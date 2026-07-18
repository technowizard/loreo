import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  RssIcon,
  WarningCircleIcon
} from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';
import { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

import { useFeedSubscriptionSummary } from '@/features/feeds/api/get-feed-subscription-summary';
import { useUpdateFeedSubscription } from '@/features/feeds/api/update-feed-subscription';

import { cn } from '@/lib/utils';

import type { FeedItemState, FeedSubscription } from '@/types/feeds';

import { AddFeedForm } from './add-feed-form';

export type FeedManagerStatusFilter = 'all' | 'active' | 'paused' | 'attention';

type FeedManagerDialogProps = {
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onSelectFeed: (feedId: string) => void;
  onStartAdd: () => void;
  onStatusFilterChange: (filter: FeedManagerStatusFilter) => void;
  open: boolean;
  subscriptionsLoading: boolean;
  query: string;
  selectedFeedId?: string;
  statusFilter: FeedManagerStatusFilter;
  subscriptions: FeedSubscription[];
};

function needsAttention(subscription: FeedSubscription) {
  return subscription.failureCount > 0 || Boolean(subscription.lastError);
}

export function getDefaultManagedFeedId(subscriptions: FeedSubscription[]) {
  return subscriptions.find(needsAttention)?.id ?? subscriptions[0]?.id ?? 'add';
}

export function filterManagedFeeds(
  subscriptions: FeedSubscription[],
  query: string,
  statusFilter: FeedManagerStatusFilter
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return subscriptions.filter((subscription) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      subscription.title.toLocaleLowerCase().includes(normalizedQuery) ||
      subscription.feedUrl.toLocaleLowerCase().includes(normalizedQuery);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'attention' && needsAttention(subscription)) ||
      (statusFilter === 'active' && subscription.status === 'active') ||
      (statusFilter === 'paused' && subscription.status === 'paused');

    return matchesQuery && matchesStatus;
  });
}

function getFeedInitials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase())
    .join('');
}

function FeedIdentity({
  subscription,
  size = 'md'
}: {
  subscription: FeedSubscription;
  size?: 'lg' | 'md';
}) {
  const dimensions = size === 'lg' ? 'size-14 text-lg' : 'size-11 text-sm';

  return subscription.imageUrl ? (
    <img
      alt=""
      className={cn('shrink-0 rounded-2xl border border-border object-cover', dimensions)}
      height={size === 'lg' ? 56 : 44}
      loading="lazy"
      src={subscription.imageUrl}
      width={size === 'lg' ? 56 : 44}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-2xl border border-border bg-muted font-semibold text-muted-foreground',
        dimensions
      )}
    >
      {getFeedInitials(subscription.title) || <RssIcon weight="bold" />}
    </span>
  );
}

function FeedStatusBadge({ subscription }: { subscription: FeedSubscription }) {
  const { t } = useTranslation();

  if (needsAttention(subscription)) {
    return <Badge variant="warning">{t('feeds.manager.status.attention')}</Badge>;
  }

  return (
    <Badge variant={subscription.status === 'active' ? 'success' : 'secondary'}>
      {t(`feeds.manager.status.${subscription.status}`)}
    </Badge>
  );
}

