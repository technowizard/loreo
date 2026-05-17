# Notification Store Toast Dispatch Tasks

## Scope

Route simple one-shot success/error notifications through `useNotificationsStore` in the remaining mechanical call sites. Do not replace Sonner, do not add store API, and do not touch loading/dismiss flows.

## Tasks

- [x] Refactor `apps/web/src/features/auth/components/login-form.tsx`
  - [x] Remove direct `toast` import from `sonner`.
  - [x] Import `useNotificationsStore` from `@/stores/notifications`.
  - [x] Add `notifyError = useNotificationsStore.useError()`.
  - [x] Add `notifySuccess = useNotificationsStore.useSuccess()`.
  - [x] Replace `toast.error('Invalid email or password', ...)` with `notifyError('Invalid email or password')`.
  - [x] Replace `toast.success('Login successful', ...)` with `notifySuccess('Login successful')`.

- [x] Refactor `apps/web/src/features/auth/components/register-form.tsx`
  - [x] Remove direct `toast` import from `sonner`.
  - [x] Import `useNotificationsStore` from `@/stores/notifications`.
  - [x] Add `notifyError = useNotificationsStore.useError()`.
  - [x] Add `notifySuccess = useNotificationsStore.useSuccess()`.
  - [x] Replace `toast.error(error.message, ...)` with `notifyError(error.message)`.
  - [x] Replace `toast.error('An error occurred', ...)` with `notifyError('An error occurred')`.
  - [x] Replace `toast.success('Account created. Welcome!', ...)` with `notifySuccess('Account created. Welcome!')`.
  - [x] Confirm mutation flow, navigation, and cache writes are unchanged.

- [x] Refactor `apps/web/src/features/home/components/quick-add-bar.tsx`
  - [x] Remove direct `toast` import from `sonner`.
  - [x] Import `useNotificationsStore` from `@/stores/notifications`.
  - [x] Add `notifySuccess = useNotificationsStore.useSuccess()`.
  - [x] Replace `toast.success(t('home.quickAdd.success'), ...)` with `notifySuccess(t('home.quickAdd.success'))`.
  - [x] Confirm `setUrl('')` remains in the same behavior path.

- [x] Verify deferred call sites remain intentionally untouched
  - [x] Keep `apps/web/src/features/articles/components/add-article-dialog.tsx` unchanged because of custom position/description behavior.
  - [x] Keep `apps/web/src/features/articles/components/edit-tags-dialog.tsx` unchanged because of custom `top-center` behavior.
  - [x] Keep `apps/web/src/features/tags/hooks/use-tags-actions.ts` unchanged because of loading/dismiss and custom positions.
  - [x] Keep `apps/web/src/features/import-articles/components/upload-from-csv.tsx` unchanged because of loading/dismiss behavior.
  - [x] Keep `apps/web/src/features/import-articles/api/get-links-from-session.ts` unchanged because it is non-component code with bottom-right behavior.
  - [x] Keep `apps/web/src/lib/utils.ts` unchanged because it supports `warning`, which is not in `NotificationType`.
  - [x] Keep `apps/web/src/app.tsx` unchanged because bridge mounting is outside this quick win.

- [x] Run verification
  - [x] Search the three changed files and confirm none imports `toast` from `sonner`.
  - [x] Run `pnpm --filter web typecheck`.
  - [x] Run `pnpm lint`.
  - [x] Create or update `context/features/active/notification-store-toast-dispatch/review.md` with changed files, command results, and any residual risks.

## Notes

- `apps/web/src/stores/notifications.ts` already exposes `success`, `error`, and `info`; no store change is planned.
- `apps/web/src/components/common/notifications.tsx` already bridges store notifications to Sonner with shared presentation options; no bridge change is planned.
- `apps/web/src/pages/articles.tsx`, `apps/web/src/features/settings/components/account-section.tsx`, and `apps/web/src/features/settings/components/security-section.tsx` are reference implementations for this pass.
