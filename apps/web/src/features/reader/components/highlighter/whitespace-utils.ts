export function analyzeSelectionWhitespace(text: string) {
  const totalLength = text.length;
  const trimmedLength = text.trim().length;
  const whitespaceCount = (text.match(/\s/g) || []).length;
  const newlineCount = (text.match(/\n/g) || []).length;

  return {
    hasLeadingWhitespace: /^\s/.test(text),
    hasTrailingWhitespace: /\s$/.test(text),
    isWhitespaceHeavy: totalLength > 0 && whitespaceCount / totalLength > 0.3,
    newlineCount,
    totalLength,
    trimmedLength,
    whitespaceCount,
    whitespaceRatio: totalLength > 0 ? whitespaceCount / totalLength : 0
  };
}

export interface WhitespaceAnalysis {
  hasLeadingWhitespace: boolean;
  hasTrailingWhitespace: boolean;
  isWhitespaceHeavy: boolean;
  newlineCount: number;
  totalLength: number;
  trimmedLength: number;
  whitespaceCount: number;
  whitespaceRatio: number;
}

export function isSelectionCrossElement(range: Range): boolean {
  if (range.startContainer !== range.endContainer) {
    return true;
  }

  const walker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  });

  const textNodes: Node[] = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  if (textNodes.length <= 1) {
    return false;
  }

  const firstParent = textNodes[0]?.parentElement;
  if (!firstParent) {
    return false;
  }
  return textNodes.some((textNode) => textNode.parentElement !== firstParent);
}

export interface WhitespaceProcessingResult {
  processedRange?: Range;
  processedText?: string;
  reason?: string;
  shouldHighlight: boolean;
}

export function processSelectionWhitespace(range: Range, text: string): WhitespaceProcessingResult {
  const analysis = analyzeSelectionWhitespace(text);

  if (analysis.newlineCount > 2) {
    return {
      reason: 'Selection spans too many lines - try selecting within paragraphs',
      shouldHighlight: false
    };
  }

  if (analysis.isWhitespaceHeavy) {
    return {
      reason: 'Selection contains mostly whitespace - try selecting text content',
      shouldHighlight: false
    };
  }

  if (
    analysis.newlineCount > 0 &&
    (analysis.hasLeadingWhitespace || analysis.hasTrailingWhitespace)
  ) {
    const trimmedText = text.trim();
    if (trimmedText.length > 0) {
      return {
        processedRange: range,
        processedText: text,
        shouldHighlight: true
      };
    }
  }

  return {
    processedRange: range,
    processedText: text,
    shouldHighlight: true
  };
}
