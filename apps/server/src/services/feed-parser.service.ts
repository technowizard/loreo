import { DOMParser } from 'linkedom';

import { isSafeFeedEntryUrl } from '@/lib/feed-url-guard.js';

type ParsedFeedDocument = ReturnType<DOMParser['parseFromString']>;

const MAX_TITLE_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_EXCERPT_LENGTH = 1000;
const MAX_AUTHOR_LENGTH = 200;
const MAX_FEED_ENTRIES = 500;
const MAX_UNIQUE_ENTRY_HOSTS = 50;
const URL_VALIDATION_BUDGET_MS = 5000;

export type NormalizedFeedItem = {
  author: string | null;
  excerpt: string | null;
  guid: string | null;
  imageUrl: string | null;
  normalizedUrl: string;
  publishedAt: Date | null;
  title: string;
  url: string;
};

export type NormalizedFeed = {
  description: string | null;
  imageUrl: string | null;
  items: NormalizedFeedItem[];
  siteUrl: string | null;
  title: string;
};

export class FeedParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeedParseError';
  }
}

function textFromHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ');
}

function sanitizeText(value: string | null | undefined, maxLength: number): string | null {
  const normalized = textFromHtml(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return null;
  return normalized.length > maxLength ? normalized.slice(0, maxLength).trim() : normalized;
}

function firstText(parent: Element | ParsedFeedDocument, tagNames: string[]): string | null {
  for (const tagName of tagNames) {
    const element = parent.querySelector(tagName) ?? parent.getElementsByTagName(tagName).item(0);
    const text = sanitizeText(element?.textContent, Number.MAX_SAFE_INTEGER);
    if (text) return text;
  }
  return null;
}

function firstDirectText(parent: Element, tagNames: string[]): string | null {
  const normalizedNames = new Set(tagNames.map((name) => name.toLowerCase()));
  for (const child of Array.from(parent.children)) {
    if (!normalizedNames.has(child.tagName.toLowerCase())) continue;
    const text = sanitizeText(child.textContent, Number.MAX_SAFE_INTEGER);
    if (text) return text;
  }
  return null;
}

function resolveUrl(value: string | null | undefined, baseUrl: string): string | null {
  const sanitized = sanitizeText(value, 2048);
  if (!sanitized) return null;

  try {
    return new URL(sanitized, baseUrl).toString();
  } catch {
    return null;
  }
}

function normalizeUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = '';
  parsed.searchParams.sort();
  return parsed.toString();
}

function parseDate(value: string | null | undefined): Date | null {
  const sanitized = sanitizeText(value, 200);
  if (!sanitized) return null;

  const timestamp = Date.parse(sanitized);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

type SafeUrlResolver = (value: string | null, baseUrl: string) => Promise<string | null>;

function createSafeUrlResolver(): SafeUrlResolver {
  const deadline = Date.now() + URL_VALIDATION_BUDGET_MS;
  const safetyByHostname = new Map<string, Promise<boolean>>();

  return async (value, baseUrl) => {
    const url = resolveUrl(value, baseUrl);
    if (!url) return null;

    const parsed = new URL(url);
    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      parsed.username.length > 0 ||
      parsed.password.length > 0
    ) {
      return null;
    }

    if (Date.now() >= deadline) {
      throw new FeedParseError('Feed URL validation exceeded its time budget');
    }

    const hostname = parsed.hostname.toLowerCase();
    let safety = safetyByHostname.get(hostname);
    if (!safety) {
      if (safetyByHostname.size >= MAX_UNIQUE_ENTRY_HOSTS) {
        throw new FeedParseError('Feed contains too many unique hosts');
      }
      safety = isSafeFeedEntryUrl(url);
      safetyByHostname.set(hostname, safety);
    }

    const isSafe = await safety;
    if (Date.now() >= deadline) {
      throw new FeedParseError('Feed URL validation exceeded its time budget');
    }
    return isSafe ? url : null;
  };
}

function boundedNewestElements(elements: Element[], dateTags: string[]): Element[] {
  return elements
    .map((element, sourceIndex) => ({
      element,
      publishedAt: parseDate(firstText(element, dateTags)),
      sourceIndex
    }))
    .sort((left, right) => {
      const leftTimestamp = left.publishedAt?.getTime() ?? Number.NEGATIVE_INFINITY;
      const rightTimestamp = right.publishedAt?.getTime() ?? Number.NEGATIVE_INFINITY;
      return rightTimestamp - leftTimestamp || left.sourceIndex - right.sourceIndex;
    })
    .slice(0, MAX_FEED_ENTRIES)
    .map(({ element }) => element);
}

function rssChannel(document: ParsedFeedDocument): Element {
  const channel = document.querySelector('rss channel') ?? document.querySelector('channel');
  if (!channel) {
    throw new FeedParseError('Unsupported feed XML');
  }
  return channel;
}

function atomFeed(document: ParsedFeedDocument): Element {
  const feed = document.querySelector('feed');
  if (!feed) {
    throw new FeedParseError('Unsupported feed XML');
  }
  return feed;
}

function atomLink(parent: Element): string | null {
  const links = Array.from(parent.children).filter(
    (child) => child.tagName.toLowerCase() === 'link'
  );
  const alternate =
    links.find((link) => !link.getAttribute('rel') || link.getAttribute('rel') === 'alternate') ??
    links[0];

  return alternate?.getAttribute('href') ?? alternate?.textContent ?? null;
}

