import {
  ArchiveIcon,
  ArrowsClockwiseIcon,
  BookmarkSimpleIcon,
  CalendarIcon,
  CircleDashedIcon,
  CircleIcon,
  ClockIcon,
  DotsThreeIcon,
  FlameIcon,
  StarIcon,
  TagIcon,
  TrashIcon
} from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Progress, ProgressValue } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import Tag from '@/components/ui/tag';

import { useMediaQuery } from '@/hooks/use-media-query';

import { cn, formatReadingTime, getUrlName } from '@/lib/utils';

import type { Link, UpdateLinkBody } from '@/types/links';
import type { TagGroup, Tag as TagType } from '@/types/tags';

import EditTagsDialog from './edit-tags-dialog';

type ArticleCardProps = {
  handleDeleteLink?: (id: string) => void;
  handleRefetchLink?: (id: string) => void;
  handleUpdateLink?: (id: string, body: UpdateLinkBody) => void;
  enableActions?: boolean;
  link: Omit<Link, 'content' | 'textContent'>;
  tagGroups?: TagGroup[];
  variant: 'grid' | 'list';
};

const DEFAULT_TAG_COLOR = '#6B7280';

const PRIORITY_OPTIONS = [
  {
    color: '#2563EB',
    labelKey: 'articles.card.priority.none',
    value: 'none'
  },
  {
    color: '#15803D',
    labelKey: 'articles.card.priority.lowPriority',
    value: 'low-priority'
  },
  {
    color: '#D97706',
    labelKey: 'articles.card.priority.thisWeek',
    value: 'this-week'
  },
  {
    color: '#C53030',
    labelKey: 'articles.card.priority.mustRead',
    value: 'must-read'
  }
] as const;

function useTagColorByGroupId(tagGroups: TagGroup[] = []) {
  return useMemo(() => {
    return new Map(tagGroups.map((group) => [group.id, group.color]));
  }, [tagGroups]);
}

function getDisplayTag(tag: TagType, tagColorByGroupId: Map<string, string>) {
  return {
    color: tagColorByGroupId.get(tag.groupId) ?? DEFAULT_TAG_COLOR,
    name: tag.name
  };
}

type ArticleDropdownMenuProps = {
  link: ArticleCardProps['link'];
  handleDeleteLink?: ArticleCardProps['handleDeleteLink'];
  handleRefetchLink?: ArticleCardProps['handleRefetchLink'];
  handleUpdateLink?: ArticleCardProps['handleUpdateLink'];
  onEditTagsOpen?: () => void;
};

export function ArticleCard({
  handleDeleteLink,
  handleRefetchLink,
  handleUpdateLink,
  enableActions = true,
  link,
  tagGroups,
  variant = 'grid'
}: ArticleCardProps) {
  if (variant === 'grid') {
    return (
      <GridCard
        handleDeleteLink={handleDeleteLink}
        handleRefetchLink={handleRefetchLink}
        handleUpdateLink={handleUpdateLink}
        enableActions={enableActions}
        link={link}
        tagGroups={tagGroups}
        variant={variant}
      />
    );
  }

  return (
    <ListCard
      handleDeleteLink={handleDeleteLink}
      handleRefetchLink={handleRefetchLink}
      handleUpdateLink={handleUpdateLink}
      enableActions={enableActions}
      link={link}
      tagGroups={tagGroups}
      variant={variant}
    />
  );
}

