import { parseHTML } from 'linkedom';
import TurndownService from 'turndown';

export interface MarkdownConversionContext {
  baseUrl: string;
  title: string;
}

interface GenericElement {
  classList?: {
    contains: (className: string) => boolean;
  };
  getAttribute: (name: string) => string | null;
  hasAttribute: (name: string) => boolean;
  querySelector: (selector: string) => Element | null;
  querySelectorAll: (selector: string) => NodeListOf<Element>;
  rows?: ArrayLike<{
    cells?: ArrayLike<{
      innerHTML?: string;
    }>;
  }>;
  parentNode?: ParentNode | null;
  nextSibling?: Node | null;
  nodeName: string;
  innerHTML?: string;
  children?: ArrayLike<GenericElement>;
  cloneNode: (deep?: boolean) => Node;
  textContent?: string | null;
  attributes?: NamedNodeMap;
  className?: string;
  tagName?: string;
  nodeType: number;
  closest?: (selector: string) => Element | null;
}

function isGenericElement(node: unknown): node is GenericElement {
  return node !== null && typeof node === 'object' && 'getAttribute' in node;
}

export function resolveArticleHref(href: string, baseUrl: string) {
  try {
    const resolved = new URL(href, baseUrl);
    if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
      return resolved.href;
    }

    return resolved.protocol === 'mailto:' || resolved.protocol === 'tel:' ? href : null;
  } catch {
    return null;
  }
}

export interface BookmarkCardElement {
  classList?: {
    contains: (className: string) => boolean;
  };
  getAttribute: (name: string) => string | null;
  nodeName: string;
  querySelector: (selector: string) => Element | null;
}

export function isGhostBookmarkCard(node: BookmarkCardElement): boolean {
  if (node.nodeName !== 'FIGURE' || !node.classList?.contains('kg-bookmark-card')) {
    return false;
  }

  const anchor = node.querySelector('a[href]');
  return Boolean(anchor?.textContent?.trim() && anchor.querySelector('img'));
}

function normalizeTitle(value: string) {
  return value.normalize('NFKC').replaceAll(/\s+/g, ' ').trim().toLocaleLowerCase();
}

function prepareHtmlForConversion(htmlContent: string, context: MarkdownConversionContext) {
  const { document } = parseHTML(htmlContent);
  const leadingH1Text = document.querySelector('h1')?.textContent?.trim() ?? null;

  for (const anchor of document.querySelectorAll('a[href]')) {
    const href = anchor.getAttribute('href');
    if (!href) {
      continue;
    }

    const resolvedHref = resolveArticleHref(href, context.baseUrl);
    if (resolvedHref) {
      anchor.setAttribute('href', resolvedHref);
    } else {
      anchor.removeAttribute('href');
    }
  }

  return { html: document.toString(), leadingH1Text };
}

// generic element detection, highlight, strikethrough, list
// listItem, table, and complexLinkStructure rules
// below are adapted from defuddle
// https://github.com/kepano/defuddle (MIT License)

const turndownService = new TurndownService({
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  headingStyle: 'atx',
  hr: '---',
  preformattedCode: true,
  linkStyle: 'inlined'
});

