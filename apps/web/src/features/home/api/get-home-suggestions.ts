import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import type { ApiResult } from '@/types/api';
import type { HomeSuggestions } from '@/types/home';

import { homeKeys } from './query-keys';

export const getHomeSuggestions = async () => {
  return apiClient.get('home/suggestions').json<ApiResult<HomeSuggestions>>();
};

export const getHomeSuggestionsQueryOptions = () =>
  queryOptions({
    queryFn: getHomeSuggestions,
    queryKey: homeKeys.suggestions(),
    retry: false
  });

export const useGetHomeSuggestions = () => useQuery(getHomeSuggestionsQueryOptions());
