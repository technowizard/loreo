import { useCallback, useEffect, useRef, useState } from 'react';

export function useParagraphTracker(
  contentRef: React.RefObject<HTMLDivElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  const [currentElement, setCurrentElement] = useState<HTMLElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);

  // Get all paragraphs
  const getAllParagraphs = useCallback(() => {
    if (!contentRef.current) {
      return [];
    }
    return Array.from(contentRef.current.querySelectorAll('p, h1, h2, h3, h4, h5, h6'));
  }, [contentRef]);

  // Update indicator position directly via DOM (no React state)
  const updateIndicatorPosition = useCallback(
    (paragraphIndex: number) => {
      if (!contentRef.current || !containerRef.current) {
        return;
      }

      const paragraphs = getAllParagraphs();
      const targetParagraph = paragraphs[paragraphIndex] as HTMLElement;

      if (!targetParagraph) {
        return;
      }

      // Update React state only for the element reference (needed for other logic)
      setCurrentElement(targetParagraph);

      // Update indicator position directly via DOM if ref is provided
      if (indicatorRef?.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const paragraphRect = targetParagraph.getBoundingClientRect();
        const offsetTop = paragraphRect.top - containerRect.top;
        const height = paragraphRect.height;

        // Use CSS transform for GPU-accelerated positioning
        indicatorRef.current.style.transform = `translateY(${offsetTop}px)`;
        indicatorRef.current.style.height = `${height}px`;
        indicatorRef.current.style.opacity = '0.6';
      }
    },
    [contentRef, containerRef, getAllParagraphs, indicatorRef]
  );

  // Check if a paragraph is fully visible
  const isParagraphFullyVisible = useCallback((paragraph: HTMLElement) => {
    const rect = paragraph.getBoundingClientRect();
    const menuBarHeight = 80;
    const viewportHeight = window.innerHeight;

    return rect.top >= menuBarHeight && rect.bottom <= viewportHeight;
  }, []);

  // Scroll to paragraph if not fully visible
  const scrollToParagraphIfNeeded = useCallback(
    (paragraph: HTMLElement) => {
      if (!isParagraphFullyVisible(paragraph)) {
        const menuBarHeight = 80;
        const elementTop = paragraph.offsetTop;
        const scrollTop = elementTop - menuBarHeight - 20; // Add small buffer

        window.scrollTo({
          behavior: 'smooth',
          top: scrollTop
        });
      }
    },
    [isParagraphFullyVisible]
  );

  // Enable keyboard mode with extended timeout
  const enableKeyboardMode = useCallback(() => {
    setIsKeyboardMode(true);

    // Clear existing timeout
    if (keyboardTimeoutRef.current) {
      clearTimeout(keyboardTimeoutRef.current);
    }

    // Set extended timeout to disable keyboard mode
    keyboardTimeoutRef.current = setTimeout(() => {
      setIsKeyboardMode(false);
    }, 5000); // 5 seconds of no keyboard activity
  }, []);

  // Disable keyboard mode immediately (for mouse scroll)
  const disableKeyboardMode = useCallback(() => {
    setIsKeyboardMode(false);
    if (keyboardTimeoutRef.current) {
      clearTimeout(keyboardTimeoutRef.current);
    }
  }, []);

  // Throttled function for performance optimization
  const throttle = useCallback((func: () => void, delay: number) => {
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
    }
    throttleRef.current = setTimeout(func, delay);
  }, []);

  // Keyboard navigation with smart scrolling
  const navigateToNext = useCallback(() => {
    const paragraphs = getAllParagraphs();
    const nextIndex = Math.min(currentParagraphIndex + 1, paragraphs.length - 1);
    const targetParagraph = paragraphs[nextIndex] as HTMLElement;

    if (targetParagraph) {
      enableKeyboardMode();
      setCurrentParagraphIndex(nextIndex);
      updateIndicatorPosition(nextIndex);
      scrollToParagraphIfNeeded(targetParagraph);
    }
  }, [
    currentParagraphIndex,
    getAllParagraphs,
    updateIndicatorPosition,
    scrollToParagraphIfNeeded,
    enableKeyboardMode
  ]);

  const navigateToPrevious = useCallback(() => {
    const nextIndex = Math.max(currentParagraphIndex - 1, 0);
    const targetParagraph = getAllParagraphs()[nextIndex] as HTMLElement;

    if (targetParagraph) {
      enableKeyboardMode();
      setCurrentParagraphIndex(nextIndex);
      updateIndicatorPosition(nextIndex);
      scrollToParagraphIfNeeded(targetParagraph);
    }
  }, [
    currentParagraphIndex,
    getAllParagraphs,
    updateIndicatorPosition,
    scrollToParagraphIfNeeded,
    enableKeyboardMode
  ]);

  const navigateToFirst = useCallback(() => {
    const paragraphs = getAllParagraphs();
    const firstParagraph = paragraphs[0] as HTMLElement;

    if (firstParagraph) {
      enableKeyboardMode();
      setCurrentParagraphIndex(0);
      updateIndicatorPosition(0);
      scrollToParagraphIfNeeded(firstParagraph);
    }
  }, [getAllParagraphs, updateIndicatorPosition, scrollToParagraphIfNeeded, enableKeyboardMode]);

  const navigateToLast = useCallback(() => {
    const paragraphs = getAllParagraphs();
    const lastIndex = paragraphs.length - 1;
    const lastParagraph = paragraphs[lastIndex] as HTMLElement;

    if (lastParagraph) {
      enableKeyboardMode();
      setCurrentParagraphIndex(lastIndex);
      updateIndicatorPosition(lastIndex);
      scrollToParagraphIfNeeded(lastParagraph);
    }
  }, [getAllParagraphs, updateIndicatorPosition, scrollToParagraphIfNeeded, enableKeyboardMode]);

  // Very stable intersection observer with aggressive anti-jumping logic
  const setupIntersectionObserver = useCallback(() => {
    const paragraphs = getAllParagraphs();
    if (paragraphs.length === 0) {
      return;
    }

    // Clean up existing observer
    if (intersectionObserverRef.current) {
      intersectionObserverRef.current.disconnect();
    }

    const menuBarHeight = 80;
    const rootMargin = `-${menuBarHeight}px 0px -20px 0px`;

    // Track visible paragraphs state
    const visibilityMap = new Map<HTMLElement, number>();

    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        if (isKeyboardMode) {
          return;
        }

        // Update visibility map
        entries.forEach((entry) => {
          if (entry.intersectionRatio > 0.2) {
            visibilityMap.set(entry.target as HTMLElement, entry.intersectionRatio);
          } else {
            visibilityMap.delete(entry.target as HTMLElement);
          }
        });

        // Throttled update with very conservative logic
        throttle(() => {
          if (visibilityMap.size === 0) {
            return;
          }

          // Get all visible paragraphs with their indices
          const visibleParagraphs = Array.from(visibilityMap.entries())
            .map(([element, ratio]) => ({
              element,
              index: paragraphs.indexOf(element),
              ratio
            }))
            .filter((item) => item.index !== -1)
            .sort((a, b) => a.index - b.index); // Sort by document order first

          if (visibleParagraphs.length === 0) {
            return;
          }

          // Find the best candidate using very conservative rules
          let bestCandidate = visibleParagraphs[0];

          // Only switch if current paragraph is completely invisible or much less visible
          const currentParagraph = paragraphs[currentParagraphIndex] as HTMLElement;
          const currentVisibility = currentParagraph ? visibilityMap.get(currentParagraph) || 0 : 0;

          // Very conservative switching - only change if:
          // 1. Current is invisible (< 20% visible)
          // 2. OR new candidate is much more visible (50%+ difference) and reasonably visible (60%+)
          if (currentVisibility < 0.2) {
            // Current paragraph is barely visible, find best visible one
            bestCandidate = visibleParagraphs.reduce((best, current) =>
              current.ratio > best.ratio ? current : best
            );
          } else if (currentVisibility < 0.6) {
            // Current has moderate visibility, only switch to much better ones
            const betterCandidates = visibleParagraphs.filter(
              (p) => p.ratio > currentVisibility + 0.3 && p.ratio > 0.6
            );
            if (betterCandidates.length > 0) {
              bestCandidate = betterCandidates[0]; // Take first in document order
            } else {
              return; // Don't change if no significantly better candidate
            }
          } else {
            return; // Current paragraph is sufficiently visible, don't change
          }

          // Only update if different and significantly better
          if (bestCandidate && bestCandidate.index !== currentParagraphIndex) {
            setCurrentParagraphIndex(bestCandidate.index);
            updateIndicatorPosition(bestCandidate.index);
          }
        }, 300); // Longer throttle for more stability
      },
      {
        root: null,
        rootMargin,
        threshold: [0.2, 0.6] // Only two thresholds to minimize noise
      }
    );

    // Observe all paragraphs
    paragraphs.forEach((paragraph) => {
      intersectionObserverRef.current?.observe(paragraph);
    });
  }, [getAllParagraphs, isKeyboardMode, currentParagraphIndex, updateIndicatorPosition, throttle]);

  useEffect(() => {
    if (!contentRef.current || !containerRef.current) {
      return;
    }

    const handleScroll = () => {
      // If in keyboard mode, disable it immediately when user scrolls
      if (isKeyboardMode) {
        disableKeyboardMode();
      }
    };

    // Keyboard event handler
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if we're in the reader (not in inputs/textareas)
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'j':
        case 'arrowdown':
          e.preventDefault();
          navigateToNext();
          break;
        case 'k':
        case 'arrowup':
          e.preventDefault();
          navigateToPrevious();
          break;
        case 'g':
          if (e.shiftKey) {
            e.preventDefault();
            navigateToLast();
          } else {
            e.preventDefault();
            navigateToFirst();
          }
          break;
      }
    };

    // Cleanup function
    const cleanup = () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', setupIntersectionObserver);
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (keyboardTimeoutRef.current) {
        clearTimeout(keyboardTimeoutRef.current);
      }
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };

    // Initialize intersection observer
    setupIntersectionObserver();

    // Add event listeners (reduced scroll handling for better performance)
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', setupIntersectionObserver, {
      passive: true
    });
    window.addEventListener('keydown', handleKeyDown);

    return cleanup;
  }, [
    contentRef,
    containerRef,
    isKeyboardMode,
    setupIntersectionObserver,
    navigateToNext,
    navigateToPrevious,
    navigateToFirst,
    navigateToLast,
    disableKeyboardMode
  ]);

  // Ensure tracker doesn't disappear - fallback effect
  useEffect(() => {
    if (!contentRef.current || !currentElement) {
      const paragraphs = getAllParagraphs();
      if (paragraphs.length > 0 && currentParagraphIndex < paragraphs.length) {
        // Fallback to ensure tracker is always visible
        const targetParagraph = paragraphs[currentParagraphIndex] as HTMLElement;
        if (targetParagraph && !currentElement) {
          updateIndicatorPosition(currentParagraphIndex);
        }
      }
    }
  }, [
    contentRef,
    currentElement,
    currentParagraphIndex,
    getAllParagraphs,
    updateIndicatorPosition
  ]);

  // Initial positioning - set first paragraph on mount
  useEffect(() => {
    // Small delay to ensure content is rendered
    const timeoutId = setTimeout(() => {
      if (contentRef.current && !currentElement) {
        const paragraphs = getAllParagraphs();
        if (paragraphs.length > 0) {
          updateIndicatorPosition(0);
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [contentRef, currentElement, getAllParagraphs, updateIndicatorPosition]);

  return {
    indicatorRef
  };
}
