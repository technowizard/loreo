import type { Highlight } from '@/types/highlights';

import { HIGHLIGHT_COLORS } from './colors';

type HighlightRendererHandle = {
  clearHighlights: () => void;
  markDirty: () => void;
  processHighlights: (highlights: Array<Highlight>) => void;
};

type HighlightRendererOptions = {
  highlightElement?: string;
  highlightStyle?: { className?: string; style?: Record<string, string> };
  onError?: (error: unknown, context: { highlight: Highlight }) => void;
  resolveStyle?: (highlight: Highlight) => {
    backgroundColor: string;
    borderColor?: string;
    color?: string;
  };
};

export const DEFAULT_HIGHLIGHT_STYLES: Record<
  string,
  { backgroundColor: string; borderColor: string; color?: string }
> = Object.fromEntries(
  HIGHLIGHT_COLORS.map(({ value, markBackground, markBorder }) => [
    value,
    { backgroundColor: markBackground, borderColor: markBorder }
  ])
);

export function getDefaultHighlightStyle(highlight: Highlight) {
  const colorKey = highlight.color.toLowerCase();
  const directMatch = DEFAULT_HIGHLIGHT_STYLES[colorKey];
  if (directMatch) {
    return directMatch;
  }

  const sanitizedKey = colorKey
    .replace(/^bg-/, '')
    .replace(/-300\/?40?$/, '')
    .replaceAll(/[^\da-z-]/g, '');

  const fallbackMatch = DEFAULT_HIGHLIGHT_STYLES[sanitizedKey];
  if (fallbackMatch) {
    return fallbackMatch;
  }

  return {
    backgroundColor: 'rgba(253, 224, 71, 0.4)',
    borderColor: '#facc15'
  };
}

function getIntersectionRange(range1: Range, range2: Range): Range | null {
  try {
    const intersection = document.createRange();

    const startComparison = range1.compareBoundaryPoints(Range.START_TO_START, range2);
    if (startComparison <= 0) {
      intersection.setStart(range2.startContainer, range2.startOffset);
    } else {
      intersection.setStart(range1.startContainer, range1.startOffset);
    }

    const endComparison = range1.compareBoundaryPoints(Range.END_TO_END, range2);
    if (endComparison >= 0) {
      intersection.setEnd(range2.endContainer, range2.endOffset);
    } else {
      intersection.setEnd(range1.endContainer, range1.endOffset);
    }

    if (intersection.collapsed) {
      return null;
    }

    return intersection;
  } catch {
    return null;
  }
}

