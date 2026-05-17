import { useTranslation } from 'react-i18next';

import { AccountSection } from '@/features/settings/components/account-section';
import { DataSection } from '@/features/settings/components/data-section';
import { ReaderPreferencesSection } from '@/features/settings/components/reader-preferences-section';
import { SecuritySection } from '@/features/settings/components/security-section';

function SettingsPage() {
  const { t } = useTranslation('common');

  return (
    <div className="max-w-350">
      <header className="mb-8 border-b pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t('settings.page.title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('settings.page.description')}</p>
      </header>

      <AccountSection />
      <SecuritySection />
      <ReaderPreferencesSection />
      <DataSection />
    </div>
  );
}

export default SettingsPage;
