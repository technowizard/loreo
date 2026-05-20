# Demo Mode Shared Demo Brief

## Problem

Potential users need a safe way to try Loreo without production infrastructure, production data, external extraction costs, or destructive/shared-state surprises.

## Goals

- Support a public demo deployment using the same codebase with `DEMO_MODE=true`, dedicated demo infrastructure, and seeded sample content.
- Provide a shared demo account that can browse pre-seeded articles, tags, highlights, notes, and default reader settings.
- Keep the reader experience interactive while blocking costly, destructive, account-mutating, import, link mutation, tag mutation, extraction, and shared reader-settings mutation paths on the server.
- Add demo-mode UI affordances: a visible app banner, demo login guidance or shortcut, and disabled or hidden entry points for blocked behavior.
- Add an idempotent demo seed/reset path that restores the shared demo account and sample data on demand or via schedule.

## Non-Goals

- Do not use production infrastructure, production secrets, or production data for the demo.
- Do not run the browser extraction service for the MVP unless app startup requires it.
- Do not rely on client-side hiding or disabling as the only enforcement for blocked actions.
- Do not require a custom demo domain for the first version.
- Do not require private GHCR images for the MVP unless Render repo builds prove inadequate.

## Acceptance Criteria

- [ ] Server env validation exposes `env.isDemo` from `DEMO_MODE` and demo restrictions depend on that boolean.
- [ ] Demo mode blocks registration, account mutation, avatar upload, link create/refetch/delete/update/tag-update, CSV upload/preview/execute/retry/resume/cancel, tag and tag-group mutations, extraction enqueueing, and worker crawling/import jobs with clear `403` responses where applicable.
- [ ] Reader settings changes are local-only in the browser for demo mode and do not mutate the shared demo account on the server.
- [ ] Seeded highlight examples are visible in demo content, and demo users can create/update/delete temporary highlights that are cleaned up by the reset cadence.
- [ ] Demo seed/reset creates the shared demo account plus seeded articles, tags, tag groups, highlights, notes, and reader settings, and is idempotent.
- [ ] Web app exposes a public demo flag only for UX and renders a compact authenticated demo banner.
- [ ] Demo login guidance or a `Try Demo` shortcut is available, and register/import/tag/link mutation entry points are hidden or disabled in demo mode.
- [ ] Deployment docs or workflow notes cover Render web/API services, dedicated Neon Postgres, optional Upstash Redis, demo secrets, CORS, public URL, and reset cadence.

## Decisions

- Demo account password will be a documented placeholder in code/docs and filled by the operator before deployment.
- Reset cadence target is every 6 hours for the public demo. This is expected to be negligible compared with nightly reset if the reset only performs small database cleanup/seed writes and does not crawl, import, upload, or invoke extraction services.
- Reader settings should remain local-only in demo mode. The web already persists reader preferences in local storage through Zustand, so demo mode should avoid writing these changes to the shared account.
- Highlight policy is hybrid: seed pre-highlighted text and allow temporary highlight create/update/delete so users can experience the reader interaction, with six-hour reset cleanup.
- Render direct repo builds are the MVP default. Private GHCR images are deferred until there is a concrete need for pinned private images, multi-service image promotion, or stricter release provenance.

## Risks

- Shared-account mutations can affect all visitors until reset, especially highlights if highlight CRUD remains enabled.
- Missing a server-side mutation guard could allow destructive changes despite disabled UI.
- Worker or queue startup may still require Redis or extraction-related services even if demo mode blocks runtime jobs.
- Seed/reset safety must prevent accidental production or development database resets.
- Demo credentials and demo-only secrets need to remain separate from production values.

## Verification

- Server tests for demo-mode `403` behavior across auth, imports, links, tags, tag groups, extraction enqueueing, and worker startup paths.
- Server tests confirming reader-settings server mutation is blocked or bypassed in demo mode while local reader settings still work in the web app.
- Server/web tests for the hybrid highlight policy: seeded highlights visible and temporary highlight create/update/delete works in demo mode.
- Seed/reset idempotency test or repeat-run manual verification against a demo database.
- Web tests for the demo banner, disabled registration/import/tag mutation entry points, and preserved highlight interactions.
- Manual demo deployment smoke check: log in as the demo user, browse seeded data, create/update highlights, verify blocked actions show clear demo-mode messaging, and verify reset restores seeded state.
