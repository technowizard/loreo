import { CaretDownIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { type Language, useLanguage } from '@/hooks/use-language';

import { SettingsRow, SettingsSection } from './settings-section';

const languages = ['en', 'id'] as const;

export function LanguageSection() {
  const { current, setLanguage } = useLanguage();
  const { t } = useTranslation('common');
  const currentLanguage = t(`settings.language.languages.${current}`);

  function handleLanguageChange(value: string) {
    setLanguage(value as Language);
  }

  return (
    <SettingsSection
      description={t('settings.language.description')}
      title={t('settings.language.title')}
    >
      <SettingsRow>
        <div className="flex items-center justify-between gap-4 rounded-4xl border p-4">
          <div>
            <p className="text-sm font-medium">{t('settings.language.currentLabel')}</p>
            <p className="text-muted-foreground text-sm">
              {t('settings.language.currentLanguage', {
                language: currentLanguage
              })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={t('settings.language.currentLanguage', {
                    language: currentLanguage
                  })}
                  size="sm"
                  variant="outline"
                />
              }
            >
              {currentLanguage}
              <CaretDownIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              {languages.map((language) => (
                <DropdownMenuItem key={language} onClick={() => handleLanguageChange(language)}>
                  {t(`settings.language.languages.${language}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SettingsRow>
    </SettingsSection>
  );
}