function rssImage(parent: Element): string | null {
  return (
    parent.querySelector('enclosure[type^="image/"]')?.getAttribute('url') ??
    parent.getElementsByTagName('media:content').item(0)?.getAttribute('url') ??
    parent.getElementsByTagName('media:thumbnail').item(0)?.getAttribute('url') ??
    firstText(parent, ['image url'])
  );
}

function rssChannelImage(channel: Element): string | null {
  const image = Array.from(channel.children).find(
    (child) => child.tagName.toLowerCase() === 'image'
  );
  return image ? firstText(image, ['url']) : null;
}

function atomImage(parent: Element): string | null {
  const links = Array.from(parent.querySelectorAll('link')) as Element[];
  return (
    links
      .find((link) => ['enclosure', 'image'].includes(link.getAttribute('rel') ?? ''))
      ?.getAttribute('href') ?? null
  );
}

async function parseRss(
  document: ParsedFeedDocument,
  feedUrl: string,
  safeUrl: SafeUrlResolver,
  isRdf: boolean
): Promise<NormalizedFeed> {
  const channel = rssChannel(document);
  const rawSiteUrl = firstDirectText(channel, ['link']);
  const siteUrl = await safeUrl(rawSiteUrl, feedUrl);
  const imageUrl = await safeUrl(rssChannelImage(channel), feedUrl);
  const title =
    sanitizeText(firstDirectText(channel, ['title']), MAX_TITLE_LENGTH) ?? 'Untitled feed';
  const items: NormalizedFeedItem[] = [];

  const itemElements = isRdf
    ? (Array.from(document.querySelectorAll('item')) as Element[])
    : (Array.from(channel.querySelectorAll('item')) as Element[]);
  for (const item of boundedNewestElements(itemElements, ['pubDate', 'published', 'updated'])) {
    const url = await safeUrl(firstText(item, ['link']), siteUrl ?? feedUrl);
    if (!url) continue;

    const image = await safeUrl(rssImage(item), url);
    const titleText = sanitizeText(firstText(item, ['title']), MAX_TITLE_LENGTH) ?? url;

    items.push({
      author: sanitizeText(
        firstText(item, ['author', 'dc\\:creator', 'creator']),
        MAX_AUTHOR_LENGTH
      ),
      excerpt: sanitizeText(
        firstText(item, ['description', 'content\\:encoded', 'summary']),
        MAX_EXCERPT_LENGTH
      ),
      guid: sanitizeText(firstText(item, ['guid']), 500),
      imageUrl: image,
      normalizedUrl: normalizeUrl(url),
      publishedAt: parseDate(firstText(item, ['pubDate', 'published', 'updated'])),
      title: titleText,
      url
    });
  }

  return {
    description: sanitizeText(
      firstDirectText(channel, ['description', 'subtitle']),
      MAX_DESCRIPTION_LENGTH
    ),
    imageUrl,
    items,
    siteUrl,
    title
  };
}

async function parseAtom(
  document: ParsedFeedDocument,
  feedUrl: string,
  safeUrl: SafeUrlResolver
): Promise<NormalizedFeed> {
  const feed = atomFeed(document);
  const siteUrl = await safeUrl(atomLink(feed), feedUrl);
  const imageUrl = await safeUrl(firstDirectText(feed, ['icon', 'logo']), feedUrl);
  const title = sanitizeText(firstDirectText(feed, ['title']), MAX_TITLE_LENGTH) ?? 'Untitled feed';
  const items: NormalizedFeedItem[] = [];

  const entryElements = Array.from(feed.querySelectorAll('entry')) as Element[];
  for (const entry of boundedNewestElements(entryElements, ['published', 'updated'])) {
    const url = await safeUrl(atomLink(entry), siteUrl ?? feedUrl);
    if (!url) continue;

    const image = await safeUrl(atomImage(entry), url);
    const titleText = sanitizeText(firstText(entry, ['title']), MAX_TITLE_LENGTH) ?? url;

    items.push({
      author: sanitizeText(
        firstText(entry, ['author name', 'author', 'creator']),
        MAX_AUTHOR_LENGTH
      ),
      excerpt: sanitizeText(firstText(entry, ['summary', 'content']), MAX_EXCERPT_LENGTH),
      guid: sanitizeText(firstText(entry, ['id']), 500),
      imageUrl: image,
      normalizedUrl: normalizeUrl(url),
      publishedAt: parseDate(firstText(entry, ['published', 'updated'])),
      title: titleText,
      url
    });
  }

  return {
    description: sanitizeText(
      firstDirectText(feed, ['subtitle', 'description']),
      MAX_DESCRIPTION_LENGTH
    ),
    imageUrl,
    items,
    siteUrl,
    title
  };
}

export async function parseFeedXml(xml: string, feedUrl: string): Promise<NormalizedFeed> {
  const document = new DOMParser().parseFromString(xml, 'text/xml');
  const rootName = document.documentElement?.tagName.toLowerCase();
  const safeUrl = createSafeUrlResolver();

  if (rootName === 'rss' || rootName === 'rdf:rdf') {
    return parseRss(document, feedUrl, safeUrl, rootName === 'rdf:rdf');
  }

  if (rootName === 'feed') {
    return parseAtom(document, feedUrl, safeUrl);
  }

  throw new FeedParseError('Unsupported feed XML');
}
