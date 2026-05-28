import { ClockIcon, FileTextIcon, FlameIcon, LightningIcon } from '@phosphor-icons/react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';

import SuggestionCard from './suggestion-card';

type HomeSuggestions = {
  shortReads: { totalArticles: number };
  longReads: { totalArticles: number };
};

type Props = {
  isLoading: boolean;
  suggestions: HomeSuggestions | undefined;
};

export function SuggestionsSection({ isLoading, suggestions }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const shortReadCount = suggestions?.shortReads?.totalArticles ?? 0;
  const longReadCount = suggestions?.longReads?.totalArticles ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground text-xl font-bold">{t('home.suggestions')}</h1>
      <div className={cn('grid gap-2.5', 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4')}>
        {isLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton className="h-11 w-full rounded-full" key={i} />
            ))}
          </>
        ) : (
          <>
            {shortReadCount > 0 && (
              <SuggestionCard
                icon={
                  <div
                    className={cn(
                      'rounded-full p-1.5',
                      'bg-green-50 dark:bg-green-900/20',
                      'border border-green-300 dark:border-green-800'
                    )}
                  >
                    <LightningIcon className="size-4 text-green-600 dark:text-green-400" />
                  </div>
                }
                onClick={() => navigate({ search: { readLength: 'short' }, to: '/articles' })}
                title={t('home.quickReads')}
              />
            )}

            {longReadCount > 0 && (
              <SuggestionCard
                icon={
                  <div
                    className={cn(
                      'rounded-full p-1.5',
                      'bg-blue-50 dark:bg-blue-900/20',
                      'border border-blue-300 dark:border-blue-800'
                    )}
                  >
                    <FileTextIcon className="size-4 text-blue-600 dark:text-blue-400" />
                  </div>
                }
                onClick={() => navigate({ search: { readLength: 'long' }, to: '/articles' })}
                title={t('home.longReads')}
              />
            )}

            <SuggestionCard
              icon={
                <div
                  className={cn(
                    'rounded-full p-1.5',
                    'bg-warning-50 dark:bg-warning-900/20',
                    'border-warning-300 dark:border-warning-800 border'
                  )}
                >
                  <ClockIcon className="text-warning-600 dark:text-warning-400 size-4" />
                </div>
              }
              onClick={() => navigate({ search: { priority: 'this-week' }, to: '/articles' })}
              title={t('home.thisWeek')}
            />

            <SuggestionCard
              icon={
                <div
                  className={cn(
                    'rounded-full p-1.5',
                    'bg-danger-50 dark:bg-danger-900/20',
                    'border-danger-300 dark:border-danger-800 border'
                  )}
                >
                  <FlameIcon className="text-danger-600 dark:text-danger-400 size-4" />
                </div>
              }
              onClick={() => navigate({ search: { priority: 'must-read' }, to: '/articles' })}
              title={t('home.mustRead')}
            />
          </>
        )}
      </div>
    </div>
  );
}
