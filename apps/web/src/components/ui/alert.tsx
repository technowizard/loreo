import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-base grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-4 gap-y-0.5 items-start [&>svg]:size-6 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    defaultVariants: {
      variant: 'default'
    },
    variants: {
      variant: {
        danger:
          'text-foreground bg-danger-50 dark:bg-danger-950/20 border-danger-300 dark:border-danger-400 [&>svg]:text-danger-500 dark:[&>svg]:text-danger-400 *:data-[slot=alert-description]:text-muted-foreground',
        default: 'bg-card text-card-foreground',
        info: 'text-foreground bg-info-50 dark:bg-info-950/20 border-info-300 dark:border-info-400 [&>svg]:text-info-500 dark:[&>svg]:text-info-400 *:data-[slot=alert-description]:text-muted-foreground',
        success:
          'text-foreground bg-success-50 dark:bg-success-950/20 border-success-300 dark:border-success-400 [&>svg]:text-success-500 dark:[&>svg]:text-success-400 *:data-[slot=alert-description]:text-muted-foreground',
        warning:
          'text-foreground bg-warning-50 dark:bg-warning-950/20 border-warning-300 dark:border-warning-400 [&>svg]:text-warning-500 dark:[&>svg]:text-warning-400 *:data-[slot=alert-description]:text-muted-foreground'
      }
    }
  }
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      className={cn(alertVariants({ variant }), className)}
      data-slot="alert"
      role="alert"
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', className)}
      data-slot="alert-title"
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
        className
      )}
      data-slot="alert-description"
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
