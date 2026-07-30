import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

import { logger } from '@/lib/logger.js';

const GHOST_BOOKMARK_CLASSES = [
  'kg-bookmark-card',
  'kg-bookmark-content',
  'kg-bookmark-title',
  'kg-bookmark-description',
  'kg-bookmark-thumbnail'
];

class ContentExtraction {
  async extractReadableContent(htmlContent: string, url: string) {
    const { document } = parseHTML(htmlContent);

    // check if the document is suitable for extraction
    if (!document.body) {
      logger.warn(`Skipping extraction for ${url} because it doesn't have a body`);

      return {
        content: null,
        excerpt: null,
        textContent: null,
        title: url
      };
    }

    try {
      const article = new Readability(document, {
        classesToPreserve: GHOST_BOOKMARK_CLASSES,
        // @ts-expect-error: missing type definition
        linkDensityModifier: 0.1
      }).parse();

      if (!article || typeof article.content !== 'string') {
        logger.warn(`Could not extract content from ${url}`);

        return {
          content: null,
          excerpt: null,
          textContent: null,
          title: url
        };
      }

      // take opengraph image for cover image if available
      let coverImage = null;
      const ogImage = document.querySelector('meta[property="og:image"]');

      if (ogImage) {
        coverImage = ogImage.getAttribute('content');
      }

      return {
        author: article.byline,
        content: article.content,
        coverImage,
        excerpt: article.excerpt,
        textContent: article.textContent,
        title: article.title || url
      };
    } catch (error) {
      logger.error(`Failed to extract content from ${url}: ${(error as Error).message}`);

      return {
        content: null,
        excerpt: null,
        textContent: null,
        title: url
      };
    }
  }

  private resolveUrl(href: string, origin: string) {
    // handle absolute urls
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return href;
    }

    // handle protocol-relative urls
    if (href.startsWith('//')) {
      return new URL(href, origin).href;
    }

    // handle relative urls
    return new URL(href, origin).href;
  }

  private extractFavicon(document: Document, url: string) {
    const origin = new URL(url).origin;

    // Priority order: SVG → PNG variants → ICO → root fallback

    // SVG favicon
    const svgFavicon = document
      .querySelector('link[rel="icon"][type="image/svg+xml"]')
      ?.getAttribute('href');

    if (svgFavicon) {
      return this.resolveUrl(svgFavicon, origin);
    }

    // PNG favicon
    const pngFavicon = document
      .querySelector('link[rel="icon"][type="image/png"]')
      ?.getAttribute('href');

    if (pngFavicon) {
      return this.resolveUrl(pngFavicon, origin);
    }

    // generic icon link
    const genericIcon = document.querySelector('link[rel="icon"]')?.getAttribute('href');

    if (genericIcon && !genericIcon.includes('apple')) {
      return this.resolveUrl(genericIcon, origin);
    }

    // apple touch icon
    const appleTouchIcon = document
      .querySelector('link[rel="apple-touch-icon"]')
      ?.getAttribute('href');
    if (appleTouchIcon) {
      return this.resolveUrl(appleTouchIcon, origin);
    }

    // apple touch icon precomposed (older iOS)
    const applePrecomposed = document
      .querySelector('link[rel="apple-touch-icon-precomposed"]')
      ?.getAttribute('href');
    if (applePrecomposed) {
      return this.resolveUrl(applePrecomposed, origin);
    }

    // shortcut icon (legacy)
    const shortcutIcon = document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href');
    if (shortcutIcon) {
      return this.resolveUrl(shortcutIcon, origin);
    }

    // fallback
    return `${origin}/favicon.ico`;
  }

  async extractMetadata(htmlContent: string, url: string) {
    const { document } = parseHTML(htmlContent);

    const metadata = {
      title:
        document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        document.querySelector('meta[name="title"]')?.getAttribute('content') ||
        document.title,

      image:
        document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
        document.querySelector('meta[name="image"]')?.getAttribute('content'),

      author: document.querySelector('meta[name="author"]')?.getAttribute('content'),

      publishedDate:
        document
          .querySelector('meta[property="article:published_time"]')
          ?.getAttribute('content') ||
        document.querySelector('meta[name="publish_date"]')?.getAttribute('content') ||
        document.querySelector('meta[name="published"]')?.getAttribute('content') ||
        document.querySelector('meta[itemprop="datePublished"]')?.getAttribute('content') ||
        document.querySelector('time[datetime]')?.getAttribute('datetime') ||
        null,

      favicon: this.extractFavicon(document, url)
    };

    return metadata;
  }
}

export const contentExtractionService = new ContentExtraction();
