import {
  CheckCircleIcon,
  InfoIcon,
  SpinnerIcon,
  WarningIcon,
  XCircleIcon
} from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const lightRichColorVariables = {
  '--success-bg': 'var(--color-success-50)',
  '--success-text': 'var(--color-success-900)',
  '--success-border': 'var(--color-success-200)',
  '--info-bg': 'var(--color-info-50)',
  '--info-text': 'var(--color-info-900)',
  '--info-border': 'var(--color-info-200)',
  '--error-bg': 'var(--color-danger-50)',
  '--error-text': 'var(--color-danger-900)',
  '--error-border': 'var(--color-danger-200)'
} as const;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();
  const richColorVariables = theme === 'dark' ? {} : lightRichColorVariables;

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <CheckCircleIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <WarningIcon className="size-4" />,
        error: <XCircleIcon className="size-4" />,
        loading: <SpinnerIcon className="size-4 animate-spin" />
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          ...richColorVariables,
          '--border-radius': 'var(--radius)'
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast'
        }
      }}
      {...props}
    />
  );
};

export { Toaster };
