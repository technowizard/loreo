import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { StreamlinedLink } from '@/types/links';

import { linkKeys } from './query-keys';

const getUpcomingArticles = async (linkId: string): Promise<ApiResult<StreamlinedLink[]>> => {
  const response = await apiClient.get(`links/${linkId}/upcoming`);

  return response.json();
};

export const getUpcomingArticlesQueryOptions = (linkId: string) => {
  return queryOptions({
    queryFn: () => getUpcomingArticles(linkId),
    queryKey: linkKeys.upcoming(linkId)
  });
};

type UseGetUpcomingArticlesOptions = {
  linkId: string;
  queryConfig?: QueryConfig<typeof getUpcomingArticlesQueryOptions>;
};

export const useGetUpcomingArticles = ({ linkId, queryConfig }: UseGetUpcomingArticlesOptions) => {
  return useQuery({
    ...getUpcomingArticlesQueryOptions(linkId),
    ...queryConfig
  });
};
