# Demo Mode Shared Demo Review

## Goal Coverage

- Phase 1 complete: demo env parsing, shared demo helper, and test isolation helper added.
- Phase 2 complete: demo-mode route enforcement added for auth, links, imports, tags, and highlights coverage verified.
- Phase 3 complete: demo-mode worker and queue safety added for content extraction and CSV import.
- Phase 4 complete: demo seed/reset data, safety checks, and reset command added.
- Phase 5 complete: web demo UX banner, demo login guidance, registration blocking, and reader note added.
- Phase 6 complete: web entry-point disabling added for import, tags, articles, reader actions, and local-only reader settings; fresh verification shows only unrelated repo-lint drift outside this slice.

## Changed Files

- `apps/server/src/lib/env-config.ts` - added strict `DEMO_MODE` parsing and `env.isDemo`.
- `apps/server/src/lib/demo-mode.ts` - added canonical demo-disabled message and forbidden response helper.
- `apps/server/src/tests/env.ts` - added isolated env import helper for tests.
- `apps/server/src/lib/env-config.test.ts` - added parser coverage for demo mode.
- `apps/server/src/lib/demo-mode.test.ts` - added response helper coverage.
- `apps/server/src/routes/auth/auth.handlers.ts` - bypassed shared settings DB read in demo mode.
- `apps/server/src/routes/auth/auth.routes.ts` - added demo-mode `403` response contracts to blocked mutations.
- `apps/server/src/routes/links/links.routes.ts` - added demo-mode `403` response contracts to blocked mutations.
- `apps/server/src/routes/imports/imports.routes.ts` - added demo-mode `403` response contracts to blocked upload/import/cleanup paths.
- `apps/server/src/routes/tags/tags.routes.ts` - added demo-mode `403` response contracts to blocked mutations.
- `apps/server/src/routes/auth/auth.demo.test.ts` - added demo-mode auth route coverage.
- `apps/server/src/routes/links/links.demo.test.ts` - added demo-mode links route coverage.
- `apps/server/src/routes/imports/imports.demo.test.ts` - added demo-mode imports route coverage.
- `apps/server/src/routes/tags/tags.demo.test.ts` - added demo-mode tags route coverage.
- `apps/server/src/routes/highlights/highlights.demo.test.ts` - added hybrid highlight behavior coverage.
- `apps/server/src/workers/content-extraction.worker.ts` - added demo-mode early exit before crawl, writes, and follow-up enqueueing.
- `apps/server/src/workers/csv-import.worker.ts` - added demo-mode early exit before CSV import work and extraction enqueueing.
- `apps/server/src/workers/content-extraction.worker.test.ts` - added demo-mode worker regression coverage.
- `apps/server/src/workers/csv-import.worker.test.ts` - added demo-mode worker regression coverage.
- `apps/server/src/db/fixtures.ts` - added seeded TurboFan article content, tags, highlights, and shared demo reader settings seed data.
- `apps/server/src/lib/demo-reset.ts` - added reset safety checks for demo-only execution and demo-looking database targets.
- `apps/server/src/lib/demo-reset.test.ts` - added safety guard coverage for the reset helper.
- `apps/server/scripts/demo-reset.ts` - added demo reset truncate-and-reseed command.
- `apps/server/package.json` - added `demo:reset` script.
- `apps/web/src/lib/env.ts` - added strict `VITE_DEMO_MODE` parsing and `env.isDemo`.
- `apps/web/src/components/layouts/demo-banner.tsx` - added compact demo banner for authenticated shell.
- `apps/web/src/components/layouts/main.tsx` - rendered demo banner in the protected shell.
- `apps/web/src/features/auth/components/login-form.tsx` - added `Try Demo`, demo guidance, and hidden register navigation in demo mode.
- `apps/web/src/pages/register.tsx` - blocked direct registration with a demo-only notice.
- `apps/web/src/features/settings/components/reader-preferences-section.tsx` - added local-only reader preference note for demo mode.
- `apps/web/src/lib/env.test.ts` - added web demo flag parser coverage.
- `apps/web/src/locales/en/common.json` - added demo-mode copy.
- `apps/web/src/locales/id/common.json` - added demo-mode copy.
- `apps/web/src/components/navigation/reader-nav.tsx` - hid the reader actions menu in demo mode while keeping navigation, highlights, and settings.
- `apps/web/src/features/tags/components/tag-group-card.tsx` - kept tag-group browsing visible while hiding demo-mode mutating actions.

## Verification Results

- `pnpm --filter server test -- src/lib/env-config.test.ts src/lib/demo-mode.test.ts` - pass, 16 files / 155 tests total, 0 failures.
- `pnpm --filter server typecheck` - pass, no output beyond `tsc --noEmit`.
- `pnpm --filter server typecheck` after phase 2 route/test fixes - pass.
- `pnpm --filter server test` after phase 2 route/test fixes - pass, 21 files / 168 tests total, 0 failures.
- `pnpm --filter server test -- src/workers/content-extraction.worker.test.ts src/workers/csv-import.worker.test.ts` - pass, 23 files / 170 tests total, 0 failures.
- `pnpm --filter server typecheck` after worker guard/test fixes - pass.
- `pnpm --filter server typecheck` after phase 4 seed/reset changes - pass.
- `pnpm --filter server exec vitest run src/lib/demo-reset.test.ts` - pass, 1 file / 3 tests, with the server test migration setup running successfully beforehand.
- `pnpm --filter web typecheck` - pass (fresh run during phase 6 review).
- `pnpm --filter web exec vitest run src/app.test.tsx src/lib/env.test.ts` - pass, 2 files / 3 tests total.
- `pnpm lint` - partial pass; `oxlint` passed, but `oxfmt --check` still reports unrelated formatting drift in `apps/server/browser/server.js`, `apps/web/src/routeTree.gen.ts`, `apps/web/src/typography.css`, and `docs/browser-image-optimization.md`.
- Browser smoke: the local demo session rendered the protected shell banner, manage-tags page with disabled `New Group`, settings import demo-disabled screen, and seeded TurboFan article reader with continuation controls.

## Drift Check

- Phase 6 keeps runtime behavior aligned with the documented hybrid policy: server mutations are blocked in demo mode while reads and highlight CRUD remain available, and the web shell now hides or disables the matching entry points.

## Remaining Risks

- The reset command was not executed against a live demo database here, so repeat-run verification still needs a real demo target even though the script is truncate-and-reseed deterministic.
- Deployment notes remain for later phases.
- Repo lint is still blocked by unrelated formatting drift outside the demo-mode slice.
- Browser smoke is limited to the local demo session in this workspace.

## Completion Summary

Phase 1 scaffolded the demo-mode contract and the env isolation helper needed for later route tests. Phase 2 enforced the demo-mode server route policy and verified the hybrid highlight behavior. Phase 3 stopped background workers from doing real work in demo mode and locked that down with isolated regression tests. Phase 4 added seeded demo content for the TurboFan article, highlight notes, demo tag groups/tags, and an idempotent reset command guarded against non-demo execution. Phase 5 added the demo-facing web shell treatment, demo login affordances, registration blocking, and an explicit reader-settings note while keeping the server as the source of truth. Phase 6 finished the web gating slice and confirmed the demo shell, disabled tags/import surfaces, and seeded reader flow in the local browser.
