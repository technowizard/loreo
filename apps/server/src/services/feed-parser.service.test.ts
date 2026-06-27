import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseFeedXml } from './feed-parser.service.js';

const isSafeFeedEntryUrlMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/feed-url-guard.js', () => ({
  isSafeFeedEntryUrl: isSafeFeedEntryUrlMock
}));

describe('parseFeedXml', () => {
  beforeEach(() => {
    isSafeFeedEntryUrlMock.mockReset().mockResolvedValue(true);
  });

  it('maps RSS feed metadata and items into normalized records', async () => {
    const feed = await parseFeedXml(
      `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <title> Example RSS </title>
          <description>A &lt;strong&gt;calm&lt;/strong&gt; feed</description>
          <link>https://example.com/</link>
          <image><url>/logo.png</url></image>
          <item>
            <title> First article </title>
            <link>https://example.com/articles/one?b=2&amp;a=1#section</link>
            <guid>item-1</guid>
            <description><![CDATA[<p>Useful summary</p>]]></description>
            <author>Jane Author</author>
            <pubDate>Sun, 28 Jun 2026 12:00:00 GMT</pubDate>
            <enclosure url="https://example.com/one.jpg" type="image/jpeg" />
          </item>
        </channel>
      </rss>`,
      'https://example.com/feed.xml'
    );

    expect(feed).toMatchObject({
      description: 'A calm feed',
      imageUrl: 'https://example.com/logo.png',
      siteUrl: 'https://example.com/',
      title: 'Example RSS'
    });
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]).toMatchObject({
      author: 'Jane Author',
      excerpt: 'Useful summary',
      guid: 'item-1',
      imageUrl: 'https://example.com/one.jpg',
      normalizedUrl: 'https://example.com/articles/one?a=1&b=2',
      title: 'First article',
      url: 'https://example.com/articles/one?b=2&a=1#section'
    });
    expect(feed.items[0]?.publishedAt?.toISOString()).toBe('2026-06-28T12:00:00.000Z');
  });

  it('maps Atom feed metadata and entries into normalized records', async () => {
    const feed = await parseFeedXml(
      `<?xml version="1.0"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Example Atom</title>
        <subtitle>Atom summary</subtitle>
        <link href="https://example.com/" rel="alternate" />
        <entry>
          <id>tag:example.com,2026:one</id>
          <title>Atom article</title>
          <link href="/articles/atom-one" rel="alternate" />
          <summary><![CDATA[<p>Atom excerpt</p>]]></summary>
          <author><name>Ada Writer</name></author>
          <updated>2026-06-28T13:00:00Z</updated>
        </entry>
      </feed>`,
      'https://example.com/feed.atom'
    );

    expect(feed).toMatchObject({
      description: 'Atom summary',
      siteUrl: 'https://example.com/',
      title: 'Example Atom'
    });
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]).toMatchObject({
      author: 'Ada Writer',
      excerpt: 'Atom excerpt',
      guid: 'tag:example.com,2026:one',
      normalizedUrl: 'https://example.com/articles/atom-one',
      title: 'Atom article',
      url: 'https://example.com/articles/atom-one'
    });
  });

  it('skips entries with blocked or invalid URLs', async () => {
    isSafeFeedEntryUrlMock.mockImplementation(async (url: string) => !url.includes('internal'));

    const feed = await parseFeedXml(
      `<rss><channel>
        <title>Mixed feed</title>
        <item><title>Unsafe</title><link>http://127.0.0.1/internal</link></item>
        <item><title>Safe</title><link>https://example.com/safe</link></item>
      </channel></rss>`,
      'https://example.com/feed.xml'
    );

    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]?.title).toBe('Safe');
  });

  it('bounds noisy external text fields', async () => {
    const longTitle = 'A'.repeat(400);
    const longDescription = 'B'.repeat(1200);

    const feed = await parseFeedXml(
      `<rss><channel>
        <title>${longTitle}</title>
        <description>${longDescription}</description>
        <item><title>${longTitle}</title><description>${longDescription}</description><link>https://example.com/post</link></item>
      </channel></rss>`,
      'https://example.com/feed.xml'
    );

    expect(feed.title).toHaveLength(300);
    expect(feed.description).toHaveLength(1000);
    expect(feed.items[0]?.title).toHaveLength(300);
    expect(feed.items[0]?.excerpt).toHaveLength(1000);
  });

  it('rejects unsupported or invalid XML documents', async () => {
    await expect(
      parseFeedXml('<html><body>not a feed</body></html>', 'https://example.com')
    ).rejects.toThrow(/unsupported feed/i);
  });
});
