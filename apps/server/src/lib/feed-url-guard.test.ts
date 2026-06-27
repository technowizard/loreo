import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assertSafeFeedUrl, isSafeFeedEntryUrl } from './feed-url-guard.js';

const lookupMock = vi.hoisted(() => vi.fn());

vi.mock('node:dns/promises', () => ({
  lookup: lookupMock
}));

describe('feed URL guard', () => {
  beforeEach(() => {
    lookupMock.mockReset();
  });

  it('rejects non-http feed URLs', async () => {
    await expect(assertSafeFeedUrl('file:///etc/passwd')).rejects.toThrow(/feed url/i);
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it('rejects localhost feed URLs without DNS lookup', async () => {
    await expect(assertSafeFeedUrl('http://localhost/feed.xml')).rejects.toThrow(/feed url/i);
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it('rejects hostnames that resolve to private addresses', async () => {
    lookupMock.mockResolvedValue([{ address: '10.0.0.10', family: 4 }] as never);

    await expect(assertSafeFeedUrl('https://feeds.example.com/rss')).rejects.toThrow(/feed url/i);
    expect(lookupMock).toHaveBeenCalledWith('feeds.example.com', { all: true });
  });

  it('allows public feed and entry URLs', async () => {
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as never);

    await expect(assertSafeFeedUrl('https://feeds.example.com/rss')).resolves.toBeUndefined();
    await expect(isSafeFeedEntryUrl('https://example.com/article')).resolves.toBe(true);
  });
});
