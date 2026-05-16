import { ArrowRightIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SuggestionCardProps {
  className?: string;
  icon: ReactNode;
  onClick: () => void;
  title: string;
}

function SuggestionCard({ className, icon, onClick, title }: SuggestionCardProps) {
  return (
    <button
      className={cn(
        'border-border bg-card flex w-full cursor-pointer items-center gap-3 rounded-full border px-4 py-2.5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]',
        className
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span className="text-foreground flex-1 text-left text-sm font-medium">{title}</span>
      <ArrowRightIcon className="text-muted-foreground size-4 shrink-0" />
    </button>
  );
}

export default SuggestionCard;
