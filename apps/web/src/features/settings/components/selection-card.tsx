import { CheckCircleIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';

interface SelectionCardProps {
  checked: boolean;
  children?: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  onChange: () => void;
  title: string;
  value: string;
}

export function SelectionCard({
  checked,
  children,
  description,
  icon,
  onChange,
  title,
  value
}: SelectionCardProps) {
  return (
    <label
      className={cn(
        'group relative flex cursor-pointer flex-col rounded-4xl border-2 p-4 transition-all duration-200',
        checked
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30'
      )}
    >
      <input checked={checked} className="sr-only" onChange={onChange} type="radio" value={value} />
      <div className="flex items-start gap-3">
        {icon && (
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-md border transition-colors',
              checked
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground group-hover:text-foreground'
            )}
          >
            {icon}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'font-medium transition-colors',
                checked ? 'text-foreground' : 'text-foreground'
              )}
            >
              {title}
            </span>
            {checked && <CheckCircleIcon className="text-primary size-5" weight="fill" />}
          </div>
          {description && <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>}
        </div>
      </div>
      {children && <div className="border-border/50 mt-3 border-t pt-3">{children}</div>}
    </label>
  );
}
