import { useRouteContext } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

import { useGetHomeSuggestions } from '@/features/home/api/get-home-suggestions';
import { ContinueReadingSection } from '@/features/home/components/continue-reading-section';
import { OnboardingProgressCard } from '@/features/home/components/onboarding-progress-card';
import { QuickAddBar } from '@/features/home/components/quick-add-bar';
import { RecentlySavedSection } from '@/features/home/components/recently-saved-section';
import { SuggestionsSection } from '@/features/home/components/suggestions-section';

import { env } from '@/lib/env';
import { greetUser } from '@/lib/utils';

function HomePage() {
  const { auth } = useRouteContext({ from: '/_protected/_with-layout/' });
  const { t } = useTranslation('common');
  const homeSuggestions = useGetHomeSuggestions();
  const suggestions = homeSuggestions.data?.result;

  const totalArticles = suggestions?.recentlySaved?.length ?? 0;
  const hasStartedReading = suggestions?.hasReadArticle ?? false;

  const isOnboarding = !homeSuggestions.isLoading && (totalArticles < 3 || !hasStartedReading);
  const isFirstTimeUser = isOnboarding;

  return (
    <div className="flex flex-col w-full space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col">
          {homeSuggestions.isLoading ? (
            <>
              <Skeleton className="h-8 w-48 rounded-md" />
              <Skeleton className="mt-2 h-4 w-64 rounded-md" />
            </>
          ) : (
            <>
              <h1 className="text-foreground text-2xl font-bold">
                {isFirstTimeUser ? t('home.welcome') : greetUser(auth.user?.name as string)}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isFirstTimeUser ? t('home.onboardingDescription') : t('home.readyToCatchUp')}
              </p>
            </>
          )}
        </div>
      </div>

      <QuickAddBar isDemo={env.isDemo} />

      <ContinueReadingSection
        data={suggestions?.continueReading}
        isLoading={homeSuggestions.isLoading}
      />

      {isOnboarding ? (
        <OnboardingProgressCard
          hasStartedReading={hasStartedReading}
          totalArticles={totalArticles}
        />
      ) : (
        <SuggestionsSection isLoading={homeSuggestions.isLoading} suggestions={suggestions} />
      )}

      <RecentlySavedSection
        articles={suggestions?.recentlySaved}
        isFirstTimeUser={isFirstTimeUser}
        isLoading={homeSuggestions.isLoading}
      />
    </div>
  );
}

export default HomePage;
