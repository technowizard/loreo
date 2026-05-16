import { useCallback, useEffect, useRef, useState } from 'react';

interface TouchSelectionState {
  endX: number;
  endY: number;
  isSelecting: boolean;
  range: Range | null;
  selectedText: string;
  startX: number;
  startY: number;
}

interface UseTouchSelectionOptions {
  allowCrossElement?: boolean;
  minSelectionLength?: number;
  onSelectionClear?: () => void;
  onSelectionEnd?: (selection: { range: Range; text: string }) => void;
}

function getCaretPosition(x: number, y: number): Range | null {
  // WebKit browsers (Safari, Chrome, iOS)
  if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(x, y);
    return range;
  }

  // Firefox
  if (document.caretPositionFromPoint) {
    const caretPosition = document.caretPositionFromPoint(x, y);

    if (caretPosition && caretPosition.offsetNode) {
      const range = document.createRange();
      range.setStart(caretPosition.offsetNode, caretPosition.offset);
      range.collapse(true);
      return range;
    }
  }

  // Browser doesn't support either API
  return null;
}

export default function useTouchSelection({
  allowCrossElement = false,
  minSelectionLength = 3,
  onSelectionClear,
  onSelectionEnd
}: UseTouchSelectionOptions = {}) {
  const [selection, setSelection] = useState<TouchSelectionState>({
    endX: 0,
    endY: 0,
    isSelecting: false,
    range: null,
    selectedText: '',
    startX: 0,
    startY: 0
  });

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSelectionText = useRef<string>('');
  const lastSelectionRectKey = useRef<string>('');
  const selectionStableTimer = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const lastTapTime = useRef<number>(0);
  const isLongPressing = useRef<boolean>(false);
  const isUserTouching = useRef<boolean>(false);
  const activeTouchCount = useRef<number>(0);
  const touchEndTime = useRef<number>(0);
  const pendingSelectionOnRelease = useRef<{
    rectKey: string;
    text: string;
  } | null>(null);
  const lastTouchEventAt = useRef<number>(0);
  const pendingReleaseFallbackTimer = useRef<number | null>(null);
  const popupDelay = 350;

  // Utility: Detect if selection crosses element boundaries
  const isSelectionCrossElement = useCallback((range: Range): boolean => {
    return range.startContainer !== range.endContainer;
  }, []);

  // Utility: Validate cross-element selection
  const validateCrossElementSelection = useCallback(
    (range: Range) => {
      const crossesElements = isSelectionCrossElement(range);

      if (!crossesElements) {
        return {
          elementTypes: [],
          isValid: true,
          reason: 'Within single element'
        };
      }

      const startElement =
        range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement
          : (range.startContainer as Element);

      const endElement =
        range.endContainer.nodeType === Node.TEXT_NODE
          ? range.endContainer.parentElement
          : (range.endContainer as Element);

      const elementTypes = [startElement?.tagName, endElement?.tagName]
        .filter(Boolean)
        .map((tag) => tag?.toUpperCase());

      // Allow selection across text-level elements but not block-level
      const allowedCrossings = ['P', 'SPAN', 'EM', 'STRONG', 'A', 'CODE', 'MARK'];
      const isValid = elementTypes.every((tag) => allowedCrossings.includes(tag || ''));

      return {
        elementTypes,
        isValid,
        reason: isValid
          ? `Crosses allowed elements: ${elementTypes.join(' → ')}`
          : `Crosses restricted elements: ${elementTypes.join(' → ')}`
      };
    },
    [isSelectionCrossElement]
  );

  // Utility: Expand range to word boundaries
  const expandToWordBoundaries = useCallback((range: Range): Range => {
    const newRange = range.cloneRange();

    if (range.collapsed) {
      return newRange;
    }

    // Robust cross-browser fallback
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    let startOffset = range.startOffset;
    let endOffset = range.endOffset;

    // Handle start container - expand to word boundary
    if (startContainer.nodeType === Node.TEXT_NODE) {
      const fullText = startContainer.textContent || '';
      const textBefore = fullText.slice(0, startOffset);

      // Find word boundaries including spaces, punctuation, and Unicode boundaries
      let wordStart = 0;
      for (let i = textBefore.length - 1; i >= 0; i--) {
        const char = textBefore[i];
        // Stop at whitespace or punctuation
        if (char && /[\s!"'(),.:;?[\]{}–—-]/.test(char)) {
          wordStart = i + 1;
          break;
        }
      }
      startOffset = wordStart;
    }

    // Handle end container - expand to word boundary
    if (endContainer.nodeType === Node.TEXT_NODE) {
      const fullText = endContainer.textContent || '';
      const textAfter = fullText.slice(endOffset);

      // Find word boundaries including spaces, punctuation, and Unicode boundaries
      let wordEnd = textAfter.length;
      for (let i = 0; i < textAfter.length; i++) {
        const char = textAfter[i];
        // Stop at whitespace or punctuation
        if (char && /[\s!"'(),.:;?[\]{}–—-]/.test(char)) {
          wordEnd = i;
          break;
        }
      }
      endOffset += wordEnd;
    }

    try {
      newRange.setStart(startContainer, startOffset);
      newRange.setEnd(endContainer, endOffset);
    } catch (error) {
      // If range manipulation fails, try simpler fallback
      console.warn('Word boundary expansion failed:', error);
      try {
        return range.cloneRange();
      } catch (fallbackError) {
        console.error('Range cloning also failed:', fallbackError);
        // Create a new collapsed range as last resort
        const fallbackRange = document.createRange();
        fallbackRange.collapse(true);
        return fallbackRange;
      }
    }

    return newRange;
  }, []);

  // Utility: Enhanced device detection
  const isDesktopDevice = useCallback((): boolean => {
    if (typeof window === 'undefined') {
      return false;
    }

    // Enhanced mobile/desktop detection
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasFinPointer = window.matchMedia('(pointer: fine)').matches;
    const hasHover = window.matchMedia('(hover: hover)').matches;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Desktop: fine pointer + hover support, or fine pointer without touch
    const isDesktop = hasFinPointer && (hasHover || !hasTouch);

    // Mobile: coarse pointer or touch support without hover
    const isMobile = hasCoarsePointer || (hasTouch && !hasHover);

    return isDesktop && !isMobile;
  }, []);

  // Detect if we should prioritize native selection (mobile-first approach)
  const shouldUseNativeSelection = useCallback((): boolean => {
    if (typeof window === 'undefined') {
      return false;
    }

    // Use native selection on mobile devices
    const isMobileDevice = !isDesktopDevice();
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

    return isMobileDevice || hasTouch || hasCoarsePointer;
  }, [isDesktopDevice]);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection({
      endX: 0,
      endY: 0,
      isSelecting: false,
      range: null,
      selectedText: '',
      startX: 0,
      startY: 0
    });
    onSelectionClear?.();
  }, [onSelectionClear]);

  const isPartialWord = useCallback((range: Range): boolean => {
    const before = (range.startContainer.textContent || '')[range.startOffset - 1];
    const after = (range.endContainer.textContent || '')[range.endOffset];
    return /\w/.test(before || '') || /\w/.test(after || '');
  }, []);

  // Apply word boundary expansion (always 'word')
  const applySelectionBoundary = useCallback(
    (range: Range): Range =>
      isPartialWord(range) ? expandToWordBoundaries(range) : range.cloneRange(),
    [expandToWordBoundaries, isPartialWord]
  );

  const handleTouchStart = useCallback(
    (e: Event) => {
      const touchEvent = e as TouchEvent;
      const touch = touchEvent.touches?.[0];
      if (!touch) {
        return;
      }

      const now = Date.now();

      // Check for double tap
      if (now - lastTapTime.current < 300) {
        // Double tap detected - clear any existing selection
        clearSelection();
        return;
      }

      lastTapTime.current = now;
      touchStartTime.current = now;
      isLongPressing.current = false;

      // Clear existing selection on new touch
      if (selection.range) {
        clearSelection();
      }

      // Start long press timer - shorter delay on mobile devices
      const isMobile = shouldUseNativeSelection();
      const longPressDelay = isMobile ? 300 : 500; // Shorter delay for mobile

      longPressTimer.current = setTimeout(() => {
        // On mobile, give native selection priority - only intervene if no native selection exists
        if (isMobile) {
          const existingSelection = window.getSelection();
          if (existingSelection && existingSelection.toString().trim()) {
            return; // Native selection is active, let it handle
          }
        }

        isLongPressing.current = true;

        // Get element under touch point
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && element.closest('[data-selectable]')) {
          // Add haptic feedback on supported devices
          try {
            if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
              navigator.vibrate(50);
            }
          } catch {
            // Ignore vibration errors
          }

          // Start text selection using cross-browser utility
          let range: Range | null = getCaretPosition(touch.clientX, touch.clientY);

          if (range) {
            // Apply word boundary expansion
            range = applySelectionBoundary(range);

            // Validate cross-element selection
            if (isSelectionCrossElement(range)) {
              const validation = validateCrossElementSelection(range);

              if (!validation.isValid && !allowCrossElement) {
                if (isDesktopDevice()) {
                  console.info(
                    `Selection spans across different sections (${validation.elementTypes.join(
                      ' → '
                    )}). Enable cross-element selection to highlight this text.`,
                    { duration: 3000 }
                  );
                }
                return; // Don't proceed with invalid selection
              }

              if (validation.isValid && validation.elementTypes.length > 0) {
                console.log(`Cross-element selection: ${validation.reason}`);
              }
            }

            const windowSelection = window.getSelection();
            windowSelection?.removeAllRanges();
            windowSelection?.addRange(range);

            setSelection({
              endX: touch.clientX,
              endY: touch.clientY,
              isSelecting: true,
              range: range.cloneRange(),
              selectedText: range.toString(),
              startX: touch.clientX,
              startY: touch.clientY
            });
          }
        }
      }, longPressDelay); // Adaptive long press threshold
    },
    [
      selection.range,
      clearSelection,
      applySelectionBoundary,
      isSelectionCrossElement,
      validateCrossElementSelection,
      allowCrossElement,
      isDesktopDevice,
      shouldUseNativeSelection
    ]
  );

  const handleTouchMove = useCallback(
    (e: Event) => {
      // Allow native selection by default - only intervene if in custom selection mode
      if (!isLongPressing.current || !selection.isSelecting) {
        return; // Let browser handle native selection
      }

      const touchEvent = e as TouchEvent;
      // Only prevent default for our custom selection to avoid interfering with native
      touchEvent.preventDefault();

      const touch = touchEvent.touches?.[0];
      if (!touch) {
        return;
      }

      const endPoint: Range | null = getCaretPosition(touch.clientX, touch.clientY);

      if (endPoint && selection.range) {
        const newRange = selection.range.cloneRange();

        // Determine if we're selecting forward or backward
        const startPoint: Range | null = getCaretPosition(selection.startX, selection.startY);

        if (startPoint) {
          const comparison = startPoint.compareBoundaryPoints(Range.START_TO_START, endPoint);

          if (comparison <= 0) {
            // Forward selection
            newRange.setStart(startPoint.startContainer, startPoint.startOffset);
            newRange.setEnd(endPoint.endContainer, endPoint.endOffset);
          } else {
            // Backward selection
            newRange.setStart(endPoint.startContainer, endPoint.startOffset);
            newRange.setEnd(startPoint.endContainer, startPoint.endOffset);
          }

          // Update window selection
          const windowSelection = window.getSelection();
          windowSelection?.removeAllRanges();
          windowSelection?.addRange(newRange);

          setSelection((prev) => ({
            ...prev,
            endX: touch.clientX,
            endY: touch.clientY,
            range: newRange.cloneRange(),
            selectedText: newRange.toString()
          }));
        }
      }
    },
    [selection.isSelecting, selection.range, selection.startX, selection.startY]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const touchDuration = Date.now() - touchStartTime.current;

    // If it was a long press and we have a selection
    if (isLongPressing.current && selection.isSelecting && selection.range) {
      const selectedText = selection.selectedText.trim();

      if (selectedText.length >= minSelectionLength) {
        onSelectionEnd?.({
          range: selection.range,
          text: selectedText
        });
      } else {
        // Selection too short, clear it
        clearSelection();
      }
    } else if (touchDuration < 200) {
      // Short tap - clear any existing selection
      clearSelection();
    }

    isLongPressing.current = false;

    setSelection((prev) => ({
      ...prev,
      isSelecting: false
    }));
  }, [
    selection.isSelecting,
    selection.range,
    selection.selectedText,
    minSelectionLength,
    onSelectionEnd,
    clearSelection
  ]);

  // Process a confirmed native selection
  const processNativeSelection = useCallback(
    (range: Range, selectedText: string) => {
      // Check if selection is within our selectable elements
      const startElement =
        range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement
          : (range.startContainer as Element);

      if (!startElement?.closest('[data-selectable]')) {
        return; // Selection is outside our content area
      }

      // Only process meaningful selections
      if (selectedText.length >= minSelectionLength) {
        const processedRange = applySelectionBoundary(range);

        // Validate cross-element selection
        if (isSelectionCrossElement(processedRange)) {
          const validation = validateCrossElementSelection(processedRange);

          if (!validation.isValid && !allowCrossElement) {
            // Clear invalid selection and show feedback
            window.getSelection()?.removeAllRanges();
            if (isDesktopDevice()) {
              console.info(
                `Selection spans across different sections. Try selecting within a single paragraph.`
              );
            }
            return;
          }
        }

        // Update our selection state
        setSelection({
          endX: 0, // Native selection doesn't track coordinates
          endY: 0,
          isSelecting: false,
          range: processedRange.cloneRange(),
          selectedText: processedRange.toString().trim(),
          startX: 0,
          startY: 0
        });

        // Trigger selection end callback
        onSelectionEnd?.({
          range: processedRange.cloneRange(),
          text: processedRange.toString().trim()
        });
      }
    },
    [
      minSelectionLength,
      applySelectionBoundary,
      isSelectionCrossElement,
      validateCrossElementSelection,
      allowCrossElement,
      isDesktopDevice,
      onSelectionEnd,
      shouldUseNativeSelection
    ]
  );

  // Handle native mobile selection via selectionchange event
  const handleNativeSelection = useCallback(() => {
    const windowSelection = window.getSelection();
    if (!windowSelection || windowSelection.rangeCount === 0) {
      // Selection was cleared - reset tracking
      lastSelectionText.current = '';
      lastSelectionRectKey.current = '';
      if (selectionStableTimer.current) {
        clearTimeout(selectionStableTimer.current);
        selectionStableTimer.current = null;
      }
      return;
    }

    const range = windowSelection.getRangeAt(0);
    const selectedText = range.toString().trim();

    // Compute a stable rect key for selection (merged bounding box)
    const getRangeRectKey = (r: Range) => {
      try {
        const rects = Array.from(r.getClientRects());
        if (rects.length === 0) {
          const b = r.getBoundingClientRect();
          const round = (v: number) => Math.round(v);
          return `${round(b.left)}:${round(b.top)}:${round(b.right)}:${round(b.bottom)}:0`;
        }
        let minL = Infinity,
          minT = Infinity,
          maxR = -Infinity,
          maxB = -Infinity;
        rects.forEach((rc) => {
          minL = Math.min(minL, rc.left);
          minT = Math.min(minT, rc.top);
          maxR = Math.max(maxR, rc.right);
          maxB = Math.max(maxB, rc.bottom);
        });
        const round = (v: number) => Math.round(v);
        return `${round(minL)}:${round(minT)}:${round(maxR)}:${round(maxB)}:${rects.length}`;
      } catch {
        return 'no-rect';
      }
    };
    const rectKey = getRangeRectKey(range);

    // Skip empty selections or collapsed ranges (just cursor placement)
    if (!selectedText || range.collapsed) {
      lastSelectionText.current = '';
      lastSelectionRectKey.current = '';
      return;
    }

    // Check if selection is within our selectable elements
    const startElement =
      range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : (range.startContainer as Element);

    if (!startElement?.closest('[data-selectable]')) {
      return; // Selection is outside our content area
    }

    const textChanged = selectedText !== lastSelectionText.current;
    const rectChanged = rectKey !== lastSelectionRectKey.current;

    // Save latest snapshot
    lastSelectionText.current = selectedText;
    lastSelectionRectKey.current = rectKey;

    // If selection text or rect changed, restart stability timer (finger is up)
    if (textChanged || rectChanged) {
      if (selectionStableTimer.current) {
        clearTimeout(selectionStableTimer.current);
      }

      if (selectedText.length >= minSelectionLength) {
        selectionStableTimer.current = window.setTimeout(() => {
          // Double-check selection is still the same and stable
          const finalSelection = window.getSelection();
          if (!finalSelection || finalSelection.rangeCount === 0) {
            return;
          }
          const finalRange = finalSelection.getRangeAt(0);
          const finalText = finalRange.toString().trim();
          const finalRectKey = getRangeRectKey(finalRange);

          if (
            finalText === lastSelectionText.current &&
            finalRectKey === lastSelectionRectKey.current &&
            !finalRange.collapsed
          ) {
            processNativeSelection(finalRange, finalText);
          }
        }, popupDelay); // Wait for selection to stabilize after handle drag
      }
    }
  }, [processNativeSelection, minSelectionLength]);

  const handleMouseUp = useCallback(() => {
    // Handle desktop text selection with enhanced validation
    const windowSelection = window.getSelection();
    if (windowSelection && windowSelection.toString().trim() !== '') {
      let range = windowSelection.getRangeAt(0);

      // Apply word boundary expansion
      range = applySelectionBoundary(range);

      // Validate cross-element selection
      if (isSelectionCrossElement(range)) {
        const validation = validateCrossElementSelection(range);

        if (!validation.isValid && !allowCrossElement) {
          console.warn(
            `Selection spans across different sections (${validation.elementTypes.join(
              ' → '
            )}). Try selecting within a single paragraph or enable cross-element selection.`
          );
          windowSelection.removeAllRanges();
          return;
        }

        if (validation.isValid && validation.elementTypes.length > 0) {
          console.log(`Desktop cross-element selection: ${validation.reason}`);
        }
      }

      const selectedText = range.toString().trim();

      if (selectedText.length >= minSelectionLength) {
        // Update window selection with processed range
        windowSelection.removeAllRanges();
        windowSelection.addRange(range);

        setSelection({
          endX: 0,
          endY: 0,
          isSelecting: false,
          range: range.cloneRange(),
          selectedText,
          startX: 0,
          startY: 0
        });

        onSelectionEnd?.({
          range: range.cloneRange(),
          text: selectedText
        });
      }
    }
  }, [
    minSelectionLength,
    onSelectionEnd,
    applySelectionBoundary,
    isSelectionCrossElement,
    validateCrossElementSelection,
    allowCrossElement
  ]);

  // Global touch tracking (kept for custom selection mode only)
  const handleGlobalTouchStart = useCallback(() => {
    isUserTouching.current = true;
    activeTouchCount.current = Math.max(1, activeTouchCount.current + 1);
    lastTouchEventAt.current = Date.now();
  }, []);

  const handleGlobalTouchEnd = useCallback(() => {
    activeTouchCount.current = Math.max(0, activeTouchCount.current - 1);
    if (activeTouchCount.current === 0) {
      isUserTouching.current = false;
      touchEndTime.current = Date.now();
      lastTouchEventAt.current = touchEndTime.current;

      // If we had a pending selection snapshot, start a stability timer now
      if (pendingSelectionOnRelease.current) {
        pendingSelectionOnRelease.current = null;

        if (selectionStableTimer.current) {
          clearTimeout(selectionStableTimer.current);
        }

        // Recreate rect key function locally
        const getKey = (r: Range) => {
          try {
            const rects = Array.from(r.getClientRects());
            if (rects.length === 0) {
              const b = r.getBoundingClientRect();
              const round = (v: number) => Math.round(v);
              return `${round(b.left)}:${round(b.top)}:${round(b.right)}:${round(b.bottom)}:0`;
            }
            let minL = Infinity,
              minT = Infinity,
              maxR = -Infinity,
              maxB = -Infinity;
            rects.forEach((rc) => {
              minL = Math.min(minL, rc.left);
              minT = Math.min(minT, rc.top);
              maxR = Math.max(maxR, rc.right);
              maxB = Math.max(maxB, rc.bottom);
            });
            const round = (v: number) => Math.round(v);
            return `${round(minL)}:${round(minT)}:${round(maxR)}:${round(maxB)}:${rects.length}`;
          } catch {
            return 'no-rect';
          }
        };

        selectionStableTimer.current = window.setTimeout(() => {
          const finalSelection = window.getSelection();
          if (!finalSelection || finalSelection.rangeCount === 0) {
            return;
          }
          const finalRange = finalSelection.getRangeAt(0);
          const finalText = finalRange.toString().trim();

          const finalRectKey = getKey(finalRange);
          if (
            !finalRange.collapsed &&
            finalText.length >= minSelectionLength &&
            finalText === lastSelectionText.current &&
            finalRectKey === lastSelectionRectKey.current
          ) {
            processNativeSelection(finalRange, finalText);
          }
        }, popupDelay);
      }
    }
  }, [minSelectionLength, processNativeSelection, popupDelay]);

  const handleGlobalTouchCancel = useCallback(() => {
    activeTouchCount.current = 0;
    isUserTouching.current = false;
    lastTouchEventAt.current = Date.now();
  }, []);

  // Pointer events (improves Firefox mobile reliability)
  const handleGlobalPointerDown = useCallback((e: Event) => {
    const pe = e as PointerEvent;
    if (pe.pointerType === 'touch') {
      isUserTouching.current = true;
      activeTouchCount.current = Math.max(1, activeTouchCount.current + 1);
      lastTouchEventAt.current = Date.now();
    }
  }, []);

  const handleGlobalPointerUp = useCallback((e: Event) => {
    const pe = e as PointerEvent;
    if (pe.pointerType === 'touch') {
      activeTouchCount.current = Math.max(0, activeTouchCount.current - 1);
      if (activeTouchCount.current === 0) {
        isUserTouching.current = false;
        lastTouchEventAt.current = Date.now();
      }
    }
  }, []);

  const handleGlobalPointerCancel = useCallback((e: Event) => {
    const pe = e as PointerEvent;
    if (pe.pointerType === 'touch') {
      activeTouchCount.current = 0;
      isUserTouching.current = false;
      lastTouchEventAt.current = Date.now();
    }
  }, []);

  // Attach event listeners only to selectable content
  useEffect(() => {
    const selectableElements = document.querySelectorAll('[data-selectable]');
    const options = { passive: false as const };

    const useNative = shouldUseNativeSelection();

    // Attach desktop/fallback handlers
    if (!useNative) {
      selectableElements.forEach((element) => {
        element.addEventListener('touchstart', handleTouchStart, options);
        element.addEventListener('touchmove', handleTouchMove, options);
        element.addEventListener('touchend', handleTouchEnd, options);
      });
    }

    // Always track global touch state for native gating
    document.addEventListener('touchstart', handleGlobalTouchStart, {
      passive: true
    });
    document.addEventListener('touchend', handleGlobalTouchEnd, {
      passive: true
    });
    document.addEventListener('touchcancel', handleGlobalTouchCancel, {
      passive: true
    });

    // Always allow mouse-based selection end (desktop)
    selectableElements.forEach((element) => {
      element.addEventListener('mouseup', handleMouseUp);
    });

    // Native mobile selection observation
    if (useNative) {
      document.addEventListener('selectionchange', handleNativeSelection);
    }

    // Global pointer listeners for better Firefox support
    document.addEventListener('pointerdown', handleGlobalPointerDown);
    document.addEventListener('pointerup', handleGlobalPointerUp);
    document.addEventListener('pointercancel', handleGlobalPointerCancel);

    return () => {
      if (!useNative) {
        selectableElements.forEach((element) => {
          element.removeEventListener('touchstart', handleTouchStart);
          element.removeEventListener('touchmove', handleTouchMove);
          element.removeEventListener('touchend', handleTouchEnd);
        });
      }

      document.removeEventListener('touchstart', handleGlobalTouchStart);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('touchcancel', handleGlobalTouchCancel);

      selectableElements.forEach((element) => {
        element.removeEventListener('mouseup', handleMouseUp);
      });

      if (useNative) {
        document.removeEventListener('selectionchange', handleNativeSelection);
      }

      document.removeEventListener('pointerdown', handleGlobalPointerDown);
      document.removeEventListener('pointerup', handleGlobalPointerUp);
      document.removeEventListener('pointercancel', handleGlobalPointerCancel);

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      if (selectionStableTimer.current) {
        clearTimeout(selectionStableTimer.current);
        selectionStableTimer.current = null;
      }
      if (pendingReleaseFallbackTimer.current) {
        clearTimeout(pendingReleaseFallbackTimer.current);
        pendingReleaseFallbackTimer.current = null;
      }
    };
  }, [
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseUp,
    handleNativeSelection,
    handleGlobalTouchStart,
    handleGlobalTouchEnd,
    handleGlobalPointerDown,
    handleGlobalPointerUp,
    handleGlobalPointerCancel,
    shouldUseNativeSelection,
    handleGlobalTouchCancel
  ]);

  return {
    clearSelection,
    isSelecting: selection.isSelecting,
    selection
  };
}
