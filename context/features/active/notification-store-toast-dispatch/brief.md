# Notification Store Toast Dispatch Brief

## Problem

`apps/web` has an existing notification store and Sonner bridge, but some simple success/error/info toasts still dispatch directly through Sonner. That keeps simple toast dispatch duplicated across features even though presentation details can live behind the store bridge.

## Goals

- Use `useNotificationsStore` for reusable dispatch of simple one-shot success/error/info notifications.
- Keep Sonner as the underlying presentation adapter in `apps/web/src/components/common/notifications.tsx` and `apps/web/src/components/ui/sonner.tsx`.
- Preserve loading/dismiss lifecycles as direct Sonner calls for now, matching `docs/plans/2026-05-17-web-refactor-quick-wins.md` Task 2.
- Prefer mechanical, behavior-preserving replacements.

## Non-Goals

- Replace Sonner entirely.
- Add loading, dismiss, warning, description, or position support to the notification store in this quick win.
- Refactor broad workflows such as tag action state, import uploads, or article pagination.
- Change toast styling or global presentation behavior.

## Acceptance Criteria

- [ ] Simple top-right success/error/info toasts that can be converted mechanically dispatch through `useNotificationsStore`.
- [ ] Sonner remains in the bridge/rendering layer and in direct loading/dismiss flows.
- [ ] Existing loading toasts still use `toast.loading` and `toast.dismiss` directly.
- [ ] Relevant typecheck and lint checks pass.

## Risks

- Some direct Sonner calls include custom position, description, or loading/dismiss behavior; converting those would change behavior and should be deferred.
- Files with mixed loading and success flows may intentionally keep direct Sonner imports.

## Verification

- Search changed files for direct simple `toast.success`, `toast.error`, and `toast.info` calls that should use the store.
- Run `pnpm --filter web typecheck` and `pnpm lint`.
- Manually spot-check converted auth/home/article flows where practical.