export function createHighlightRenderer(
  container: HTMLElement,
  options: HighlightRendererOptions = {}
): HighlightRendererHandle {
  // SSR guard: return early handle if not in browser
  if (typeof window === 'undefined') {
    return {
      clearHighlights: () => {},
      markDirty: () => {},
      processHighlights: () => {}
    };
  }

  let textNodeCache: Array<Text> = [];
  let isDirty = true;

  const highlightElement = options.highlightElement || 'mark';
  const highlightStyle = options.highlightStyle;

  const resolveStyle =
    options.resolveStyle ??
    ((highlight: Highlight) => {
      return getDefaultHighlightStyle(highlight);
    });

  function getTextNodes(): Array<Text> {
    if (!isDirty && textNodeCache.length > 0) {
      return textNodeCache;
    }

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        return node.parentElement?.closest(highlightElement)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes: Array<Text> = [];
    let node;
    while ((node = walker.nextNode())) {
      nodes.push(node as Text);
    }

    textNodeCache = nodes;
    isDirty = false;

    return nodes;
  }

  function clearHighlights() {
    const marks = container.querySelectorAll(highlightElement);
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });
    markDirty();
  }

  function processHighlights(highlights: Array<Highlight>) {
    if (!highlights.length) {
      return;
    }

    const sortedHighlights = [...highlights].sort((a, b) => b.startOffset - a.startOffset);

    sortedHighlights.forEach((highlight) => {
      processSingleHighlight(highlight);
    });
  }

  function processSingleHighlight(highlight: Highlight) {
    const textNodes = getTextNodes();
    const range = createRangeFromHighlight(highlight, textNodes);

    if (range) {
      applyHighlightToRange(range, highlight);
    }
  }

  function createRangeFromHighlight(highlight: Highlight, textNodes: Array<Text>): Range | null {
    const range = document.createRange();
    let charIndex = 0;
    let startFound = false;
    let endFound = false;

    for (const textNode of textNodes) {
      if (endFound) {
        break;
      }

      const nodeStart = charIndex;
      const nodeEnd = nodeStart + textNode.length;

      if (!startFound && highlight.startOffset >= nodeStart && highlight.startOffset < nodeEnd) {
        range.setStart(textNode, highlight.startOffset - nodeStart);
        startFound = true;
      }

      if (startFound && highlight.endOffset > nodeStart && highlight.endOffset <= nodeEnd) {
        range.setEnd(textNode, highlight.endOffset - nodeStart);
        endFound = true;
      }

      charIndex = nodeEnd;
    }

    return startFound && endFound ? range : null;
  }

  function applyHighlightToRange(range: Range, highlight: Highlight) {
    try {
      const mark = document.createElement(highlightElement);
      configureHighlightElement(mark, highlight);
      range.surroundContents(mark);
    } catch {
      applyHighlightToComplexRange(range, highlight);
    }
  }

  function applyHighlightToComplexRange(range: Range, highlight: Highlight) {
    const walker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    const nodes: Array<Text> = [];
    let node;
    while ((node = walker.nextNode())) {
      nodes.push(node as Text);
    }

    nodes.forEach((textNode) => {
      const textContent = textNode.textContent || '';
      if (textContent.trim().length === 0) {
        return;
      }

      const nodeRange = document.createRange();
      nodeRange.selectNodeContents(textNode);

      const intersection = getIntersectionRange(range, nodeRange);
      if (!intersection) {
        return;
      }

      const intersectionText = intersection.toString().trim();
      if (intersectionText.length === 0) {
        return;
      }

      try {
        const mark = document.createElement(highlightElement);
        configureHighlightElement(mark, highlight);
        intersection.surroundContents(mark);
      } catch (error) {
        options.onError?.(error, { highlight });
      }
    });
  }

  function configureHighlightElement(mark: HTMLElement, highlight: Highlight) {
    const style = resolveStyle(highlight);

    mark.style.cursor = 'pointer';
    mark.style.backgroundColor = style.backgroundColor;
    mark.style.borderBottomStyle = style.borderColor ? 'solid' : 'none';
    mark.style.borderBottomWidth = style.borderColor ? '3px' : '';
    mark.style.borderBottomColor = style.borderColor || '';
    mark.style.borderRadius = '2px';
    mark.style.padding = '0 1px';
    mark.style.color = style.color || 'inherit';

    if (highlightStyle) {
      if (highlightStyle.className) {
        mark.className = highlightStyle.className;
      }
      if (highlightStyle.style) {
        Object.assign(mark.style, highlightStyle.style);
      }
    }

    mark.dataset.highlightId = highlight.id;

    if (highlight.note) {
      mark.title = highlight.note;
      mark.style.background = `linear-gradient(to right, ${style.borderColor}95 20%, color-mix(in srgb, ${style.borderColor} 30%, transparent) 85%, transparent 100%)`;
      mark.style.borderBottomWidth = '';
    }

    mark.onclick = (event) => {
      event.stopPropagation();
      const rect = mark.getBoundingClientRect();
      const customEvent = new CustomEvent('highlightClick', {
        bubbles: true,
        detail: { highlight, rect }
      });
      mark.dispatchEvent(customEvent);
    };
  }

  function markDirty() {
    isDirty = true;
    textNodeCache = [];
  }

  return {
    clearHighlights,
    markDirty,
    processHighlights
  };
}
