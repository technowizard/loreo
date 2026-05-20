# Release Checklist

Use this checklist before publishing Loreo to GitHub or cutting a release. See `docs/READINESS.md` for the fuller readiness notes and known caveats.

## 1. Repository readiness

- [ ] Confirm `LICENSE` is complete and accurate.
- [ ] Add or update `CHANGELOG.md` with user-facing changes.
- [ ] Add `CONTRIBUTING.md` if outside contributors are expected.
- [ ] Add `SECURITY.md` with vulnerability reporting instructions.
- [ ] Review `docs/READINESS.md` and decide which follow-ups are required for this release.
- [ ] Review `README.md` for accurate setup, development, testing, and deployment instructions.
- [ ] Confirm screenshots, demo links, and project description are ready for a public repository.

## 2. Environment and configuration

- [ ] Verify root `.env.example` includes every variable needed by Docker Compose.
- [ ] Verify `apps/server/.env.example` includes every required server variable.
- [ ] Verify `apps/web/.env.example` includes every required web variable.
- [ ] Confirm no secrets, credentials, private URLs, or local-only values are committed.
- [ ] Document required production environment variables in the README or deployment docs.
- [ ] Replace production `JWT_SECRET`, database passwords, and object-storage credentials with strong deployment-specific values.

## 3. Local quality gates

Run these checks from the repository root before release:

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

- [ ] Type checking passes.
- [ ] Linting and formatting pass.
- [ ] Tests pass.
- [ ] Production builds pass.
- [ ] Frontend smoke tests exist or the lack of frontend test coverage is explicitly accepted for this release.

## 4. Docker release validation

- [ ] Build the server production image.
- [ ] Build the web production image with the correct `VITE_API_URL`.
- [ ] Build or publish the browser production image.
- [ ] Smoke test the production compose stack.

```bash
docker build -f apps/server/Dockerfile.prod -t loreo-server:release .
docker build -f apps/web/Dockerfile.prod --build-arg VITE_API_URL=<production-api-url> -t loreo-web:release .
docker build -f apps/server/Dockerfile.browser -t loreo-browser:release apps/server
docker compose -f docker-compose.prod.yml up -d
```

- [ ] Confirm the web app can reach the API.
- [ ] Confirm database migrations are applied or documented.
- [ ] Confirm the server can reach Camoufox through the internal `BROWSER_URL`.
- [ ] Confirm browser port `4444` is not publicly exposed.
- [ ] Confirm production containers restart cleanly.

## 5. Security release validation

- [ ] Confirm submitted article URLs reject localhost and private IP inputs.
- [ ] Confirm server-side image downloads reject localhost and private IP inputs.
- [ ] Confirm local file storage cannot read outside the configured storage root.
- [ ] Confirm auth register and login routes have rate limiting enabled.
- [ ] Decide whether DNS and redirect-aware SSRF hardening is required before this release.
- [ ] Confirm browser extraction is isolated from host/private networks and cloud metadata endpoints.
- [ ] Confirm browser extraction is isolated from host/private networks and cloud metadata endpoints, and that Compose network separation is not treated as the only control.

## 6. GitHub readiness

- [ ] Add `.github/workflows/ci.yml` or confirm CI runs equivalent checks.
- [ ] Ensure CI runs server tests serially against the test database, not multiple concurrent DB reset commands.
- [ ] Publish GHCR images or document that production images are not yet available.
- [ ] Decide the initial release version, for example `v0.1.0`.
- [ ] Decide the release process:
  - manual GitHub release,
  - Git tags only,
  - or automated changelog/release workflow.
- [ ] Create release notes from `CHANGELOG.md` or merged PR summaries.
- [ ] Confirm repository topics, description, homepage, and visibility settings.

## 7. Final public-release smoke test

- [ ] Fresh clone setup works using only documented instructions.
- [ ] Docker-based setup works.
- [ ] Local development setup works.
- [ ] README commands match actual `package.json` scripts.
- [ ] Public repository contains no private/internal data.
- [ ] `docker-compose.prod.yml` works with published images or documented local builds.
- [ ] GitHub release artifact or tag is published successfully.
