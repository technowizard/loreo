import { BookmarkSimpleIcon, XIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

interface ResumePositionBannerProps {
  progress: number; // 0–100
  onRestore: () => void;
  onDismiss: () => void;
}

export default function ResumePositionBanner({
  progress,
  onRestore,
  onDismiss
}: ResumePositionBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  // Capture progress at mount so it doesn't update as the user scrolls
  const [snapshotPercent] = useState(Math.round(progress));

  useEffect(() => {
    // Delay mount animation so the slide-up plays on entry
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRestore = () => {
    setIsVisible(false);
    setTimeout(onRestore, 200);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 left-0 px-4 w-full sm:px-0 sm:w-auto sm:left-1/2 sm:-translate-x-1/2 z-40 transition-all duration-200 ease-out',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      <div className="bg-background sm:w-80 border-border flex items-center gap-4 rounded-xl border px-4 py-3 shadow-lg">
        <BookmarkSimpleIcon className="text-muted-foreground size-4 shrink-0" weight="fill" />
        <div className="flex flex-col w-full">
          <span className="text-foreground text-sm font-semibold">Resume reading</span>
          <span className="text-muted-foreground text-xs">You were at {snapshotPercent}%</span>
        </div>
        <Button className="h-7 px-3 text-xs" onClick={handleRestore} size="sm">
          Continue
        </Button>
        <button
          className="text-muted-foreground hover:text-foreground -mr-1 transition-colors"
          onClick={handleDismiss}
          type="button"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
