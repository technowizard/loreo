import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { QueryConfig } from '@/lib/react-query';

import type { ApiResult } from '@/types/api';
import type { Link } from '@/types/links';

import { linkKeys } from './query-keys';

const getLink = async (linkId: string): Promise<ApiResult<Link>> => {
  const response = await apiClient.get(`links/${linkId}`);

  return response.json<ApiResult<Link>>();
};

export const getLinkQueryOptions = (linkId: string) => {
  return queryOptions({
    queryFn: () => getLink(linkId),
    queryKey: linkKeys.detail(linkId)
  });
};

type UseGetLinkOptions = {
  linkId: string;
  queryConfig?: QueryConfig<typeof getLinkQueryOptions>;
};

export const useGetLink = ({ linkId, queryConfig }: UseGetLinkOptions) => {
  return useQuery({ ...getLinkQueryOptions(linkId), ...queryConfig });
};
