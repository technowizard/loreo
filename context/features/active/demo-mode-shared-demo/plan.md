# Demo Mode Shared Demo Plan

## Approach

Implement demo mode as a single server-side capability flag plus a web-only UX flag. The server is the source of truth: add `env.isDemo`, centralize the `403` response in a tiny helper, and call it at the top of every blocked mutation route and worker job before any file writes, database mutation, queue enqueue, crawl, or upload can happen.

Keep the MVP incremental and reversible:

1. Add demo env parsing and shared guard helpers.
2. Block dangerous server mutations and workers while preserving read endpoints, logout, local-only reader settings, and hybrid highlight interactions.
3. Add tests around route-level demo blocks and allowed demo behavior.
4. Add demo seed/reset support using existing fixture/repository/schema patterns, with explicit demo-only safety checks.
5. Add web UX flags and clear disabled states for blocked actions.
6. Add deployment/reset documentation after the code paths exist.

Defer non-essential deployment automation until the app behavior is verified locally. For login, prefer a one-click `Try Demo` button that submits documented demo credentials from the web client in demo mode; this avoids adding a special auth endpoint while still making the demo easy to enter. Keep visible credentials as fallback copy if the button fails. Use a checked-in placeholder for the demo password in docs/config examples and have the operator fill the real value during deployment.

## Files Likely To Change

- `apps/server/src/lib/env-config.ts` - parse `DEMO_MODE` and expose `env.isDemo`.
- `apps/server/src/lib/demo-mode.ts` or similar - shared `DEMO_MODE_DISABLED_MESSAGE`, `isDemoMode`, and route guard/response helper.
- `apps/server/src/routes/auth/auth.handlers.ts` - block register, email/password/account/avatar mutations; keep login/logout/get-user reads; block or bypass shared server settings updates in demo mode so reader settings remain local-only.
- `apps/server/src/routes/links/links.handlers.ts` - block create, delete, update, refetch, and tag replacement; keep list/search/read endpoints.
- `apps/server/src/routes/imports/imports.handlers.ts` - block upload, preview, execute, cancel, delete, resume, retry, and cleanup where they mutate sessions/files/queues; keep read-only session/status endpoints if useful.
- `apps/server/src/routes/tags/tags.handlers.ts` - block create/update/delete/move/bulk tag and tag-group mutations; keep tag and group reads.
- `apps/server/src/workers/content-extraction.worker.ts` - exit before crawling, updating records, or uploading assets when `env.isDemo` is true.
- `apps/server/src/workers/csv-import.worker.ts` - exit before reading/importing CSV rows, creating tags/links, or enqueueing extraction when `env.isDemo` is true.
- `apps/server/src/db/fixtures.ts` - extend existing demo fixtures only as needed for full articles, tag groups/tags, highlights/notes, and settings.
- `apps/server/scripts/demo-reset.ts` or similar - idempotent demo-only reset/seed command using `DEMO_MODE=true` and additional database safety checks.
- `apps/server/package.json` - add a demo reset script command if the script is added.
- `apps/server/src/routes/auth/auth.test.ts` - demo-mode blocks for register/account/avatar and allowed login/settings behavior.
- `apps/server/src/routes/links/links.test.ts` - demo-mode blocks for link mutation and extraction enqueue routes while reads still work.
- `apps/server/src/routes/imports/imports.test.ts` - demo-mode blocks for upload/preview/execute/retry/resume/cancel/delete/cleanup.
- `apps/server/src/routes/tags/tags.test.ts` - demo-mode blocks for tag and tag-group mutations while reads still work.
- `apps/server/src/routes/highlights/highlights.test.ts` - confirm seeded highlights are readable and temporary highlight create/update/delete works in demo mode.
- Worker or script tests near existing server test structure - cover worker early exits and reset idempotency if practical without requiring external services.
- `apps/web/src/lib/env.ts` - parse `VITE_DEMO_MODE` and expose `env.isDemo`.
- `apps/web/src/components/layouts/main.tsx` plus a new `DemoModeBanner` component - render authenticated compact banner in the app shell.
- `apps/web/src/features/auth/components/login-form.tsx` - show demo guidance and a `Try Demo` action in demo mode.
- `apps/web/src/features/auth/components/register-form.tsx`, `apps/web/src/pages/register.tsx`, or `apps/web/src/routes/_auth/register.tsx` - hide/disable/redirect registration in demo mode.
- `apps/web/src/pages/import-articles.tsx` and `apps/web/src/features/import-articles/components/upload-from-csv.tsx` - block direct import wizard use and disable file selection/drop.
- `apps/web/src/pages/manage-tags.tsx` and tag components under `apps/web/src/features/tags/components/` - keep browsing visible but disable create/edit/delete/move entry points.
- `apps/web/src/features/home/components/quick-add-bar.tsx`, `apps/web/src/features/articles/components/add-article-dialog.tsx`, `apps/web/src/features/articles/components/article-card.tsx`, `apps/web/src/features/articles/components/edit-tags-dialog.tsx`, `apps/web/src/pages/articles.tsx`, `apps/web/src/pages/article-reader.tsx`, and `apps/web/src/components/navigation/reader-nav.tsx` - disable link create/refetch/delete/update/tag actions exposed in list and reader flows.
- `apps/web/src/locales` or existing i18n resources if demo strings live in translations rather than inline copy.
- `docs/specs/demo-mode-shared-demo.md` or a deployment doc - record final decisions, required demo env vars, reset command, six-hour cadence, Render setup, and manual verification steps.

