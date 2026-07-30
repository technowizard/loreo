import { useRouter } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';

type ProgressData = { readingProgress: number; timeSpentReading: number };

type SaveProgress = (data: ProgressData) => void;

interface UseReadingSessionOptions {
  linkId: string;
  link:
    | {
        readingProgress: number;
        timeSpentReading: number;
        isRead: boolean;
      }
    | undefined;
  onSaveProgress: SaveProgress;
  onSaveProgressOnUnload?: SaveProgress;
}

interface ReadingSession {
  progress: number;
  restorablePosition: { scrollPosition: number; progress: number } | null;
  restore: () => void;
}

export function useReadingSession({
  linkId,
  link,
  onSaveProgress,
  onSaveProgressOnUnload
}: UseReadingSessionOptions): ReadingSession {
  const router = useRouter();
  const storageKey = `reading-position-${linkId}`;

  // scroll tracking
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const pendingScrollRef = useRef<number | null>(null);

  // position persistence
  const saveTimerRef = useRef<number | null>(null);
  const [restorablePosition, setRestorablePosition] = useState<{
    scrollPosition: number;
    progress: number;
  } | null>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const { scrollPosition, progress } = JSON.parse(stored) as {
          scrollPosition: number;
          progress: number;
        };
        if (progress >= 0.05) return { scrollPosition, progress };
      }
    } catch {}
    return null;
  });

  // session tracking
  const startTimeRef = useRef(Date.now());
  const linkRef = useRef(link);
  const onSaveProgressRef = useRef(onSaveProgress);
  const onSaveProgressOnUnloadRef = useRef(onSaveProgressOnUnload);

  // keep refs current
  useEffect(() => {
    linkRef.current = link;
  }, [link]);
  useEffect(() => {
    onSaveProgressRef.current = onSaveProgress;
  }, [onSaveProgress]);
  useEffect(() => {
    onSaveProgressOnUnloadRef.current = onSaveProgressOnUnload;
  }, [onSaveProgressOnUnload]);

  // scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const raw = scrollHeight > 0 ? Math.min(window.scrollY / scrollHeight, 1) : 0;

      progressRef.current = raw;

      const now = Date.now();
      if (now - lastUpdateRef.current >= 150) {
        lastUpdateRef.current = now;
        setProgress(raw);
      } else if (!pendingScrollRef.current) {
        pendingScrollRef.current = window.setTimeout(() => {
          setProgress(progressRef.current);
          pendingScrollRef.current = null;
        }, 150);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (pendingScrollRef.current) clearTimeout(pendingScrollRef.current);
    };
  }, []);

  // persist position to localStorage
  useEffect(() => {
    if (progress > 0) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({ progress, scrollPosition: window.scrollY })
          );
        } catch {}
      }, 1000);
    }
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [progress, storageKey]);

  // save reading progress on navigation or unload
  useEffect(() => {
    startTimeRef.current = Date.now();

    const saveProgress = (isUnloading = false) => {
      const currentLink = linkRef.current;
      if (!currentLink) return;

      const currentProgress = Math.round(progressRef.current * 100);
      if (currentProgress === 0) return;

      const timeSpentMinutes = Math.round((Date.now() - startTimeRef.current) / 60_000);
      const isProgressGreater = currentProgress > currentLink.readingProgress;
      const hasSpentTime = timeSpentMinutes > 0;

      if (!isProgressGreater && !hasSpentTime && currentLink.isRead) return;

      const save = isUnloading
        ? (onSaveProgressOnUnloadRef.current ?? onSaveProgressRef.current)
        : onSaveProgressRef.current;

      save({
        readingProgress: currentProgress,
        timeSpentReading: currentLink.timeSpentReading + timeSpentMinutes
      });
    };

    const unsub = router.subscribe('onBeforeNavigate', (event) => {
      if (event.fromLocation?.pathname === `/articles/${linkId}`) {
        saveProgress();
      }
    });
    const handleBeforeUnload = () => saveProgress(true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsub();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [router, linkId]);

  const restore = useCallback(() => {
    if (restorablePosition !== null) {
      window.scrollTo({ behavior: 'smooth', top: restorablePosition.scrollPosition });
      setRestorablePosition(null);
    }
  }, [restorablePosition]);

  return { progress, restorablePosition, restore };
}
