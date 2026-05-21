import { SpinnerIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

import { useNotificationsStore } from '@/stores/notifications';

import { type LoginInput, useLogin } from '../api/login';
import { authKeys } from '../api/query-keys';

export function LoginForm({ className, ...props }: React.ComponentProps<'form'>) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notifyError = useNotificationsStore.useError();
  const notifySuccess = useNotificationsStore.useSuccess();

  const login = useLogin({
    mutationConfig: {
      onError: () => {
        notifyError(t('login.invalidCredentials'));
      },
      onSuccess: (user) => {
        queryClient.setQueryData(authKeys.user(), user);

        notifySuccess(t('login.success'));

        navigate({ to: '/' });
      }
    }
  });

  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: ''
  });

  const handleTryDemo = () => {
    const demoCredentials = {
      email: 'demo@loreo.app',
      password: 'demo-password'
    } satisfies LoginInput;

    setFormData(demoCredentials);
    onSubmit(demoCredentials);
  };

  const onSubmit = (data: LoginInput) => {
    login.mutate(data);
  };

  const handleLogin = (event: React.SubmitEvent) => {
    event.preventDefault();

    onSubmit(formData);
  };

  return (
    <form className={cn('flex flex-col gap-6', className)} {...props} onSubmit={handleLogin}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">{t('login.title')}</h1>
        <p className="text-muted-foreground text-balance text-sm">{t('login.description')}</p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-3">
          <Label htmlFor="email">{t('login.email')}</Label>
          <Input
            id="email"
            name="email"
            onChange={(event) => setFormData({ ...formData, email: event.target.value })}
            placeholder={t('login.emailPlaceholder')}
            required
            type="email"
            value={formData.email}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">{t('login.password')}</Label>
          <Input
            id="password"
            name="password"
            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
            required
            type="password"
            value={formData.password}
          />
        </div>
        <Button className="w-full" disabled={login.isPending} type="submit">
          {login.isPending && <SpinnerIcon className="mr-2 animate-spin" size={16} />}
          {t('login.signIn')}
        </Button>
        {env.isDemo && (
          <div className="space-y-2">
            <Button className="w-full" onClick={handleTryDemo} type="button" variant="secondary">
              {t('login.tryDemo')}
            </Button>
            <p className="text-muted-foreground text-center text-xs leading-5">
              {t('login.demoGuidance')}
            </p>
          </div>
        )}
      </div>
      {env.isDemo ? (
        <p className="text-muted-foreground text-center text-sm">{t('login.demoSignUpDisabled')}</p>
      ) : (
        <div className="text-center text-sm">
          {t('login.dontHaveAccount')}{' '}
          <button
            className="underline underline-offset-4"
            onClick={() => navigate({ to: '/register' })}
            type="button"
          >
            {t('login.signUp')}
          </button>
        </div>
      )}
    </form>
  );
}
