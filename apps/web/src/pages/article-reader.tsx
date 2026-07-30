import { ArchiveIcon, CheckIcon, ClockIcon, CopyIcon, StarIcon } from '@phosphor-icons/react';
import { Link, useParams, useRouter } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ReaderLayout from '@/components/layouts/reader';
import { Button } from '@/components/ui/button';
import Tag from '@/components/ui/tag';

import { useGetLink } from '@/features/articles/api/get-link';
import { useGetUpcomingArticles } from '@/features/articles/api/get-upcoming-articles';
import { updateLinkKeepalive } from '@/features/articles/api/update-link';
import { ArticleCard } from '@/features/articles/components/article-card';
import ArticleTypography from '@/features/reader/components/article-typography';
import FloatingProgressIndicator from '@/features/reader/components/floating-progress-indicator';
import { ReaderContent } from '@/features/reader/components/reader-content';
import ReaderSkeleton from '@/features/reader/components/reader-skeleton';
import ResumePositionBanner from '@/features/reader/components/resume-position-banner';
import useProgressIndicator from '@/features/reader/hooks/use-progress-indicator';
import { useReaderActions } from '@/features/reader/hooks/use-reader-actions';
import { useReadingSession } from '@/features/reader/hooks/use-reading-session';
import { useGetTagGroups } from '@/features/tags/api/get-tag-groups';

import { env } from '@/lib/env';
import { cn, formatReadingTime, getUrlName } from '@/lib/utils';

const DEFAULT_TAG_COLOR = '#6B7280';

