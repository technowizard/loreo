import { type IncomingMessage, request as httpRequest, type RequestOptions } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { Readable } from 'node:stream';
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib';

import { resolvePublicAddresses, type PublicAddress } from './url-validator.js';

type METHODS = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestBody = File | string | URLSearchParams | FormData | object | undefined;
type RedirectFetchOptions = {
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxRedirects?: number;
};

type PinnedRequestOptions = Required<Pick<RedirectFetchOptions, 'headers' | 'timeoutMs'>>;
type PinnedRequest = (
  url: URL,
  address: PublicAddress,
  options: PinnedRequestOptions
) => Promise<Response>;
type ResolvePublicAddresses = (url: string) => Promise<PublicAddress[] | null>;

// used for user agent rotation
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
];

export const rotatedUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

export function defaultHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };
}

function buildPayload(method: METHODS, body?: RequestBody, headers = {}): RequestInit {
  let payload: RequestInit = {
    headers: {
      ...defaultHeaders(),
      ...headers
    },
    method
  };

  if (body) {
    payload =
      typeof body === 'object' ? { ...payload, body: JSON.stringify(body) } : { ...payload, body };
  }

  return payload;
}

function isRedirectStatus(status: number): boolean {
  return [301, 302, 303, 307, 308].includes(status);
}

function responseHeaders(headers: Record<string, string | string[] | undefined>): Headers {
  const result = new Headers();

  for (const [name, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => result.append(name, entry));
    } else if (value !== undefined) {
      result.set(name, value);
    }
  }

  return result;
}

function decodedResponseBody(incoming: IncomingMessage, headers: Headers) {
  const encoding = headers.get('content-encoding')?.trim().toLowerCase();
  if (!encoding || encoding === 'identity') {
    return Readable.toWeb(incoming) as ReadableStream<Uint8Array>;
  }

  const decoder =
    encoding === 'gzip' || encoding === 'x-gzip'
      ? createGunzip()
      : encoding === 'deflate'
        ? createInflate()
        : encoding === 'br'
          ? createBrotliDecompress()
          : null;

  if (!decoder) {
    incoming.resume();
    throw new Error(`Unsupported Content-Encoding: ${encoding}`);
  }

  incoming.on('error', (error) => decoder.destroy(error));
  incoming.pipe(decoder);
  headers.delete('content-encoding');
  headers.delete('content-length');

  return Readable.toWeb(decoder) as ReadableStream<Uint8Array>;
}

const requestPinnedUrl: PinnedRequest = (url, address, { headers, timeoutMs }) =>
  new Promise<Response>((resolve, reject) => {
    const requestHostname =
      url.hostname.startsWith('[') && url.hostname.endsWith(']')
        ? url.hostname.slice(1, -1)
        : url.hostname;
    const lookup = ((
      _hostname: string,
      options: { all?: boolean },
      callback: (
        error: NodeJS.ErrnoException | null,
        result: PublicAddress[] | string,
        family?: number
      ) => void
    ) => {
      if (options.all) {
        callback(null, [address]);
        return;
      }

      callback(null, address.address, address.family);
    }) as NonNullable<RequestOptions['lookup']>;

    const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(
      url,
      {
        headers: {
          ...headers,
          'Accept-Encoding': 'gzip, deflate, br',
          Host: url.host
        },
        lookup,
        method: 'GET',
        servername: isIP(requestHostname) === 0 ? requestHostname : undefined,
        signal: AbortSignal.timeout(timeoutMs)
      },
      (incoming) => {
        const status = incoming.statusCode ?? 500;
        const hasNoBody = status === 101 || status === 204 || status === 205 || status === 304;
        const responseHeaderValues = responseHeaders(incoming.headers);

        try {
          const body = hasNoBody ? null : decodedResponseBody(incoming, responseHeaderValues);
          resolve(
            new Response(body, {
              headers: responseHeaderValues,
              status,
              statusText: incoming.statusMessage
            })
          );
        } catch (error) {
          reject(error);
        }
      }
    );

    request.on('error', reject);
    request.end();
  });

export function createValidatedRedirectFetcher(
  dependencies: {
    requestPinned?: PinnedRequest;
    resolvePublicAddresses?: ResolvePublicAddresses;
  } = {}
) {
  const requestPinned = dependencies.requestPinned ?? requestPinnedUrl;
  const resolveAddresses = dependencies.resolvePublicAddresses ?? resolvePublicAddresses;

  return async function fetchValidatedRedirects(
    url: string,
    { headers = {}, timeoutMs = 30_000, maxRedirects = 5 }: RedirectFetchOptions = {}
  ): Promise<Response> {
    let currentUrl = url;
    let redirectCount = 0;
    const deadline = Date.now() + timeoutMs;

    while (true) {
      const addresses = await resolveAddresses(currentUrl);
      if (!addresses?.[0]) {
        const prefix = redirectCount === 0 ? 'Rejected URL' : 'Unsafe redirect target rejected';
        throw new Error(`${prefix}: ${currentUrl}`);
      }

      let response: Response | undefined;
      let lastConnectionError: unknown;

      for (const address of addresses) {
        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0) {
          throw lastConnectionError ?? new Error(`Request timed out while fetching ${url}`);
        }

        try {
          response = await requestPinned(new URL(currentUrl), address, {
            headers,
            timeoutMs: remainingMs
          });
          break;
        } catch (error) {
          lastConnectionError = error;
        }
      }

      if (!response) {
        throw lastConnectionError ?? new Error(`Could not connect to ${currentUrl}`);
      }

      if (!isRedirectStatus(response.status)) {
        return response;
      }

      redirectCount += 1;
      if (redirectCount > maxRedirects) {
        await response.body?.cancel();
        throw new Error(`Too many redirects while fetching ${url}`);
      }

      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location) {
        throw new Error(`Redirect response missing Location header for ${currentUrl}`);
      }

      currentUrl = new URL(location, currentUrl).toString();
    }
  };
}

export const fetchWithValidatedRedirects = createValidatedRedirectFetcher();

export const apiClient = {
  get: async (url: string, headers: object = {}) => {
    const payload = buildPayload('GET', undefined, headers);
    return fetch(url, {
      ...payload,
      signal: AbortSignal.timeout(30_000) // 30 second timeout for image downloads
    });
  },
  post: async (url: string, body: RequestBody = {}, headers: object = {}) => {
    const payload = buildPayload('POST', body, headers);
    return fetch(url, payload);
  },
  put: async (url: string, body: RequestBody = {}, headers: object = {}) => {
    const payload = buildPayload('PUT', body, headers);
    return fetch(url, payload);
  },
  patch: async (url: string, body: RequestBody = {}, headers: object = {}) => {
    const payload = buildPayload('PATCH', body, headers);
    return fetch(url, payload);
  },
  delete: async (url: string, body: RequestBody = {}, headers: object = {}) => {
    const payload = buildPayload('DELETE', body, headers);
    return fetch(url, payload);
  }
};
