import '@testing-library/jest-dom';

// jsdom doesn't implement window.matchMedia. stub it so ThemeProvider doesn't throw
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
});
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { afterAll, afterEach, beforeAll } from 'vitest';

import enCommon from '@/locales/en/common.json';

import { server } from './mocks/server';

// init i18n for tests with English only
i18n.use(initReactI18next).init({
  resources: { en: { common: enCommon } },
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false }
});

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
