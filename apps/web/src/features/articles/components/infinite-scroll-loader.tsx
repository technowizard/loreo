import { Skeleton } from '@/components/ui/skeleton';

import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

import { cn } from '@/lib/utils';

type Props = {
  articleCardView: 'grid' | 'list';
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};

export function InfiniteScrollLoader({
  articleCardView,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore
}: Props) {
  const { targetRef } = useIntersectionObserver({
    onIntersect: (isIntersecting) => {
      if (isIntersecting && hasNextPage && !isFetchingNextPage) {
        onLoadMore();
      }
    },
    rootMargin: '100px'
  });

  return (
    <>
      <div ref={targetRef as React.RefObject<HTMLDivElement>} />
      {isFetchingNextPage && (
        <div
          className={cn(
            'mt-4 grid gap-4',
            articleCardView === 'grid' ? 'sm:grid-cols-2' : 'sm:grid-cols-1'
          )}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton className="h-70 w-full md:h-42.5" key={i} />
          ))}
        </div>
      )}
    </>
  );
}
