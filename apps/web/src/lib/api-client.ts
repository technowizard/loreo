import ky, { type Options } from 'ky';

import { env } from './env';

type RequestBody = File | string | URLSearchParams | FormData | object | undefined;

export const defaultHeaders = () => ({
  Accept: 'application/json',
  'X-Device-Type': 'web'
});

const shouldStringifyBody = (body: RequestBody): boolean => {
  if (
    body instanceof FormData ||
    body instanceof File ||
    body instanceof URLSearchParams ||
    typeof body === 'string'
  ) {
    return false;
  }

  return typeof body === 'object' && body !== null;
};

const buildPayload = (body?: RequestBody, headers: object = {}): Options => {
  let headersWithDefaults: Record<string, string> = {
    ...defaultHeaders(),
    ...headers
  };

  let payload: Options = { headers: headersWithDefaults };

  if (body !== undefined && body !== null) {
    const shouldStringify = shouldStringifyBody(body);

    if (shouldStringify) {
      headersWithDefaults = {
        ...headersWithDefaults,
        'Content-Type': 'application/json'
      };
      payload = { body: JSON.stringify(body), headers: headersWithDefaults };
    } else {
      payload = { body: body as BodyInit, headers: headersWithDefaults };
    }
  }

  return payload;
};

export const instance = ky.create({
  credentials: 'include',
  prefix: env.API_URL || globalThis.location.origin,
  retry: {
    limit: 1,
    statusCodes: [429, 500, 502, 503, 504]
  }
});

export const apiClient = {
  delete: (url: string, body: RequestBody = {}, headers: object = {}) => {
    const payload = buildPayload(body, headers);

    return instance.delete(url, payload);
  },
  get: (url: string, headers: object = {}, params?: Record<string, string>) => {
    const payload = buildPayload(undefined, headers);

    return instance.get(url, params ? { ...payload, searchParams: params } : payload);
  },
  patch: (url: string, body: RequestBody = {}, headers: object = {}) => {
    const payload = buildPayload(body, headers);

    return instance.patch(url, payload);
  },
  patchKeepalive: (url: string, body: RequestBody = {}, headers: object = {}) => {
    const payload = buildPayload(body, headers);

    return instance.patch(url, { ...payload, keepalive: true, retry: 0 });
  },
  post: (url: string, body: RequestBody = {}, headers: object = {}) => {
    const payload = buildPayload(body, headers);

    return instance.post(url, payload);
  },
  put: (url: string, body: RequestBody = {}, headers: object = {}) => {
    const payload = buildPayload(body, headers);

    return instance.put(url, payload);
  }
};
