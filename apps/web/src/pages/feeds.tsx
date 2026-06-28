import {
  ArrowsClockwise,
  CheckCircle,
  FloppyDisk,
  Plus,
  RssSimple,
  WarningCircle,
  XCircle
} from '@phosphor-icons/react';
import { Link, useSearch } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

import {
  createFeedSubscriptionBodySchema,
  useCreateFeedSubscription
} from '@/features/feeds/api/create-feed-subscription';
import { useDismissFeedItem } from '@/features/feeds/api/dismiss-feed-item';
import { useFeedItems } from '@/features/feeds/api/get-feed-items';
import { useFeedSubscriptions } from '@/features/feeds/api/get-feed-subscriptions';
import { useRefreshFeedSubscription } from '@/features/feeds/api/refresh-feed-subscription';
import { useSaveFeedItem } from '@/features/feeds/api/save-feed-item';

import { cn } from '@/lib/utils';

import type { FeedItem, FeedItemState, FeedSubscription } from '@/types/feeds';

type FeedTab = 'new' | 'saved' | 'dismissed' | 'feeds';
type FeedShelf = {
  defaultOpen: boolean;
  items: FeedItem[];
  priority: number;
  subscription: FeedSubscription;
};

const tabStates: Array<{ state?: FeedItemState; value: FeedTab }> = [
  { value: 'new', state: 'new' },
  { value: 'saved', state: 'saved' },
  { value: 'dismissed', state: 'dismissed' },
  { value: 'feeds' }
];

const formatDate = (value: string | null) => {
  if (!value) return null;

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
};

const getActionError = (error: unknown) => {
  if (error instanceof Error) return error.message;

  return null;
};

export const groupFeedItemsBySubscription = (items: FeedItem[]) => {
  const grouped = new Map<string, FeedItem[]>();

  for (const item of items) {
    grouped.set(item.subscriptionId, [...(grouped.get(item.subscriptionId) ?? []), item]);
  }

  return grouped;
};

export const buildFeedShelves = (
  subscriptions: FeedSubscription[],
  itemsBySubscription: Map<string, FeedItem[]>
): FeedShelf[] =>
  subscriptions
    .map((subscription) => {
      const items = itemsBySubscription.get(subscription.id) ?? [];
      const hasWarning = Boolean(subscription.lastError);
      const hasNewItems = items.some((item) => item.state === 'new');
      const priority = hasNewItems ? 0 : hasWarning ? 1 : 2;

      return {
        defaultOpen: hasNewItems || hasWarning,
        items,
        priority,
        subscription
      };
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (b.items.length !== a.items.length) return b.items.length - a.items.length;

      return a.subscription.title.localeCompare(b.subscription.title);
    });

function FeedsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-30 w-full rounded-4xl" />
      <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
        <Skeleton className="mb-4 h-76 w-full break-inside-avoid rounded-3xl" />
        <Skeleton className="mb-4 h-52 w-full break-inside-avoid rounded-3xl" />
        <Skeleton className="mb-4 h-64 w-full break-inside-avoid rounded-3xl" />
      </div>
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

