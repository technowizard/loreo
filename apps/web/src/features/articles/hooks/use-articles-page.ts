import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { type ActiveFilters, useGetLinks } from '@/features/articles/api/get-links';
import { filterConfig } from '@/features/articles/constants/filter-config';

import { useDebounce } from '@/hooks/use-debounce';

import type { Tag } from '@/types/tags';

const filterTypeMap = new Map<string, string>();
filterConfig.status.forEach((f) => filterTypeMap.set(f.id, 'status'));
filterConfig.priority.forEach((f) => filterTypeMap.set(f.id, 'priority'));
filterConfig.readLength.forEach((f) => filterTypeMap.set(f.id, 'readLength'));
filterConfig.sort.forEach((f) => filterTypeMap.set(f.id, 'sort'));

interface AddArticleModal {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  formData: { url: string; tags: Tag[] };
  onChange: (field: string, value: string | Tag[]) => void;
  reset: () => void;
}

export interface UseArticlesPageReturn {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilters: ActiveFilters;
  setFilter: (filterId: string, type: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  cardView: 'grid' | 'list';
  setCardView: (view: 'grid' | 'list') => void;
  isFilterModalOpen: boolean;
  openFilterModal: () => void;
  closeFilterModal: () => void;
  addArticleModal: AddArticleModal;
  articles: ReturnType<typeof useGetLinks>['data'];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
}

export function useArticlesPage(): UseArticlesPageReturn {
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

  // --- Search ---
  // Local state owns the input value. Debounced value writes to URL (one direction
  // only — eliminates the bidirectional useEffect sync from the original page).
  const [searchQuery, setSearchQuery] = useState(searchParams.q ?? '');
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    navigate({
      to: '/articles',
      search: (prev) => ({
        ...prev,
        q: debouncedSearch.trim().length >= 3 ? debouncedSearch : undefined
      })
    });
  }, [debouncedSearch, navigate]);

  // --- Active filters ---
  // Referentially stable object used as the React Query cache key.
  // q comes from debouncedSearch directly (not searchParams.q) so the
  // query updates in sync with the local input, not after a double-debounce.
  const hasAnySearchParams = Object.keys(searchParams).length > 0;

  const activeFilters = useMemo<ActiveFilters>(
    () => ({
      groups: searchParams.groups ?? '',
      filter: searchParams.filter ?? (hasAnySearchParams ? '' : 'all'),
      priority: searchParams.priority ?? '',
      q: debouncedSearch.trim().length >= 3 ? debouncedSearch : '',
      readLength: searchParams.readLength ?? '',
      sort: searchParams.sort ?? '',
      tags: searchParams.tags ?? ''
    }),
    [searchParams, hasAnySearchParams, debouncedSearch]
  );

  const hasActiveFilters = useMemo(
    () =>
      Object.entries(activeFilters).some(
        ([key, value]) => key !== 'q' && value && value !== 'all'
      ) || (activeFilters.q?.length ?? 0) > 0,
    [activeFilters]
  );

  // --- Filter actions ---
  const setFilter = useCallback(
    (filterId: string, type: string) => {
      const newParams: Record<string, string> = {};
      const filterType = filterTypeMap.get(filterId);

      if (filterType === 'status') newParams.filter = filterId;
      else if (filterType === 'priority') newParams.priority = filterId;
      else if (filterType === 'readLength') newParams.readLength = filterId;
      else if (filterType === 'sort') newParams.sort = filterId;
      else if (type === 'groups') newParams.groups = filterId;
      else if (type === 'tags') {
        const [groupId, tagName] = filterId.split(',');
        newParams.groups = groupId ?? '';
        newParams.tags = tagName ?? '';
      }

      navigate({ search: newParams, to: '/articles' });
      setIsFilterModalOpen(false);
    },
    [navigate]
  );

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    navigate({ search: {}, to: '/articles' });
  }, [navigate]);

  // --- UI state ---
  const [cardView, setCardView] = useState<'grid' | 'list'>('grid');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // --- Add article modal ---
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<{ url: string; tags: Tag[] }>({
    tags: [],
    url: ''
  });

  const addArticleModal = useMemo<AddArticleModal>(
    () => ({
      close: () => setShowModal(false),
      formData,
      isOpen: showModal,
      onChange: (field, value) => setFormData((prev) => ({ ...prev, [field]: value })),
      open: () => setShowModal(true),
      reset: () => setFormData({ tags: [], url: '' })
    }),
    [showModal, formData]
  );

  // --- Server data ---
  const getLinksQuery = useGetLinks({ filters: activeFilters });

  return {
    activeFilters,
    addArticleModal,
    articles: getLinksQuery.data,
    cardView,
    clearFilters,
    closeFilterModal: () => setIsFilterModalOpen(false),
    fetchNextPage: getLinksQuery.fetchNextPage,
    hasActiveFilters,
    hasNextPage: getLinksQuery.hasNextPage,
    isFetchingNextPage: getLinksQuery.isFetchingNextPage,
    isFilterModalOpen,
    isLoading: getLinksQuery.isLoading,
    onSearchChange: setSearchQuery,
    openFilterModal: () => setIsFilterModalOpen(true),
    searchQuery,
    setCardView,
    setFilter
  };
}
