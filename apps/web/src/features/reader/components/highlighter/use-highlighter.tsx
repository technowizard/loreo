import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ColorOption } from './types';
import type { Highlight } from '@/types/highlights';

import { HIGHLIGHT_COLORS } from './colors';
import { createHighlightRenderer } from './highlight-renderer';
import { useFloatingUI } from './use-floating-ui';
import useTouchSelection from './use-touch-selection';
import { processSelectionWhitespace } from './whitespace-utils';

function highlightsChanged(prev: Highlight[], curr: Highlight[]): boolean {
  if (prev.length !== curr.length) {
    return true;
  }

  const prevMap = new Map(prev.map((h) => [h.id, h]));

  for (const currHighlight of curr) {
    const prevHighlight = prevMap.get(currHighlight.id);
    if (!prevHighlight) {
      return true;
    }

    if (
      prevHighlight.color !== currHighlight.color ||
      prevHighlight.startOffset !== currHighlight.startOffset ||
      prevHighlight.endOffset !== currHighlight.endOffset ||
      prevHighlight.text !== currHighlight.text ||
      prevHighlight.note !== currHighlight.note
    ) {
      return true;
    }
  }

  return false;
}

interface HighlightPopoverState {
  editingHighlight: Highlight | null;
  selectedRange: Range | null;
  selectedText: string;
  show: boolean;
}

interface HighlightSelection {
  range: Range | null;
  text: string;
}

export interface UseHighlighterProps {
  allowCrossElementSelection?: boolean;
  colors?: ColorOption[];
  highlights: Highlight[];
  onCreate?: (highlight: Omit<Highlight, 'id'>) => void;
  onRemove?: (id: string) => void;
  onUpdate?: (payload: { highlight: Partial<Highlight>; id: string }) => void;
  onHighlightClick?: (highlight: Highlight, rect: DOMRect) => void;
}

const DEFAULT_COLORS: ColorOption[] = HIGHLIGHT_COLORS.map(({ swatch, label, value }) => ({
  color: swatch,
  label,
  value
}));

