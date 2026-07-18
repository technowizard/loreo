import { BookmarkSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import { useDismissFeedItem } from '@/features/feeds/api/dismiss-feed-item';
import { useSaveFeedItem } from '@/features/feeds/api/save-feed-item';

import type { FeedItem } from '@/types/feeds';

type FeedItemCardProps = {
  item: FeedItem;
  showActions?: boolean;
  sourceTitle?: string;
};

const formatPublishedDate = (value: string | null) => {
  if (!value) return null;

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
};

const getActionError = (error: unknown) => (error instanceof Error ? error.message : null);

function FeedItemActions({ item }: { item: FeedItem }) {
  const { t } = useTranslation();
  const saveItem = useSaveFeedItem();
  const dismissItem = useDismissFeedItem();
  const isMutating = saveItem.isPending || dismissItem.isPending;
  const errorMessage = getActionError(saveItem.error) ?? getActionError(dismissItem.error);

  return (
    <div className="space-y-2">
      {errorMessage ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="min-h-10 w-full"
          disabled={isMutating}
          onClick={() => saveItem.mutate(item.id)}
          size="sm"
          type="button"
        >
          {saveItem.isPending ? t('feeds.actions.saving') : t('feeds.actions.save')}
        </Button>
        <Button
          className="min-h-10 w-full"
          disabled={isMutating}
          onClick={() => dismissItem.mutate(item.id)}
          size="sm"
          type="button"
          variant="outline"
        >
          {dismissItem.isPending ? t('feeds.actions.dismissing') : t('feeds.actions.dismiss')}
        </Button>
      </div>
    </div>
  );
}

function FeedThumbnail({ item }: { item: FeedItem }) {
  return (
    <a
      aria-label={item.title}
      className="from-muted/50 to-muted flex h-50 w-full shrink-0 items-center justify-center overflow-hidden bg-linear-to-br"
      href={item.url}
      rel="noreferrer"
      target="_blank"
    >
      {item.imageUrl ? (
        <img
          alt=""
          className="size-full object-cover"
          height={200}
          loading="lazy"
          src={item.imageUrl}
          width={356}
        />
      ) : (
        <span className="flex size-14 items-center justify-center rounded-xl bg-background shadow-sm">
          <BookmarkSimpleIcon aria-hidden="true" className="text-muted-foreground" size={32} />
        </span>
      )}
    </a>
  );
}

function GridFeedItemCard({ item, showActions, sourceTitle }: FeedItemCardProps) {
  const publishedAt = formatPublishedDate(item.publishedAt);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-4xl border border-border bg-card transition-colors hover:bg-accent/30">
      <FeedThumbnail item={item} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          {sourceTitle ? (
            <p className="truncate text-sm font-medium text-muted-foreground">{sourceTitle}</p>
          ) : null}
          <h2 className="line-clamp-2 text-base font-semibold leading-snug text-card-foreground">
            <a
              className="hover:text-primary hover:underline"
              href={item.url}
              rel="noreferrer"
              target="_blank"
            >
              {item.title}
            </a>
          </h2>
          {item.excerpt ? (
            <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{item.excerpt}</p>
          ) : null}
        </div>
        <div className="mt-auto space-y-3">
          {publishedAt ? <p className="text-xs text-muted-foreground">{publishedAt}</p> : null}
          {showActions ? <FeedItemActions item={item} /> : null}
        </div>
      </div>
    </article>
  );
}

export function FeedItemCard({
  item,
  showActions = item.state === 'new',
  sourceTitle = ''
}: FeedItemCardProps) {
  return <GridFeedItemCard item={item} showActions={showActions} sourceTitle={sourceTitle} />;
}
