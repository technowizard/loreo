import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';

type AvatarUploadResult = { avatar: string; url: string };

const uploadAvatar = async (file: File): Promise<AvatarUploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('auth/avatar', formData).json<AvatarUploadResult>();
};

type UseUploadAvatarOptions = { mutationConfig?: MutationConfig<typeof uploadAvatar> };

export const useUploadAvatar = ({ mutationConfig }: UseUploadAvatarOptions = {}) =>
  useMutation({
    ...mutationConfig,
    mutationFn: uploadAvatar
  });
