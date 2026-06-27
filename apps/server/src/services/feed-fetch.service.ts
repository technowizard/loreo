import { fetchWithValidatedRedirects, rotatedUserAgent } from '@/lib/api-client.js';
import { assertSafeFeedUrl } from '@/lib/feed-url-guard.js';

const DEFAULT_FEED_FETCH_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_FEED_BYTES = 1024 * 1024;

export type FeedFetchOptions = {
  etag?: string | null;
  lastModified?: string | null;
  maxBytes?: number;
  timeoutMs?: number;
};

export type FeedFetchResult =
  | {
      headers: {
        etag: string | null;
        lastModified: string | null;
      };
      status: 'not-modified';
    }
  | {
      body: string;
      headers: {
        etag: string | null;
        lastModified: string | null;
      };
      status: 'ok';
    };

export class FeedFetchError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'feed-url-not-allowed'
      | 'feed-fetch-failed'
      | 'feed-timeout'
      | 'feed-too-large'
      | 'feed-unexpected-status'
  ) {
    super(message);
    this.name = 'FeedFetchError';
  }
}

function conditionalHeaders({ etag, lastModified }: FeedFetchOptions): Record<string, string> {
  return {
    Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5',
    'User-Agent': rotatedUserAgent ?? 'Mozilla/5.0',
    ...(etag ? { 'If-None-Match': etag } : {}),
    ...(lastModified ? { 'If-Modified-Since': lastModified } : {})
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

function safeErrorMessage(error: unknown): string {
  if (isAbortError(error)) return 'Feed fetch timed out';
  if (error instanceof FeedFetchError) return error.message;
  if (error instanceof Error && /Rejected URL|Unsafe redirect/i.test(error.message)) {
    return 'Feed URL is not allowed';
  }
  return 'Feed fetch failed';
}

async function readBoundedText(response: Response, maxBytes: number): Promise<string> {
  const contentLength = response.headers.get('content-length');
  if (contentLength && Number.parseInt(contentLength, 10) > maxBytes) {
    throw new FeedFetchError('Feed response is too large', 'feed-too-large');
  }

  if (!response.body) {
    const body = await response.text();
    if (Buffer.byteLength(body, 'utf8') > maxBytes) {
      throw new FeedFetchError('Feed response is too large', 'feed-too-large');
    }
    return body;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new FeedFetchError('Feed response is too large', 'feed-too-large');
    }
    chunks.push(value);
  }

  return new TextDecoder().decode(Buffer.concat(chunks));
}

export async function fetchFeed(
  url: string,
  options: FeedFetchOptions = {}
): Promise<FeedFetchResult> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_FEED_BYTES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_FEED_FETCH_TIMEOUT_MS;

  try {
    await assertSafeFeedUrl(url);

    const response = await fetchWithValidatedRedirects(url, {
      headers: conditionalHeaders(options),
      timeoutMs
    });

    const headers = {
      etag: response.headers.get('etag'),
      lastModified: response.headers.get('last-modified')
    };

    if (response.status === 304) {
      return { headers, status: 'not-modified' };
    }

    if (!response.ok) {
      throw new FeedFetchError('Feed returned an unexpected status', 'feed-unexpected-status');
    }

    return {
      body: await readBoundedText(response, maxBytes),
      headers,
      status: 'ok'
    };
  } catch (error) {
    if (error instanceof FeedFetchError) throw error;
    if (isAbortError(error)) throw new FeedFetchError('Feed fetch timed out', 'feed-timeout');
    if (error instanceof Error && /Rejected URL|Unsafe redirect|not allowed/i.test(error.message)) {
      throw new FeedFetchError('Feed URL is not allowed', 'feed-url-not-allowed');
    }
    throw new FeedFetchError(safeErrorMessage(error), 'feed-fetch-failed');
  }
}
