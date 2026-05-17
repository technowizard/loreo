# i18next Translation Coverage Review

## Phase 1: Auth and Home

### Completed

- Added a phase 1 locale coverage test for required English and Indonesian keys.
- Added missing auth/home/route keys to `apps/web/src/locales/en/common.json`.
- Expanded `apps/web/src/locales/id/common.json` to match current English structure for existing auth/home coverage, using English placeholders.
- Replaced hardcoded phase 1 auth strings with i18next calls:
  - Login email placeholder.
  - Login invalid credentials toast.
  - Login success toast.
  - Register generic error toast.
  - Register success toast.
- Replaced hardcoded home `Continue Reading` heading with i18next.
- Replaced auth route metadata titles with i18next lookups.

### Verification

- RED: `bun test src/locales/common.test.ts` failed before locale keys were added.
- GREEN: `bun test src/locales/common.test.ts` passed: 10 tests, 20 assertions.
- Typecheck: `bun run typecheck` passed.
- Touched-file lint/format: `pnpm exec oxlint ... && pnpm exec oxfmt --check ...` passed for the touched TypeScript files.
- Full repo lint: `pnpm lint` failed because `apps/web/src/routeTree.gen.ts` has a formatting issue unrelated to this phase; the file was not changed in this phase.

### Remaining Risks

- `id/common.json` currently mirrors English with English values; it still needs real Indonesian copy.
- Full repo lint remains blocked by pre-existing generated route tree formatting.

## Phase 2: Navigation, Layout, and Route Metadata

### Completed

- Added phase 2 locale coverage tests for navigation, user menu, theme labels, and protected route metadata keys.
- Added matching `nav.*`, `userMenu.*`, and protected `routes.*` keys to English and Indonesian common locales.
- Replaced hardcoded header navigation labels with `useTranslation('common')` lookups.
- Replaced hardcoded user menu fallback name, theme labels, switch-theme label, settings label, and log-out label with i18next lookups.
- Replaced protected route metadata titles with `i18n.t(...)` lookups while preserving dynamic article titles as user content.

### Verification

- RED: `bun test src/locales/common.test.ts` failed before phase 2 locale keys were added: all 17 phase 2 keys were undefined in both locales.
- GREEN: `bun test src/locales/common.test.ts` passed: 27 tests, 54 assertions.
- Typecheck: `bun run typecheck` passed.
- Touched-file lint/format: `pnpm exec oxlint ... && pnpm exec oxfmt --check ...` passed for phase 2 touched files after formatting with `oxfmt --write`.

### Remaining Risks

- `id/common.json` still mirrors English values; it needs a later Indonesian copy pass.
- Phase 2 only covers route metadata identified in the protected layout/navigation scope; later phases may add more route/page metadata keys.

## Phase 3: Articles List Experience

### Completed

- Added phase 3 locale coverage tests for 66 articles-related keys (toasts, toolbar, filters, empty states, card actions, dialogs).
- Added matching `articles.*` keys to English and Indonesian common locales.
- Replaced hardcoded article page toasts with `useTranslation('common')` lookups.
- Replaced hardcoded toolbar search, filter sheet, and save article strings.
- Replaced hardcoded filter sidebar section titles and aria-labels.
- Replaced hardcoded empty state titles, descriptions, and action labels.
- Replaced hardcoded article card priority badges, dropdown menu actions, and "+ more" counts.
- Replaced hardcoded add-article dialog copy and toast messages.
- Replaced hardcoded edit-tags dialog copy and toast messages.

### Verification

- RED: `bun test src/locales/common.test.ts` failed before phase 3 locale keys were added: all 66 phase 3 keys were undefined.
- GREEN: `bun test src/locales/common.test.ts` passed: 93 tests, 186 assertions.
- Typecheck: `bun run typecheck` passed.
- Touched-file lint/format: `pnpm exec oxlint ... && pnpm exec oxfmt --check ...` passed for phase 3 touched files after formatting.

### Remaining Risks

