import 'i18next';
import type { resources } from './resources';

type TranslationResources = (typeof resources)['en']['translation'] & Record<string, unknown>;

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      translation: TranslationResources;
    };
  }
}
