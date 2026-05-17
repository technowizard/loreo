# i18next Translation Coverage Tasks

## Phase 0: Locale Architecture and Parity Baseline

- [ ] Decide final locale key grouping conventions.
- [ ] Add missing currently referenced keys to `en/common.json`.
- [ ] Add feature namespaces to `en/common.json`.
- [ ] Mirror English structure in `id/common.json`.
- [ ] Verify locale JSON parses correctly.

## Phase 1: Auth and Home

- [x] Translate auth placeholders, toasts, and route titles.
- [x] Fix register submit key mismatch.
- [x] Translate remaining home hardcoded strings.
- [x] Verify login, register, and home screens.

## Phase 2: Navigation, Layout, and Route Metadata

- [ ] Translate header navigation labels.
- [ ] Translate user menu and theme labels.
- [ ] Translate route metadata titles.
- [ ] Verify protected layout renders translated labels.

## Phase 3: Articles List Experience

- [ ] Translate article page toasts.
- [ ] Translate toolbar and filter sidebar copy.
- [ ] Translate empty states.
- [ ] Translate article cards and action menus.
- [ ] Translate add/edit article dialogs.
- [ ] Verify article list flows.

## Phase 4: Article Reader Experience

- [ ] Translate reader actions and mutation toasts.
- [ ] Translate resume banner.
- [ ] Translate floating progress indicator.
- [ ] Translate article reader metadata.
- [ ] Verify article reader flows.

## Phase 5: Settings

- [ ] Translate settings page shell.
- [ ] Translate account section.
- [ ] Translate security section.
- [ ] Translate reader preferences section.
- [ ] Translate data/import settings section.
- [ ] Verify settings flows.

## Phase 6: Tags Management

- [ ] Translate manage-tags page shell.
- [ ] Translate tag/group cards and forms.
- [ ] Translate delete/move/group dialogs.
- [ ] Translate tags validation and toasts.
- [ ] Verify tags flows.

## Phase 7: Import Articles Workflow

- [ ] Translate import wizard shell and controls.
- [ ] Translate CSV upload/dropzone.
- [ ] Translate field mapping.
- [ ] Translate review step.
- [ ] Translate progress and extraction status screens.
- [ ] Verify import flows.

## Phase 8: Shared UI, Validation, and Toast Cleanup

- [ ] Scan shared components for remaining visible English copy.
- [ ] Translate shared static notifications.
- [ ] Translate user-facing validation messages.
- [ ] Confirm internal-only strings remain untouched.

## Phase 9: Verification and Regression Pass

- [ ] Search for remaining hardcoded user-facing English strings.
- [ ] Check for missing i18next keys.
- [ ] Run typecheck.
- [ ] Run lint.
- [ ] Run biome/format check.
- [ ] Record verification evidence in `review.md`.
