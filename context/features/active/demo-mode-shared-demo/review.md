# Demo Mode Shared Demo Review

## Goal Coverage

- Phase 1 complete: demo env parsing, shared demo helper, and test isolation helper added.
- Phase 2 complete: demo-mode route enforcement added for auth, links, imports, tags, and highlights coverage verified.
- Phase 3 complete: demo-mode worker and queue safety added for content extraction and CSV import.
- Phase 4 complete: demo seed/reset data, safety checks, and reset command added.

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

## Verification Results

- `pnpm --filter server test -- src/lib/env-config.test.ts src/lib/demo-mode.test.ts` - pass, 16 files / 155 tests total, 0 failures.
- `pnpm --filter server typecheck` - pass, no output beyond `tsc --noEmit`.
- `pnpm --filter server typecheck` after phase 2 route/test fixes - pass.
- `pnpm --filter server test` after phase 2 route/test fixes - pass, 21 files / 168 tests total, 0 failures.
- `pnpm --filter server test -- src/workers/content-extraction.worker.test.ts src/workers/csv-import.worker.test.ts` - pass, 23 files / 170 tests total, 0 failures.
- `pnpm --filter server typecheck` after worker guard/test fixes - pass.
- `pnpm --filter server typecheck` after phase 4 seed/reset changes - pass.
- `pnpm --filter server exec vitest run src/lib/demo-reset.test.ts` - pass, 1 file / 3 tests, with the server test migration setup running successfully beforehand.

## Drift Check

- No product behavior implemented yet beyond the shared demo flag/helper foundation.
- Phase 2 keeps runtime behavior aligned with the documented hybrid policy: server mutations are blocked in demo mode while reads and highlight CRUD remain available.

## Remaining Risks

- Worker exits, demo reset, web UX, and deployment notes remain for later phases.
- Web UX and deployment notes remain for later phases.
- The reset command was not executed against a live demo database here, so repeat-run verification still needs a real demo target even though the script is truncate-and-reseed deterministic.

## Completion Summary

Phase 1 scaffolded the demo-mode contract and the env isolation helper needed for later route tests. Phase 2 enforced the demo-mode server route policy and verified the hybrid highlight behavior. Phase 3 stopped background workers from doing real work in demo mode and locked that down with isolated regression tests. Phase 4 added seeded demo content for the TurboFan article, highlight notes, demo tag groups/tags, and an idempotent reset command guarded against non-demo execution.