export function useHighlighter({
  allowCrossElementSelection = true,
  colors = DEFAULT_COLORS,
  highlights,
  onCreate,
  onHighlightClick,
  onRemove,
  onUpdate
}: UseHighlighterProps) {
  const { t } = useTranslation();
  const [popoverState, setPopoverState] = useState<HighlightPopoverState>({
    editingHighlight: null,
    selectedRange: null,
    selectedText: '',
    show: false
  });

  const [desktopSelection, setDesktopSelection] = useState<HighlightSelection>({
    range: null,
    text: ''
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lastClickRef = useRef<{ id: string; time: number } | null>(null);
  const prevHighlightsRef = useRef<Highlight[]>([]);
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null);
  const highlightProcessorRef = useRef<ReturnType<typeof createHighlightRenderer> | null>(null);

  const {
    FloatingUI,
    hideFloatingUI,
    isVisible: isFloatingUIVisible,
    position: floatingUIPosition,
    showFloatingUI
  } = useFloatingUI({
    position: 'smart',
    positionDesktop: 'smart',
    positionMobile: 'below'
  });

  const highlightsMap = useMemo(() => {
    const map = new Map<string, Highlight>();
    highlights.forEach((h) => {
      if (h.id) {
        map.set(h.id, h);
      }
    });
    return map;
  }, [highlights]);

  const registerContainer = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
  }, []);

  const registerContent = useCallback((node: HTMLDivElement | null) => {
    if (contentRef.current === node) {
      return;
    }

    highlightProcessorRef.current?.clearHighlights();
    highlightProcessorRef.current = null;

    contentRef.current = node;
    setContentElement(node);
    highlightProcessorRef.current = node ? createHighlightRenderer(node, {}) : null;
  }, []);

  const isSelectionAlreadyHighlighted = useCallback(
    (range: Range, text: string) => {
      const contentNode = contentRef.current;
      if (!contentNode) {
        return false;
      }

      if (!text.trim()) {
        return false;
      }

      const processed = processSelectionWhitespace(range, text);

      if (!processed.shouldHighlight) {
        return false;
      }

      const processedText = processed.processedText || text;
      const processedRange = processed.processedRange || range;

      const preSelectionRange = document.createRange();
      preSelectionRange.selectNodeContents(contentNode);
      preSelectionRange.setEnd(processedRange.startContainer, processedRange.startOffset);

      const startOffset = (preSelectionRange.cloneContents().textContent || '').length;
      const endOffset = startOffset + processedText.length;

      const overlappingHighlights = highlights.filter(
        ({ endOffset: highlightEnd, startOffset: highlightStart }) =>
          highlightEnd > startOffset && highlightStart < endOffset
      );

      if (overlappingHighlights.length === 0) {
        return false;
      }

      return true;
    },
    [highlights]
  );

  const handleSelectionEnd = useCallback(
    (selection: { range: Range; text: string }) => {
      const contentNode = contentRef.current;
      if (!contentNode || !contentNode.contains(selection.range.commonAncestorContainer)) {
        return;
      }

      if (isSelectionAlreadyHighlighted(selection.range, selection.text)) {
        hideFloatingUI();
        setDesktopSelection({ range: null, text: '' });
        setPopoverState((prev) => ({ ...prev, show: false }));
        return;
      }

      setDesktopSelection({
        range: selection.range,
        text: selection.text
      });
      showFloatingUI(selection);
      setPopoverState((prev) => ({
        ...prev,
        editingHighlight: null,
        show: false
      }));
    },
    [hideFloatingUI, isSelectionAlreadyHighlighted, showFloatingUI]
  );

  const handleSelectionClear = useCallback(() => {
    setPopoverState((prev) => ({ ...prev, show: false }));
    setDesktopSelection({ range: null, text: '' });
    hideFloatingUI();
  }, [hideFloatingUI]);

  const handleHighlightClick = useCallback(
    (event: CustomEvent<{ highlight: Highlight; rect: DOMRect }>) => {
      const { highlight, rect } = event.detail;

      if (!highlight.id) {
        return;
      }

      const now = Date.now();
      const lastClick = lastClickRef.current;
      if (lastClick && lastClick.id === highlight.id && now - lastClick.time < 300) {
        return;
      }
      lastClickRef.current = { id: highlight.id, time: now };

      const vetoResult = onHighlightClick?.(highlight, rect);

      if (typeof vetoResult === 'boolean' && vetoResult === false) {
        return;
      }

      setPopoverState({
        editingHighlight: highlight,
        selectedRange: null,
        selectedText: highlight.text,
        show: true
      });

      showFloatingUI({ range: rect, text: highlight.text });
    },
    [onHighlightClick, showFloatingUI]
  );

  useTouchSelection({
    allowCrossElement: allowCrossElementSelection,
    minSelectionLength: 3,
    onSelectionClear: handleSelectionClear,
    onSelectionEnd: handleSelectionEnd
  });

  const closePopover = useCallback(() => {
    setPopoverState({
      editingHighlight: null,
      selectedRange: null,
      selectedText: '',
      show: false
    });
    setDesktopSelection({ range: null, text: '' });
    hideFloatingUI();
    window.getSelection()?.removeAllRanges();
  }, [hideFloatingUI]);

  const createHighlight = useCallback(
    (color: string) => {
      let selectedRange = desktopSelection.range || popoverState.selectedRange;

      if (!selectedRange) {
        const windowSelection = window.getSelection();
        if (windowSelection && windowSelection.rangeCount > 0 && !windowSelection.isCollapsed) {
          selectedRange = windowSelection.getRangeAt(0);
        }
      }

      const contentNode = contentRef.current;

      if (!selectedRange || !contentNode) {
        console.warn('No selection available to highlight');
        return;
      }

      const originalText = selectedRange.toString();
      const processed = processSelectionWhitespace(selectedRange, originalText);

      if (!processed.shouldHighlight) {
        if (processed.reason) {
          console.warn(processed.reason);
        }
        closePopover();
        return;
      }

      const text = processed.processedText || originalText;
      const range = processed.processedRange || selectedRange;

      if (!text.trim()) {
        console.warn('Cannot highlight empty selection');
        closePopover();
        return;
      }

      const preSelectionRange = document.createRange();
      preSelectionRange.selectNodeContents(contentNode);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);

      const startOffset = (preSelectionRange.cloneContents().textContent || '').length;
      const endOffset = startOffset + text.length;

      const newHighlight = {
        color,
        endOffset,
        startOffset,
        text,
        note: null
      };

      onCreate?.(newHighlight);
      window.getSelection()?.removeAllRanges();
      closePopover();
    },
    [desktopSelection.range, popoverState.selectedRange, onCreate, closePopover]
  );

  const renderDesktopHighlightUI = useCallback(() => {
    return (
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: '8px',
          minWidth: '160px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {colors.map(({ color, value, label }) => (
            <button
              aria-label={`Highlight in ${label}`}
              key={value}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                createHighlight(value);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                backgroundColor: color,
                border: 'none',
                borderRadius: '9999px',
                cursor: 'pointer',
                height: '24px',
                padding: 0,
                width: '24px'
              }}
              title={`Highlight in ${label}`}
            />
          ))}
        </div>

        <div
          style={{
            backgroundColor: 'black',
            height: '24px',
            width: '1px'
          }}
        />

        <div
          aria-label={t('reader.highlights.closeOptionsAria')}
          onClick={hideFloatingUI}
          style={{
            alignItems: 'center',
            color: 'black',
            cursor: 'pointer',
            display: 'flex',
            fontSize: '12px',
            justifyContent: 'center',
            lineHeight: '16px'
          }}
        >
          {t('common.dialog.close')}
        </div>
      </div>
    );
  }, [colors, createHighlight, hideFloatingUI]);

  const renderHighlightEditUI = useCallback(() => {
    const editingHighlight = popoverState.editingHighlight;
    if (!editingHighlight) {
      return null;
    }

    const handleColorClick = (key: string) => {
      if (!editingHighlight.id) {
        console.warn('Cannot update highlight without an id');
        return;
      }
      onUpdate?.({
        highlight: { color: key },
        id: editingHighlight.id
      });
    };

    const handleRemoveClick = () => {
      if (!editingHighlight.id) {
        console.warn('Cannot remove highlight without an id');
        return;
      }
      onRemove?.(editingHighlight.id);
      setPopoverState((prev) => ({
        ...prev,
        editingHighlight: null,
        show: false
      }));
    };

    return (
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: '8px',
          minWidth: '200px'
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          {colors.map(({ color, value, label }) => (
            <button
              aria-label={t('reader.highlights.changeColorAria', { label })}
              key={value}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleColorClick(value);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                backgroundColor: color,
                border:
                  editingHighlight.color === color ? '2px solid #3b82f6' : '2px solid transparent',
                borderRadius: '9999px',
                cursor: 'pointer',
                height: '24px',
                padding: 0,
                transition: 'border-color 0.15s ease',
                width: '24px'
              }}
              title={t('reader.highlights.changeColorTitle', { label })}
            />
          ))}
        </div>

        <div
          style={{
            backgroundColor: '#e5e7eb',
            height: '24px',
            width: '1px'
          }}
        />

        <button
          aria-label={t('reader.notes.removeHighlight')}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleRemoveClick();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fee2e2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          style={{
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '4px',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            fontSize: '12px',
            fontWeight: 500,
            justifyContent: 'center',
            lineHeight: '16px',
            padding: '4px 8px',
            transition: 'background-color 0.15s ease'
          }}
        >
          Remove
        </button>
      </div>
    );
  }, [colors, popoverState.editingHighlight, onUpdate, onRemove]);

  const updateHighlight = useCallback(
    (highlightId: string, updates: Partial<Highlight>) => {
      if (!onUpdate) {
        return;
      }
      onUpdate({
        highlight: updates,
        id: highlightId
      });
    },
    [onUpdate]
  );

  const removeHighlight = useCallback(
    (highlightId: string) => {
      const highlight = highlightsMap.get(highlightId);
      if (!highlight) {
        console.warn(`[removeHighlight] Highlight with id "${highlightId}" not found`);
        return;
      }

      onRemove?.(highlightId);
      setPopoverState((prev) => ({
        ...prev,
        editingHighlight:
          prev.editingHighlight && prev.editingHighlight.id === highlightId
            ? null
            : prev.editingHighlight,
        show: false
      }));
    },
    [onRemove, highlightsMap]
  );

  const clearHighlights = useCallback(() => {
    const ids = Array.from(highlightsMap.keys());
    ids.forEach((id) => {
      onRemove?.(id);
    });
    setPopoverState((prev) => ({
      ...prev,
      editingHighlight: null,
      show: false
    }));
  }, [highlightsMap, onRemove]);

  useLayoutEffect(() => {
    const processor = highlightProcessorRef.current;
    if (!processor) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const prev = prevHighlightsRef.current;
      const curr = highlights;

      // Only re-process if highlights actually changed
      if (highlightsChanged(prev, curr)) {
        processor.clearHighlights();
        if (highlights.length > 0) {
          processor.processHighlights(highlights);
        }
        prevHighlightsRef.current = curr;
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [highlights, contentElement]);

  useLayoutEffect(() => {
    if (!contentElement) {
      return;
    }
    highlightProcessorRef.current?.markDirty();
  }, [contentElement]);

  useEffect(() => {
    const node = contentElement;
    if (!node) {
      return;
    }

    const listener = (event: Event) => {
      handleHighlightClick(
        event as CustomEvent<{
          highlight: Highlight;
          rect: DOMRect;
        }>
      );
    };

    node.addEventListener('highlightClick', listener as EventListener);
    return () => {
      node.removeEventListener('highlightClick', listener as EventListener);
    };
  }, [contentElement, handleHighlightClick]);

  useEffect(() => {
    return () => {
      highlightProcessorRef.current?.clearHighlights();
      highlightProcessorRef.current = null;
    };
  }, []);

  return {
    clearHighlights,
    closePopover,
    createHighlight,
    desktopSelection,
    FloatingUI,
    floatingUIPosition,
    hideFloatingUI,
    isFloatingUIVisible,
    popoverState,
    registerContainer,
    registerContent,
    removeHighlight,
    renderDesktopHighlightUI,
    renderHighlightEditUI,
    updateHighlight
  };
}
