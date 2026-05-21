import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import { AuthBrandPanel, MobileBrandHeader } from '@/features/auth/components/brand-panel';
import { RegisterForm } from '@/features/auth/components/register-form';

import { env } from '@/lib/env';

function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  if (env.isDemo) {
    return (
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="relative m-4 hidden lg:block">
          <AuthBrandPanel />
        </div>
        <div className="flex flex-col">
          <MobileBrandHeader />
          <div className="flex flex-1 items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-xs space-y-4 text-center">
              <h1 className="text-2xl font-bold">{t('register.demoDisabled.title')}</h1>
              <p className="text-muted-foreground text-sm">
                {t('register.demoDisabled.description')}
              </p>
              <Button className="w-full" onClick={() => navigate({ to: '/login' })} type="button">
                {t('register.demoDisabled.goToLogin')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative m-4 hidden lg:block">
        <AuthBrandPanel />
      </div>
      <div className="flex flex-col">
        <MobileBrandHeader />
        <div className="flex flex-1 items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-xs">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
