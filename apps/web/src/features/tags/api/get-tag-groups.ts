import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { TagGroup } from '@/types/tags';

import { tagsKeys } from './query-keys';

const getTagGroups = async () => {
  const response = await apiClient.get('tags/groups');

  return response.json<ApiResult<TagGroup[]>>();
};

export const getTagGroupsQueryOptions = () => {
  return queryOptions({
    queryFn: getTagGroups,
    queryKey: tagsKeys.groups()
  });
};

type UseGetTagGroupsOptions = {
  queryConfig?: QueryConfig<typeof getTagGroupsQueryOptions>;
};

export const useGetTagGroups = ({ queryConfig }: UseGetTagGroupsOptions = {}) => {
  return useQuery({
    ...getTagGroupsQueryOptions(),
    ...queryConfig
  });
};
