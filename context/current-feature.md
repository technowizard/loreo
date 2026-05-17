# Current Feature

**Slug:** notification-store-toast-dispatch
**Status:** Implemented
**Path:** `context/features/active/notification-store-toast-dispatch/`
**Branch:** main

## Current Focus

- Execute the prepared tasks for routing simple one-shot auth and quick-add toasts through the notification store.

## Notes

- Existing store implementation: `apps/web/src/stores/notifications.ts`
- Existing bridge component: `apps/web/src/components/common/notifications.tsx`
- Reference plan: `docs/plans/2026-05-17-web-refactor-quick-wins.md`, Task 2
- Keep `toast.loading` and `toast.dismiss` direct for now because the store does not model loading lifecycles.
- Task list: `context/features/active/notification-store-toast-dispatch/tasks.md`
