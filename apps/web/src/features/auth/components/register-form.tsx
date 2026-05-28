import { SpinnerIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { cn } from '@/lib/utils';

import { useNotificationsStore } from '@/stores/notifications';

import { authKeys } from '../api/query-keys';
import { type RegisterInput, useRegister } from '../api/register';

export function RegisterForm({ className, ...props }: React.ComponentProps<'form'>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notifyError = useNotificationsStore.useError();
  const notifySuccess = useNotificationsStore.useSuccess();

  const register = useRegister({
    mutationConfig: {
      onError: (error: unknown) => {
        if (error instanceof Error) {
          notifyError(error.message);
        } else {
          notifyError(t('register.genericError'));
        }
      },
      onSuccess: (user) => {
        queryClient.setQueryData(authKeys.user(), user);

        notifySuccess(t('register.success'));

        navigate({ to: '/' });
      }
    }
  });

  const [formData, setFormData] = useState<RegisterInput>({
    confirmPassword: '',
    email: '',
    name: '',
    password: ''
  });

  const onSubmit = (data: RegisterInput) => {
    register.mutate(data);
  };

  const handleLogin = (event: React.SubmitEvent) => {
    event.preventDefault();

    onSubmit(formData);
  };

  return (
    <form className={cn('flex flex-col gap-6', className)} {...props} onSubmit={handleLogin}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">{t('register.title')}</h1>
        <p className="text-muted-foreground text-balance text-sm">{t('register.description')}</p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-3">
          <Label htmlFor="name">{t('register.name')}</Label>
          <Input
            id="name"
            name="name"
            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
            placeholder={t('register.namePlaceholder')}
            required
            value={formData.name}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="email">{t('register.email')}</Label>
          <Input
            id="email"
            name="email"
            onChange={(event) => setFormData({ ...formData, email: event.target.value })}
            placeholder={t('register.emailPlaceholder')}
            required
            type="email"
            value={formData.email}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">{t('register.password')}</Label>
          <Input
            id="password"
            name="password"
            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
            required
            type="password"
            value={formData.password}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="confirmPassword">{t('register.confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })}
            required
            type="password"
            value={formData.confirmPassword}
          />
        </div>
        <Button className="w-full" disabled={register.isPending} type="submit">
          {register.isPending && <SpinnerIcon className="mr-2 animate-spin" size={16} />}
          {t('register.createAccount')}
        </Button>
      </div>
      <div className="text-center text-sm">
        {t('register.alreadyHaveAccount')}{' '}
        <button
          className="underline underline-offset-4"
          onClick={() => navigate({ to: '/login' })}
          type="button"
        >
          {t('register.signIn')}
        </button>
      </div>
    </form>
  );
}