// Clean up figure + figcaption
turndownService.addRule('figure', {
  filter: 'figure',
  replacement(content, node) {
    if (!isGenericElement(node)) {
      return content;
    }

    // Handle nested img elements - look for the first valid img
    const img = node.querySelector('img');
    const figcaption = node.querySelector('figcaption');

    if (!img || !isGenericElement(img)) {
      return content;
    }

    // Enhanced alt text extraction - handle nested img elements
    const alt = img.getAttribute('alt') || '';
    const src = img.getAttribute('src') || '';
    let caption = '';

    if (figcaption && isGenericElement(figcaption)) {
      const tagSpan = figcaption.querySelector('.ltx_tag_figure');
      const tagText = tagSpan && isGenericElement(tagSpan) ? tagSpan.textContent?.trim() : '';

      // Enhanced caption processing for multiple paragraphs and nested elements
      // Get all paragraph content and combine them
      const paragraphs = Array.from(figcaption.querySelectorAll('p'));
      let captionMarkdown = '';

      if (paragraphs.length > 0) {
        // Handle figcaption with multiple paragraphs
        const paragraphContents: string[] = [];
        for (const p of paragraphs) {
          if (isGenericElement(p) && p.innerHTML) {
            paragraphContents.push(turndownService.turndown(p.innerHTML));
          }
        }
        captionMarkdown = paragraphContents.join('\n\n');
      } else {
        // Handle figcaption with nested elements (not direct paragraphs)
        captionMarkdown = turndownService.turndown(figcaption.innerHTML || '');
      }

      // Remove the tag from caption if it's included in the markdown
      const tagMarkdown =
        tagSpan && isGenericElement(tagSpan) && tagSpan.innerHTML
          ? turndownService.turndown(tagSpan.innerHTML)
          : '';
      if (tagMarkdown && captionMarkdown.startsWith(tagMarkdown)) {
        captionMarkdown = captionMarkdown.slice(tagMarkdown.length).trim();
      }

      // Combine tag and processed caption
      caption = tagText ? `${tagText} ${captionMarkdown}`.trim() : captionMarkdown;
    }

    return `![${alt}](${src})\n\n${caption}\n\n`;
  }
});

turndownService.addRule('bookmarkCard', {
  filter(node) {
    return isGenericElement(node) && isGhostBookmarkCard(node);
  },
  replacement(content, node) {
    if (!isGenericElement(node)) {
      return content;
    }

    const anchor = node.querySelector('a[href]');
    if (!anchor || !isGenericElement(anchor)) {
      return content;
    }

    const href = anchor.getAttribute('href');
    const paragraphs = Array.from(anchor.querySelectorAll('p'));
    const titleElement = anchor.querySelector('.kg-bookmark-title') ?? paragraphs[0];
    const descriptionElement = anchor.querySelector('.kg-bookmark-description') ?? paragraphs[1];
    const title = titleElement?.textContent?.trim() ?? '';
    const description =
      descriptionElement && isGenericElement(descriptionElement)
        ? turndownService.turndown(descriptionElement.innerHTML || '').trim()
        : '';

    if (!href || !title) {
      return content;
    }

    const safeTitle = title
      .replaceAll('\\', '\\\\')
      .replaceAll('[', '\\[')
      .replaceAll(']', '\\]')
      .replaceAll('*', '\\*')
      .replaceAll('_', '\\_')
      .replaceAll('`', '\\`')
      .replaceAll('~', '\\~');
    const safeHref = href.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
    const bookmarkLines = [`[**${safeTitle}**](${safeHref})`];
    if (description) {
      bookmarkLines.push('', description);
    }

    return `\n\n${bookmarkLines.join('\n')}\n\n`;
  }
});

turndownService.addRule('highlight', {
  filter: 'mark',
  replacement(content) {
    return `==${content}==`;
  }
});

turndownService.addRule('strikethrough', {
  filter: (node) => node.nodeName === 'DEL' || node.nodeName === 'S' || node.nodeName === 'STRIKE',
  replacement(content) {
    return `~~${content}~~`;
  }
});

turndownService.addRule('list', {
  filter: ['ul', 'ol'],
  replacement(content, node) {
    const trimmed = content.trim();
    const isNested =
      isGenericElement(node) &&
      (node.parentNode?.nodeName === 'UL' || node.parentNode?.nodeName === 'OL');
    return `${isNested ? '' : '\n'}${trimmed}\n`;
  }
});

