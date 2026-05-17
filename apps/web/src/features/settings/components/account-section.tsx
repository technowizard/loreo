import { SpinnerIcon } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';

import { useGetUser } from '@/features/auth/api/get-user';
import { authKeys } from '@/features/auth/api/query-keys';
import { useUpdateAccount } from '@/features/auth/api/update-account';
import { useUploadAvatar } from '@/features/auth/api/update-avatar';
import { useUpdateEmail } from '@/features/auth/api/update-email';

import { cn } from '@/lib/utils';

import { useNotificationsStore } from '@/stores/notifications';

import { SettingsSection } from './settings-section';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

// ease-out-cubic — matches the password section expansion easing
const easeOutCubic = 'cubic-bezier(0.215, 0.61, 0.355, 1)';

export function AccountSection() {
  const { data: user } = useGetUser();
  const notifyError = useNotificationsStore.useError();
  const notifySuccess = useNotificationsStore.useSuccess();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [emailPassword, setEmailPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (user && !initialized.current) {
      setName(user.result.name ?? '');
      setEmail(user.result.email);
      setAvatarPreview(user.result.avatar ?? null);
      initialized.current = true;
    }
  }, [user]);

  // Focus the password input after the expand animation starts
  useEffect(() => {
    if (!showPasswordField) return;
    const timer = setTimeout(() => passwordInputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [showPasswordField]);

  const originalName = user?.result.name ?? '';
  const originalEmail = user?.result.email ?? '';
  const isDirtyName = name !== originalName;
  const isDirtyEmail = email !== originalEmail && isValidEmail(email);
  const showSaveEmail = isDirtyEmail && !showPasswordField;

  const fallback =
    user?.result.name?.[0]?.toUpperCase() ?? user?.result.email?.[0]?.toUpperCase() ?? '?';

  const uploadAvatar = useUploadAvatar({
    mutationConfig: {
      meta: { invalidates: [authKeys.user()] },
      onError: (error) => notifyError(error.message),
      onSuccess: (data) => {
        setAvatarPreview(data.url);
        notifySuccess('Avatar updated');
      }
    }
  });

  const updateAccount = useUpdateAccount({
    mutationConfig: {
      meta: { invalidates: [authKeys.user()] },
      onError: (error) => notifyError(error.message),
      onSuccess: () => notifySuccess('Name updated')
    }
  });

  const updateEmail = useUpdateEmail({
    mutationConfig: {
      meta: { invalidates: [authKeys.user()] },
      onError: (error) => notifyError(error.message),
      onSuccess: () => {
        setShowPasswordField(false);
        setEmailPassword('');
        notifySuccess('Email updated');
      }
    }
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    uploadAvatar.mutate(file);
    e.target.value = '';
  };

  const handleCancelEmailEdit = () => {
    setShowPasswordField(false);
    setEmailPassword('');
    setEmail(originalEmail);
  };

  return (
    <SettingsSection description="Your personal information and profile details" title="Account">
      <div className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {avatarPreview && <AvatarImage src={avatarPreview} />}
            <AvatarFallback className="text-lg">{fallback}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <Button
              disabled={uploadAvatar.isPending}
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              variant="outline"
            >
              {uploadAvatar.isPending && <SpinnerIcon className="mr-2 animate-spin" size={16} />}
              Change Avatar
            </Button>
            <span className="text-muted-foreground text-xs">JPG or PNG. Max 2MB.</span>
          </div>
          <input
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleAvatarChange}
            ref={fileInputRef}
            type="file"
          />
        </div>

        {/* Name */}
        <Field>
          <FieldLabel>Name</FieldLabel>
          {/* Outer grid: input takes 1fr, button wrapper takes auto (content-sized) */}
          <div className="grid grid-cols-[1fr_auto]">
            <Input
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              type="text"
              value={name}
            />
            {/* Inner grid nested in auto column: 1fr here = button's natural width */}
            <div
              className={cn(
                'grid min-w-0 transition-[grid-template-columns] duration-150 motion-reduce:transition-none',
                isDirtyName ? 'grid-cols-[1fr]' : 'grid-cols-[0fr]'
              )}
              style={{ transitionTimingFunction: easeOutCubic }}
            >
              <div className="min-w-0 overflow-hidden">
                <div className="pl-2">
                  {isDirtyName && (
                    <Button
                      className="animate-in fade-in-0 zoom-in-95 duration-150 motion-reduce:animate-none"
                      disabled={updateAccount.isPending}
                      onClick={() => updateAccount.mutate({ name })}
                      size="sm"
                    >
                      {updateAccount.isPending ? (
                        <SpinnerIcon className="animate-spin" size={16} />
                      ) : (
                        'Save'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Field>

        {/* Email */}
        <div>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <div className="grid grid-cols-[1fr_auto]">
              <Input
                disabled={showPasswordField}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setShowPasswordField(false);
                  setEmailPassword('');
                }}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
              <div
                className={cn(
                  'grid min-w-0 transition-[grid-template-columns] duration-150 motion-reduce:transition-none',
                  showSaveEmail ? 'grid-cols-[1fr]' : 'grid-cols-[0fr]'
                )}
                style={{ transitionTimingFunction: easeOutCubic }}
              >
                <div className="min-w-0 overflow-hidden">
                  <div className="pl-2">
                    {showSaveEmail && (
                      <Button
                        className="animate-in fade-in-0 zoom-in-95 duration-150 motion-reduce:animate-none"
                        onClick={() => setShowPasswordField(true)}
                        size="sm"
                        variant="outline"
                      >
                        Save Email
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Field>

          {/* Animated password confirmation — grid-rows expand + opacity + translateY */}
          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none',
              showPasswordField ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            )}
            style={{ transitionTimingFunction: easeOutCubic }}
          >
            <div
              className={cn(
                'overflow-hidden transition-[opacity,transform] duration-200 motion-reduce:transition-none',
                showPasswordField ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
              )}
              style={{ transitionTimingFunction: easeOutCubic }}
            >
              <div className="space-y-3 pt-3">
                <Field>
                  <FieldLabel>Confirm with your current password</FieldLabel>
                  <PasswordInput
                    onChange={(e) => setEmailPassword(e.target.value)}
                    placeholder="Enter current password"
                    ref={passwordInputRef}
                    value={emailPassword}
                  />
                </Field>
                <div className="flex gap-2">
                  <Button
                    disabled={!emailPassword || updateEmail.isPending}
                    onClick={() =>
                      updateEmail.mutate({
                        newEmail: email,
                        currentPassword: emailPassword
                      })
                    }
                    size="sm"
                  >
                    {updateEmail.isPending ? (
                      <SpinnerIcon className="animate-spin" size={16} />
                    ) : (
                      'Confirm'
                    )}
                  </Button>
                  <Button onClick={handleCancelEmailEdit} size="sm" variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
