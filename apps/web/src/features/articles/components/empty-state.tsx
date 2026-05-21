import {
  ArchiveIcon,
  BookOpenIcon,
  HighlighterIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  StarIcon
} from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  filter: string;
  hasSearch: boolean;
  isDemo?: boolean;
  onAddArticle: () => void;
}

export function EmptyState({ filter, hasSearch, isDemo = false, onAddArticle }: EmptyStateProps) {
  const shouldReduceMotion = useReducedMotion();
  const { t } = useTranslation('common');

  const getEmptyStateContent = () => {
    if (hasSearch) {
      return {
        action: t('articles.empty.clearSearch'),
        description: t('articles.empty.noResultsDescription'),
        icon: MagnifyingGlassIcon,
        title: t('articles.empty.noResultsTitle')
      };
    }

    switch (filter) {
      case 'favorites':
        return {
          action: t('articles.empty.browseArticles'),
          description: t('articles.empty.noFavoritesDescription'),
          icon: StarIcon,
          title: t('articles.empty.noFavoritesTitle')
        };
      case 'archived':
        return {
          description: t('articles.empty.noArchivedDescription'),
          icon: ArchiveIcon,
          title: t('articles.empty.noArchivedTitle')
        };
      case 'highlights':
        return {
          description: t('articles.empty.noHighlightsDescription'),
          icon: HighlighterIcon,
          title: t('articles.empty.noHighlightsTitle')
        };
      default:
        return {
          action: t('articles.empty.saveFirstArticle'),
          description: t('articles.empty.emptyLibraryDescription'),
          icon: BookOpenIcon,
          title: t('articles.empty.emptyLibraryTitle')
        };
    }
  };

  const content = getEmptyStateContent();
  const Icon = content.icon;

  return (
    <motion.div
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center px-4 py-16 text-center"
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
        className="relative mb-8"
        initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.8 }}
        transition={{
          delay: 0.1,
          duration: 0.5,
          stiffness: 100,
          type: 'spring'
        }}
      >
        <div className="bg-primary/10 border-primary-300 dark:border-primary-800 sepia-theme:border-sepia-300 flex h-24 w-24 items-center justify-center rounded-full border">
          <Icon className="text-primary-500 dark:text-primary-400 sepia-theme:text-sepia-500 h-12 w-12" />
        </div>
      </motion.div>

      <motion.div
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        className="max-w-md space-y-4"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold tracking-tight">{content.title}</h2>

        <p className="text-muted-foreground leading-relaxed">{content.description}</p>
      </motion.div>

      {content.action && (
        <motion.div
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          className="mt-8"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Button className="group" disabled={isDemo} onClick={onAddArticle} size="lg">
            <PlusIcon className="mr-2 h-4 w-4 transition-transform duration-200 motion-safe:group-hover:rotate-90" />
            {content.action}
          </Button>
        </motion.div>
      )}

      {!hasSearch && filter === 'all' && (
        <motion.div
          animate={shouldReduceMotion ? undefined : { opacity: 1 }}
          className="mt-12 max-w-2xl text-left"
          initial={shouldReduceMotion ? undefined : { opacity: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h3 className="text-muted-foreground mb-3 text-sm font-medium tracking-wider uppercase">
            {t('articles.empty.gettingStartedTips')}
          </h3>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div className="flex items-start space-x-3">
              <div className="bg-primary-100 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                <span className="text-primary text-xs font-bold">1</span>
              </div>
              <p className="text-muted-foreground">{t('articles.empty.tip1')}</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary-100 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                <span className="text-primary text-xs font-bold">2</span>
              </div>
              <p className="text-muted-foreground">{t('articles.empty.tip2')}</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary-100 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                <span className="text-primary text-xs font-bold">3</span>
              </div>
              <p className="text-muted-foreground">{t('articles.empty.tip3')}</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary-100 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                <span className="text-primary text-xs font-bold">4</span>
              </div>
              <p className="text-muted-foreground">{t('articles.empty.tip4')}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