function ArticleReaderPage() {
  const { t } = useTranslation();
  const id = useParams({ from: '/_protected/articles/$id' }).id;

  const linkQuery = useGetLink({ linkId: id });
  const upcomingArticlesQuery = useGetUpcomingArticles({ linkId: id });
  const tagGroupsQuery = useGetTagGroups();

  const article = linkQuery.data?.result;
  const upcomingArticles = upcomingArticlesQuery.data?.result;
  const tagGroups = tagGroupsQuery.data?.result;
  const tagColorByGroupId = useMemo(() => {
    return new Map(tagGroups?.map((group) => [group.id, group.color]) ?? []);
  }, [tagGroups]);

  const actions = useReaderActions(id, {
    disabled: env.isDemo,
    formatUpdateMessage: (body) => {
      if (body.readingProgress !== undefined || body.timeSpentReading !== undefined) return false;
      if (body.isFavorite !== undefined)
        return body.isFavorite
          ? t('reader.actions.markedAsFavorite')
          : t('reader.actions.removedFromFavorites');
      if (body.isArchived !== undefined && body.isRead !== undefined)
        return t('reader.actions.archivedAndMarkedRead');
      return t('reader.actions.linkUpdated');
    }
  });

  const { progress, restorablePosition, restore } = useReadingSession({
    linkId: id,
    link: article,
    onSaveProgress: env.isDemo ? () => {} : (data) => actions.updateLink(id, data),
    onSaveProgressOnUnload: env.isDemo
      ? () => {}
      : (data) => updateLinkKeepalive({ body: data, linkId: id })
  });

  const { shouldShowFloating } = useProgressIndicator();

  const handleFavoriteArticle = () => {
    if (!article) {
      return;
    }

    actions.updateLink(article.id, {
      isFavorite: !article.isFavorite
    });
  };

  const handleArchiveArticle = () => {
    if (!article) {
      return;
    }

    actions.updateLink(article.id, {
      isArchived: true,
      isRead: true
    });

    router.navigate({ to: '/articles' });
  };

  const handleCopyLink = async () => {
    if (!article) {
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(article.url);
    } else {
      // fallback for non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = article.url;
      document.body.append(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const router = useRouter();

  const [isCopied, setIsCopied] = useState(false);
  const [isPositionBannerDismissed, setIsPositionBannerDismissed] = useState(false);

  if (!article) {
    return (
      <ReaderLayout>
        <ReaderSkeleton />
      </ReaderLayout>
    );
  }

  return (
    <ReaderLayout
      highlights={article.highlights}
      onUpdateHighlight={actions.updateHighlight}
      onRemoveHighlight={actions.removeHighlight}
    >
      {shouldShowFloating && isPositionBannerDismissed && (
        <FloatingProgressIndicator
          onScrollTo={(targetProgress) => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo({
              behavior: 'smooth',
              top: scrollHeight * targetProgress
            });
          }}
          progress={progress}
          readingTime={article?.readingTime as number}
        />
      )}
      {restorablePosition !== null && !isPositionBannerDismissed && (
        <ResumePositionBanner
          onDismiss={() => setIsPositionBannerDismissed(true)}
          onRestore={() => {
            setIsPositionBannerDismissed(true);

            restore();
          }}
          progress={Math.round(restorablePosition.progress * 100)}
        />
      )}
      <h1 className="text-foreground mb-4 text-4xl leading-tight font-bold">{article.title}</h1>
      <p>{article.excerpt}</p>
      <div className="my-6 inline-flex items-center justify-between">
        <div className={cn('flex flex-col', article.tags.length > 0 && 'space-y-6')}>
          <div className="inline-flex items-center space-x-2">
            <div className="not-prose text-foreground text-sm font-semibold md:text-base">
              <span className="flex items-center gap-2">
                {article.favicon && <img alt="favicon" className="size-5" src={article.favicon} />}{' '}
                {getUrlName(article.url)}
              </span>
            </div>
            <div className="not-prose text-foreground text-sm font-semibold md:text-base">•</div>
            <div className="not-prose text-foreground inline-flex items-center text-sm font-semibold md:text-base">
              <ClockIcon className="mr-2" size={16} weight="bold" />
              {formatReadingTime(article.readingTime as number)}
            </div>
          </div>
          {article.tags.length > 0 && (
            <div className="inline-flex items-center space-x-2">
              {article.tags.slice(0, 3).map((tag) => {
                return (
                  <Tag
                    key={tag.name}
                    tag={{
                      color: tagColorByGroupId.get(tag.groupId) ?? DEFAULT_TAG_COLOR,
                      name: tag.name
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <hr className="mb-6" />

      <ArticleTypography>
        <ReaderContent
          articleHighlights={article.highlights}
          handleCreateHighlight={actions.createHighlight}
          handleRemoveHighlight={actions.removeHighlight}
          handleUpdateHighlight={actions.updateHighlight}
          textContent={article.content || ''}
        />
      </ArticleTypography>

      <hr className="mb-6" />

      <div className="flex flex-col space-y-4">
        <h3 className="text-xl font-bold">{t('reader.whatsNext')}</h3>
        <div className="flex flex-col space-y-4">
          {!env.isDemo && (
            <Button className="flex-1" onClick={handleFavoriteArticle}>
              <StarIcon
                className={cn('size-4', article.isFavorite && 'fill-yellow-500')}
                weight={article.isFavorite ? 'fill' : 'bold'}
              />
              {article.isFavorite ? t('reader.actions.favorited') : t('reader.actions.favorite')}
            </Button>
          )}
          <div className="inline-flex items-center space-x-2">
            {!env.isDemo && (
              <Button className="flex-1" onClick={handleArchiveArticle} variant="outline">
                <ArchiveIcon className="size-4" />
                {t('reader.actions.archiveAndMarkRead')}
              </Button>
            )}

            <Button
              className="flex-1"
              disabled={isCopied}
              onClick={handleCopyLink}
              variant="outline"
            >
              <div className="relative mr-4">
                <CopyIcon
                  className={cn(
                    'absolute -bottom-2 size-4 duration-200',
                    isCopied && 'scale-0 opacity-0 blur-[2px]'
                  )}
                />
                <CheckIcon
                  className={cn(
                    'absolute -bottom-2 size-4 duration-200',
                    !isCopied && 'scale-0 opacity-0 blur-[2px]'
                  )}
                />
              </div>
              {isCopied ? (
                <div className={cn('duration-200', !isCopied && 'scale-0 opacity-0 blur-[2px]')}>
                  Link Copied
                </div>
              ) : (
                <div className={cn('duration-200', isCopied && 'scale-0 opacity-0 blur-[2px]')}>
                  {t('reader.actions.copyLink')}
                </div>
              )}
            </Button>
          </div>
        </div>
        {upcomingArticles && upcomingArticles?.length > 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold">{t('reader.actions.upNext')}</h3>
            <div className="flex flex-col space-y-4">
              {upcomingArticles?.map((article) => (
                <Link key={article.id} params={{ id: article.id }} to="/articles/$id">
                  <ArticleCard
                    enableActions={false}
                    link={article}
                    tagGroups={tagGroups}
                    variant="list"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </ReaderLayout>
  );
}

export default ArticleReaderPage;