turndownService.addRule('listItem', {
  filter: 'li',
  replacement(content, node, options) {
    if (!isGenericElement(node)) {
      return content;
    }

    const checkbox = node.querySelector('input[type="checkbox"]');
    let taskPrefix = '';
    if (checkbox && isGenericElement(checkbox)) {
      taskPrefix = checkbox.getAttribute('checked') !== null ? '[x] ' : '[ ] ';
      content = content.replace(/<input[^>]*>/i, '').trim();
    }

    const lines = content
      .replace(/\n+$/, '')
      .split('\n')
      .filter((line) => line.length > 0)
      .join('\n\t');

    let level = 0;
    let cur: ParentNode | null | undefined = node.parentNode;
    while (cur) {
      const name = (cur as unknown as { nodeName?: string }).nodeName;
      if (name === 'UL' || name === 'OL') {
        level++;
      } else if (name !== 'LI') {
        break;
      }
      cur = (cur as unknown as { parentNode?: ParentNode | null }).parentNode;
    }

    const indent = '\t'.repeat(Math.max(0, level - 1));
    const parent = node.parentNode;

    if (isGenericElement(parent) && parent.nodeName === 'OL') {
      const startAttr = parent.getAttribute('start');
      const children = Array.from(parent.children || []);
      const idx = children.indexOf(node as unknown as (typeof children)[0]) + 1;
      const num = startAttr ? Number(startAttr) + idx - 1 : idx;
      return `${indent}${num}. ${taskPrefix}${lines.trim()}\n`;
    }

    return `${indent}${options.bulletListMarker} ${taskPrefix}${lines.trim()}\n`;
  }
});

turndownService.addRule('table', {
  filter: 'table',
  replacement(content, node) {
    if (!isGenericElement(node)) {
      return content;
    }

    // Skip layout tables: nested tables or single-column
    const hasNested = node.querySelector('table') !== null;
    const allCells = Array.from(node.querySelectorAll('td, th'));
    if (hasNested || allCells.length <= 1) {
      return `\n\n${content}\n\n`;
    }

    // Complex tables with colspan/rowspan: pass HTML as-is
    const hasComplex = allCells.some(
      (c) =>
        isGenericElement(c as unknown as GenericElement) &&
        (c.hasAttribute('colspan') || c.hasAttribute('rowspan'))
    );
    if (hasComplex) {
      return `\n\n${node.innerHTML || content}\n\n`;
    }

    // Build Markdown table from rows
    const rows = Array.from(node.querySelectorAll('tr'));
    if (rows.length === 0) {
      return content;
    }

    const mdRows = rows.map((tr) => {
      const cells = Array.from(tr.querySelectorAll('td, th'));
      const cellTexts = cells.map((cell) => {
        const cellEl = cell as unknown as GenericElement;
        return turndownService
          .turndown(cellEl.innerHTML || '')
          .replaceAll('\n', ' ')
          .replaceAll('|', String.raw`\|`)
          .trim();
      });
      return `| ${cellTexts.join(' | ')} |`;
    });

    if (mdRows.length === 0) {
      return content;
    }
    const colCount = mdRows[0]!.split('|').length - 2;
    const separator = `| ${Array.from({ length: colCount }).fill('---').join(' | ')} |`;

    return `\n\n${[mdRows[0], separator, ...mdRows.slice(1)].join('\n')}\n\n`;
  }
});

turndownService.addRule('complexLinkStructure', {
  filter(node) {
    return (
      node.nodeName === 'A' &&
      Array.from(node.childNodes).some((c) =>
        ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(c.nodeName)
      )
    );
  },
  replacement(content, node) {
    if (!isGenericElement(node)) {
      return content;
    }

    const headingEl = node.querySelector('h1, h2, h3, h4, h5, h6');
    if (!headingEl || !isGenericElement(headingEl)) {
      return content;
    }

    const headingLevel = Number(headingEl.nodeName.slice(1));
    const headingContent = turndownService.turndown(headingEl.innerHTML || '').trim();
    const href = node.getAttribute('href') || '';
    const clonedLink = node.cloneNode(true);
    const remaining = isGenericElement(clonedLink)
      ? (() => {
          const clonedHeading = clonedLink.querySelector('h1, h2, h3, h4, h5, h6');
          clonedHeading?.remove();
          return turndownService.turndown(clonedLink.innerHTML || '').trim();
        })()
      : '';
    const heading = `${'#'.repeat(headingLevel)} ${href ? `[${headingContent}](${href})` : headingContent}`;
    return `\n\n${heading}${remaining ? `\n\n${remaining}` : ''}\n\n`;
  }
});

