import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { FeedItem } from '@/types/feeds';

import { FeedItemCard } from './feed-collection';

const VIRTUALIZATION_THRESHOLD = 36;

function getColumnCount() {
  if (typeof window === 'undefined') return 1;
  if (window.matchMedia('(min-width: 1280px)').matches) return 3;
  if (window.matchMedia('(min-width: 640px)').matches) return 2;
  return 1;
}

function useFeedGridColumnCount() {
  const [columnCount, setColumnCount] = useState(getColumnCount);

  useEffect(() => {
    const tabletQuery = window.matchMedia('(min-width: 640px)');
    const desktopQuery = window.matchMedia('(min-width: 1280px)');
    const updateColumnCount = () => setColumnCount(getColumnCount());

    tabletQuery.addEventListener('change', updateColumnCount);
    desktopQuery.addEventListener('change', updateColumnCount);

    return () => {
      tabletQuery.removeEventListener('change', updateColumnCount);
      desktopQuery.removeEventListener('change', updateColumnCount);
    };
  }, []);

  return columnCount;
}

export function chunkFeedItems(items: FeedItem[], columnCount: number) {
  const rows: FeedItem[][] = [];

  for (let index = 0; index < items.length; index += columnCount) {
    rows.push(items.slice(index, index + columnCount));
  }

  return rows;
}

type VirtualizedFeedGridProps = {
  ariaLabel: string;
  items: FeedItem[];
  showActions: boolean;
  sourceTitleBySubscriptionId: Map<string, string>;
};

export function VirtualizedFeedGrid({
  ariaLabel,
  items,
  showActions,
  sourceTitleBySubscriptionId
}: VirtualizedFeedGridProps) {
  const gridRef = useRef<HTMLElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const columnCount = useFeedGridColumnCount();
  const rows = useMemo(() => chunkFeedItems(items, columnCount), [columnCount, items]);
  const rowVirtualizer = useWindowVirtualizer<HTMLDivElement>({
    count: rows.length,
    estimateSize: () => (showActions ? 520 : 440),
    getItemKey: (index) => rows[index]?.[0]?.id ?? index,
    overscan: 3,
    scrollMargin
  });

  useLayoutEffect(() => {
    const updateScrollMargin = () => {
      const element = gridRef.current;
      if (!element) return;
      setScrollMargin(element.getBoundingClientRect().top + window.scrollY);
    };

    updateScrollMargin();
    window.addEventListener('resize', updateScrollMargin);
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateScrollMargin);
    if (gridRef.current) observer?.observe(gridRef.current);

    return () => {
      window.removeEventListener('resize', updateScrollMargin);
      observer?.disconnect();
    };
  }, []);

  if (items.length <= VIRTUALIZATION_THRESHOLD) {
    return (
      <section
        aria-label={ariaLabel}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        ref={gridRef}
      >
        {items.map((item) => (
          <FeedItemCard
            item={item}
            key={item.id}
            showActions={showActions}
            sourceTitle={sourceTitleBySubscriptionId.get(item.subscriptionId) ?? ''}
          />
        ))}
      </section>
    );
  }

  return (
    <section
      aria-label={ariaLabel}
      className="relative w-full"
      ref={gridRef}
      style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => (
        <div
          className="absolute left-0 top-0 w-full pb-4"
          data-index={virtualRow.index}
          key={virtualRow.key}
          ref={rowVirtualizer.measureElement}
          style={{ transform: `translateY(${virtualRow.start - scrollMargin}px)` }}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows[virtualRow.index]?.map((item) => (
              <FeedItemCard
                item={item}
                key={item.id}
                showActions={showActions}
                sourceTitle={sourceTitleBySubscriptionId.get(item.subscriptionId) ?? ''}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
