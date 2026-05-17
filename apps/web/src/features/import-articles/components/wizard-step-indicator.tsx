import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

type Props = {
  currentStep: number;
  steps: readonly string[];
};

export function WizardStepIndicator({ currentStep, steps }: Props) {
  const { t } = useTranslation('common');

  return (
    <nav aria-label={t('import.wizard.stepsAria')} className="flex items-center gap-2 text-sm">
      <ol className="flex items-center gap-2" role="list">
        {steps.map((label, index) => (
          <li
            className={cn(
              'flex items-center',
              index === currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}
            key={label}
          >
            {index > 0 && (
              <span aria-hidden="true" className="text-muted-foreground/50 mx-1">
                /
              </span>
            )}
            <span
              aria-current={index === currentStep ? 'step' : undefined}
              className={cn(
                'relative py-1',
                index === currentStep &&
                  'after:bg-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:content-[""]'
              )}
            >
              <span className="hidden sm:inline">
                {t('import.wizard.stepLabel', { current: index + 1 })}{' '}
              </span>
              {label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