turndownService.addRule('removeMediumAuthor', {
  filter: (node) => {
    const isDiv = node.nodeName === 'DIV';
    const hasTabIndex = node.getAttribute('tabindex') === '-1';
    const containsAuthorPhoto = node.querySelector('[data-testid="authorPhoto"]') !== null;
    const isAuthorPhotoContainer = isDiv && hasTabIndex && containsAuthorPhoto;

    // Check for spans with specific data-testids
    const isSpan = node.nodeName === 'SPAN';
    const dataTestId = node.getAttribute('data-testid');
    const isUnwantedSpan =
      isSpan && (dataTestId === 'storyReadTime' || dataTestId === 'storyPublishDate');

    return isAuthorPhotoContainer || isUnwantedSpan;
  },
  replacement: () => ''
});

turndownService.addRule('preToCodeBlock', {
  filter: 'pre',
  replacement: (content, node) => {
    // Enhanced handling for code blocks with edge cases
    let formattedContent = content
      .replaceAll(/<br\s*\/?>/g, '\n')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&amp;', '&')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'");

    // Handle language class attributes
    let language = '';
    if (isGenericElement(node)) {
      const codeElement = node.querySelector('code');
      if (codeElement && isGenericElement(codeElement)) {
        const className = codeElement.getAttribute('class') || '';
        const langMatch = className.match(/language-(\w+)/);
        if (langMatch?.[1]) {
          language = langMatch[1];
        }
      }
    }

    // If content is already formatted with backticks (from default code rule), clean it up
    if (formattedContent.trim().startsWith('```') && formattedContent.trim().endsWith('```')) {
      // Extract the language if present and the actual content
      const match = formattedContent.match(/^```(\w*)\n([\S\s]*?)\n```$/);
      if (match) {
        const extractedLang = match[1];
        const extractedContent = match[2];
        if (extractedLang && !language) {
          language = extractedLang;
        }
        formattedContent = extractedContent as string;
      }
    }

    // Trim leading/trailing newlines but preserve internal structure
    formattedContent = formattedContent.replaceAll(/^\n+|\n+$/g, '');

    return language
      ? `\`\`\`${language}\n${formattedContent}\n\`\`\``
      : `\`\`\`\n${formattedContent}\n\`\`\``;
  }
});

turndownService.addRule('removeMediumSubscription', {
  filter: (node) => {
    if (node.nodeName === 'P' || node.nodeName === 'H2') {
      const text = node.textContent?.toLowerCase() || '';
      return (
        text.includes('join medium for free') ||
        text.includes('stories in&nbsp;your&nbsp;inbox') ||
        (text.includes('get ') && text.includes('inbox') && text.includes('stories'))
      );
    }

    return false;
  },
  replacement: () => ''
});

turndownService.addRule('removeControls', {
  filter(node: HTMLElement): boolean {
    if (node.nodeName === 'BUTTON') {
      return true;
    }

    if (node.nodeName !== 'A') {
      return false;
    }

    const href = node.getAttribute('href')?.trim().toLowerCase() ?? '';
    return href === 'javascript:void(0)' || href === 'javascript:;';
  },
  replacement: () => ''
});

turndownService.remove(['style', 'script']);

