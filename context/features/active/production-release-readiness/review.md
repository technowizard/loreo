# Production Release Readiness Review

## Goal Coverage

- Phase 1 is complete. The server URL validator is now async, resolves hostnames with DNS at request time, rejects localhost/private/link-local/multicast/unspecified literals, and rejects hostnames that resolve to blocked ranges.
- Phase 2 is complete. Redirect-following downloads now revalidate each redirect target, reject private/loopback redirect destinations, and stop after a small redirect budget.
- Phase 3 is complete. The server URL entry points and content extraction worker now validate URLs before creating links or navigating the browser.
- Phase 4 is complete. Remote image downloads now pass through URL validation and redirect revalidation before storage writes.

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
- `apps/server/src/lib/article-url-guard.ts` - added a small article URL safety wrapper around the async validator.
- `apps/server/src/lib/article-url-guard.test.ts` - added a focused rejection test for unsafe article URLs.
- `apps/server/src/workers/content-extraction.worker.ts` - validates article URLs before calling the browser service.
- `apps/server/src/services/storage.service.ts` - routes remote image downloads through URL validation and redirect-safe fetches for both local and S3 adapters.
- `apps/server/src/routes/files/files.test.ts` - covers rejection of a private-network remote image URL.

## Verification Results

- `pnpm --filter server test src/lib/url-validator.test.ts` - pass.
- `pnpm --filter server test src/lib/api-client.test.ts` - pass.
- `pnpm --filter server test src/lib/article-url-guard.test.ts` - pass.
- `pnpm --filter server test src/lib/api-client.test.ts` - pass.
- `pnpm --filter server test src/routes/files/files.test.ts` - pass.
- `pnpm --filter server typecheck` - pass.
- `pnpm lint` - root lint still fails because of pre-existing unrelated formatting issues in `apps/server/browser/server.js`, `apps/web/src/locales/en/common.json`, `apps/web/src/locales/id/common.json`, `apps/web/src/routeTree.gen.ts`, `apps/web/src/typography.css`, and `docs/browser-image-optimization.md`.

## Drift Check

- Stayed within phase 1 scope.
- No CI workflow changes were made.
- The async validator change rippled only to the SSRF-sensitive call sites.

## Remaining Risks

- Phase 5 still remains: browser extraction backstop.
- The repo has unrelated pre-existing worktree changes that were intentionally left untouched.

## Completion Summary

Completed the SSRF guard foundation, redirect-safe fetching, the browser-navigation backstop, and remote image download safety by making URL validation async and DNS-aware, adding redirect revalidation for SSRF-sensitive downloads, validating article URLs before browser navigation, routing remote image downloads through validated fetches, and verifying the new behavior with focused tests and server typecheck.
