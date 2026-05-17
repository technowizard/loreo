import { SpinnerIcon } from '@phosphor-icons/react';
import { useState } from 'react';

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
  const notifyError = useNotificationsStore.useError();
  const notifySuccess = useNotificationsStore.useSuccess();
  const [formData, setFormData] = useState(emptyForm);

  const hasChanges = Object.values(formData).some(Boolean);

  const updatePassword = useUpdatePassword({
    mutationConfig: {
      onError: (error) => notifyError(error.message),
      onSuccess: () => {
        setFormData(emptyForm);
        notifySuccess('Password updated');
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePassword.mutate(formData);
  };

  return (
    <SettingsSection
      description="Update your password to keep your account secure"
      title="Security"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field>
          <FieldLabel>Current Password</FieldLabel>
          <PasswordInput
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            placeholder="Enter current password"
            required
            value={formData.currentPassword}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>New Password</FieldLabel>
            <PasswordInput
              minLength={8}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="Enter new password"
              required
              value={formData.newPassword}
            />
          </Field>
          <Field>
            <FieldLabel>Confirm New Password</FieldLabel>
            <PasswordInput
              minLength={8}
              onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
              placeholder="Confirm new password"
              required
              value={formData.confirmNewPassword}
            />
          </Field>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-muted-foreground text-xs">
            Password must be at least 8 characters
          </span>
          <Button disabled={!hasChanges || updatePassword.isPending} size="sm" type="submit">
            {updatePassword.isPending && <SpinnerIcon className="mr-2 animate-spin" size={16} />}
            Update Password
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}
