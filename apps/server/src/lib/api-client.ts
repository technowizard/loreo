type METHODS = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestBody = File | string | URLSearchParams | FormData | object | undefined;

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
