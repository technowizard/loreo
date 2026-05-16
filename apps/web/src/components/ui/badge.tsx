import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden group/badge',
  {
    defaultVariants: {
      variant: 'default'
    },
    variants: {
      variant: {
        danger:
          'bg-danger-50 dark:bg-danger-950/30 text-danger-700 dark:text-danger-400 border-danger-300 dark:border-danger-400',
        default:
          'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 border-primary-300 dark:border-primary-400',
        ghost: 'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
        info: 'bg-info-50 dark:bg-info-950/30 text-info-700 dark:text-info-400 border-info-300 dark:border-info-400',
        link: 'text-primary underline-offset-4 hover:underline',
        outline: 'border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
        secondary:
          'bg-secondary text-secondary-foreground border-secondary-foreground dark:bg-secondary/30',
        success:
          'bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-400 border-success-300 dark:border-success-400',
        warning:
          'bg-warning-50 dark:bg-warning-950/30 text-warning-700 dark:text-warning-400 border-warning-300 dark:border-warning-400'
      }
    }
  }
);

function Badge({
  className,
  render,
  variant = 'default',
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ className, variant }))
      },
      props
    ),
    render,
    state: {
      slot: 'badge',
      variant
    }
  });
}

export { Badge, badgeVariants };
