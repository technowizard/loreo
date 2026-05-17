# Notification Store Toast Dispatch Review

## Changed Files
- `apps/web/src/features/auth/components/login-form.tsx`
- `apps/web/src/features/auth/components/register-form.tsx`
- `apps/web/src/features/home/components/quick-add-bar.tsx`

## Test Results

| Check | Result |
|-------|--------|
| `pnpm --filter web typecheck` | PASS |
| `pnpm oxlint` | 0 warnings, 0 errors |
| Sonner imports in changed files | None found |

## Deferred Files (intentionally untouched)
- `apps/web/src/features/articles/components/add-article-dialog.tsx` — custom position/description
- `apps/web/src/features/articles/components/edit-tags-dialog.tsx` — custom `top-center` positioning
- `apps/web/src/features/tags/hooks/use-tags-actions.ts` — loading/dismiss + custom positions
- `apps/web/src/features/import-articles/components/upload-from-csv.tsx` — loading/dismiss
- `apps/web/src/features/import-articles/api/get-links-from-session.ts` — non-component + bottom-right
- `apps/web/src/lib/utils.ts` — `warning` not in `NotificationType`
- `apps/web/src/app.tsx` — bridge mounting outside this quick win
