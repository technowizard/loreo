import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

import type { UserSettings } from '@/types/settings';

export const updateSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  return apiClient.patch('auth/settings', settings).json<UserSettings>();
};

type UseUpdateSettingsOptions = { mutationConfig?: MutationConfig<typeof updateSettings> };

export const useUpdateSettings = ({ mutationConfig }: UseUpdateSettingsOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: updateSettings
  });
