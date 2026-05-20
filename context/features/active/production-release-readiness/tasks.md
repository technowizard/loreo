# Production Release Readiness Tasks

## Scope

Implement the high and medium readiness items from `brief.md` and `plan.md`. Do not add or modify CI workflow setup.

## Phase 1: SSRF Guard Foundation

- [x] Add failing tests for DNS-aware URL validation in `apps/server/src/lib/url-validator.test.ts`
  - [x] Reject `localhost` and `*.localhost`.
  - [x] Reject loopback, private, link-local, multicast, and unspecified IP literals.
  - [x] Reject public hostnames that resolve to blocked IP ranges.
  - [x] Accept normal `http` and `https` public URLs.
  - [x] Reject non-HTTP(S) schemes.
- [x] Implement async safe URL validation in `apps/server/src/lib/url-validator.ts`
  - [x] Keep or replace `isValidUrl()` intentionally; avoid ambiguous sync/async APIs.
  - [x] Resolve DNS close to request time.
  - [x] Centralize blocked address/range checks.
  - [x] Return safe boolean/result data without leaking internal details to API callers.
- [x] Run server validator tests.

## Phase 2: Redirect-Safe Fetching

- [x] Add failing tests for redirect target revalidation.
  - [x] Public URL redirecting to private/loopback target is rejected.
  - [x] Allowed redirect chain stays accepted within a small redirect limit.
  - [x] Excessive redirect chains fail safely.
- [x] Add a redirect-aware fetch helper or option for SSRF-sensitive downloads.
  - [x] Disable automatic redirect following where needed.
  - [x] Revalidate each `Location` target before continuing.
  - [x] Preserve timeout and user-agent behavior used by image downloads.
- [x] Run the redirect/url validator tests.

## Phase 3: Apply Guard To Server URL Entry Points

- [x] Update `apps/server/src/routes/links/links.handlers.ts` to await the deeper URL guard before creating links.
- [x] Update `apps/server/src/routes/imports/imports.handlers.ts` to validate CSV preview/import URLs with the deeper guard.
- [x] Update `apps/server/src/workers/csv-import.worker.ts` to validate imported URLs with the deeper guard before creating links.
- [x] Update `apps/server/src/workers/content-extraction.worker.ts` to validate article URLs before browser navigation.
- [x] Update tests around link creation/import validation.
- [x] Run relevant server route/worker tests.

## Phase 4: Apply Guard To Remote Image Downloads

- [x] Update `apps/server/src/services/storage.service.ts` to use the deeper URL guard before remote image downloads.
- [x] Route image downloads through the redirect-safe fetch path.
- [x] Ensure both local and S3 storage adapters use equivalent remote image URL safety.
- [x] Update `apps/server/src/routes/files/files.test.ts` or storage tests for unsafe image URL and unsafe redirect rejection.
- [x] Run remote image/storage related tests.

## Phase 5: Browser Extraction Backstop

- [x] Add a testable helper for browser request URL blocking.
  - [x] Reject internal/private URL requests.
  - [x] Allow normal public asset/document requests.
- [x] Update `apps/server/src/services/browser.service.ts` to install browser context request interception.
  - [x] Block private/internal navigation and subresource requests.
  - [x] Keep logging useful without exposing sensitive internal host details.
  - [x] Make clear in code/docs this is defense-in-depth, not full infrastructure isolation.
- [x] Run browser service/request-blocking tests where practical.

## Phase 6: Docker Browser Isolation Guidance

- [x] Review `docker-compose.prod.yml` service networks and add safe explicit network membership if it does not break local production testing.
- [x] Confirm browser port `4444` remains un-published to the host.
- [x] Document what Compose can and cannot enforce for browser egress.
- [x] Document the stronger production recommendation: separate browser sandbox or egress proxy that blocks private ranges and metadata endpoints.
- [x] Run `docker compose --env-file .env.example -f docker-compose.prod.yml config`.

## Phase 7: Production Secrets And Deployment Docs

- [ ] Decide whether to enforce minimum `JWT_SECRET` and database password lengths at runtime or document requirements only.
- [ ] Update env examples and deployment docs to require strong deployment-specific values.
- [ ] Verify `PUBLIC_URL`, `VITE_API_URL`, and `CORS_ORIGINS` docs match the same-origin nginx proxy production shape.
- [ ] Review cookie/CORS notes against the intended production domain model.
- [ ] Add `SECURITY.md` with vulnerability reporting instructions.
- [ ] Update `docs/READINESS.md` and `docs/RELEASE_CHECKLIST.md` to reflect completed and remaining readiness items.
- [ ] Fix the release checklist browser Docker build context if still incorrect.

## Phase 8: Frontend Smoke Tests

- [ ] Add smoke test for app/auth shell rendering without crashing.
- [ ] Add one critical auth or link-management smoke test using existing Vitest/jsdom/MSW setup.
- [ ] Avoid adding new E2E infrastructure in this feature.
- [ ] Run `pnpm --filter web test`.

## Phase 9: Full Verification And Review

- [ ] Run `pnpm --filter server test`.
- [ ] Run `pnpm --filter web test`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build`.
- [ ] Run `docker compose --env-file .env.example -f docker-compose.prod.yml config`.
- [ ] If Docker is available, rebuild production images and smoke test production Compose from documented commands.
- [ ] Record verification results, changed files, accepted gaps, and remaining risks in `review.md`.

## Dependencies

- Phase 2 depends on Phase 1.
- Phases 3 and 4 depend on Phases 1 and 2.
- Phase 5 depends on the URL blocking helper from Phase 1, but can be implemented before Phases 3 and 4 if needed.
- Phase 8 can run independently after the initial task branch exists.
- Phase 9 must run last.

## Notes

- CI workflow setup is intentionally excluded.
- Do not weaken `secureHeaders()` or same-origin production behavior to make tests easier.
- Prefer small, test-backed changes. This is security-sensitive; avoid broad refactors while applying the guard.