export function AddFeedForm() {
  const { t } = useTranslation();
  const [feedUrl, setFeedUrl] = useState('');
  const [autoSave, setAutoSave] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const createFeed = useCreateFeedSubscription({
    mutationConfig: {
      onSuccess: (response) => {
        setFeedUrl('');
        setAutoSave(false);
        setValidationError(null);
        setSuccessMessage(
          response.result.createdSubscription
            ? t('feeds.form.success', { count: response.result.staged })
            : t('feeds.form.alreadyAdded')
        );
      },
      onError: () => {
        setSuccessMessage(null);
      }
    }
  });

  const errorMessage = validationError ?? getActionError(createFeed.error);

  return (
    <form
      className="rounded-3xl border border-border bg-background/60 p-4 shadow-xs"
      onSubmit={(event) => {
        event.preventDefault();
        setSuccessMessage(null);

        const parsed = createFeedSubscriptionBodySchema.safeParse({ feedUrl, autoSave });
        if (!parsed.success) {
          setValidationError(t('feeds.form.invalidUrl'));
          return;
        }

        setValidationError(null);
        createFeed.mutate(parsed.data);
      }}
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-2">
          <Label htmlFor="feed-url">{t('feeds.form.urlLabel')}</Label>
          <Input
            aria-describedby="feed-url-help feed-url-error"
            aria-invalid={Boolean(errorMessage)}
            disabled={createFeed.isPending}
            id="feed-url"
            inputMode="url"
            onChange={(event) => setFeedUrl(event.target.value)}
            placeholder={t('feeds.form.urlPlaceholder')}
            type="text"
            value={feedUrl}
          />
          <p className="text-sm text-muted-foreground" id="feed-url-help">
            {t('feeds.form.help')}
          </p>
        </div>
        <Button disabled={createFeed.isPending || feedUrl.trim().length === 0} type="submit">
          <Plus weight="bold" />
          {createFeed.isPending ? t('feeds.form.adding') : t('feeds.addFeed')}
        </Button>
      </div>

      <label className="mt-3 flex items-start gap-3 text-sm text-muted-foreground">
        <Checkbox
          checked={autoSave}
          disabled={createFeed.isPending}
          onCheckedChange={(checked) => setAutoSave(checked === true)}
        />
        <span>{t('feeds.form.autoSaveHelp')}</span>
      </label>

      {errorMessage ? (
        <p
          className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
          id="feed-url-error"
        >
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="mt-3 rounded-2xl bg-primary/10 px-3 py-2 text-sm text-primary" role="status">
          {successMessage}
        </p>
      ) : null}
    </form>
  );
}

