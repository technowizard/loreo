import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

type FeedInfiniteScrollLoaderProps = {
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};

export function FeedInfiniteScrollLoader({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore
}: FeedInfiniteScrollLoaderProps) {
  const { t } = useTranslation();
  const { targetRef } = useIntersectionObserver({
    onIntersect: (isIntersecting) => {
      if (isIntersecting && hasNextPage && !isFetchingNextPage) {
        onLoadMore();
      }
    },
    rootMargin: '600px'
  });

  return (
    <>
      <div aria-hidden="true" ref={targetRef as React.RefObject<HTMLDivElement>} />
      {isFetchingNextPage ? (
        <div aria-live="polite" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <span className="sr-only">{t('feeds.loadingMore')}</span>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton className="h-96 w-full rounded-4xl" key={index} />
          ))}
        </div>
      ) : null}
    </>
  );
}
