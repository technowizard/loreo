import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Skeleton } from '@/components/ui/skeleton';
import { getRecentlyCompletedLinkIds } from '@/features/articles/utils/get-completed-link-ids';

import { useDeleteLink } from '@/features/articles/api/delete-link';
import { getLinkQueryOptions } from '@/features/articles/api/get-link';
import { useGetLinks } from '@/features/articles/api/get-links';
import { useRefetchLink } from '@/features/articles/api/refetch-link';
import { useUpdateLink } from '@/features/articles/api/update-link';
import { AddArticleDialog } from '@/features/articles/components/add-article-dialog';
import { ArticleCard } from '@/features/articles/components/article-card';
import { ArticlesToolbar } from '@/features/articles/components/articles-toolbar';
import { EmptyState } from '@/features/articles/components/empty-state';
import { FilterSidebar } from '@/features/articles/components/filter-sidebar';
import { InfiniteScrollLoader } from '@/features/articles/components/infinite-scroll-loader';
import { filterConfig } from '@/features/articles/constants/filter-config';
import { useGetTagGroups } from '@/features/tags/api/get-tag-groups';
import { useGetTags } from '@/features/tags/api/get-tags';

import { useDebounce } from '@/hooks/use-debounce';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useThemeConfig } from '@/hooks/use-theme-config';

import { cn } from '@/lib/utils';

import { useNotificationsStore } from '@/stores/notifications';

import type { StreamlinedLink, UpdateLinkBody } from '@/types/links';
import type { Tag, TagGroup } from '@/types/tags';

const filterTypeMap = new Map<string, string>();
filterConfig.status.forEach((f) => filterTypeMap.set(f.id, 'status'));
filterConfig.priority.forEach((f) => filterTypeMap.set(f.id, 'priority'));
filterConfig.readLength.forEach((f) => filterTypeMap.set(f.id, 'readLength'));
filterConfig.sort.forEach((f) => filterTypeMap.set(f.id, 'sort'));

function ArticleListSkeleton() {
  return Array.from({ length: 5 }).map((_, index) => (
    <Skeleton className="h-70 w-full md:h-42.5" key={index} />
  ));
}

