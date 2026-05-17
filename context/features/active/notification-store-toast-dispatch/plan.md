# Notification Store Toast Dispatch Plan

## Approach

Narrow the work to the Task 2 quick-win scope from `docs/plans/2026-05-17-web-refactor-quick-wins.md`: route simple one-shot notifications through `useNotificationsStore`, keep Sonner for rendering and for loading/dismiss lifecycles, and avoid store API expansion. The current store already exposes `success`, `error`, and `info`, and the bridge already centralizes Sonner options, so implementation should focus on the remaining mechanical top-right simple toasts.

## Affected Components And Modules

### Include In This Pass

- `apps/web/src/features/auth/components/login-form.tsx` - replace top-right login success/error toasts with store selectors.
- `apps/web/src/features/auth/components/register-form.tsx` - replace top-right registration success/error toasts with store selectors.
- `apps/web/src/features/home/components/quick-add-bar.tsx` - replace top-right quick-add success toast with store selector.
- `apps/web/src/pages/articles.tsx` - already uses `useNotificationsStore.useSuccess()` for success messages; keep `toast.loading` and `toast.dismiss` direct.
- `apps/web/src/features/settings/components/account-section.tsx` - already uses store selectors; treat as reference implementation.
- `apps/web/src/features/settings/components/security-section.tsx` - already uses store selectors; treat as reference implementation.
- `apps/web/src/components/common/notifications.tsx` - keep as the Sonner bridge; no behavior change expected unless verification reveals missing shared options.
- `apps/web/src/stores/notifications.ts` - keep existing convenience actions; no loading/dismiss expansion.

### Defer For Behavior Preservation

- `apps/web/src/features/articles/components/add-article-dialog.tsx` - direct Sonner calls include custom mobile/desktop position and description handling.
- `apps/web/src/features/articles/components/edit-tags-dialog.tsx` - direct Sonner calls use `top-center` positioning.
- `apps/web/src/features/tags/hooks/use-tags-actions.ts` - mixed loading/dismiss plus custom bottom-right/top-center options.
- `apps/web/src/features/import-articles/components/upload-from-csv.tsx` - loading/dismiss flow should stay direct for now.
- `apps/web/src/features/import-articles/api/get-links-from-session.ts` - direct Sonner call is in non-component query helper code and uses bottom-right positioning.
- `apps/web/src/lib/utils.ts` - helper supports `warning`, which the store does not model; defer unless callers prove only success/error/info are used.
- `apps/web/src/app.tsx` - currently mounts `Toaster` directly; do not change unless a separate pass standardizes mounting through `Notifications`.

## Files Likely To Change

- `apps/web/src/features/auth/components/login-form.tsx` - add `useNotificationsStore` and replace simple toast calls.
- `apps/web/src/features/auth/components/register-form.tsx` - add `useNotificationsStore` and replace simple toast calls.
- `apps/web/src/features/home/components/quick-add-bar.tsx` - add `useNotificationsStore` and replace simple toast call.

## Data Or API Changes

- No server, route, or persistence changes.
- No notification store contract change expected; use existing `success`, `error`, and `info` actions.

## Test Strategy

- Run `pnpm --filter web typecheck`.
- Run `pnpm lint`.
- Search converted files to confirm they no longer import `toast` from `sonner`.
- Confirm direct Sonner imports remain only where intentionally deferred or used by the bridge/UI adapter.

## Rollback Plan

- Revert the changed component files if any converted notification behaves differently.
- Because no store contract changes are planned, rollback should be limited to the small component edits.
