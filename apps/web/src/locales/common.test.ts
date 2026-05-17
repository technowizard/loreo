import { describe, expect, it } from 'vitest';

import enCommon from './en/common.json';
import idCommon from './id/common.json';

const phaseOneKeys = [
  'login.emailPlaceholder',
  'login.invalidCredentials',
  'login.success',
  'register.createAccount',
  'register.genericError',
  'register.success',
  'home.continueReading',
  'home.pasteUrlToSaveFirstArticle',
  'routes.login.metaTitle',
  'routes.register.metaTitle'
] as const;

const phaseTwoKeys = [
  'nav.home',
  'nav.articles',
  'userMenu.fallbackName',
  'userMenu.switchTheme',
  'userMenu.settings',
  'userMenu.logOut',
  'userMenu.themes.system',
  'userMenu.themes.light',
  'userMenu.themes.sepia',
  'userMenu.themes.dark',
  'routes.home.metaTitle',
  'routes.articles.metaTitle',
  'routes.settings.metaTitle',
  'routes.manageTags.metaTitle',
  'routes.importArticles.metaTitle',
  'routes.importProgress.metaTitle',
  'routes.articleReader.fallbackMetaTitle'
] as const;

function getValue(source: unknown, key: string) {
  return key.split('.').reduce<unknown>((value, segment) => {
    if (value && typeof value === 'object' && segment in value) {
      return (value as Record<string, unknown>)[segment];
    }

    return undefined;
  }, source);
}

describe('common locale phase 1 coverage', () => {
  it.each(phaseOneKeys)('defines %s in English and Indonesian locales', (key) => {
    expect(getValue(enCommon, key)).toEqual(expect.any(String));
    expect(getValue(idCommon, key)).toEqual(expect.any(String));
  });
});

describe('common locale phase 2 coverage', () => {
  it.each(phaseTwoKeys)('defines %s in English and Indonesian locales', (key) => {
    expect(getValue(enCommon, key)).toEqual(expect.any(String));
    expect(getValue(idCommon, key)).toEqual(expect.any(String));
  });
});
