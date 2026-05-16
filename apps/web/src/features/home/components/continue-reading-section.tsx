import { useNavigate } from '@tanstack/react-router';

import { Skeleton } from '@/components/ui/skeleton';

import type { HomeSuggestions } from '@/types/home';

import ContinueReadingCard from './continue-reading-card';

type Props = {
  data: HomeSuggestions['continueReading'] | undefined;
  isLoading: boolean;
};

export function ContinueReadingSection({ data, isLoading }: Props) {
  const navigate = useNavigate();

  if (isLoading) {
    return <Skeleton className="h-25 w-full rounded-3xl" />;
  }
  if (!data) {
    return null;
  }

  return (
    <>
      <h1 className="text-foreground text-xl font-bold">Continue Reading</h1>
      <ContinueReadingCard
        coverImage={data.coverImage}
        onClick={() => navigate({ params: { id: data.id }, to: '/articles/$id' })}
        progress={data.progress}
        readingTime={data.readingTime}
        title={data.title}
      />
    </>
  );
}
