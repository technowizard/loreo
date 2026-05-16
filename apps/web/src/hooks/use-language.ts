import { useTranslation } from 'react-i18next';

const LANGUAGES = ['en', 'id'] as const;

export type Language = (typeof LANGUAGES)[number];

export function useLanguage() {
  const { i18n } = useTranslation('common');

  const current = LANGUAGES.find((l) => i18n.language.startsWith(l)) ?? 'en';
  const next = current === 'en' ? 'id' : 'en';

  function toggle() {
    i18n.changeLanguage(next);
  }

  return { current, next, toggle };
}
