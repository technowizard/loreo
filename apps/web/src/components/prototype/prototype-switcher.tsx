import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

interface PrototypeVariantOption {
  key: string;
  name: string;
}

interface PrototypeSwitcherProps {
  className?: string;
  current: string;
  onChange: (variant: string) => void;
  variants: readonly PrototypeVariantOption[];
}

function isTextEntryElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || target.isContentEditable;
}

export function PrototypeSwitcher({
  className,
  current,
  onChange,
  variants
}: PrototypeSwitcherProps) {
  const currentIndex = Math.max(
    variants.findIndex((variant) => variant.key === current),
    0
  );
  const currentVariant = variants[currentIndex] ?? variants[0];

  const move = (direction: -1 | 1) => {
    const nextIndex = (currentIndex + direction + variants.length) % variants.length;
    const nextVariant = variants[nextIndex];
    if (nextVariant) onChange(nextVariant.key);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTextEntryElement(event.target)) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        move(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        move(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (import.meta.env.PROD || !currentVariant) return null;

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-5 z-[80] flex justify-center px-4 pointer-events-none',
        className
      )}
    >
      <div className="bg-foreground text-background pointer-events-auto flex items-center gap-2 rounded-full border border-background/20 px-2 py-2 shadow-2xl">
        <Button
          aria-label="Show previous prototype variant"
          className="bg-background/10 text-background hover:bg-background/20"
          onClick={() => move(-1)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <CaretLeftIcon className="size-4" />
        </Button>
        <div className="min-w-44 px-2 text-center text-sm font-medium">
          {currentVariant.key} — {currentVariant.name}
        </div>
        <Button
          aria-label="Show next prototype variant"
          className="bg-background/10 text-background hover:bg-background/20"
          onClick={() => move(1)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <CaretRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
