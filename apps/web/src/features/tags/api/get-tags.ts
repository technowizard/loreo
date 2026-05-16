import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { Tag } from '@/types/tags';

import { tagsKeys } from './query-keys';

const getTags = async (): Promise<ApiResult<Tag[]>> => {
  const response = await apiClient.get('tags');

  return response.json();
};

export const getTagsQueryOptions = () => {
  return queryOptions({
    queryKey: tagsKeys.lists(),
    queryFn: getTags
  });
};

type UseGetTagsOptions = {
  queryConfig?: QueryConfig<typeof getTagsQueryOptions>;
};

export const useGetTags = ({ queryConfig }: UseGetTagsOptions = {}) => {
  return useQuery({
    ...getTagsQueryOptions(),
    ...queryConfig
  });
};
