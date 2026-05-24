import { ArrowRightIcon, BookOpenIcon } from '@phosphor-icons/react';

import { cn, formatReadingTime } from '@/lib/utils';

interface ContinueReadingCardProps {
  className?: string;
  coverImage?: string | null;
  onClick: () => void;
  progress: number;
  readingTime: number;
  title: string;
}

function ContinueReadingCard({
  className,
  coverImage,
  onClick,
  progress,
  readingTime,
  title
}: ContinueReadingCardProps) {
  return (
    <button
      className={cn(
        'border-border bg-card group w-full overflow-hidden rounded-2xl border text-left shadow-sm',
        'motion-safe:transition-shadow motion-safe:duration-200 [@media(hover:hover)]:hover:shadow-md',
        'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        className
      )}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-4 p-4">
        <div className="bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
          {coverImage ? (
            <img
              alt=""
              className="size-full object-cover"
              height={64}
              src={coverImage}
              width={64}
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-primary/10">
              <BookOpenIcon className="text-primary/60 size-7" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-card-foreground line-clamp-2 text-sm font-semibold leading-snug">
            {title}
          </p>
          <p className="text-muted-foreground mt-1 text-xs tabular-nums">
            {Math.round(progress)}% read · {formatReadingTime(readingTime)} left
          </p>
        </div>

        <ArrowRightIcon
          className="text-muted-foreground shrink-0 motion-safe:transition-transform motion-safe:duration-150 [@media(hover:hover)]:group-hover:translate-x-0.5"
          size={16}
          weight="bold"
        />
      </div>

      <div className="bg-muted h-0.5 w-full overflow-hidden">
        <div
          className="bg-primary h-full w-full origin-left motion-safe:transition-[transform] motion-safe:duration-400 motion-safe:ease-[cubic-bezier(0.215,0.61,0.355,1)]"
          style={{ transform: `scaleX(${progress / 100})` }}
        />
      </div>
    </button>
  );
}

export default ContinueReadingCard;
