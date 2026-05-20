import { isValidUrl } from './url-validator.js';

type METHODS = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestBody = File | string | URLSearchParams | FormData | object | undefined;
type RedirectFetchOptions = {
  headers?: object;
  timeoutMs?: number;
  maxRedirects?: number;
};

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

export async function fetchWithValidatedRedirects(
  url: string,
  { headers = {}, timeoutMs = 30_000, maxRedirects = 5 }: RedirectFetchOptions = {}
): Promise<Response> {
  let currentUrl = url;
  let redirectCount = 0;

  while (true) {
    if (!(await isValidUrl(currentUrl))) {
      throw new Error(`Rejected URL: ${currentUrl}`);
    }

    const payload = buildPayload('GET', undefined, headers);
    const response = await fetch(currentUrl, {
      ...payload,
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (!isRedirectStatus(response.status)) {
      return response;
    }

    redirectCount += 1;
    if (redirectCount > maxRedirects) {
      throw new Error(`Too many redirects while fetching ${url}`);
    }

    const location = response.headers.get('location');
    if (!location) {
      throw new Error(`Redirect response missing Location header for ${currentUrl}`);
    }

    const nextUrl = new URL(location, currentUrl).toString();
    if (!(await isValidUrl(nextUrl))) {
      throw new Error(`Unsafe redirect target rejected: ${nextUrl}`);
    }

    currentUrl = nextUrl;
  }
}

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