## Data Or API Changes

- Add server env variable `DEMO_MODE`; parse truthy string values conservatively, ideally requiring `true` for enabled.
- Add web env variable `VITE_DEMO_MODE`; use only for UX, never authorization.
- Standardize blocked server responses as `403 Forbidden` with `This action is disabled in demo mode`.
- No schema migration is expected for MVP if seeded records fit current users, links, tags, highlights, and settings tables.
- Demo reset should create or upsert one shared user, reset demo-owned mutable data, seed completed links, assign tags/tag groups, seed highlights and notes, and set default reader settings.
- Demo reset must refuse to run unless `DEMO_MODE=true`; it should also reject obviously non-demo database targets where practical.
- No special auth endpoint is required for MVP if the client-side `Try Demo` button calls the existing login endpoint with demo credentials.
- Demo reader settings should be local-only in the browser. The existing web reader config already uses Zustand persistence, so demo mode should avoid mutating server-side shared settings from reader controls.
- Use Render direct repo builds for MVP. Defer private GHCR until there is a concrete release-management or provenance need.

## Test Strategy

- Server route tests: run targeted Vitest tests for auth, links, imports, tags, and hybrid highlights after adding `env.isDemo` test control.
- Worker tests: cover early demo-mode return before crawling/importing/enqueueing, preferably by exporting small job functions or testing a thin helper if exports are too invasive.
- Reset tests: test idempotency against in-memory/repository abstractions if feasible; otherwise document a repeat-run manual check against a demo database.
- Web tests: add focused component/page tests only where current test setup supports it; otherwise verify with `pnpm --filter web typecheck`, `pnpm lint`, and manual browser checks.
- Full verification commands before review:
  - `pnpm --filter server typecheck`
  - `pnpm --filter server test -- auth links imports tags highlights`
  - `pnpm --filter web typecheck`
  - `pnpm lint`
  - `pnpm typecheck` if targeted checks pass and runtime allows it

## Rollback Plan

- Set `DEMO_MODE=false` or remove the variable to disable server-side demo restrictions.
- Set `VITE_DEMO_MODE=false` or remove the variable to hide demo UI affordances.
- Revert the demo guard/helper calls without touching existing route behavior if demo mode causes regressions.
- Keep reset scripts demo-only and manually run; do not wire scheduled production-affecting automation until the script has been verified against a dedicated demo database.

## Open Decisions

- Demo account password source: use a placeholder in code/docs for the operator to fill before deployment.
- Reset cadence: target every 6 hours; negligible if reset remains small DB-only seed/reset work.
- Reader settings: local-only in demo mode via existing Zustand persistence; avoid shared server-side settings mutation.
- Highlight policy: use hybrid behavior. Seed pre-highlighted text and allow temporary highlight create/update/delete so the core reader interaction is demonstrable, with six-hour reset cleanup.
- Deployment build path: use direct Render repo builds for MVP; defer private GHCR images.

## Recommended Next Step

Run `feature tasks` before `feature start`. This is non-trivial cross-cutting work across server enforcement, seed/reset data, web UX, deployment docs, and tests, so a task breakdown will keep implementation slices safe and reviewable.
