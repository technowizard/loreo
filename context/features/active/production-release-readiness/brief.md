# Production Release Readiness Brief

## Problem

Loreo's production Docker stack now builds and runs locally, but several release-readiness items remain before an internet-facing deployment is safe and repeatable. The remaining work is mostly security hardening, deployment guidance, smoke-test coverage, and release documentation.

## Goals

- Harden SSRF protection for submitted article URLs and server-side image downloads beyond direct localhost/private-IP checks.
- Improve browser extraction isolation so Camoufox cannot be used to reach app internals, databases, host services, cloud metadata, or private networks.
- Document and validate strong production-specific secrets and environment values.
- Add vulnerability reporting guidance via `SECURITY.md`.
- Add smoke-level frontend coverage for critical flows.
- Perform and document a public-release smoke test from a fresh clone using documented commands.
- Review production CORS origins and cookie settings against the intended deployment shape.

## Non-Goals

- Do not add or modify CI workflow setup in this feature.
- Do not change release versioning, changelog automation, or GitHub release automation unless explicitly requested later.
- Do not remove the existing production Docker Compose local-testing path.
- Do not weaken production security headers or browser same-origin protections to make local testing easier.

## Acceptance Criteria

- [ ] Submitted article URL validation rejects hosts that resolve to loopback, link-local, private, multicast, or unspecified addresses.
- [ ] Redirect targets are revalidated before fetch/navigation continues.
- [ ] Server-side image downloads use the same deeper URL safety checks as article extraction.
- [ ] Browser extraction has a documented and/or implemented isolation strategy that prevents access to app internals, database/cache services, host network, and cloud metadata endpoints.
- [ ] Production secrets/env documentation clearly requires deployment-specific `JWT_SECRET`, database password, and object-storage credentials when used.
- [ ] `SECURITY.md` documents how to report vulnerabilities.
- [ ] Frontend smoke tests cover app load and at least one critical auth or link-management flow, or any gap is explicitly accepted in readiness docs.
- [ ] Fresh-clone production Docker setup is smoke-tested using documented commands and results are recorded.
- [ ] Production CORS origins and cookie settings are reviewed for the intended same-origin/proxied deployment.
- [ ] CI workflow setup remains out of scope for this feature.

## Risks

- SSRF protection can be bypassed if DNS is checked only at input time and not near the actual request.
- Browser automation can load subresources and execute JavaScript, so app-level URL validation alone is not enough.
- Docker Compose network segmentation may not be sufficient without explicit egress controls or a proxy.
- Stronger URL filtering may block legitimate edge-case URLs and needs clear error handling.
- Frontend smoke tests may require stable test data and auth setup.

## Verification

- Add or update tests for URL validation with DNS-resolved private ranges and redirect targets where practical.
- Run relevant server tests for SSRF/url-validation paths.
- Run frontend smoke tests added for this feature.
- Run `pnpm typecheck`, `pnpm lint`, and relevant package tests before completion.
- Manually smoke test production Docker setup from documented commands and record the result in the feature review.