function ArticleDropdownMenu({
  handleDeleteLink,
  handleRefetchLink,
  handleUpdateLink,
  link,
  onEditTagsOpen
}: ArticleDropdownMenuProps) {
  const { t } = useTranslation('common');
  const { id, isArchived, priority } = link;

  return (
    <DropdownMenuContent align="end">
      <DropdownMenuGroup>
        <DropdownMenuLabel>{t('articles.filters.priority')}</DropdownMenuLabel>
        {PRIORITY_OPTIONS.map((option) => (
          <DropdownMenuItem
            className="h-11 sm:h-8"
            key={option.value}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();

              handleUpdateLink?.(id, { priority: option.value });
            }}
          >
            {option.value === 'none' ? (
              <CircleDashedIcon
                className="text-info-600 dark:text-info-300"
                size={16}
                weight="bold"
              />
            ) : (
              <CircleIcon
                size={16}
                style={{ color: option.color }}
                weight={priority === option.value ? 'fill' : 'bold'}
              />
            )}
            {t(option.labelKey)}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="h-11 sm:h-8"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();

            onEditTagsOpen?.();
          }}
        >
          <TagIcon size={16} />
          {t('articles.card.actions.editTags')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="h-11 sm:h-8"
          onClick={(event) => {
            event.stopPropagation();
            handleRefetchLink?.(id);
          }}
        >
          <ArrowsClockwiseIcon size={16} />
          {t('articles.card.actions.refresh')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="h-11 sm:h-8"
          onClick={(event) => {
            event.stopPropagation();
            handleUpdateLink?.(id, { isArchived: !isArchived });
          }}
        >
          <ArchiveIcon size={16} />
          {isArchived ? t('articles.card.actions.unarchive') : t('articles.card.actions.archive')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="h-11 sm:h-8"
          onClick={(event) => {
            event.stopPropagation();
            handleDeleteLink?.(id);
          }}
          variant="destructive"
        >
          <TrashIcon size={16} />
          {t('articles.card.actions.delete')}
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}

function GridCard({
  handleDeleteLink,
  handleRefetchLink,
  handleUpdateLink,
  link,
  tagGroups
}: ArticleCardProps) {
  const { t } = useTranslation('common');
  const {
    coverImage,
    excerpt,
    favicon,
    id,
    priority,
    processingStatus,
    readingProgress,
    readingTime,
    tags,
    title,
    url
  } = link;

  const [isEditTagsOpen, setIsEditTagsOpen] = useState(false);
  const tagColorByGroupId = useTagColorByGroupId(tagGroups);
  const isLoading = processingStatus === 'pending' || processingStatus === 'processing';
  const progressPercentage = Math.round(readingProgress);

  return (
    <div className="group bg-card hover:bg-accent/30 relative flex flex-col overflow-hidden rounded-4xl border transition-colors">
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <Button
          aria-label={t('articles.card.actions.favorite')}
          className="bg-background/80 rounded-full border backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();

            handleUpdateLink?.(id, {
              isFavorite: !link.isFavorite
            });
          }}
          size="icon"
          variant="ghost"
        >
          <StarIcon
            className={link.isFavorite ? 'fill-yellow-500' : 'text-gray-500'}
            size={16}
            weight={link.isFavorite ? 'fill' : 'bold'}
          />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label={t('articles.card.actions.more')}
                className="bg-background/80 rounded-full border backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                size="icon"
                variant="secondary"
              />
            }
          >
            <DotsThreeIcon size={16} />
          </DropdownMenuTrigger>
          <ArticleDropdownMenu
            handleDeleteLink={handleDeleteLink}
            handleRefetchLink={handleRefetchLink}
            handleUpdateLink={handleUpdateLink}
            link={link}
            onEditTagsOpen={() => setIsEditTagsOpen(true)}
          />
        </DropdownMenu>
      </div>

      <EditTagsDialog
        initialTags={tags}
        linkId={id}
        onOpenChange={setIsEditTagsOpen}
        open={isEditTagsOpen}
      />

      <div className="from-muted/50 to-muted relative flex aspect-video h-50 w-full flex-col items-center justify-center bg-linear-to-br">
        {isLoading ? (
          <Skeleton className="absolute inset-0 rounded-none" />
        ) : (
          <>
            {coverImage ? (
              <img
                alt="Article Cover"
                className="size-full h-50 self-center object-cover"
                height={200}
                src={coverImage}
                width={200}
              />
            ) : (
              <div className="bg-background flex size-14 items-center justify-center rounded-xl shadow-sm">
                {favicon ? (
                  <img
                    alt="Article Source Icon"
                    aria-hidden="true"
                    className="size-8"
                    height={32}
                    src={favicon}
                    width={32}
                  />
                ) : (
                  <BookmarkSimpleIcon size={32} />
                )}
              </div>
            )}

            {(readingProgress || priority !== 'none') && (
              <div className="absolute inset-0 bg-linear-to-t from-zinc-900/80 via-zinc-900/10"></div>
            )}

            <div className="absolute bottom-3 left-3">
              {priority === 'low-priority' && (
                <Badge
                  className="flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                  variant="success"
                >
                  <ClockIcon weight="fill" />
                  {t('articles.card.priority.lowPriority')}
                </Badge>
              )}
              {priority === 'this-week' && (
                <Badge
                  className="flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                  variant="warning"
                >
                  <ClockIcon weight="fill" />
                  {t('articles.card.priority.thisWeek')}
                </Badge>
              )}
              {priority === 'must-read' && (
                <Badge
                  className="flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                  variant="danger"
                >
                  <FlameIcon weight="fill" />
                  {t('articles.card.priority.mustRead')}
                </Badge>
              )}
            </div>

            <div className="absolute right-3 bottom-3">
              {readingProgress > 0 && (
                <div
                  className={cn(
                    'bg-background/80 text-card-foreground flex h-8 items-center justify-center rounded-full px-3 py-2 shadow-lg backdrop-blur-sm'
                  )}
                >
                  <div className="relative z-10 flex items-center space-x-2">
                    <svg className="h-4 w-4 -rotate-90 transform" viewBox="0 0 48 48">
                      <circle
                        cx="24"
                        cy="24"
                        fill="none"
                        r="20"
                        stroke="rgba(82, 82, 91, 0.3)"
                        strokeWidth="8"
                      />
                      <circle
                        className="transition-all duration-300"
                        cx="24"
                        cy="24"
                        fill="none"
                        r="20"
                        stroke="rgba(82, 82, 91)"
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - readingProgress / 100)}`}
                        strokeLinecap="round"
                        strokeWidth="8"
                      />
                    </svg>
                    <span className="text-xs leading-none font-bold">{progressPercentage}%</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3 px-4">
          <Skeleton className="h-4 w-24 rounded-md" />
          <div className="line-clamp-1 gap-2">{title}</div>
          <div className="space-y-2 sm:min-h-10">
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2 px-4">
          <p className="text-card-foreground inline-flex items-center text-sm font-medium">
            {favicon && (
              <img
                alt=""
                aria-hidden="true"
                className="mr-2 size-5"
                height={20}
                src={favicon || ''}
                width={20}
              />
            )}

            {getUrlName(url)}
          </p>
          <div className="line-clamp-1 gap-2">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm sm:min-h-10">{excerpt}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-between p-4">
          <Skeleton className="h-4 w-20 rounded-lg" />
          <Skeleton className="h-4 w-20 rounded-lg" />
        </div>
      ) : (
        <div className="p-4">
          <div className="flex w-full items-center justify-between">
            {tags && tags.length > 0 && (
              <div className="space-x-2 md:flex md:items-center">
                {tags.slice(0, 1).map((tag) => {
                  return <Tag key={tag.name} tag={getDisplayTag(tag, tagColorByGroupId)} />;
                })}
                {tags.length > 1 && (
                  <span className="text-muted-foreground text-sm">
                    {t('articles.card.moreCount', { count: tags.length - 1 })}
                  </span>
                )}
              </div>
            )}

            <p className="text-muted-foreground inline-flex items-center text-xs font-medium md:text-sm">
              <ClockIcon className="mr-1" size={16} weight="bold" />
              <span className="line-clamp-1">{formatReadingTime(readingTime as number)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ListCardCompact({
  handleDeleteLink,
  handleRefetchLink,
  handleUpdateLink,
  enableActions,
  link,
  tagGroups
}: ArticleCardProps) {
  const { t } = useTranslation('common');
  const {
    coverImage,
    excerpt,
    favicon,
    id,
    priority,
    processingStatus,
    readingProgress,
    readingTime,
    tags,
    title,
    url
  } = link;

  const [isEditTagsOpen, setIsEditTagsOpen] = useState(false);
  const tagColorByGroupId = useTagColorByGroupId(tagGroups);
  const isLoading = processingStatus === 'pending' || processingStatus === 'processing';

  return (
    <div className="group bg-card [@media(hover:hover)]:hover:bg-accent/30 relative flex w-full flex-col overflow-hidden rounded-xl border transition-colors">
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
          {isLoading ? (
            <Skeleton className="absolute inset-0 rounded-none" />
          ) : coverImage ? (
            <img alt="" className="size-full object-cover" src={coverImage} />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              {favicon ? (
                <img alt="" className="size-7" src={favicon} />
              ) : (
                <BookmarkSimpleIcon className="text-muted-foreground size-7" />
              )}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            {isLoading ? (
              <div className="flex-1 space-y-1.5">
                <h3 className="text-card-foreground line-clamp-2 flex-1 text-sm font-semibold leading-snug">
                  {title}
                </h3>
              </div>
            ) : (
              <h3 className="text-card-foreground line-clamp-2 flex-1 text-sm font-semibold leading-snug">
                {title}
              </h3>
            )}

            <div className="-mr-2 -mt-1 flex shrink-0 items-center">
              {enableActions && (
                <Button
                  aria-label={t('articles.card.actions.toggleFavorite')}
                  className="relative size-9 after:absolute after:-inset-1 after:content-['']"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleUpdateLink?.(id, { isFavorite: !link.isFavorite });
                  }}
                  size="icon"
                  variant="ghost"
                >
                  <StarIcon
                    className={link.isFavorite ? 'fill-yellow-500' : 'text-muted-foreground'}
                    size={14}
                    weight={link.isFavorite ? 'fill' : 'bold'}
                  />
                </Button>
              )}
              {enableActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        aria-label={t('articles.card.actions.more')}
                        className="relative size-9 after:absolute after:-inset-1 after:content-['']"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        size="icon"
                        variant="ghost"
                      />
                    }
                  >
                    <DotsThreeIcon size={14} />
                  </DropdownMenuTrigger>
                  <ArticleDropdownMenu
                    handleDeleteLink={handleDeleteLink}
                    handleRefetchLink={handleRefetchLink}
                    handleUpdateLink={handleUpdateLink}
                    link={link}
                    onEditTagsOpen={() => setIsEditTagsOpen(true)}
                  />
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Excerpt */}
          {isLoading ? (
            <Skeleton className="h-3 w-4/5 rounded-md" />
          ) : (
            <p className="text-muted-foreground line-clamp-1 text-xs">{excerpt}</p>
          )}

          {/* Meta row: priority · source · time · progress · tags */}
          {isLoading ? (
            <Skeleton className="h-3 w-28 rounded-md" />
          ) : (
            <div className="mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              {priority === 'low-priority' && (
                <>
                  <Badge
                    className="gap-0.5 rounded-full px-1.5 py-0 text-xs font-medium"
                    variant="success"
                  >
                    <ClockIcon size={10} weight="fill" />
                    Low
                  </Badge>
                  <span aria-hidden className="text-zinc-300 dark:text-zinc-600">
                    ·
                  </span>
                </>
              )}
              {priority === 'this-week' && (
                <>
                  <Badge
                    className="gap-0.5 rounded-full px-1.5 py-0 text-xs font-medium"
                    variant="warning"
                  >
                    <CalendarIcon size={10} weight="fill" />
                    This Week
                  </Badge>
                  <span aria-hidden className="text-zinc-300 dark:text-zinc-600">
                    ·
                  </span>
                </>
              )}
              {priority === 'must-read' && (
                <>
                  <Badge
                    className="gap-0.5 rounded-full px-1.5 py-0 text-xs font-medium"
                    variant="danger"
                  >
                    <FlameIcon size={10} weight="fill" />
                    Must Read
                  </Badge>
                  <span aria-hidden className="text-zinc-300 dark:text-zinc-600">
                    ·
                  </span>
                </>
              )}
              <span className="flex min-w-0 items-center gap-1">
                {favicon && <img alt="" className="size-3 shrink-0" src={favicon} />}
                <span className="max-w-24 truncate">{getUrlName(url)}</span>
              </span>
              <span aria-hidden className="text-zinc-300 dark:text-zinc-600">
                ·
              </span>
              <span className="whitespace-nowrap">{Math.ceil(readingTime / 60)} min</span>
              {readingProgress > 0 && (
                <>
                  <span aria-hidden className="text-zinc-300 dark:text-zinc-600">
                    ·
                  </span>
                  <span className="text-primary whitespace-nowrap font-medium tabular-nums">
                    {Math.round(readingProgress)}%
                  </span>
                </>
              )}
              {tags.length > 0 && (
                <>
                  <span aria-hidden className="text-zinc-300 dark:text-zinc-600">
                    ·
                  </span>
                  <Tag
                    className="px-1.5 py-0 text-xs"
                    tag={getDisplayTag(tags[0]!, tagColorByGroupId)}
                  />
                  {tags.length > 1 && (
                    <span className="text-muted-foreground">+{tags.length - 1}</span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ambient reading progress bar at card bottom */}
      {!isLoading && readingProgress > 0 && (
        <div className="bg-muted h-0.5 w-full overflow-hidden">
          <div
            className="bg-primary h-full w-full origin-left motion-safe:transition-[transform] motion-safe:duration-500 motion-safe:[transition-timing-function:cubic-bezier(0.215,0.61,0.355,1)]"
            style={{ transform: `scaleX(${readingProgress / 100})` }}
          />
        </div>
      )}

      <EditTagsDialog
        initialTags={tags}
        linkId={id}
        onOpenChange={setIsEditTagsOpen}
        open={isEditTagsOpen}
      />
    </div>
  );
}

function ListCardDesktop({
  handleDeleteLink,
  handleRefetchLink,
  handleUpdateLink,
  enableActions,
  link,
  tagGroups
}: ArticleCardProps) {
  const { t } = useTranslation('common');
  const {
    coverImage,
    excerpt,
    favicon,
    id,
    priority,
    processingStatus,
    readingProgress,
    readingTime,
    tags,
    title,
    url
  } = link;

  const [isEditTagsOpen, setIsEditTagsOpen] = useState(false);
  const tagColorByGroupId = useTagColorByGroupId(tagGroups);

  return (
    <div className="group bg-card text-card-foreground border-border relative flex w-full flex-row items-start gap-6 rounded-4xl border p-6 shadow transition-all hover:cursor-pointer hover:shadow-lg">
      {processingStatus === 'pending' || processingStatus === 'processing' ? (
        <Skeleton className="h-30 w-30 self-center rounded-md object-cover" />
      ) : (
        <div className="relative aspect-video w-full overflow-hidden md:aspect-square md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={t('articles.card.actions.more')}
                  className="bg-card absolute top-2 right-2 z-10 size-7 border p-1 transition-all duration-200 md:hidden"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  size="icon"
                  variant="ghost"
                />
              }
            >
              <DotsThreeIcon size={24} />
            </DropdownMenuTrigger>
            <ArticleDropdownMenu
              handleDeleteLink={handleDeleteLink}
              handleRefetchLink={handleRefetchLink}
              handleUpdateLink={handleUpdateLink}
              link={link}
              onEditTagsOpen={() => setIsEditTagsOpen(true)}
            />
          </DropdownMenu>
          {coverImage ? (
            <img
              alt="Article Cover"
              className="size-full self-center rounded-xl object-cover md:h-30 md:w-30"
              height={120}
              src={coverImage || undefined}
              width={120}
            />
          ) : (
            <div className="from-muted/50 to-muted flex aspect-video w-full flex-col items-center justify-center rounded-md bg-linear-to-br md:h-30 md:w-30 dark:bg-zinc-600/80">
              <div className="bg-background flex size-14 items-center justify-center rounded-xl shadow-sm">
                {favicon ? (
                  <img
                    alt="Article Source Icon"
                    aria-hidden="true"
                    className="size-8"
                    height={32}
                    src={favicon || undefined}
                    width={32}
                  />
                ) : (
                  <BookmarkSimpleIcon size={32} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex w-full shrink grow basis-0 flex-col space-y-1 md:min-h-30 md:space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="line-clamp-1 flex-1 text-base font-semibold md:text-lg">{title}</h2>
        </div>
        <div className="flex max-w-170 flex-col gap-2">
          {processingStatus === 'pending' || processingStatus === 'processing' ? (
            <>
              <Skeleton className="h-4 w-100" />
              <Skeleton className="h-4 w-90" />
            </>
          ) : (
            <p className="text-card-foreground/70 line-clamp-2 min-h-12 w-full text-base font-normal">
              {excerpt}
            </p>
          )}
          {processingStatus === 'pending' || processingStatus === 'processing' ? (
            <Skeleton className="h-4 w-60" />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-card-foreground text-sm font-normal md:text-base">
                <span className="flex items-center gap-2 font-medium">
                  {favicon && (
                    <img
                      alt=""
                      aria-hidden="true"
                      className="size-5"
                      height={20}
                      src={favicon}
                      width={20}
                    />
                  )}{' '}
                  {getUrlName(url)}
                </span>
              </p>
              <div aria-hidden="true" className="bg-foreground size-1 rounded-full" />
              <p className="text-card-foreground inline-flex items-center text-sm font-medium md:text-base">
                <ClockIcon className="mr-2" size={16} weight="bold" />
                {formatReadingTime(readingTime as number)}
              </p>
              {tags && tags.length > 0 && (
                <div className="hidden gap-2 md:flex md:items-center">
                  <div aria-hidden="true" className="bg-foreground size-1 rounded-full" />
                  {tags.slice(0, 3).map((tag) => {
                    return <Tag key={tag.name} tag={getDisplayTag(tag, tagColorByGroupId)} />;
                  })}
                  {tags.length > 3 && (
                    <span className="text-sm text-zinc-600">
                      {t('articles.card.moreCount', { count: tags.length - 3 })}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="hidden w-30 flex-col gap-4 self-end md:flex">
        {priority === 'low-priority' && (
          <Badge
            className="flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
            variant="success"
          >
            <ClockIcon weight="fill" />
            Low Priority
          </Badge>
        )}
        {priority === 'this-week' && (
          <Badge
            className="flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
            variant="warning"
          >
            <ClockIcon weight="fill" />
            This Week
          </Badge>
        )}
        {priority === 'must-read' && (
          <Badge
            className="flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
            variant="danger"
          >
            <FlameIcon weight="fill" />
            Must Read
          </Badge>
        )}
        {readingProgress > 0 && (
          <div className="w-full">
            <Progress value={readingProgress}>
              <ProgressValue />
            </Progress>
          </div>
        )}
      </div>

      {enableActions && (
        <div className="hidden md:block">
          <div className="absolute top-6 right-6 z-10">
            <div className="relative flex h-8 items-center gap-2">
              <div className="bg-background flex items-center gap-2">
                {enableActions && (
                  <Button
                    aria-label={link.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    className="border size-9 rounded-full transition-colors hover:bg-zinc-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleUpdateLink?.(id, {
                        isFavorite: !link.isFavorite
                      });
                    }}
                    size="icon"
                    variant="ghost"
                  >
                    <StarIcon
                      className={link.isFavorite ? 'fill-yellow-500' : 'text-gray-500'}
                      size={16}
                      weight={link.isFavorite ? 'fill' : 'bold'}
                    />
                  </Button>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      aria-label={t('articles.card.actions.more')}
                      className="bg-background border-border size-9 rounded-full border p-4 transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      size="icon"
                      variant="ghost"
                    />
                  }
                >
                  <DotsThreeIcon size={16} />
                </DropdownMenuTrigger>
                <ArticleDropdownMenu
                  handleDeleteLink={handleDeleteLink}
                  handleRefetchLink={handleRefetchLink}
                  handleUpdateLink={handleUpdateLink}
                  link={link}
                  onEditTagsOpen={() => setIsEditTagsOpen(true)}
                />
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}

      <EditTagsDialog
        initialTags={tags}
        linkId={id}
        onOpenChange={setIsEditTagsOpen}
        open={isEditTagsOpen}
      />
    </div>
  );
}

function ListCard(props: ArticleCardProps) {
  const { isMobile } = useMediaQuery();

  if (isMobile) {
    return <ListCardCompact {...props} />;
  }

  return <ListCardDesktop {...props} />;
}
