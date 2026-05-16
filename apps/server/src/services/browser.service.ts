import { Mutex } from 'async-mutex';
import { firefox, type Browser, type BrowserContext } from 'playwright-core';

import { env } from '@/lib/env-config.js';
import { logger } from '@/lib/logger.js';
import { detectPaywall } from '@/lib/paywall-detector.js';

import { getIsShuttingDown } from '../index.js';

class BrowserService {
  private browser: Browser | undefined;
  private browserMutex = new Mutex();
  private activeContextCount = 0;

  async acquireContext(): Promise<BrowserContext> {
    this.activeContextCount++;
    return await this.createContext(await this.ensureBrowser());
  }

  async releaseContext(context: BrowserContext): Promise<void> {
    await context.close();
    this.activeContextCount--;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch((error) => {
        logger.error('Error closing browser during shutdown:', error);
      });
      this.browser = undefined;
    }
  }

  async createInstance(): Promise<Browser> {
    logger.info(`[Crawler] Connecting to Browser instance`);

    return await firefox.connect(env.BROWSER_URL, { timeout: 10_000 });
  }

  async createContext(browser: Browser): Promise<BrowserContext> {
    return await browser.newContext();
  }

  async ensureBrowser(): Promise<Browser> {
    return await this.browserMutex.runExclusive(async () => {
      if (this.browser && this.browser.isConnected()) {
        return this.browser;
      }

      if (getIsShuttingDown()) {
        throw new Error('Browser service is shutting down');
      }

      try {
        if (this.browser) {
          await this.browser.close().catch(() => {});
        }

        this.browser = await this.createInstance();

        logger.info(`[Crawler] Connected to browser instance at ${env.BROWSER_URL}`);

        this.browser.on('disconnected', () => {
          if (!getIsShuttingDown()) {
            logger.info('Browser disconnected. Will reconnect on next request.');
            this.browser = undefined;
          }
        });

        return this.browser;
      } catch (error) {
        logger.error(`Error launching browser: ${error}`);
        throw error;
      }
    });
  }

  async crawlPage(url: string): Promise<{ html: string; isPaywalled: boolean }> {
    const context = await this.acquireContext();

    try {
      const page = await context.newPage();

      logger.info(`[Crawler] Navigating to ${url}...`);

      await page.goto(url, {
        timeout: 30_000,
        waitUntil: 'domcontentloaded'
      });

      logger.info(`[Crawler] Successfully navigated to ${url}. Waiting for page to load...`);

      await Promise.race([
        page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 5000))
      ]);

      logger.info(`[Crawler] Successfully loaded ${url}. Extracting content...`);

      const html = await page.content();

      const { isPaywalled, matchedRule } = detectPaywall(html, url);

      if (isPaywalled) {
        logger.info(`[Crawler] Paywalled content detected via rule: ${matchedRule}`);
      }

      return { html, isPaywalled };
    } catch (error) {
      logger.error(`[Crawler] Error crawling ${url}: ${error}`);
      throw error;
    } finally {
      await this.releaseContext(context);
    }
  }
}

export const browserService = new BrowserService();