- `id/common.json` still mirrors English values; needs Indonesian copy pass.
- Article card `PRIORITY_OPTIONS` constant uses `labelKey` references translated inside components.
- Some dynamic filter titles in `articles.tsx` (e.g., "Group: {{name}}", "Tag: {{name}}") remain hardcoded and use runtime data.

## Phase 4: Article Reader Experience

### Completed

- Added phase 4 locale coverage tests for reader actions, resume banner, and progress indicator keys.
- Added matching `reader.*` keys for article reader actions, resume banner, and progress indicator copy to English and Indonesian common locales.
- Replaced hardcoded article reader page action labels and mutation status messages with i18next lookups.
- Replaced resume-position banner copy with i18next lookups.
- Replaced floating progress indicator copy with i18next lookups.

### Verification

- RED: `bun test src/locales/common.test.ts` failed before phase 4 reader keys were added.
- GREEN: `bun test src/locales/common.test.ts` passed: 111 tests, 222 assertions.
- Typecheck: `bun run typecheck` passed.
- Touched-file lint/format: `pnpm exec oxlint ... && pnpm exec oxfmt --check ...` passed for the phase 4 touched reader files after formatting.

### Remaining Risks

- `id/common.json` still mirrors English values; it needs a later Indonesian copy pass.
- Reader navigation drawer copy remains untranslated and is deferred to a later phase.

## Phase 5: Settings

### Completed

- Added phase 5 locale coverage tests for settings page, account, security, reader preferences, and data sections.
- Added matching `settings.*` keys to English and Indonesian common locales.
- Replaced settings page shell title/description with i18next lookups.
- Replaced account section copy (avatar, name, email fields, save/cancel/confirm buttons, toast messages).
- Replaced security section copy (password fields, validation hint, password update button, toast).
- Replaced reader preferences section copy (section title/description, theme labels/tooltip/cards, typography/font/line-spacing field labels, preview toggle, font-family tab labels, text alignment cards, reset preferences block).
- Replaced data section copy (section title/description, import card copy, session card title/date, status badges, progress labels, extracted/failed counts, delete/view-details buttons).

### Verification

- RED: `bun test src/locales/common.test.ts` failed before phase 5 locale keys were added.
- GREEN: `bun test src/locales/common.test.ts` passed: 174 tests, 348 assertions.
- Typecheck: `bun run typecheck` passed.
- Touched-file lint/format: `pnpm exec oxlint ... && pnpm exec oxfmt --check ...` passed for the phase 5 touched files after formatting.

### Remaining Risks

- `id/common.json` still mirrors English values; it needs a later Indonesian copy pass.
- Reader navigation drawer copy remains untranslated and deferred.

## Phase 6: Tags Management

### Completed

- Added `tags.*` locale block to English and Indonesian common locales covering page shell, delete dialog, group/tag form dialogs, group tags sheet, move dialog, and group card.
- Translated `pages/manage-tags.tsx` page title, description, search placeholder, new group button, error/empty states.
- Translated `delete-confirmation-dialog.tsx` with `<Trans>` components for rich-text confirm messages.
- Translated `tag-group-form-dialog.tsx` and `tag-form-dialog.tsx` dialog headers, descriptions, labels, placeholders, preview labels, buttons.
- Translated `group-tags-sheet.tsx` tags count, select/cancel, add tag, selected count, move-to, delete, and aria labels.
- Translated `move-tags-dialog.tsx` title (single/bulk/group), description, destination label, placeholder, cancel, move.
- Translated `tag-group-card.tsx` tag count (plural), action labels, more count, manage tags, add first tag, and aria labels.
- Removed duplicate Move button in move-tags-dialog.tsx.

### Verification

- RED: 70 phase 6 locale tests failed before keys were added.
- GREEN: `bun test src/locales/common.test.ts` passed: 246 tests, 492 assertions.
- Typecheck: `bun run typecheck` passed.
- Touched-file lint/format: `pnpm exec oxlint ... && pnpm exec oxfmt --check ...` passed.

### Remaining Risks

- `id/common.json` still mirrors English values; it needs a later Indonesian copy pass.
- Phase 6 only covers tags management UI; some aria labels use interpolation.
