# i18next Translation Coverage

## Goal

Internationalize hardcoded user-facing English copy in `apps/web` using the existing i18next setup.

## Context

- Existing i18next setup: `apps/web/src/lib/i18n.ts`
- English source locale: `apps/web/src/locales/en/common.json`
- Indonesian locale: `apps/web/src/locales/id/common.json`
- Current English coverage is limited to `brandPanel`, `login`, `register`, and `home`.
- `id/common.json` should keep structural parity with English, even if values start as English placeholders.

## Scope

Translate visible UI copy, route metadata, form labels, placeholders, toast messages, validation messages, confirm dialogs, empty states, and aria labels across:

1. Auth
2. Home
3. Navigation/Layout
4. Articles
5. Article Reader
6. Settings
7. Tags
8. Import Articles
9. Shared UI/common user-facing strings

## Out of Scope

- Backend/API translations.
- Translating database content or user-generated content.
- Full Indonesian copywriting quality pass; initial parity may use English placeholders.
- Non-user-facing constants such as API paths, internal enum values, CSS classes, and test-only fixture strings.

## Success Criteria

- `en/common.json` contains keys for all scanned user-facing copy.
- `id/common.json` mirrors the English key structure.
- Hardcoded visible English strings are replaced feature-by-feature with `t(...)` calls or equivalent i18next usage.
- Typecheck, lint, and formatting checks pass after implementation phases.
