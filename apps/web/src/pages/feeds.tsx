import { ArrowsClockwise, CheckCircle, RssSimple, WarningCircle } from '@phosphor-icons/react';
import { Link, useSearch } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useFeedItems } from '@/features/feeds/api/get-feed-items';
import { useFeedSubscriptions } from '@/features/feeds/api/get-feed-subscriptions';

import { cn } from '@/lib/utils';

import type { FeedItemState, FeedSubscription } from '@/types/feeds';

type FeedTab = 'new' | 'saved' | 'dismissed' | 'feeds';

const tabStates: Array<{ state?: FeedItemState; value: FeedTab }> = [
  { value: 'new', state: 'new' },
  { value: 'saved', state: 'saved' },
  { value: 'dismissed', state: 'dismissed' },
  { value: 'feeds' }
];

function FeedsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function FeedStatusBadge({ subscription }: { subscription: FeedSubscription }) {
  const { t } = useTranslation();

  if (subscription.lastError) {
    return (
      <Badge className="gap-1" variant="danger">
        <WarningCircle weight="bold" />
        {t('feeds.status.warning')}
      </Badge>
    );
  }

  if (subscription.status === 'paused') {
    return <Badge variant="secondary">{t('feeds.status.paused')}</Badge>;
  }

  return (
    <Badge className="gap-1" variant="secondary">
      <CheckCircle weight="bold" />
      {t('feeds.status.active')}
    </Badge>
  );
}

function FeedsPage() {
  const { t } = useTranslation();
  const search = useSearch({ strict: false }) as { tab?: FeedTab };
  const activeTab: FeedTab = search.tab ?? 'new';
  const activeState = tabStates.find((tab) => tab.value === activeTab)?.state;

  const subscriptionsQuery = useFeedSubscriptions();
  const itemsQuery = useFeedItems({ filters: activeState ? { state: activeState } : {} });

  const subscriptions = subscriptionsQuery.data?.result ?? [];
  const items = itemsQuery.data?.result ?? [];
  const itemsBySubscription = useMemo(() => {
    const grouped = new Map<string, typeof items>();

    for (const item of items) {
      grouped.set(item.subscriptionId, [...(grouped.get(item.subscriptionId) ?? []), item]);
    }

    return grouped;
  }, [items]);

  const isLoading = subscriptionsQuery.isLoading || itemsQuery.isLoading;
  const isError = subscriptionsQuery.isError || itemsQuery.isError;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-4 rounded-4xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <RssSimple weight="bold" />
              {t('feeds.eyebrow')}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t('feeds.title')}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {t('feeds.description')}
              </p>
            </div>
          </div>
          <Button disabled variant="secondary">
            {t('feeds.addFeed')}
          </Button>
        </div>

        <nav aria-label={t('feeds.tabs.aria')} className="grid grid-cols-4 gap-2 sm:flex sm:w-fit">
          {tabStates.map((tab) => (
            <Link key={tab.value} search={{ tab: tab.value }} to="/feeds">
              <Button
                className={cn(
                  'w-full sm:w-auto',
                  activeTab === tab.value && 'bg-primary text-primary-foreground'
                )}
                size="sm"
                variant={activeTab === tab.value ? 'default' : 'outline'}
              >
                {t(`feeds.tabs.${tab.value}`)}
              </Button>
            </Link>
          ))}
        </nav>
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

      {!isLoading && !isError && subscriptions.length > 0 ? (
        <section className="columns-1 gap-4 md:columns-2 xl:columns-3">
          {subscriptions.map((subscription) => {
            const subscriptionItems = itemsBySubscription.get(subscription.id) ?? [];

            return (
              <Card className="mb-4 break-inside-avoid" key={subscription.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{subscription.title}</CardTitle>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {subscription.siteUrl ?? subscription.feedUrl}
                      </p>
                    </div>
                    <FeedStatusBadge subscription={subscription} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {subscription.lastError ? (
                    <p className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
                      {subscription.lastError}
                    </p>
                  ) : null}

                  {activeTab === 'feeds' ? (
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-muted-foreground">{t('feeds.fields.autoSave')}</dt>
                        <dd>{subscription.autoSave ? t('feeds.yes') : t('feeds.no')}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">{t('feeds.fields.failures')}</dt>
                        <dd>{subscription.failureCount}</dd>
                      </div>
                    </dl>
                  ) : subscriptionItems.length > 0 ? (
                    <div className="space-y-3">
                      {subscriptionItems.map((item) => (
                        <article className="rounded-3xl border border-border p-4" key={item.id}>
                          <h2 className="line-clamp-2 text-sm font-medium">{item.title}</h2>
                          {item.excerpt ? (
                            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                              {item.excerpt}
                            </p>
                          ) : null}
                          <div className="mt-3 flex gap-2">
                            <Button disabled size="sm">
                              {t('feeds.actions.save')}
                            </Button>
                            <Button disabled size="sm" variant="outline">
                              {t('feeds.actions.dismiss')}
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('feeds.emptyFeed')}</p>
                  )}

                  <Button className="w-full" disabled size="sm" variant="outline">
                    <ArrowsClockwise />
                    {t('feeds.actions.refresh')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      ) : null}
    </main>
  );
}

export default FeedsPage;