function ArticlesPage() {
  const { isDesktop, isMobile, isTablet } = useMediaQuery();
  const queryClient = useQueryClient();
  const notifySuccess = useNotificationsStore.useSuccess();
  const { t } = useTranslation('common');

  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as {
    groups?: string;
    filter?: string;
    priority?: string;
    q?: string;
    readLength?: string;
    sort?: string;
    tags?: string;
  };

  const [openFilterModal, setOpenFilterModal] = useState(false);
  const { articleCardView, toggleArticleCardView } = useThemeConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddArticleOpen, setIsAddArticleOpen] = useState(false);
  const [addArticleFormData, setAddArticleFormData] = useState<{
    tags: Tag[];
    url: string;
  }>({
    tags: [],
    url: ''
  });

  const addArticleModal = useMemo(
    () => ({
      close: () => setIsAddArticleOpen(false),
      formData: addArticleFormData,
      isOpen: isAddArticleOpen,
      onChange: (field: string, value: string | Tag[]) =>
        setAddArticleFormData((prev) => ({ ...prev, [field]: value })),
      open: () => setIsAddArticleOpen(true),
      reset: () => setAddArticleFormData({ tags: [], url: '' })
    }),
    [isAddArticleOpen, addArticleFormData]
  );

  const hasAnySearchParams = Object.keys(searchParams).length > 0;

  const activeFilter = useMemo(
    () => ({
      groups: searchParams.groups || '',
      filter: searchParams.filter || (hasAnySearchParams ? '' : 'all'),
      priority: searchParams.priority || '',
      q: searchParams.q || '',
      readLength: searchParams.readLength || '',
      sort: searchParams.sort || '',
      tags: searchParams.tags || ''
    }),
    [searchParams, hasAnySearchParams]
  );

  useEffect(() => {
    setSearchQuery(searchParams.q || '');
  }, [searchParams.q]);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const newSearchParams: {
      groups?: string;
      filter?: string;
      priority?: string;
      q?: string;
      readLength?: string;
      sort?: string;
      tags?: string;
    } = { ...searchParams };

    if (debouncedSearchQuery.trim().length >= 3) {
      newSearchParams.q = debouncedSearchQuery;
    } else {
      delete newSearchParams.q;
    }

    navigate({ search: newSearchParams, to: '/articles' });
  }, [debouncedSearchQuery, navigate, searchParams]);

  const infiniteLinksQuery = useGetLinks({ filters: activeFilter });
  const tagsQuery = useGetTags();
  const tagGroupsQuery = useGetTagGroups();
  const previousLinksRef = useRef<Array<Pick<StreamlinedLink, 'id' | 'processingStatus'>>>([]);

  const updateLinkMutation = useUpdateLink({
    mutationConfig: {
      onMutate: () =>
        toast.loading(t('articles.toasts.updating'), {
          position: 'top-right',
          richColors: true
        }),
      onSuccess: () => {
        toast.dismiss();
        notifySuccess(t('articles.toasts.linkUpdated'));
      }
    }
  });

  const deleteLinkMutation = useDeleteLink({
    mutationConfig: {
      onMutate: () =>
        toast.loading(t('articles.toasts.deletingLink'), {
          position: 'top-right',
          richColors: true
        }),
      onSuccess: () => {
        toast.dismiss();
        notifySuccess(t('articles.toasts.linkDeleted'));
      }
    }
  });

  const refetchLinkMutation = useRefetchLink({
    mutationConfig: {
      onMutate: () =>
        toast.loading(t('articles.toasts.reprocessing'), {
          position: 'top-right',
          richColors: true
        }),
      onSuccess: () => {
        toast.dismiss();
        notifySuccess(t('articles.toasts.queuedForReprocessing'));
      }
    }
  });

  const handleUpdateLink = useCallback(
    (linkId: string, body: UpdateLinkBody) => updateLinkMutation.mutate({ body, linkId }),
    [updateLinkMutation]
  );

  const handleDeleteLink = useCallback(
    (linkId: string) => deleteLinkMutation.mutate({ id: linkId }),
    [deleteLinkMutation]
  );

  const handleRefetchLink = useCallback(
    (id: string) => refetchLinkMutation.mutate({ id }),
    [refetchLinkMutation]
  );

  const links = infiniteLinksQuery.data;
  const tags = tagsQuery.data?.result;
  const tagGroups = tagGroupsQuery.data?.result;

  useEffect(() => {
    if (!links?.length) {
      previousLinksRef.current = [];
      return;
    }

    const recentlyCompletedLinkIds = getRecentlyCompletedLinkIds(previousLinksRef.current, links);

    if (recentlyCompletedLinkIds.length > 0) {
      void Promise.all(
        recentlyCompletedLinkIds.map(async (id) => {
          await queryClient.invalidateQueries({
            queryKey: getLinkQueryOptions(id).queryKey
          });
          await queryClient.prefetchQuery(getLinkQueryOptions(id));
        })
      );
    }

    previousLinksRef.current = links.map(({ id, processingStatus }) => ({
      id,
      processingStatus
    }));
  }, [links, queryClient]);

  const groupedTags = useMemo(() => {
    const groupMap = tagGroups?.reduce(
      (acc, cat) => {
        acc[cat.id] = { ...cat, tags: [] };
        return acc;
      },
      {} as Record<string, TagGroup & { tags: Tag[] }>
    );

    if (!groupMap) {
      return [];
    }

    tags?.forEach((tag) => {
      if (groupMap[tag.groupId]) {
        groupMap[tag.groupId]?.tags.push(tag);
      }
    });

    return Object.values(groupMap).filter((cat) => cat.tags.length > 0);
  }, [tagGroups, tags]);

  const currentFilterInfo = useMemo(() => {
    if (activeFilter.filter) {
      return filterConfig.status.find((f) => f.id === activeFilter.filter);
    }
    if (activeFilter.priority) {
      return filterConfig.priority.find((f) => f.id === activeFilter.priority);
    }
    if (activeFilter.readLength) {
      return filterConfig.readLength.find((f) => f.id === activeFilter.readLength);
    }
    if (activeFilter.sort) {
      return filterConfig.sort.find((f) => f.id === activeFilter.sort);
    }
    if (activeFilter.groups) {
      const category = groupedTags.find((cat) => cat.id === activeFilter.groups);
      if (category) {
        return {
          description: category.description || `Articles in ${category.name} group`,
          id: category.id,
          name: category.name,
          title: `Group: ${category.name}`
        };
      }
    }
    if (tags && activeFilter.tags) {
      const tag = tags.find((t) => t.name === activeFilter.tags);
      if (tag) {
        return {
          description: `Articles tagged with "${tag.name}"`,
          id: tag.name,
          name: tag.name,
          title: `Tag: ${tag.name}`
        };
      }
    }
    return filterConfig.status[0];
  }, [activeFilter, groupedTags, tags]);

  const handleFilterClick = useCallback(
    (filterId: string, type: string) => {
      const newSearchParams: {
        groups?: string;
        filter?: string;
        priority?: string;
        readLength?: string;
        sort?: string;
        tags?: string;
      } = {};

      const filterType = filterTypeMap.get(filterId);

      if (filterType === 'status') {
        newSearchParams.filter = filterId;
      } else if (filterType === 'priority') {
        newSearchParams.priority = filterId;
      } else if (filterType === 'readLength') {
        newSearchParams.readLength = filterId;
      } else if (filterType === 'sort') {
        newSearchParams.sort = filterId;
      } else if (type === 'groups') {
        newSearchParams.groups = filterId;
      } else if (type === 'tags') {
        const [groupId, tagName] = filterId.split(',');
        newSearchParams.groups = groupId;
        newSearchParams.tags = tagName;
      }

      navigate({ search: newSearchParams, to: '/articles' });

      if (isMobile || isTablet) {
        setOpenFilterModal(false);
      }
    },
    [isMobile, isTablet, navigate]
  );

  const handleNavigateToTagManagement = useCallback(() => {
    navigate({ to: '/manage-tags' });
  }, [navigate]);

  const filterContentProps = useMemo(
    () => ({
      activeFilter,
      groupedTags,
      onFilterClick: handleFilterClick,
      onNavigateToTagManagement: handleNavigateToTagManagement
    }),
    [activeFilter, groupedTags, handleFilterClick, handleNavigateToTagManagement]
  );

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-start gap-2">
        {isDesktop && <FilterSidebar {...filterContentProps} />}
        <div className="flex w-full flex-col space-y-4">
          <ArticlesToolbar
            articleCardView={articleCardView}
            currentFilterInfo={currentFilterInfo}
            filterContentProps={filterContentProps}
            isMobile={isMobile}
            isTablet={isTablet}
            onAddArticle={addArticleModal.open}
            onArticleCardViewChange={toggleArticleCardView}
            onSearchChange={setSearchQuery}
            onSearchClear={() => setSearchQuery('')}
            openFilterModal={openFilterModal}
            searchQuery={searchQuery}
            setOpenFilterModal={setOpenFilterModal}
          />

          {infiniteLinksQuery.isLoading && <ArticleListSkeleton />}

          <div
            className={cn(
              'grid gap-4',
              articleCardView === 'grid' ? 'sm:grid-cols-2' : 'sm:grid-cols-1'
            )}
          >
            {infiniteLinksQuery.isLoading ? (
              <ArticleListSkeleton />
            ) : links && links.length > 0 ? (
              links.map((link) => (
                <Link
                  className="grid"
                  from="/"
                  key={link.id}
                  params={{ id: link.id }}
                  to="/articles/$id"
                >
                  <ArticleCard
                    handleDeleteLink={handleDeleteLink}
                    handleRefetchLink={handleRefetchLink}
                    handleUpdateLink={handleUpdateLink}
                    link={link}
                    tagGroups={tagGroups}
                    variant={articleCardView}
                  />
                </Link>
              ))
            ) : (
              <div className="col-span-2">
                <EmptyState
                  filter={activeFilter.filter}
                  hasSearch={!!activeFilter.q}
                  onAddArticle={addArticleModal.open}
                />
              </div>
            )}
          </div>

          <InfiniteScrollLoader
            articleCardView={articleCardView}
            hasNextPage={infiniteLinksQuery.hasNextPage}
            isFetchingNextPage={infiniteLinksQuery.isFetchingNextPage}
            onLoadMore={infiniteLinksQuery.fetchNextPage}
          />
        </div>
      </div>

      <AddArticleDialog
        formData={addArticleModal.formData}
        isMobile={isMobile}
        onClose={addArticleModal.close}
        onFormChange={addArticleModal.onChange}
        onReset={addArticleModal.reset}
        open={addArticleModal.isOpen}
        tagGroups={tagGroups}
        tags={tags}
      />
    </div>
  );
}

export default ArticlesPage;
