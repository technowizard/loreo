# Loreo Readiness Notes

Use this document to track what is needed before the initial GitHub commit and before the first public/self-hosted release.

## Current verified baseline

Recent local verification passed:

```bash
pnpm lint
pnpm typecheck
pnpm --filter server test
```

Server route tests currently pass with 134 tests across 8 test files. The repository has not been staged or committed yet.

## Initial GitHub commit readiness

### Ready

- Environment files are ignored, including `.env.test`.
- Example environment files exist for root, server, server test, web, and web test configuration.
- Current migrations live under `apps/server/src/db/migrations`; old `migrations-bak/` material has been removed.
- Server tests pass from a clean test database reset.
- Workspace typecheck and lint pass.
- Docker Compose config validates for local and production compose files.
- Browser service is no longer published on a public host port in Compose.

### Strongly recommended before the first push

- Add GitHub Actions CI for:
  - dependency installation,
  - `pnpm lint`,
  - `pnpm typecheck`,
  - `pnpm --filter server test`,
  - production builds if CI runtime allows Docker/build tooling.
- Review `git status --short` before staging because this is still an initial untracked repository.
- Add `SECURITY.md` if the repository will be public.
- Decide whether to add `CHANGELOG.md` and `CONTRIBUTING.md` now or in the first follow-up branch.

## Initial release readiness

The initial release has a higher bar than the initial GitHub commit. Treat these as release blockers or release-track follow-ups.

### Security

#### Addressed baseline items

- Local file storage path traversal is hardened by rejecting unsafe storage keys and enforcing resolved paths stay inside the storage root.
- Submitted link URLs reject non-HTTP(S), localhost, and direct private-network IP hosts.
- Article image downloads reuse URL validation before server-side fetches.
- Auth register and login routes have endpoint-specific rate limit middleware.
- Browser automation is internal-only in Docker Compose; port `4444` is exposed only inside the Compose network.
- Browser automation is isolated to its own Compose network so it does not share backend services like Postgres or Redis.
- `.env`, local env files, and `.env.test` are ignored.

#### Needed before internet-facing release

- Harden SSRF validation beyond direct host checks:
  - resolve DNS before fetch/navigation,
  - reject resolved loopback, link-local, private, multicast, and unspecified addresses,
  - re-check every redirect target,
  - consider DNS rebinding by resolving close to the actual request.
- Apply the deeper SSRF guard to both:
  - browser/article URL navigation,
  - server-side image downloads.
- Isolate browser extraction from private infrastructure:
  - no access to host network,
  - no access to cloud metadata endpoints,
  - least-privilege container networking.
- Compose network separation is a baseline only; it does not replace a stronger browser sandbox or egress proxy.
- Replace all production secrets with strong deployment-specific values:
  - `JWT_SECRET`,
  - database password,
  - S3 credentials if used.
- Add `SECURITY.md` with vulnerability reporting instructions.
- Review production CORS origins and cookie settings against the real deployment domain.

### Non-security

- Add CI before relying on the repository as a collaboration baseline.
- Add at least smoke-level frontend tests for critical flows:
  - app loads,
  - auth form behavior,
  - link creation/listing flow if practical.
- Keep test DB reset serial. The current test migration script drops and recreates `public`, so concurrent test commands against the same database can collide.
- Publish GHCR images used by `docker-compose.prod.yml`:
  - `ghcr.io/technowizard17/loreo-browser`,
  - `ghcr.io/technowizard17/loreo-server`,
  - `ghcr.io/technowizard17/loreo-web`.
- Add or document an image publishing workflow.
- Smoke test production Compose from a fresh clone using only documented commands.
- Decide release versioning and changelog process before tagging `v0.1.0`.
- Confirm README setup, Docker, testing, and deployment commands stay aligned with `package.json` scripts.

## Known caveats

- Current SSRF protection is a baseline. It blocks direct localhost/private IP inputs, but not public hostnames that resolve to private addresses or redirect to private addresses.
- Camoufox server mode is experimental. Treat browser extraction as infrastructure-sensitive and best-effort until it has stronger isolation and operational monitoring.
- Production Compose references GHCR images that must be published before users can pull them.
- Web test coverage is lighter than server test coverage.
