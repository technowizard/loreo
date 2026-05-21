# Demo Mode Shared Demo Tasks

## Phase 1: Demo Flag And Guard Skeleton

Dependencies: none.

- [x] Add server `DEMO_MODE` parsing in `apps/server/src/lib/env-config.ts` and expose `env.isDemo`.
- [x] Add a small shared demo-mode helper, including the canonical message `This action is disabled in demo mode` and a reusable `403` response path for route handlers.
- [x] Add or adapt test control for demo mode so route tests can reliably exercise `env.isDemo` without leaking state between tests.
- [x] Verify with `pnpm --filter server typecheck` and the smallest affected server test subset.
- [x] Record verification results in `review.md`.

## Phase 2: Server Route Enforcement

Dependencies: Phase 1.

- [x] Block demo-mode account mutations in `apps/server/src/routes/auth/auth.handlers.ts`: registration, email change, password change, account update, and avatar upload.
- [x] Keep login, logout, current-user reads, and settings reads available; block or bypass shared server settings updates so demo reader settings remain local-only.
- [x] Block demo-mode link mutations in `apps/server/src/routes/links/links.handlers.ts`: create, delete, update, refetch, and tag replacement.
- [x] Keep link list, search, detail, and upcoming read endpoints available.
- [x] Block demo-mode import mutation/file/queue paths in `apps/server/src/routes/imports/imports.handlers.ts`: upload, preview, execute, cancel, delete, resume, retry, and cleanup.
- [x] Keep import session/status read endpoints available if they remain useful and safe.
- [x] Block demo-mode tag and tag-group mutations in `apps/server/src/routes/tags/tags.handlers.ts`, including create, update, delete, move, and bulk actions.
- [x] Keep tag and tag-group read endpoints available.
- [x] Add route tests for blocked demo actions, still-allowed reads, blocked/bypassed shared settings mutation, and hybrid highlight behavior.
- [x] Verify with `pnpm --filter server test -- auth links imports tags highlights` and `pnpm --filter server typecheck`.
- [x] Record verification results in `review.md`.

## Phase 3: Worker And Queue Safety

Dependencies: Phase 1.

- [x] Add an early demo-mode exit in `apps/server/src/workers/content-extraction.worker.ts` before any status update, crawl, image upload, database write, or follow-up enqueue.
- [x] Add an early demo-mode exit in `apps/server/src/workers/csv-import.worker.ts` before any CSV read, import-session mutation, tag/link creation, or extraction enqueue.
- [x] Ensure demo-blocked link/import route paths cannot enqueue extraction/import jobs before returning `403`.
- [x] Add worker or helper tests proving demo mode exits before expensive or mutating collaborators are called.
- [x] Verify with targeted worker tests if available, plus `pnpm --filter server typecheck`.
- [x] Record verification results in `review.md`.

## Phase 4: Demo Seed And Reset

Dependencies: Phases 1 and 2.

- [x] Extend `apps/server/src/db/fixtures.ts` only as needed to seed realistic demo links, tag groups/tags, pre-highlighted examples, notes, and default reader settings.
- [x] Add an idempotent demo reset script under `apps/server/scripts/` that upserts the shared demo account and resets/reseeds demo-owned mutable data.
- [x] Add explicit safety checks so reset refuses to run unless `DEMO_MODE=true` and rejects obviously non-demo database targets where practical.
- [x] Add a package script in `apps/server/package.json` for the demo reset command.
- [x] Test reset idempotency if practical in the existing test setup; otherwise document the manual repeat-run verification in `review.md`.
- [x] Verify with `pnpm --filter server typecheck` and targeted reset/script checks.
- [x] Record verification results in `review.md`.

## Phase 5: Web Demo UX Shell And Auth

Dependencies: Phase 1 for contract shape; can run after server guard behavior is clear.

- [x] Add `VITE_DEMO_MODE` parsing to `apps/web/src/lib/env.ts` and expose `env.isDemo` for UX only.
- [x] Add a compact authenticated demo banner in the protected app shell, likely through `apps/web/src/components/layouts/main.tsx` and a new banner component.
- [x] Add demo login guidance and a `Try Demo` action in `apps/web/src/features/auth/components/login-form.tsx` using the existing login endpoint.
- [x] Hide or disable register navigation and direct registration UI in demo mode.
- [x] Keep reader preference controls local-only in demo mode using the existing Zustand-persisted reader config; avoid shared account settings writes.
- [x] Ensure copy clearly explains that server-side restrictions protect the shared demo.
- [x] Verify with `pnpm --filter web typecheck` and existing web tests if affected components have coverage.
- [x] Record verification results in `review.md`.

## Phase 6: Web Disabled Entry Points

Dependencies: Phase 5.

- [ ] Disable or hide import wizard access and file selection/drop paths in `apps/web/src/pages/import-articles.tsx` and `apps/web/src/features/import-articles/components/upload-from-csv.tsx`.
- [ ] Keep manage-tags browsing visible while disabling create/edit/delete/move entry points in `apps/web/src/pages/manage-tags.tsx` and tag components.
- [ ] Disable link create entry points in quick add and add-article flows.
- [ ] Disable link refetch/delete/update/tag-edit actions in article list, article cards, edit-tags dialog, article reader, and reader nav.
- [ ] Preserve reader settings UI as local-only in demo mode.
- [ ] Implement hybrid highlight behavior: seeded highlighted text plus temporary highlight CRUD cleaned up by reset.
- [ ] Verify with `pnpm --filter web typecheck`, `pnpm lint`, and manual browser checks for login, banner, import, tags, article list, reader, and highlights.
- [ ] Record verification results in `review.md`.

## Phase 7: Deployment Notes And Final Verification

Dependencies: Phases 1 through 6.

- [ ] Update `docs/specs/demo-mode-shared-demo.md` or a deployment note with final required env vars, Render web/API setup, dedicated Neon database, optional Upstash Redis, CORS/public URL, and six-hour reset cadence.
- [ ] Document the demo account email/password placeholder and how operators fill/rotate demo-only secrets.
- [ ] Document the manual smoke test: log in as demo user, browse seeded content, create/update/delete highlights, confirm blocked actions show demo messaging, run reset, confirm seeded state returns.
- [ ] Run `pnpm --filter server typecheck`.
- [ ] Run `pnpm --filter server test -- auth links imports tags highlights`.
- [ ] Run `pnpm --filter web typecheck`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm typecheck` if targeted checks pass and runtime allows it.
- [ ] Record final verification evidence, drift check, and remaining risks in `review.md`.

## Open Decisions To Resolve Before Or During Start

- [x] Demo account password source: create a placeholder and let the operator fill it.
- [x] Reset cadence: target every 6 hours; expected to be negligible versus nightly if reset remains DB-only seed/reset work.
- [x] Reader settings: local-only in demo mode via existing Zustand persistence; avoid shared server-side settings mutation.
- [x] Highlight policy: hybrid seeded highlights plus temporary highlight CRUD, cleaned up by reset.
- [x] Deployment build path: direct Render repo builds for MVP; defer private GHCR images until there is a concrete need.

## First Recommended Task

Start with Phase 2. Phase 1 is complete and verified.
