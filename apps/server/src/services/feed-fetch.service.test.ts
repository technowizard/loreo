import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FeedFetchError, fetchFeed } from './feed-fetch.service.js';

const assertSafeFeedUrlMock = vi.hoisted(() => vi.fn());
const fetchWithValidatedRedirectsMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/feed-url-guard.js', () => ({
  assertSafeFeedUrl: assertSafeFeedUrlMock
}));

vi.mock('@/lib/api-client.js', () => ({
  fetchWithValidatedRedirects: fetchWithValidatedRedirectsMock,
  rotatedUserAgent: 'test-agent'
}));

describe('fetchFeed', () => {
  beforeEach(() => {
    assertSafeFeedUrlMock.mockReset().mockResolvedValue(undefined);
    fetchWithValidatedRedirectsMock.mockReset();
  });

  it('sends conditional request headers and returns feed text', async () => {
    fetchWithValidatedRedirectsMock.mockResolvedValue(
      new Response('<rss><channel /></rss>', {
        headers: {
          etag: 'abc123',
          'last-modified': 'Sun, 28 Jun 2026 12:00:00 GMT'
        },
        status: 200
      })
    );

    const result = await fetchFeed('https://example.com/feed.xml', {
      etag: 'previous-etag',
      lastModified: 'Sat, 27 Jun 2026 12:00:00 GMT'
    });

    expect(result).toMatchObject({
      body: '<rss><channel /></rss>',
      headers: {
        etag: 'abc123',
        lastModified: 'Sun, 28 Jun 2026 12:00:00 GMT'
      },
      status: 'ok'
    });
    expect(fetchWithValidatedRedirectsMock).toHaveBeenCalledWith(
      'https://example.com/feed.xml',
      expect.objectContaining({
        headers: expect.objectContaining({
          'If-Modified-Since': 'Sat, 27 Jun 2026 12:00:00 GMT',
          'If-None-Match': 'previous-etag',
          'User-Agent': 'test-agent'
        })
      })
    );
  });

  it('returns not-modified for 304 responses without reading a body', async () => {
    fetchWithValidatedRedirectsMock.mockResolvedValue(new Response(null, { status: 304 }));

    await expect(fetchFeed('https://example.com/feed.xml')).resolves.toEqual({
      headers: { etag: null, lastModified: null },
      status: 'not-modified'
    });
  });

  it('rejects unsafe feed URLs before fetching', async () => {
    assertSafeFeedUrlMock.mockRejectedValue(new Error('Feed URL is not allowed'));

    await expect(fetchFeed('http://127.0.0.1/feed.xml')).rejects.toMatchObject({
      code: 'feed-url-not-allowed'
    } satisfies Partial<FeedFetchError>);
    expect(fetchWithValidatedRedirectsMock).not.toHaveBeenCalled();
  });

  it('maps aborts to timeout errors', async () => {
    fetchWithValidatedRedirectsMock.mockRejectedValue(
      new DOMException('Timed out', 'TimeoutError')
    );

    await expect(fetchFeed('https://example.com/feed.xml')).rejects.toMatchObject({
      code: 'feed-timeout'
    } satisfies Partial<FeedFetchError>);
  });

  it('rejects oversized responses using content-length', async () => {
    fetchWithValidatedRedirectsMock.mockResolvedValue(
      new Response('too large', {
        headers: { 'content-length': '10' },
        status: 200
      })
    );

    await expect(fetchFeed('https://example.com/feed.xml', { maxBytes: 5 })).rejects.toMatchObject({
      code: 'feed-too-large'
    } satisfies Partial<FeedFetchError>);
  });

  it('rejects oversized streamed responses', async () => {
    fetchWithValidatedRedirectsMock.mockResolvedValue(new Response('123456', { status: 200 }));

    await expect(fetchFeed('https://example.com/feed.xml', { maxBytes: 5 })).rejects.toMatchObject({
      code: 'feed-too-large'
    } satisfies Partial<FeedFetchError>);
  });
});
