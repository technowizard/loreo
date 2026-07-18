import { CaretDownIcon, InfoIcon, PlusIcon, RssIcon } from '@phosphor-icons/react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useFeedItems } from '@/features/feeds/api/get-feed-items';
import { useFeedSubscriptions } from '@/features/feeds/api/get-feed-subscriptions';
import { AddFeedDialog } from '@/features/feeds/components/add-feed-dialog';
import { FeedInfiniteScrollLoader } from '@/features/feeds/components/feed-infinite-scroll-loader';
import {
  FeedManagerDialog,
  type FeedManagerStatusFilter
} from '@/features/feeds/components/feed-manager-dialog';
import { VirtualizedFeedGrid } from '@/features/feeds/components/virtualized-feed-grid';

import { cn } from '@/lib/utils';

import type { FeedItemState } from '@/types/feeds';

type FeedTab = 'new' | 'saved' | 'dismissed';
type FeedTabSearch = FeedTab | 'feeds';
type FeedSort = 'newest' | 'oldest';

type FeedSearch = {
  feed?: string;
  manage?: boolean;
  manageQuery?: string;
  manageStatus?: FeedManagerStatusFilter;
  sort?: FeedSort;
  subscriptionId?: string;
  tab?: FeedTabSearch;
};

const tabStates: Array<{ state: FeedItemState; value: FeedTab }> = [
  { value: 'new', state: 'new' },
  { value: 'saved', state: 'saved' },
  { value: 'dismissed', state: 'dismissed' }
];

function FeedsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-4 w-80 max-w-full rounded-md" />
      </div>
      <Skeleton className="h-40 w-full rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-76 w-full rounded-3xl" />
        <Skeleton className="h-76 w-full rounded-3xl" />
        <Skeleton className="h-76 w-full rounded-3xl" />
      </div>
    </div>
  );
}

export { AddFeedForm } from '@/features/feeds/components/add-feed-form';

export { FeedItemCard } from '@/features/feeds/components/feed-collection';

function FeedsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const search = useSearch({ strict: false }) as FeedSearch;
  const activeTab: FeedTab = search.tab && search.tab !== 'feeds' ? search.tab : 'new';
  const sort: FeedSort = search.sort ?? 'newest';
  const selectedSubscriptionId = search.subscriptionId ?? 'all';
  const activeState = tabStates.find((tab) => tab.value === activeTab)?.state ?? 'new';
  const selectedSubscriptionFilter =
    selectedSubscriptionId === 'all' ? undefined : selectedSubscriptionId;

  const subscriptionsQuery = useFeedSubscriptions();
  const itemsQuery = useFeedItems({
    filters: {
      sort,
      state: activeState,
      ...(selectedSubscriptionFilter ? { subscriptionId: selectedSubscriptionFilter } : {})
    }
  });
  const pendingItemsQuery = useFeedItems({ filters: { state: 'new' } });

  const subscriptions = subscriptionsQuery.data?.result ?? [];
  const items = itemsQuery.data ?? [];
  const activeFeeds = subscriptions.filter((subscription) => subscription.status === 'active');
  const sourceTitleBySubscriptionId = useMemo(
    () => new Map(subscriptions.map((subscription) => [subscription.id, subscription.title])),
    [subscriptions]
  );
  const isLoading = subscriptionsQuery.isLoading || itemsQuery.isLoading;
  const isError = subscriptionsQuery.isError || itemsQuery.isError;
  const isManageOpen = search.manage === true || search.tab === 'feeds';
  const managerStatus = search.manageStatus ?? 'all';

  const updateSearch = (next: Partial<FeedSearch>, replace = false) => {
    navigate({
      replace,
      search: (previous) =>
        ({
          ...previous,
          ...next
        }) as FeedSearch,
      to: '/feeds'
    });
  };

  useEffect(() => {
    if (search.tab !== 'feeds') return;
    updateSearch({ manage: true, tab: undefined }, true);
  }, [search.tab]);

  const updateSubscriptionFilter = (subscriptionId: string) => {
    updateSearch({ subscriptionId: subscriptionId === 'all' ? undefined : subscriptionId });
  };

  return (
    <>
      <main className="mx-auto w-full max-w-350 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.72fr)] lg:items-start">
          <div className="space-y-4">
            <header className="space-y-2">
              <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t('feeds.title')}
              </h1>
              <p className="max-w-2xl text-pretty text-sm leading-6 text-muted-foreground">
                {t('feeds.description')}
              </p>
            </header>

            <Alert className="max-w-3xl" variant="info">
              <InfoIcon aria-hidden="true" />
              <AlertDescription>{t('feeds.reviewNote')}</AlertDescription>
            </Alert>
          </div>

          <div className="space-y-4 lg:pt-1">
            <div className="rounded-3xl border border-border bg-card p-4 shadow-xs">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <RssIcon aria-hidden="true" className="size-5 text-primary" weight="bold" />
                  <div>
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {subscriptions.length}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('feeds.overview.total')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:border-l sm:border-border sm:pl-4">
                  <span aria-hidden="true" className="size-2 rounded-full bg-success-500" />
                  <div>
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {activeFeeds.length}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('feeds.overview.active')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:border-l sm:border-border sm:pl-4">
                  <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {pendingItemsQuery.total}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('feeds.overview.pending')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                onClick={() => updateSearch({ feed: undefined, manage: true })}
                type="button"
                variant="outline"
              >
                {t('feeds.manageFeeds')}
              </Button>
              <Button className="gap-2" onClick={() => setIsAddFeedOpen(true)} type="button">
                <PlusIcon aria-hidden="true" weight="bold" />
                {t('feeds.addFeed')}
              </Button>
            </div>
          </div>
        </section>

        <Tabs
          className="sticky top-0 z-20 bg-background/95 py-1 backdrop-blur md:static md:top-auto md:z-auto md:bg-transparent md:py-0 md:backdrop-blur-none"
          onValueChange={(value) => updateSearch({ tab: value as FeedTab })}
          value={activeTab}
        >
          <TabsList className="w-full justify-start border-b border-border" variant="line">
            {tabStates.map((tab) => (
              <TabsTrigger className="flex-none px-3 sm:px-4" key={tab.value} value={tab.value}>
                {t(`feeds.tabs.${tab.value}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <section aria-label={t('feeds.filters.aria')}>
          <div className="flex min-w-0 items-center gap-3">
            <Button
              aria-label={t('feeds.filters.sortAria')}
              className="shrink-0"
              onClick={() => updateSearch({ sort: sort === 'newest' ? 'oldest' : 'newest' })}
              type="button"
              variant="outline"
            >
              {sort === 'newest' ? t('feeds.filters.newestFirst') : t('feeds.filters.oldestFirst')}
              <CaretDownIcon
                aria-hidden="true"
                className={cn(
                  'transition-transform motion-reduce:transition-none',
                  sort === 'oldest' && 'rotate-180'
                )}
              />
            </Button>

            <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-2">
                <Button
                  aria-pressed={selectedSubscriptionId === 'all'}
                  className="min-h-10 shrink-0"
                  onClick={() => updateSubscriptionFilter('all')}
                  size="sm"
                  type="button"
                  variant={selectedSubscriptionId === 'all' ? 'default' : 'outline'}
                >
                  {t('feeds.filters.all')}
                </Button>
                {subscriptions.map((subscription) => (
                  <Button
                    aria-pressed={selectedSubscriptionId === subscription.id}
                    className="min-h-10 max-w-56 shrink-0 truncate"
                    key={subscription.id}
                    onClick={() => updateSubscriptionFilter(subscription.id)}
                    size="sm"
                    type="button"
                    variant={selectedSubscriptionId === subscription.id ? 'default' : 'outline'}
                  >
                    {subscription.title}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {isLoading ? <FeedsSkeleton /> : null}

        {isError ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('feeds.error.title')}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t('feeds.error.description')}
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && subscriptions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('feeds.empty.title')}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t('feeds.empty.description')}
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && subscriptions.length > 0 && items.length > 0 ? (
          <>
            <VirtualizedFeedGrid
              ariaLabel={t('feeds.collection.aria')}
              items={items}
              showActions={activeTab === 'new'}
              sourceTitleBySubscriptionId={sourceTitleBySubscriptionId}
            />
            <FeedInfiniteScrollLoader
              hasNextPage={itemsQuery.hasNextPage}
              isFetchingNextPage={itemsQuery.isFetchingNextPage}
              onLoadMore={() => void itemsQuery.fetchNextPage()}
            />
          </>
        ) : null}

        {!isLoading && !isError && subscriptions.length > 0 && items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {t('feeds.emptyFeed')}
            </CardContent>
          </Card>
        ) : null}
      </main>
      <AddFeedDialog onOpenChange={setIsAddFeedOpen} open={isAddFeedOpen} />
      <FeedManagerDialog
        onOpenChange={(open) => {
          if (open) {
            updateSearch({ manage: true });
            return;
          }
          updateSearch(
            {
              feed: undefined,
              manage: undefined,
              manageQuery: undefined,
              manageStatus: undefined,
              tab: search.tab === 'feeds' ? undefined : search.tab
            },
            true
          );
        }}
        onQueryChange={(query) =>
          updateSearch({ manageQuery: query.length > 0 ? query : undefined }, true)
        }
        onSelectFeed={(feed) => updateSearch({ feed }, true)}
        onStartAdd={() =>
          updateSearch({ feed: 'add', manageQuery: undefined, manageStatus: undefined }, true)
        }
        onStatusFilterChange={(status) =>
          updateSearch({ manageStatus: status === 'all' ? undefined : status }, true)
        }
        open={isManageOpen}
        query={search.manageQuery ?? ''}
        selectedFeedId={search.feed}
        statusFilter={managerStatus}
        subscriptions={subscriptions}
        subscriptionsLoading={subscriptionsQuery.isLoading}
      />
    </>
  );
}

export default FeedsPage;
