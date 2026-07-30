# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

- Store extracted article body images under per-user, ownership-checked paths so users cannot read each other's images; add `ALLOW_LEGACY_SHARED_ARTICLES` to keep older articles rendering during migration.
- Scope highlight and tag enrichment to the requesting user across home, upcoming, and search.
- Validate image uploads by sniffing file content instead of trusting filename or Content-Type.
- Gate rate-limit client identification on forwarded headers behind `BEHIND_PROXY`/`TRUSTED_PROXIES`; default to the direct connection IP.
- Assign the first admin account atomically so concurrent initial sign-ups settle on exactly one admin.
- Save reading progress when closing the tab via a keepalive request instead of dropping the final update.
- Stop retrying non-idempotent actions such as link create/delete, and drop auth errors from HTTP retry cascades.
- Resume stalled article extraction and reset stuck processing rows instead of skipping retries.
- Align the create-link tag shape between web and server, guarded by a contract test that fails on drift.
- Trim full text content from list and search responses.
- Parallelize home-suggestion reads and collapse short/long reading counts into a single query.
- Declare the generated search index column and indexes in the schema so schema sync cannot drop them.
- Refresh production dependencies and align Tailwind CSS core with the Vite plugin at version 4.3.3.
- Replace the unmaintained `private-ip` URL-validation dependency with `ipaddr.js` and expand SSRF protection coverage.
- Make the production dependency audit a blocking CI check after clearing high-severity vulnerabilities.

## [v0.2.0] - 2026-07-29

- Add user-curated RSS and Atom subscriptions with staged Review, Saved, and Dismissed collections.
- Add source filtering, newest/oldest sorting, cursor-based infinite loading, and responsive feed management.
- Add per-feed pause, future-only Auto-save, health warnings, and confirmed deletion that preserves saved articles.
- Add autonomous conditional polling with failure backoff, bounded retention, SSRF-safe fetching, and parser workload limits.
- Add admin dashboard with dedicated layout for account management and service health visibility.
- Add admin account management: list, detail, update name/role, reset password, soft delete, and restore users.
- Expose user role in current-user response; client role gates admin navigation affordance only.
- Add service connections health check with camoufox browser probe.
- Add per-user article count column on admin accounts table.
- Add last-admin protection: server blocks demotion/deletion that would leave zero active admins; UI disables mutations targeting admin-role users.

## [v0.1.2] - 2026-05-29

- Enhance delete article logic to prevent multiple API calls once an article is deleted that returns 404.
- Improve meta invalidate handling when deleting article.
- Minor fixes: add saving state toast when submitting article, reset form when dialog dismissed.

## [v0.1.1] - 2026-05-28

- Centralized i18n translations.
- Fix duplicate toast containers.

## [v0.1.0] - 2026-05-24

- Initial public release of Loreo.
- Save, read, tag, highlight, and import articles.
- Self-hosted deployment with Docker Compose and production images.
