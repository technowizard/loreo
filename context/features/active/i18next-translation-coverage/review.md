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

## Phase 7: Import Articles Workflow

### Completed

- Added phase 7 locale coverage tests for 326 keys across 9 groups (wizard, progress, upload, mapFields, review, progressDemo, extraction).
- Added matching `import.*` locale blocks to English and Indonesian common locales.
- Changed wizard-config.ts to export key-based STEP_LABELS, STEP_DESCRIPTIONS, and STEP_ERROR_MESSAGES arrays.
- Translated `pages/import-articles.tsx` wizard shell (step labels/descriptions, cancel/back/continue/start buttons, confirm dialog, toasts, error messages).
- Translated `pages/import-progress.tsx` (complete/importing screens, progress text, view extraction progress button).
- Translated `upload-from-csv.tsx` (toast, aria labels, dropzone text, file hint, select/clear buttons, upload alerts).
- Translated `map-fields.tsx` (table headings, field labels, required badge, do-not-map option, help text tooltips).
- Translated `review-import.tsx` (summary, estimated time, data preview section, table headings, no-tags, more-count).
- Translated `features/import-articles/components/import-progress.tsx` (demo-only completion/importing text).
- Translated `extraction-progress.tsx` (title, completed/failed cards, status filter labels, load-more button).
- Translated `extraction-status-card.tsx` (status badges, view button).

### Verification

- RED: 80 phase 7 locale tests failed before keys were added.
- GREEN: `bun test src/locales/common.test.ts` passed: 326 tests, 652 assertions.
- Typecheck: `bun run typecheck` passed.
- Touched-file lint/format: `pnpm exec oxlint ... && pnpm exec oxfmt --check ...` passed.

### Remaining Risks

- `id/common.json` still mirrors English values; it needs a later Indonesian copy pass.
- Some aria labels and tooltips on extraction progress page remain as inline static text.
- Demo import-progress component content uses locale keys but is not functionally wired to real import state.

## Phase 8: Shared UI, Validation, and Toast Cleanup

### Completed

- Added phase 8 locale coverage tests for 49 keys across `common.*`, `reader.highlights.*`, `reader.notes.*`, `tags.tagInput.*`, `tags.toasts.*`, and `import.extraction.failedLoadMore`.
- Added matching `common.*` (error/notFound/dialog close), `reader.highlights.*`, `reader.notes.*`, `tags.tagInput.*`, `tags.toasts.*`, and `import.extraction.failedLoadMore` keys to English and Indonesian common locales.
- Translated `components/common/error.tsx` (error label, title, retry button).
- Translated `components/common/not-found.tsx` (404 page title, go back link).
- Translated `components/layouts/reader.tsx` (highlights sheet title/description).
- Translated `components/ui/dialog.tsx` and `components/ui/sheet.tsx` (sr-only Close labels).
- Translated `components/ui/tag-input.tsx` (search placeholder, create-in text, tag count with plural, no-tags states, max-tags message).
- Translated `features/reader/components/note-card.tsx` (highlight color, edit/add/delete note, save, add your thoughts, remove highlight).
- Translated `features/tags/hooks/use-tags-actions.ts` (all toast strings: creating/updating/deleting group and tag CRUD toasts, validation errors, move confirmations, name conflicts).
- Translated `features/import-articles/api/get-links-from-session.ts` (failed-to-load-more toast).

### Verification

- RED: 6 phase 8 locale tests failed before `common.*`, `common.notFound.*`, and `common.dialog.close` keys were added to locale JSON (the other 43 passed immediately).
- GREEN: `bun test src/locales/common.test.ts` passed: 374 tests, 748 assertions.
- Typecheck: `bun run typecheck` passed (fixed missing `children` destructuring in reader.tsx).
- Touched-file lint/format: `pnpm exec oxlint ... && pnpm exec oxfmt --check ...` passed.

### Remaining Risks

- `id/common.json` still mirrors English values; it needs a later Indonesian copy pass.
- Reader navigation drawer copy (Back, Reader Settings, Theme, Font Size, Line Spacing, Text Alignment, Font Family, Sans Serif, Unfavorite/Favorite) remains untranslated — deferred because labels double as state values in theme-config.
