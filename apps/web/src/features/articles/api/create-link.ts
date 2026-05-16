import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { homeKeys } from '@/features/home/api/query-keys';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { CreateLinkResponse } from '@/types/links';

import { linkKeys } from './query-keys';

export const createLinkBodySchema = z.object({
  url: z.url(),
  tags: z
    .array(
      z.object({
        groupId: z.string(),
        name: z.string()
      })
    )
    .optional()
});

export type CreateLinkBody = z.infer<typeof createLinkBodySchema>;

export const createLink = async (body: CreateLinkBody): Promise<CreateLinkResponse> => {
  const response = await apiClient.post('links', body);

  return response.json();
};

type UseCreateLinkOptions = {
  mutationConfig?: MutationConfig<typeof createLink>;
};

export const useCreateLink = ({ mutationConfig }: UseCreateLinkOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: createLink,
    meta: { invalidates: [linkKeys.all, homeKeys.all] }
  });
