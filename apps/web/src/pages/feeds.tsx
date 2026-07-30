import { CaretDownIcon, InfoIcon, PlusIcon, RssIcon } from '@phosphor-icons/react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status">
      <span className="sr-only">{t('feeds.loading')}</span>
      <Skeleton className="h-96 w-full rounded-3xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
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
  const subscriptions = subscriptionsQuery.data?.result ?? [];
  const hasSubscriptions = subscriptions.length > 0;
  const itemsQuery = useFeedItems({
    filters: {
      sort,
      state: activeState,
      ...(selectedSubscriptionFilter ? { subscriptionId: selectedSubscriptionFilter } : {})
    },
    queryConfig: { enabled: hasSubscriptions }
  });
  const pendingItemsQuery = useFeedItems({
    filters: { state: 'new' },
    queryConfig: { enabled: hasSubscriptions }
  });

  const items = itemsQuery.data ?? [];
  const activeFeeds = subscriptions.filter((subscription) => subscription.status === 'active');
  const sourceTitleBySubscriptionId = useMemo(
    () => new Map(subscriptions.map((subscription) => [subscription.id, subscription.title])),
    [subscriptions]
  );
  const isLoading = subscriptionsQuery.isLoading || (hasSubscriptions && itemsQuery.isLoading);
  const isError = subscriptionsQuery.isError || (hasSubscriptions && itemsQuery.isError);
  const isOverviewLoading =
    subscriptionsQuery.isLoading || (hasSubscriptions && pendingItemsQuery.isLoading);
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

  const retryFeeds = () => {
    if (!hasSubscriptions) {
      void subscriptionsQuery.refetch();
      return;
    }

    void Promise.all([
      subscriptionsQuery.refetch(),
      itemsQuery.refetch(),
      pendingItemsQuery.refetch()
    ]);
  };

  const feedTabContent = (
    <>
      {activeTab === 'new' ? (
        <Alert variant="info">
          <InfoIcon aria-hidden="true" />
          <AlertDescription>{t('feeds.reviewNote')}</AlertDescription>
        </Alert>
      ) : null}

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

          <div className="relative min-w-0 flex-1">
            <div className="overflow-x-auto overscroll-x-contain pb-1 pr-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                    title={subscription.title}
                    type="button"
                    variant={selectedSubscriptionId === subscription.id ? 'default' : 'outline'}
                  >
                    {subscription.title}
                  </Button>
                ))}
              </div>
            </div>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-background to-transparent"
            />
          </div>
        </div>
      </section>

      {isLoading ? <FeedsSkeleton /> : null}

      {isError ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('feeds.error.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{t('feeds.error.description')}</p>
            <Button onClick={retryFeeds} type="button" variant="outline">
              {t('feeds.error.retry')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && subscriptions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('feeds.empty.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{t('feeds.empty.description')}</p>
            <Button onClick={() => setIsAddFeedOpen(true)} type="button">
              <PlusIcon aria-hidden="true" />
              {t('feeds.addFeed')}
            </Button>
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
          <CardContent className="space-y-4 py-8 text-center text-sm text-muted-foreground">
            <p>{t(`feeds.emptyItems.${activeTab}`)}</p>
            {selectedSubscriptionFilter ? (
              <Button
                onClick={() => updateSubscriptionFilter('all')}
                type="button"
                variant="outline"
              >
                {t('feeds.filters.showAll')}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </>
  );

  return (
    <>
      <main className="w-full space-y-6">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.72fr)] lg:items-start">
          <header>
            <h1 className="text-foreground text-2xl font-bold">{t('feeds.title')}</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">{t('feeds.description')}</p>
          </header>

          <div className="space-y-3 lg:pt-1">
            <div className="rounded-3xl border border-border bg-card p-4 shadow-xs">
              {isOverviewLoading ? (
                <div className="grid grid-cols-3 gap-4" role="status">
                  <span className="sr-only">{t('feeds.overview.loading')}</span>
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ) : (
                <div className="grid grid-cols-3 divide-x divide-border">
                  <div className="min-w-0 space-y-1 pr-3">
                    <div className="flex items-center gap-2">
                      <RssIcon aria-hidden="true" className="size-4 shrink-0 text-primary" />
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        {subscriptions.length}
                      </p>
                    </div>
                    <p className="text-xs leading-4 text-muted-foreground">
                      {t('feeds.overview.total')}
                    </p>
                  </div>
                  <div className="min-w-0 space-y-1 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full bg-success-500"
                      />
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        {activeFeeds.length}
                      </p>
                    </div>
                    <p className="text-xs leading-4 text-muted-foreground">
                      {t('feeds.overview.active')}
                    </p>
                  </div>
                  <div className="min-w-0 space-y-1 pl-3">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full bg-primary"
                      />
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        {pendingItemsQuery.isError ? (
                          <span aria-label={t('feeds.overview.unavailable')}>—</span>
                        ) : (
                          pendingItemsQuery.total
                        )}
                      </p>
                    </div>
                    <p className="text-xs leading-4 text-muted-foreground">
                      {t('feeds.overview.pending')}
                    </p>
                    {pendingItemsQuery.isError ? (
                      <button
                        className="text-xs text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => void pendingItemsQuery.refetch()}
                        type="button"
                      >
                        {t('feeds.overview.retry')}
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
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

        <Tabs onValueChange={(value) => updateSearch({ tab: value as FeedTab })} value={activeTab}>
          <div className="sticky top-0 z-20 bg-background/95 py-1 backdrop-blur md:static md:z-auto md:bg-transparent md:py-0 md:backdrop-blur-none">
            <TabsList
              aria-label={t('feeds.tabs.aria')}
              className="w-full justify-start border-b border-border"
              variant="line"
            >
              {tabStates.map((tab) => (
                <TabsTrigger className="flex-none px-3 sm:px-4" key={tab.value} value={tab.value}>
                  {t(`feeds.tabs.${tab.value}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {tabStates.map((tab) => (
            <TabsContent className="space-y-6 pt-4" key={tab.value} value={tab.value}>
              {activeTab === tab.value ? feedTabContent : null}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <AddFeedDialog onOpenChange={setIsAddFeedOpen} open={isAddFeedOpen} />
      <FeedManagerDialog
        onClearFilters={() =>
          updateSearch({ manageQuery: undefined, manageStatus: undefined }, true)
        }
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
