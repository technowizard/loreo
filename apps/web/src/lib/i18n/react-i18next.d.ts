import type { resources } from './resources';

declare module 'react-i18next' {
  type CustomTypeOptions = {
    resources: (typeof resources)['en'];
  };
}
