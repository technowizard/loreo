import { useCallback, useEffect, useRef, useState } from 'react';

export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = '0px',
  onIntersect
}: {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
  onIntersect?: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void;
}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const disconnectObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  const setupObserver = useCallback(() => {
    const target = targetRef.current;
    if (!target) {
      return;
    }

    disconnectObserver();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }

        const intersecting = entry.isIntersecting;
        setIsIntersecting(intersecting);

        if (onIntersect) {
          onIntersect(intersecting, entry);
        }
      },
      {
        threshold,
        root,
        rootMargin
      }
    );

    observerRef.current.observe(target);
  }, [threshold, root, rootMargin, onIntersect, disconnectObserver]);

  useEffect(() => {
    setupObserver();

    return () => {
      disconnectObserver();
    };
  }, [setupObserver, disconnectObserver]);

  return { isIntersecting, targetRef };
}
