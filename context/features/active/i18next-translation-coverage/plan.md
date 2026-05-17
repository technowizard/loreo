# i18next Translation Coverage Plan

## Phase 0: Locale Architecture and Parity Baseline

- Audit current `common.json` structure and decide key grouping conventions.
- Add missing keys already referenced by code, especially `register.createAccount`.
- Expand `en/common.json` with feature namespaces.
- Mirror the structure in `id/common.json` using English placeholders where Indonesian copy is not ready.
- Keep key names stable and feature-scoped: `auth/login`, `home`, `nav`, `articles`, `articleReader`, `settings`, `tags`, `import`, `shared`.

## Phase 1: Auth and Home

- Replace remaining hardcoded auth strings:
  - Login email placeholder.
  - Login error/success toasts.
  - Register generic error/success toasts.
  - Auth route titles.
- Fix existing key mismatch: `register.createAccount` vs `register.submit`.
- Replace remaining home hardcoded strings:
  - Continue Reading heading.
  - Recently saved empty/help copy.

## Phase 2: Navigation, Layout, and Route Metadata

- Translate header nav labels: Home, Articles.
- Translate user menu labels:
  - Switch theme.
  - System, Light, Sepia, Dark.
  - Settings.
  - Log out.
  - User fallback label if shown.
- Translate protected route/page metadata titles.

## Phase 3: Articles List Experience

- Translate article list page toasts:
  - Updating, deleting, reprocessing.
  - Link updated/deleted/queued.
- Translate toolbar copy:
  - Search placeholder and aria labels.
  - Filter sheet title/description.
  - Save article button.
- Translate filter sidebar labels:
  - Articles, Priority, Reading Length, Sort By, Tags.
  - Manage tags and toggle-group aria labels.
- Translate article empty states and getting-started copy.
- Translate article cards:
  - Priority labels.
  - Badges.
  - Action menu labels.
  - `+{{count}} more` tag overflow copy.
- Translate add/edit article-related dialogs and toasts.

## Phase 4: Article Reader Experience

- Translate reader status and action messages:
  - Favorite/favorited.
  - Archive and mark read.
  - Copy link/link copied.
  - What’s next/up next.
- Translate reader mutation toasts:
  - Marked as favorite.
  - Removed from favorites.
  - Archived and marked read.
- Translate resume position banner.
- Translate floating progress labels: Top, End, progress copy.
- Translate article-reader route metadata.

## Phase 5: Settings

- Translate settings page title and description.
- Translate account section:
  - Section title/description.
  - Avatar upload copy.
  - Name/email/password field labels and placeholders.
  - Save/confirm/cancel buttons.
  - Account update toasts.
- Translate security section:
  - Section title/description.
  - Password labels/placeholders.
  - Validation helper copy.
  - Password update toast.
- Translate reader preferences:
  - Theme, typography, preview, alignment labels/descriptions.
  - Tooltips/help copy.
- Translate data/import settings section:
  - Import card title/description/button.
  - Recent imports, status badges, progress labels, delete/view details.

## Phase 6: Tags Management

- Translate manage-tags page:
  - Title/description.
  - Search placeholder.
  - New group button.
  - Empty/error states.
  - Retry/helper copy.
- Translate tag group and tag forms:
  - New/edit titles.
  - Descriptions.
  - Labels/placeholders.
  - Preview labels.
  - Create/update submit buttons.
- Translate delete confirmation dialog.
- Translate move/group tags dialogs and sheet copy.
- Translate tag validation and toast messages.

## Phase 7: Import Articles Workflow

- Translate import wizard page:
  - Step titles/descriptions.
  - Cancel confirmation.
  - Cancel/back/continue/start buttons.
  - Failed/cancelled import messages.
- Translate CSV upload/dropzone:
  - Upload states.
  - Select/clear buttons.
  - File hints.
  - Tips and alerts.
  - Success-state copy.
- Translate field mapping:
  - Table headings.
  - Field labels.
  - Required badge.
  - Tooltip/help copy.
  - Do-not-map option.
- Translate review step:
  - Summary.
  - Estimated time.
  - Preview headings.
  - No tags and more-count copy.
- Translate import progress/extraction status screens.

## Phase 8: Shared UI, Validation, and Toast Cleanup

- Scan reusable components for visible static labels and aria labels.
- Translate shared notifications when messages are defined statically.
- Translate validation messages surfaced to users.
- Avoid translating internal-only strings, CSS classes, API paths, enum keys, or test fixtures.

## Phase 9: Verification and Regression Pass

- Search `apps/web/src` for remaining hardcoded user-facing English strings.
- Confirm no missing i18next keys at runtime for touched screens.
- Run required checks after JS/TS changes:
  - Typecheck.
  - Lint.
  - Biome/format check.
- Spot-check English UI flows manually where practical.
- Confirm `en/common.json` and `id/common.json` maintain structural parity.

## Implementation Notes

- Prefer small feature-by-feature changes over one large rewrite.
- Keep locale keys close to product language, not component implementation details.
- Use interpolation for dynamic copy, e.g. `{{count}}`, `{{progress}}`, `{{completed}}`, `{{total}}`.
- Keep behavior changes separate from translation-only changes.