function FeedManagerList({
  filteredSubscriptions,
  onSelectFeed,
  query,
  selectedFeedId,
  subscriptions,
  subscriptionsLoading
}: {
  filteredSubscriptions: FeedSubscription[];
  onSelectFeed: (feedId: string) => void;
  query: string;
  selectedFeedId?: string;
  subscriptions: FeedSubscription[];
  subscriptionsLoading: boolean;
}) {
  const { i18n, t } = useTranslation();
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }),
    [i18n.language]
  );

  if (subscriptionsLoading) {
    return (
      <div className="space-y-3 p-4" role="status">
        <span className="sr-only">{t('feeds.manager.loading')}</span>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton className="h-20 w-full rounded-2xl" key={index} />
        ))}
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <RssIcon aria-hidden="true" className="size-6" weight="bold" />
        </span>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">{t('feeds.manager.empty.title')}</h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            {t('feeds.manager.empty.description')}
          </p>
        </div>
      </div>
    );
  }

  if (filteredSubscriptions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <h3 className="font-semibold text-foreground">{t('feeds.manager.noResults.title')}</h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          {t('feeds.manager.noResults.description', { query })}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {filteredSubscriptions.map((subscription) => (
        <button
          aria-pressed={selectedFeedId === subscription.id}
          className={cn(
            'flex min-h-24 w-full touch-manipulation gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none [content-visibility:auto] [contain-intrinsic-size:96px]',
            selectedFeedId === subscription.id &&
              'bg-primary/5 shadow-[inset_3px_0_0_var(--color-primary)]'
          )}
          key={subscription.id}
          onClick={() => onSelectFeed(subscription.id)}
          type="button"
        >
          <FeedIdentity subscription={subscription} />
          <span className="min-w-0 flex-1 space-y-1">
            <span className="flex min-w-0 items-start justify-between gap-2">
              <span className="truncate font-semibold text-foreground">{subscription.title}</span>
              <FeedStatusBadge subscription={subscription} />
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {subscription.feedUrl}
            </span>
            <span className="block text-xs text-muted-foreground">
              {subscription.lastSuccessfulFetchAt
                ? t('feeds.manager.lastFetched', {
                    date: dateFormatter.format(new Date(subscription.lastSuccessfulFetchAt))
                  })
                : t('feeds.manager.neverFetched')}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

function SummaryLink({
  count,
  label,
  state,
  subscriptionId
}: {
  count: number;
  label: string;
  state: FeedItemState;
  subscriptionId: string;
}) {
  const { t } = useTranslation();
  const tab = state === 'new' ? 'new' : state;

  return (
    <div className="min-w-0 space-y-2 border-r border-border px-3 last:border-r-0 first:pl-0 last:pr-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-foreground">{count}</p>
      <Link
        aria-label={t('feeds.manager.summary.viewItemsLabel', { label })}
        className={cn(buttonVariants({ size: 'sm', variant: 'link' }), 'h-auto justify-start p-0')}
        search={{ subscriptionId, tab }}
        to="/feeds"
      >
        {t('feeds.manager.summary.viewItems')}
      </Link>
    </div>
  );
}

function FeedDetail({ subscription }: { subscription: FeedSubscription }) {
  const { i18n, t } = useTranslation();
  const statusSwitchId = useId();
  const autoSaveSwitchId = useId();
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const summaryQuery = useFeedSubscriptionSummary({ subscriptionId: subscription.id });
  const updateFeed = useUpdateFeedSubscription({
    mutationConfig: {
      onError: () => setUpdateMessage(null),
      onMutate: () => setUpdateMessage(null),
      onSuccess: () => setUpdateMessage(t('feeds.manager.controls.updated'))
    }
  });
  const dateTimeFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }),
    [i18n.language]
  );
  const summary = summaryQuery.data?.result;
  const mutationError = updateFeed.error instanceof Error ? updateFeed.error.message : null;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex min-w-0 items-center gap-4 border-b border-border pb-5">
        <FeedIdentity size="lg" subscription={subscription} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-foreground">{subscription.title}</h2>
            <FeedStatusBadge subscription={subscription} />
          </div>
          <a
            className="block truncate text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
            href={subscription.feedUrl}
            rel="noreferrer"
            target="_blank"
          >
            {subscription.feedUrl}
          </a>
        </div>
      </div>

      {subscription.lastError ? (
        <Alert variant="warning">
          <WarningCircleIcon aria-hidden="true" />
          <AlertDescription className="break-words">{subscription.lastError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{t('feeds.manager.feedUrl')}</p>
          <p className="break-all rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {subscription.feedUrl}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{t('feeds.manager.website')}</p>
          {subscription.siteUrl ? (
            <a
              className="block break-all rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              href={subscription.siteUrl}
              rel="noreferrer"
              target="_blank"
            >
              {subscription.siteUrl}
            </a>
          ) : (
            <p className="rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {t('feeds.manager.notAvailable')}
            </p>
          )}
        </div>
      </div>

      {subscription.description ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{t('feeds.manager.description')}</p>
          <p className="break-words text-pretty text-sm leading-6 text-muted-foreground">
            {subscription.description}
          </p>
        </div>
      ) : null}

      <div
        aria-busy={updateFeed.isPending}
        className="grid gap-4 rounded-3xl border border-border bg-muted/20 p-4 sm:grid-cols-2"
      >
        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-2xl px-2 hover:bg-accent">
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">
              {t('feeds.manager.controls.status')}
            </span>
            <span className="block text-xs text-muted-foreground">
              {subscription.status === 'active'
                ? t('feeds.manager.controls.activeHelp')
                : t('feeds.manager.controls.pausedHelp')}
            </span>
          </span>
          <Switch
            checked={subscription.status === 'active'}
            disabled={updateFeed.isPending}
            id={statusSwitchId}
            name="feedStatus"
            onCheckedChange={(checked) =>
              updateFeed.mutate({
                body: { status: checked ? 'active' : 'paused' },
                subscriptionId: subscription.id
              })
            }
          />
        </label>
        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-2xl px-2 hover:bg-accent">
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">
              {t('feeds.manager.controls.autoSave')}
            </span>
            <span className="block text-xs text-muted-foreground">
              {t('feeds.manager.controls.autoSaveHelp')}
            </span>
          </span>
          <Switch
            checked={subscription.autoSave}
            disabled={updateFeed.isPending}
            id={autoSaveSwitchId}
            name="feedAutoSave"
            onCheckedChange={(checked) =>
              updateFeed.mutate({
                body: { autoSave: checked },
                subscriptionId: subscription.id
              })
            }
          />
        </label>
      </div>

      <p aria-live="polite" className="sr-only" role="status">
        {updateFeed.isPending ? t('feeds.manager.controls.updating') : updateMessage}
      </p>

      {mutationError ? (
        <p className="text-sm text-destructive" role="alert">
          {t('feeds.manager.updateError', { message: mutationError })}
        </p>
      ) : null}

      <section aria-labelledby="feed-summary-title" className="space-y-3">
        <h3 className="font-semibold text-foreground" id="feed-summary-title">
          {t('feeds.manager.summary.title')}
        </h3>
        {summaryQuery.isLoading ? (
          <Skeleton className="h-28 w-full rounded-3xl" />
        ) : summaryQuery.isError || !summary ? (
          <Alert variant="danger">
            <AlertDescription>{t('feeds.manager.summary.error')}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-2 gap-y-5 rounded-3xl border border-border bg-primary/5 p-4 sm:grid-cols-5">
            <SummaryLink
              count={summary.new}
              label={t('feeds.manager.summary.pending')}
              state="new"
              subscriptionId={subscription.id}
            />
            <SummaryLink
              count={summary.saved}
              label={t('feeds.manager.summary.saved')}
              state="saved"
              subscriptionId={subscription.id}
            />
            <SummaryLink
              count={summary.dismissed}
              label={t('feeds.manager.summary.dismissed')}
              state="dismissed"
              subscriptionId={subscription.id}
            />
            <div className="space-y-2 border-r border-border px-3 sm:border-r">
              <p className="text-xs text-muted-foreground">{t('feeds.manager.summary.failures')}</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">
                {subscription.failureCount}
              </p>
            </div>
            <div className="space-y-2 px-3 last:pr-0">
              <p className="text-xs text-muted-foreground">
                {t('feeds.manager.summary.lastFetched')}
              </p>
              <p className="text-sm font-medium text-foreground">
                {subscription.lastSuccessfulFetchAt
                  ? dateTimeFormatter.format(new Date(subscription.lastSuccessfulFetchAt))
                  : t('feeds.manager.neverFetched')}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function FeedManagerDialog({
  onOpenChange,
  onQueryChange,
  onSelectFeed,
  onStartAdd,
  onStatusFilterChange,
  open,
  query,
  selectedFeedId,
  statusFilter,
  subscriptions,
  subscriptionsLoading
}: FeedManagerDialogProps) {
  const { t } = useTranslation();
  const [mobileView, setMobileView] = useState<'detail' | 'list'>(() =>
    selectedFeedId ? 'detail' : 'list'
  );
  const selectedSubscription = subscriptions.find(
    (subscription) => subscription.id === selectedFeedId
  );
  const filteredSubscriptions = useMemo(
    () => filterManagedFeeds(subscriptions, query, statusFilter),
    [query, statusFilter, subscriptions]
  );
  const isAdding = selectedFeedId === 'add';
  const statusFilters: FeedManagerStatusFilter[] = ['all', 'active', 'paused', 'attention'];
  const attentionCount = subscriptions.filter(needsAttention).length;

  useEffect(() => {
    if (!open || subscriptionsLoading) return;
    const hasValidSelection =
      selectedFeedId === 'add' ||
      subscriptions.some((subscription) => subscription.id === selectedFeedId);
    if (!hasValidSelection) {
      const candidates = filteredSubscriptions.length > 0 ? filteredSubscriptions : subscriptions;
      const defaultFeedId = getDefaultManagedFeedId(candidates);
      onSelectFeed(defaultFeedId);
      if (defaultFeedId === 'add') setMobileView('detail');
      return;
    }

    const selectionIsVisible = filteredSubscriptions.some(
      (subscription) => subscription.id === selectedFeedId
    );
    if (selectedFeedId !== 'add' && filteredSubscriptions.length > 0 && !selectionIsVisible) {
      onSelectFeed(getDefaultManagedFeedId(filteredSubscriptions));
    }
  }, [
    filteredSubscriptions,
    onSelectFeed,
    open,
    selectedFeedId,
    subscriptions,
    subscriptionsLoading
  ]);

  const showDetailOnMobile = mobileView === 'detail';
  const selectFeed = (feedId: string) => {
    onSelectFeed(feedId);
    setMobileView('detail');
  };
  const openAddFeed = () => {
    onStartAdd();
    setMobileView('detail');
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setMobileView('list');
        onOpenChange(nextOpen);
      }}
      open={open}
    >
      <DialogContent className="inset-0 top-0 left-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden overscroll-contain rounded-none p-0 pb-[env(safe-area-inset-bottom)] [&>[data-slot=dialog-close]]:top-[max(1rem,env(safe-area-inset-top))] [&>[data-slot=dialog-close]]:size-11 sm:top-1/2 sm:left-1/2 sm:h-[min(840px,calc(100dvh-2rem))] sm:max-w-[min(1180px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-4xl sm:pb-0 sm:[&>[data-slot=dialog-close]]:top-4 sm:[&>[data-slot=dialog-close]]:size-8">
        <DialogHeader className="shrink-0 border-b border-border px-4 pt-[max(1rem,env(safe-area-inset-top))] pr-16 pb-4 sm:px-6 sm:py-5 sm:pr-14">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-balance text-xl font-semibold sm:text-2xl">
                {t('feeds.manager.title')}
              </DialogTitle>
              <DialogDescription className="text-pretty">
                {t('feeds.manager.description')}
              </DialogDescription>
            </div>
            <Button className="hidden sm:inline-flex" onClick={openAddFeed} type="button">
              <PlusIcon aria-hidden="true" />
              {t('feeds.addFeed')}
            </Button>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 md:grid-cols-[21rem_minmax(0,1fr)]">
          <aside
            className={cn(
              'min-h-0 flex-col border-r border-border bg-muted/10 md:flex',
              showDetailOnMobile ? 'hidden' : 'flex'
            )}
          >
            <div className="space-y-3 border-b border-border p-4">
              <label className="relative block">
                <span className="sr-only">{t('feeds.manager.search.label')}</span>
                <MagnifyingGlassIcon
                  aria-hidden="true"
                  className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  autoComplete="off"
                  className="h-11 pl-9"
                  name="feedSearch"
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder={t('feeds.manager.search.placeholder')}
                  spellCheck={false}
                  type="search"
                  value={query}
                />
              </label>
              <div
                aria-label={t('feeds.manager.filters.label')}
                className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="group"
              >
                {statusFilters.map((filter) => (
                  <Button
                    aria-pressed={statusFilter === filter}
                    className="min-h-11 shrink-0"
                    key={filter}
                    onClick={() => onStatusFilterChange(filter)}
                    size="sm"
                    type="button"
                    variant={statusFilter === filter ? 'default' : 'outline'}
                  >
                    {t(`feeds.manager.filters.${filter}`)}
                    {filter === 'attention' && attentionCount > 0 ? (
                      <span className="tabular-nums">{attentionCount}</span>
                    ) : null}
                  </Button>
                ))}
              </div>
              <Button className="w-full sm:hidden" onClick={openAddFeed} type="button">
                <PlusIcon aria-hidden="true" />
                {t('feeds.addFeed')}
              </Button>
            </div>
            <FeedManagerList
              filteredSubscriptions={filteredSubscriptions}
              onSelectFeed={selectFeed}
              query={query}
              selectedFeedId={selectedFeedId}
              subscriptions={subscriptions}
              subscriptionsLoading={subscriptionsLoading}
            />
            <p className="shrink-0 border-t border-border px-4 py-3 text-xs text-muted-foreground">
              {t('feeds.manager.feedCount', { count: subscriptions.length })}
            </p>
          </aside>

          <section
            aria-label={t('feeds.manager.detailLabel')}
            className={cn(
              'min-h-0 overflow-y-auto overscroll-contain bg-background md:block',
              showDetailOnMobile ? 'block' : 'hidden'
            )}
          >
            <div className="sticky top-0 z-10 flex min-h-14 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
              <Button
                aria-label={t('feeds.manager.back')}
                className="size-11"
                onClick={() => setMobileView('list')}
                size="icon-lg"
                type="button"
                variant="ghost"
              >
                <ArrowLeftIcon aria-hidden="true" />
              </Button>
              <p className="truncate font-semibold text-foreground">
                {isAdding ? t('feeds.dialog.title') : selectedSubscription?.title}
              </p>
            </div>

            {isAdding ? (
              <div className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6 lg:p-8">
                <div className="space-y-1">
                  <h2 className="text-balance text-xl font-semibold text-foreground">
                    {t('feeds.dialog.title')}
                  </h2>
                  <p className="text-pretty text-sm text-muted-foreground">
                    {t('feeds.dialog.description')}
                  </p>
                </div>
                <AddFeedForm
                  onSuccess={(result) => selectFeed(result.subscription.id)}
                  presentation="embedded"
                />
              </div>
            ) : selectedSubscription ? (
              <FeedDetail key={selectedSubscription.id} subscription={selectedSubscription} />
            ) : (
              <div className="flex min-h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
                {t('feeds.manager.selectPrompt')}
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
