# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

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
