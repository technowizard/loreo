# Production Release Readiness Review

## Goal Coverage

- Phase 1 is complete. The server URL validator is now async, resolves hostnames with DNS at request time, rejects localhost/private/link-local/multicast/unspecified literals, and rejects hostnames that resolve to blocked ranges.
- Phase 2 is complete. Redirect-following downloads now revalidate each redirect target, reject private/loopback redirect destinations, and stop after a small redirect budget.

## Changed Files

- `context/current-feature.md` - marked the feature in progress and recorded the branch.
- `context/features/active/production-release-readiness/tasks.md` - marked phases 1 and 2 complete.
- `apps/server/src/lib/url-validator.ts` - converted URL validation to async DNS-aware SSRF checks.
- `apps/server/src/lib/url-validator.test.ts` - added coverage for localhost, schemes, private literals, public literals, and DNS-resolved hostnames.
- `apps/server/src/lib/api-client.ts` - added redirect-validation helper for SSRF-sensitive fetches.
- `apps/server/src/lib/api-client.test.ts` - added redirect rejection, safe redirect, and redirect-budget coverage.
- `apps/server/src/routes/links/links.handlers.ts` - awaited the new validator.
- `apps/server/src/routes/imports/imports.handlers.ts` - awaited the new validator in CSV preview.
- `apps/server/src/workers/csv-import.worker.ts` - awaited the new validator.
- `apps/server/src/services/storage.service.ts` - awaited the new validator and redirect-safe fetch helper for remote image downloads.

## Verification Results

- `pnpm --filter server test src/lib/url-validator.test.ts` - pass.
- `pnpm --filter server test src/lib/api-client.test.ts` - pass.
- `pnpm --filter server typecheck` - pass.
- `pnpm lint` - root lint still fails because of pre-existing unrelated formatting issues in `apps/server/browser/server.js`, `apps/web/src/locales/en/common.json`, `apps/web/src/locales/id/common.json`, `apps/web/src/routeTree.gen.ts`, `apps/web/src/typography.css`, and `docs/browser-image-optimization.md`.

## Drift Check

- Stayed within phase 1 scope.
- No CI workflow changes were made.
- The async validator change rippled only to the SSRF-sensitive call sites.

## Remaining Risks

- Phase 3 still remains: applying the deeper guard to every server URL entry point.
- The repo has unrelated pre-existing worktree changes that were intentionally left untouched.

## Completion Summary

Completed the SSRF guard foundation and redirect-safe fetching by making URL validation async and DNS-aware, adding redirect revalidation for SSRF-sensitive downloads, and verifying the new behavior with focused tests and server typecheck.