export function FeedItemCard({ item }: { item: FeedItem }) {
  const { t } = useTranslation();
  const saveItem = useSaveFeedItem();
  const dismissItem = useDismissFeedItem();
  const isMutating = saveItem.isPending || dismissItem.isPending;
  const canSave = item.state === 'new';
  const canDismiss = item.state === 'new';
  const publishedAt = formatDate(item.publishedAt);
  const errorMessage = getActionError(saveItem.error) ?? getActionError(dismissItem.error);

  return (
    <article className="rounded-3xl border border-border bg-card/70 p-4 transition-colors hover:border-primary/30">
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          {item.imageUrl ? (
            <img
              alt=""
              className="size-14 rounded-2xl border border-border object-cover"
              loading="lazy"
              src={item.imageUrl}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
              <a
                className="hover:text-primary hover:underline"
                href={item.url}
                rel="noreferrer"
                target="_blank"
              >
                {item.title}
              </a>
            </h3>
            {publishedAt || item.author ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {[publishedAt, item.author].filter(Boolean).join(' · ')}
              </p>
            ) : null}
          </div>
        </div>

        {item.excerpt ? (
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{item.excerpt}</p>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          disabled={!canSave || isMutating}
          onClick={() => saveItem.mutate(item.id)}
          size="sm"
          type="button"
        >
          <FloppyDisk weight="bold" />
          {saveItem.isPending ? t('feeds.actions.saving') : t('feeds.actions.save')}
        </Button>
        <Button
          disabled={!canDismiss || isMutating}
          onClick={() => dismissItem.mutate(item.id)}
          size="sm"
          type="button"
          variant="outline"
        >
          <XCircle weight="bold" />
          {dismissItem.isPending ? t('feeds.actions.dismissing') : t('feeds.actions.dismiss')}
        </Button>
      </div>
    </article>
  );
}

export function FeedShelfCard({ activeTab, shelf }: { activeTab: FeedTab; shelf: FeedShelf }) {
  const { t } = useTranslation();
  const refreshFeed = useRefreshFeedSubscription();
  const { items, subscription } = shelf;
  const lastFetchedAt = formatDate(
    subscription.lastSuccessfulFetchAt ?? subscription.lastFetchedAt
  );
  const nextFetchAfter = formatDate(subscription.nextFetchAfter);
  const refreshError = getActionError(refreshFeed.error);

  return (
    <details
      className="group mb-4 break-inside-avoid overflow-hidden rounded-3xl border border-border bg-card shadow-xs open:shadow-sm"
      open={shelf.defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-5 marker:hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-foreground">
              {subscription.title}
            </h2>
            <FeedStatusBadge subscription={subscription} />
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {subscription.siteUrl ?? subscription.feedUrl}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('feeds.shelf.itemCount', { count: items.length })}
            {lastFetchedAt ? ` · ${t('feeds.shelf.lastFetched', { date: lastFetchedAt })}` : ''}
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors group-open:bg-accent">
          {t('feeds.shelf.toggle')}
        </span>
      </summary>

      <div className="border-t border-border px-5 pb-5 pt-4">
        {subscription.lastError ? (
          <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <div className="flex gap-2 font-medium">
              <WarningCircle className="mt-0.5 shrink-0" weight="bold" />
              {t('feeds.warning.title')}
            </div>
            <p className="mt-1 text-destructive/90">{subscription.lastError}</p>
            {nextFetchAfter ? (
              <p className="mt-2 text-xs text-destructive/80">
                {t('feeds.warning.nextTry', { date: nextFetchAfter })}
              </p>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'feeds' ? (
          <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-accent/50 p-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{t('feeds.fields.autoSave')}</dt>
              <dd className="font-medium">
                {subscription.autoSave ? t('feeds.yes') : t('feeds.no')}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('feeds.fields.failures')}</dt>
              <dd className="font-medium">{subscription.failureCount}</dd>
            </div>
          </dl>
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <FeedItemCard item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-accent/50 p-3 text-sm text-muted-foreground">
            {t('feeds.emptyFeed')}
          </p>
        )}

        {refreshError ? (
          <p className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {refreshError}
          </p>
        ) : null}

        <Button
          className="mt-4 w-full"
          disabled={refreshFeed.isPending}
          onClick={() => refreshFeed.mutate(subscription.id)}
          size="sm"
          type="button"
          variant="outline"
        >
          <ArrowsClockwise className={cn(refreshFeed.isPending && 'animate-spin')} />
          {refreshFeed.isPending ? t('feeds.actions.refreshing') : t('feeds.actions.refresh')}
        </Button>
      </div>
    </details>
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
  const itemsBySubscription = useMemo(() => groupFeedItemsBySubscription(items), [items]);
  const shelves = useMemo(
    () => buildFeedShelves(subscriptions, itemsBySubscription),
    [itemsBySubscription, subscriptions]
  );

  const isLoading = subscriptionsQuery.isLoading || itemsQuery.isLoading;
  const isError = subscriptionsQuery.isError || itemsQuery.isError;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-5 rounded-4xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <RssSimple weight="bold" />
              {t('feeds.eyebrow')}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                {t('feeds.title')}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {t('feeds.description')}
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-primary/10 px-3 py-2 text-sm text-primary">
            {t('feeds.reviewNote')}
          </div>
        </div>

        <AddFeedForm />

        <nav aria-label={t('feeds.tabs.aria')} className="grid grid-cols-4 gap-2 sm:flex sm:w-fit">
          {tabStates.map((tab) => (
            <Link className="min-w-0" key={tab.value} search={{ tab: tab.value }} to="/feeds">
              <Button
                className={cn(
                  'min-h-10 w-full px-2 sm:w-auto sm:px-4',
                  activeTab === tab.value &&
                    'bg-primary text-primary-foreground hover:bg-primary/90'
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
        <section
          aria-label={t('feeds.shelf.aria')}
          className="columns-1 gap-4 md:columns-2 xl:columns-3"
        >
          {shelves.map((shelf) => (
            <FeedShelfCard activeTab={activeTab} key={shelf.subscription.id} shelf={shelf} />
          ))}
        </section>
      ) : null}
    </main>
  );
}

export default FeedsPage;
