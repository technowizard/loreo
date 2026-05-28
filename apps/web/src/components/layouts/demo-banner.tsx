import { InfoIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

import { env } from '@/lib/env';

export function DemoModeBanner() {
  const { t } = useTranslation();

  if (!env.isDemo) return null;

  return (
    <div className="mx-auto max-w-350 px-4 pt-4 sm:px-6 lg:px-8">
      <div
        className="flex items-start gap-3 rounded-3xl border border-primary-200 bg-primary-50 px-4 py-3 text-primary-900 shadow-sm dark:border-primary-900/40 dark:bg-primary-950/40 dark:text-primary-100"
        role="note"
      >
        <InfoIcon className="mt-0.5 size-5 shrink-0" weight="fill" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">{t('demo.banner.title')}</p>
          <p className="text-sm leading-6 text-primary-900/80 dark:text-primary-100/80">
            {t('demo.banner.description')}
          </p>
        </div>
      </div>
    </div>
  );
}
