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
