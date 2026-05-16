import { CheckIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

import { Progress } from '@/components/ui/progress';

import { cn } from '@/lib/utils';

type Props = {
  hasStartedReading: boolean;
  totalArticles: number;
};

export function OnboardingProgressCard({ hasStartedReading, totalArticles }: Props) {
  const { t } = useTranslation('common');

  const steps = [
    {
      completed: totalArticles >= 1,
      hint: (
        <>
          {t('home.onboardingProgress.pasteUrlOrImport')}{' '}
          <a className="text-primary hover:underline" href="/settings/import-articles">
            {t('home.onboardingProgress.importFromCsv')}
          </a>
        </>
      ),
      title: t('home.onboardingProgress.addFirstArticle')
    },
    {
      completed: totalArticles >= 3,
      hint: <>{t('home.onboardingProgress.unlocksReadingFilters')}</>,
      title: t('home.onboardingProgress.saveThreeArticles')
    },
    {
      completed: hasStartedReading,
      hint: <>{t('home.onboardingProgress.openAnyArticleAndStartReading')}</>,
      title: t('home.onboardingProgress.readFirstOne')
    }
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  return (
    <div className="bg-card border-border rounded-3xl border p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-foreground font-semibold">{t('home.onboardingProgress.title')}</p>
        <span className="text-muted-foreground tabular-nums text-sm">
          {t('home.onboardingProgress.stepsCompleted', {
            completed: completedCount,
            total: steps.length
          })}
        </span>
      </div>

      <div className="mb-5">
        <Progress value={(completedCount / steps.length) * 100} />
      </div>

      <ol className="flex flex-col gap-4">
        {steps.map((step, i) => {
          const { completed } = step;
          const isNext = !completed && steps.slice(0, i).every((s) => s.completed);

          return (
            <li key={step.title} className="flex items-start gap-3">
              <div
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all',
                  completed
                    ? 'bg-primary'
                    : isNext
                      ? 'border-primary border-2'
                      : 'border-border border'
                )}
              >
                {completed ? (
                  <CheckIcon className="text-primary-foreground size-3" weight="bold" />
                ) : (
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isNext ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {i + 1}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm font-medium leading-5',
                    completed ? 'text-muted-foreground line-through' : 'text-foreground'
                  )}
                >
                  {step.title}
                </p>
                {!completed && <p className="text-muted-foreground mt-0.5 text-xs">{step.hint}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
