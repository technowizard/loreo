import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface SelectionUIPosition {
  x: number;
  y: number;
}

interface FloatingUIProps {
  children: React.ReactNode;
  isVisible: boolean;
  onClose?: () => void;
  position: SelectionUIPosition | null;
}

interface UseFloatingUIOptions {
  enabled?: boolean;
  offset?: number;
  position?: 'above' | 'below' | 'smart';
  positionDesktop?: 'above' | 'below' | 'smart';
  positionMobile?: 'above' | 'below' | 'smart';
}

interface UseFloatingUIReturn {
  FloatingUI: React.FC<FloatingUIProps>;
  hideFloatingUI: () => void;
  isVisible: boolean;
  position: SelectionUIPosition | null;
  showFloatingUI: (selection: { range: Range | DOMRect; text: string }) => void;
}

// SSR guard
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export const useFloatingUI = ({
  enabled = true,
  offset = 40,
  position: positionMode = 'smart',
  positionDesktop,
  positionMobile
}: UseFloatingUIOptions = {}): UseFloatingUIReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<SelectionUIPosition | null>(null);

  // Detect desktop vs mobile device
  const isDesktopDevice = useCallback((): boolean => {
    if (!isBrowser) {
      return true;
    } // default to desktop for SSR

    return window.matchMedia('(pointer: fine)').matches;
  }, []);

  // calculate optimal position for floating ui - smart positioning only
  const calculatePosition = useCallback(
    (range: Range | DOMRect): SelectionUIPosition => {
      // determine if the range is a selection (Range) or highlight click (DOMRect)
      const isRange = range instanceof Range;

      const rect = isRange ? range.getBoundingClientRect() : range;
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let x = rect.left + scrollX + rect.width / 2; // center horizontally
      let y: number;

      // Device-based positioning logic
      const isDesktop = isDesktopDevice();
      const effectivePosition = isDesktop
        ? positionDesktop || positionMode
        : positionMobile || positionMode;

      const uiHeight = isRange ? 56 : 144; // estimated height of floating ui

      if (effectivePosition === 'smart') {
        const spaceAbove = rect.top;
        y =
          spaceAbove >= uiHeight + 10 || (rect.top > viewportHeight * 0.6 && spaceAbove >= uiHeight)
            ? rect.top + scrollY - uiHeight - Math.max(8, offset / 4)
            : rect.bottom + scrollY + Math.max(8, offset / 4);
      } else if (effectivePosition === 'above') {
        y = rect.top + scrollY - (uiHeight + offset);
      } else {
        // y = rect.bottom + scrollY + offset
        const spaceBelow = viewportHeight - rect.bottom;
        const hasSpaceBelow = spaceBelow >= uiHeight + 10;

        y = hasSpaceBelow
          ? rect.bottom + scrollY + offset
          : rect.top + scrollY - uiHeight - Math.max(8, offset / 4);
      }

      // ensure ui stays within viewport bounds
      const uiWidth = 200; // estimated ui width
      if (x - uiWidth / 2 < scrollX) {
        x = scrollX + uiWidth / 2 + 10;
      } else if (x + uiWidth / 2 > scrollX + viewportWidth) {
        x = scrollX + viewportWidth - uiWidth / 2 - 10;
      }

      return { x, y };
    },
    [offset, isDesktopDevice, positionMode, positionDesktop, positionMobile]
  );

  // show floating ui at selection position
  const showFloatingUI = useCallback(
    (selection: { range: Range | DOMRect; text: string }) => {
      if (!enabled) {
        return;
      }

      const calculatedPosition = calculatePosition(selection.range);
      setPosition(calculatedPosition);
      setIsVisible(true);
    },
    [enabled, calculatePosition]
  );

  const hideFloatingUI = useCallback(() => {
    setIsVisible(false);
    setPosition(null);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const handleScroll = () => {
      // hide on scroll to avoid complex repositioning
      hideFloatingUI();
    };

    const handleResize = () => {
      hideFloatingUI();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible, hideFloatingUI]);

  // floating ui component using portal with SSR guard
  const FloatingUI: React.FC<FloatingUIProps> = useCallback(
    ({ children, isVisible: propIsVisible, onClose, position: propPosition }) => {
      const floatingRef = useRef<HTMLDivElement>(null);

      // Handle click outside to close
      useEffect(() => {
        if (!propIsVisible || !onClose) {
          return;
        }

        const handleClickOutside = (event: MouseEvent) => {
          const target = event.target as Node;
          if (floatingRef.current && !floatingRef.current.contains(target)) {
            onClose();
          }
        };

        // Delay adding the listener to avoid immediate close from the same click that opened it
        const timeoutId = setTimeout(() => {
          document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
          clearTimeout(timeoutId);
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }, [propIsVisible, onClose]);

      if (!propIsVisible || !propPosition || !isBrowser) {
        return null;
      }

      return createPortal(
        <div
          className="bg-card pointer-events-auto absolute z-50 -translate-x-1/2 rounded-4xl p-2 shadow-md transition-all duration-700 ease-out select-none"
          onClick={(e) => e.stopPropagation()}
          ref={floatingRef}
          style={{
            left: propPosition.x,
            top: propPosition.y
          }}
        >
          {children}
        </div>,
        document.body
      );
    },
    []
  );

  return {
    FloatingUI,
    hideFloatingUI,
    isVisible,
    position,
    showFloatingUI
  };
};

export default useFloatingUI;
