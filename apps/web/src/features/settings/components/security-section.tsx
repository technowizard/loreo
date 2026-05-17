import { SpinnerIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';

import { useUpdatePassword } from '@/features/auth/api/update-password';

import { useNotificationsStore } from '@/stores/notifications';

import { SettingsSection } from './settings-section';

const emptyForm = {
  confirmNewPassword: '',
  currentPassword: '',
  newPassword: ''
};

export function SecuritySection() {
  const { t } = useTranslation('common');
  const notifyError = useNotificationsStore.useError();
  const notifySuccess = useNotificationsStore.useSuccess();
  const [formData, setFormData] = useState(emptyForm);

  const hasChanges = Object.values(formData).some(Boolean);

  const updatePassword = useUpdatePassword({
    mutationConfig: {
      onError: (error) => notifyError(error.message),
      onSuccess: () => {
        setFormData(emptyForm);
        notifySuccess(t('settings.security.toasts.passwordUpdated'));
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePassword.mutate(formData);
  };

  return (
    <SettingsSection
      description={t('settings.security.description')}
      title={t('settings.security.title')}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field>
          <FieldLabel>{t('settings.security.currentPasswordLabel')}</FieldLabel>
          <PasswordInput
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            placeholder={t('settings.security.currentPasswordPlaceholder')}
            required
            value={formData.currentPassword}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>{t('settings.security.newPasswordLabel')}</FieldLabel>
            <PasswordInput
              minLength={8}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder={t('settings.security.newPasswordPlaceholder')}
              required
              value={formData.newPassword}
            />
          </Field>
          <Field>
            <FieldLabel>{t('settings.security.confirmPasswordLabel')}</FieldLabel>
            <PasswordInput
              minLength={8}
              onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
              placeholder={t('settings.security.confirmPasswordPlaceholder')}
              required
              value={formData.confirmNewPassword}
            />
          </Field>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-muted-foreground text-xs">
            {t('settings.security.validationHint')}
          </span>
          <Button disabled={!hasChanges || updatePassword.isPending} size="sm" type="submit">
            {updatePassword.isPending && <SpinnerIcon className="mr-2 animate-spin" size={16} />}
            {t('settings.security.updatePassword')}
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}
