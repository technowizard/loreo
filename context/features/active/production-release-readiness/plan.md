# Production Release Readiness Plan

## Approach

Implement this as a small set of security- and release-focused slices. Start with the SSRF guard because it protects both article extraction and image downloading, then add browser network isolation guidance/configuration, then update release docs and smoke tests. Keep CI workflow setup explicitly out of scope.

The smallest correct implementation is:

- Replace the synchronous `isValidUrl()` allow/deny check with a deeper async URL safety module that validates protocol, hostname, DNS results, and redirect targets near the actual request.
- Reuse that deeper guard at every server-side URL ingestion/fetch boundary: direct link creation, CSV/import preview, CSV worker ingestion, browser article navigation, and remote image downloads.
- Add browser-context request blocking as an app-level backstop for private/internal requests, while documenting that real production isolation still needs network-level egress controls or an egress proxy.
- Improve production Compose/docs for least-privilege browser networking where Compose can help, without pretending Compose alone can enforce all outbound egress restrictions.
- Add release/security documentation and frontend smoke tests that exercise critical app load/auth surfaces.

## Files Likely To Change

- `apps/server/src/lib/url-validator.ts` - replace or extend the current direct-host validator with async DNS-aware validation, redirect validation helpers, and shared private-address checks.
- `apps/server/src/lib/url-validator.test.ts` or an equivalent server test file - cover localhost, private IP literals, public hostnames resolving to private addresses, redirect targets, and allowed public URLs.
- `apps/server/src/routes/links/links.handlers.ts` - await the deeper URL safety check before accepting new links.
- `apps/server/src/routes/links/links.test.ts` - update existing invalid URL tests and add DNS/redirect-aware cases if they fit route-level tests.
- `apps/server/src/routes/imports/imports.handlers.ts` - use async URL validation in CSV preview/import validation paths.
- `apps/server/src/workers/csv-import.worker.ts` - use async URL validation before creating imported links from worker jobs.
- `apps/server/src/workers/content-extraction.worker.ts` - validate article URL before browser navigation and keep image downloads behind the shared guard.
- `apps/server/src/services/browser.service.ts` - add browser context request interception/backstop blocking for internal/private URL requests and document why this is defense-in-depth only.
- `apps/server/src/services/storage.service.ts` - validate remote image URLs with the deeper guard and prevent automatic redirects from bypassing validation.
- `apps/server/src/lib/api-client.ts` - add a fetch path or option that disables automatic redirect following for SSRF-sensitive downloads, if needed by the URL guard.
- `apps/server/src/routes/files/files.test.ts` - update remote image download SSRF coverage.
- `docker-compose.prod.yml` - add any safe Compose-level hardening that does not break the current local production path, such as explicit networks and clear service membership.
- `docs/READINESS.md` - mark completed items, keep caveats accurate, and record remaining browser isolation limits.
- `docs/RELEASE_CHECKLIST.md` - fix the browser build command context, document the fresh-clone smoke path, and keep CI workflow unchecked/out of scope.
- `.env.example`, `apps/server/.env.example`, `apps/web/.env.example` - clarify production-only secret requirements and same-origin/proxy defaults where needed.
- `README.md` - update deployment notes for `PUBLIC_URL`, `VITE_API_URL`, strong secrets, and browser isolation expectations.
- `SECURITY.md` - add vulnerability reporting instructions.
- `apps/web/src/**/*.test.tsx` - add smoke-level tests for app shell/load and a critical auth or link-management flow.
- `apps/web/src/tests/**` - add or adjust test helpers/MSW handlers if needed for the smoke tests.

## Data Or API Changes

- No database schema change is expected.
- The server URL validation boundary may become async. Any callers currently using `isValidUrl()` synchronously will need to await the new safe-url API.
- Remote image downloads should avoid automatic redirect following unless every redirect target is revalidated first.
- Browser extraction may reject pages or subresources that resolve to private/internal addresses; error messages should remain generic enough not to leak internal network details.
- Production Docker topology may gain explicit networks, but the public local testing interface should remain web on `3001` and API on `3000` unless intentionally changed later.

## Test Strategy

- Server unit/integration tests:
  - URL validator rejects `localhost`, loopback, private, link-local, multicast, unspecified, and private DNS resolutions.
  - URL validator rechecks redirect targets.
  - Link creation rejects unsafe URLs before enqueueing extraction.
  - Remote image downloads reject unsafe source URLs and unsafe redirect targets.
  - Browser request guard rejects private/internal navigation or subresource requests where practical to test without launching a real browser.
- Web smoke tests:
  - App/auth shell renders without crashing.
  - Login or quick-add/link-management critical path renders and handles basic form behavior with MSW-backed API responses.
- Docker/manual verification:
  - `docker compose --env-file .env.example -f docker-compose.prod.yml config`
  - Production stack starts cleanly from documented commands.
  - Web can reach API through the nginx same-origin proxy.
  - Browser port `4444` is not published.

Primary commands before completion:

```bash
pnpm --filter server test
pnpm --filter web test
pnpm typecheck
pnpm lint
pnpm build
docker compose --env-file .env.example -f docker-compose.prod.yml config
```

Run Docker image builds and a production Compose smoke test when implementation is ready and Docker is available.

## Rollback Plan

- URL hardening changes can be reverted by restoring the previous validator and call sites, but keep the tests to show which cases become unprotected.
- Browser request-blocking changes can be disabled by reverting `BrowserService` context interception if it causes false positives.
- Compose network changes can be rolled back to the current single-network service layout while keeping documentation that production needs stronger isolation.
- Documentation and `SECURITY.md` changes are safe to revert independently.
- Frontend smoke tests can be removed independently if they are unstable, but record the accepted coverage gap in `docs/READINESS.md`.

## Decisions Needed

- Whether production browser isolation should be implemented only as docs/Compose guidance for now, or whether to add a stricter required deployment pattern such as an egress proxy.
- Whether to enforce minimum `JWT_SECRET` and database password lengths in runtime env validation now, or document requirements only.
- Whether frontend smoke tests should stay as Vitest/jsdom component tests or introduce browser-level E2E later. This plan uses Vitest/jsdom to avoid adding new infrastructure.

## Out Of Scope

- CI workflow setup or `.github/workflows/ci.yml`.
- Release automation, changelog automation, and tag publishing.
- Replacing Camoufox/Playwright with another extraction engine.