turndownService.addRule('callout', {
  filter: (node) => {
    if (!isGenericElement(node)) {
      return false;
    }
    const isDiv = node.nodeName.toLowerCase() === 'div';
    // GitHub-flavored markdown alerts (.markdown-alert)
    const isGitHubAlert = isDiv && !!node.classList?.contains('markdown-alert');
    // Obsidian-style callouts ([data-callout])
    const isObsidianCallout = isDiv && node.getAttribute('data-callout') !== null;
    return isGitHubAlert || isObsidianCallout;
  },
  replacement: (content, node) => {
    if (!isGenericElement(node)) {
      return content;
    }

    let type = 'NOTE';
    let titleText = '';

    if (node.getAttribute('data-callout') !== null) {
      // Obsidian-style: type from data-callout, title from .callout-title
      type = (node.getAttribute('data-callout') || 'note').toUpperCase();
      const titleEl = node.querySelector('.callout-title');
      if (titleEl && isGenericElement(titleEl)) {
        titleText = titleEl.textContent?.trim() || '';
      }
    } else {
      // GitHub-style: type from class suffix, title from .markdown-alert-title
      const alertClasses = Array.from(node.classList ? Object.keys(node.classList) : []);
      const typeClass = alertClasses.find(
        (c) => c.startsWith('markdown-alert-') && c !== 'markdown-alert'
      );
      type = typeClass ? typeClass.replace('markdown-alert-', '').toUpperCase() : 'NOTE';
      const titleEl = node.querySelector('.markdown-alert-title');
      if (titleEl && isGenericElement(titleEl)) {
        titleText = titleEl.textContent?.trim() || '';
      }
    }

    const contentElements = Array.from(
      node.querySelectorAll('p:not(.markdown-alert-title):not(.callout-title)')
    );
    let alertContent = '';

    if (contentElements.length > 0) {
      const parts: string[] = [];
      for (const p of contentElements) {
        if (isGenericElement(p)) {
          const text = p.textContent?.trim() || '';
          if (text) {
            parts.push(text);
          }
        }
      }
      alertContent = parts.join('\n\n');
    } else {
      alertContent = titleText ? content.replace(titleText, '').trim() : content;
    }

    return `\n> [!${type}]${titleText ? ` ${titleText}` : ''}\n> ${alertContent.replaceAll('\n', '\n> ')}\n`;
  }
});

turndownService.addRule('embedToMarkdown', {
  filter(node: Node): boolean {
    if (!isGenericElement(node)) {
      return false;
    }
    // Enhanced URL detection including data attributes
    const src = node.getAttribute('src');
    const dataSrc = node.getAttribute('data-src');
    const embedUrl = node.getAttribute('data-embed-url');
    const urlToCheck = src || dataSrc || embedUrl || '';
    return (
      !!urlToCheck &&
      (!!urlToCheck.match(/youtube\.com|youtu\.be/) || !!urlToCheck.match(/twitter\.com|x\.com/))
    );
  },
  replacement(content: string, node: Node): string {
    if (!isGenericElement(node)) {
      return content;
    }
    // Enhanced URL extraction including data attributes
    const src =
      node.getAttribute('src') ||
      node.getAttribute('data-src') ||
      node.getAttribute('data-embed-url') ||
      '';
    if (src) {
      // Enhanced YouTube matching - handle youtu.be short URLs and various formats
      const youtubeMatch = src.match(
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]+)/
      );
      if (youtubeMatch?.[1]) {
        return `\n![[${youtubeMatch[1]}]]\n`;
      }
      // Enhanced Twitter/X matching - handle various URL formats
      const tweetMatch = src.match(
        /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/
      );
      if (tweetMatch?.[1]) {
        return `\n![[${tweetMatch[1]}]]\n`;
      }
    }
    return content;
  }
});

class MarkdownService {
  convertToMarkdown(htmlContent: string, context: MarkdownConversionContext) {
    const prepared = prepareHtmlForConversion(htmlContent, context);
    let markdown = turndownService.turndown(prepared.html);

    const titleMatch = markdown.match(/^# .+(?:\n+|$)/);
    if (
      titleMatch &&
      prepared.leadingH1Text &&
      normalizeTitle(prepared.leadingH1Text) === normalizeTitle(context.title)
    ) {
      markdown = markdown.slice(titleMatch[0].length);
    }

    // remove any empty links e.g. [](example.com) that remain, along with surrounding newlines
    // but don't affect image links like ![](image.jpg)
    markdown = markdown.replaceAll(/\n*(?<!!)\[]\([^)]+\)\n*/g, '');

    // remove any consecutive newlines more than two
    markdown = markdown.replaceAll(/\n{3,}/g, '\n\n');

    return markdown.trim();
  }
}

export const markdownService = new MarkdownService();
