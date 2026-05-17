import { BookOpenIcon, CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

interface FloatingProgressIndicatorProps {
  className?: string;
  onScrollTo?: (progress: number) => void;
  progress: number;
  readingTime?: number;
}

export default function FloatingProgressIndicator({
  className,
  onScrollTo,
  progress,
  readingTime
}: FloatingProgressIndicatorProps) {
  const { t } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShowIndicator, setShouldShowIndicator] = useState(true);
  const idleTimerRef = useRef<number | null>(null);

  // Show after user starts reading (progress > 5%)
  useEffect(() => {
    setIsVisible(progress > 0.05);
  }, [progress]);

  // Auto-collapse after 3 seconds of expansion
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => setIsExpanded(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  // Hide while scrolling, reappear after 800ms idle
  useEffect(() => {
    const handleScroll = () => {
      setShouldShowIndicator(false);
      setIsExpanded(false);

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        setShouldShowIndicator(true);
      }, 800);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  const progressPercent = Math.round(progress * 100);
  const estimatedTimeLeft = readingTime ? Math.ceil(readingTime * (1 - progress)) : null;

  const handleScrollUp = () => {
    try {
      window.scrollTo({
        behavior: 'smooth',
        top: 0
      });
    } catch {
      // Fallback for older browsers
      window.scrollTo(0, 0);
    }
    onScrollTo?.(0);
  };

  const handleScrollDown = () => {
    // Cross-browser way to get document height
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );

    try {
      window.scrollTo({
        behavior: 'smooth',
        top: documentHeight
      });
    } catch {
      // Fallback for older browsers
      window.scrollTo(0, documentHeight);
    }
    onScrollTo?.(1);
  };

  return (
    <div
      className={cn(
        'fixed right-4 bottom-4 z-40 transition-all duration-300',
        shouldShowIndicator
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0',
        className
      )}
    >
      {/* Expanded State */}
      {isExpanded && (
        <div className="animate-in slide-in-from-bottom-2 fade-in absolute right-0 bottom-16 z-50 mb-2 duration-200">
          <div className="bg-card relative z-50 min-w-50 rounded-xl border border-gray-200 p-3 shadow-lg">
            {/* Progress Info */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="text-gray-600" size={16} />
                <span className="text-sm font-medium text-gray-900">
                  {t('reader.progress.read', { progress: progressPercent })}
                </span>
              </div>
              {estimatedTimeLeft && (
                <span className="text-xs text-gray-500">
                  {t('reader.progress.left', { minutes: estimatedTimeLeft })}
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="relative mb-3">
              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-zinc-600 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {/* Progress dots for visual appeal */}
              <div className="absolute top-0 right-0 left-0 flex h-2 items-center justify-between px-1">
                {[0, 25, 50, 75, 100].map((point) => (
                  <div
                    className={cn(
                      'h-1 w-1 rounded-full transition-colors',
                      progressPercent >= point ? 'bg-white' : 'bg-zinc-400'
                    )}
                    key={point}
                  />
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <button
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-gray-200"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleScrollUp();
                }}
              >
                <CaretUpIcon size={14} />
                {t('reader.progress.top')}
              </button>
              <button
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleScrollDown();
                }}
              >
                <CaretDownIcon size={14} />
                {t('reader.progress.end')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        className={cn(
          'bg-card sepia-theme:hover:bg-card text-card-foreground flex h-10 items-center justify-center rounded-full px-3 py-2 shadow-lg transition-all duration-200 hover:bg-zinc-600/50 active:scale-95',
          isExpanded && 'bg-zinc-200'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="relative z-10 flex items-center space-x-2">
          <svg className="h-4 w-4 -rotate-90 transform" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              fill="none"
              r="20"
              stroke="rgba(82, 82, 91, 0.3)"
              strokeWidth="8"
            />
            <circle
              className="transition-all duration-300"
              cx="24"
              cy="24"
              fill="none"
              r="20"
              stroke="rgba(82, 82, 91)"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress)}`}
              strokeLinecap="round"
              strokeWidth="8"
            />
          </svg>
          <span className="text-sm leading-none font-bold">{progressPercent}%</span>
        </div>
      </button>
    </div>
  );
}
