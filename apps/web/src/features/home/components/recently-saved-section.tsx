import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

import { ArticleCard } from '@/features/articles/components/article-card';

import type { StreamlinedLink } from '@/types/links';

type Props = {
  articles: StreamlinedLink[] | undefined;
  isFirstTimeUser: boolean;
  isLoading: boolean;
};

export function RecentlySavedSection({ articles, isFirstTimeUser, isLoading }: Props) {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground text-xl font-bold">{t('home.recentlySaved')}</h1>
      <div className="flex flex-col gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton className="h-95 w-full md:h-42.5" key={i} />
          ))
        ) : isFirstTimeUser && (!articles || articles.length === 0) ? (
          <div className="border-border rounded-3xl border px-5 py-4">
            <p className="text-muted-foreground text-sm">{t('home.pasteUrlToSaveFirstArticle')}</p>
          </div>
        ) : (
          articles?.map((article) => (
            <Link key={article.id} params={{ id: article.id }} to="/articles/$id">
              <ArticleCard enableActions={false} link={article} variant="list" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
