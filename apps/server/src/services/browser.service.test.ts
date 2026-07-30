import type { BrowserContext, Page, Response } from 'playwright-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../index.js', () => ({ getIsShuttingDown: () => false }));

import { browserService } from './browser.service.js';

type Deferred = {
  promise: Promise<void>;
  resolve: () => void;
};

function deferred(): Deferred {
  let resolve = () => {};
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function challengeResponse(): Response {
  return {
    headers: () => ({ 'x-amzn-waf-action': 'challenge' })
  } as unknown as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('browserService.crawlPage', () => {
  it('waits for challenged article content before extracting the page', async () => {
    const ready = deferred();
    const content = vi.fn().mockResolvedValue('<article>Ready</article>');
    const waitForFunction = vi.fn(() => ready.promise);
    const page = {
      content,
      goto: vi.fn().mockResolvedValue(challengeResponse()),
      waitForFunction,
      waitForLoadState: vi.fn()
    } as unknown as Page;
    const context = { newPage: vi.fn().mockResolvedValue(page) } as unknown as BrowserContext;

    vi.spyOn(browserService, 'acquireContext').mockResolvedValue(context);
    vi.spyOn(browserService, 'releaseContext').mockResolvedValue();

    const crawl = browserService.crawlPage('https://arstechnica.com/example');
    await vi.waitFor(() => expect(waitForFunction).toHaveBeenCalledOnce());

    expect(content).not.toHaveBeenCalled();

    ready.resolve();
    await expect(crawl).resolves.toEqual({ html: '<article>Ready</article>', isPaywalled: false });
    expect(content).toHaveBeenCalledOnce();
    expect(waitForFunction).toHaveBeenCalledWith(expect.any(Function), undefined, {
      polling: 250,
      timeout: 15_000
    });
  });

  it('releases the browser context when challenge readiness times out', async () => {
    const challengeError = new Error('Challenge readiness timed out');
    const page = {
      content: vi.fn(),
      goto: vi.fn().mockResolvedValue(challengeResponse()),
      waitForFunction: vi.fn().mockRejectedValue(challengeError),
      waitForLoadState: vi.fn()
    } as unknown as Page;
    const context = { newPage: vi.fn().mockResolvedValue(page) } as unknown as BrowserContext;

    vi.spyOn(browserService, 'acquireContext').mockResolvedValue(context);
    const releaseContext = vi.spyOn(browserService, 'releaseContext').mockResolvedValue();

    await expect(browserService.crawlPage('https://arstechnica.com/example')).rejects.toThrow(
      challengeError
    );
    expect(releaseContext).toHaveBeenCalledWith(context);
    expect(page.content).not.toHaveBeenCalled();
  });
});
