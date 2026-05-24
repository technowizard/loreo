# Loreo

![Cover](./docs/images/cover.png)

Loreo is a read-it-later app for saving articles worth revisiting, built with self-hosting in mind.

## Demo

[Demo](https://loreo-demo.onrender.com)

> The demo runs on a free tier Render instance, expect a cold start on first visit (~30s). Self-hosted instances don't have this limitation.
> The demo is read-only, you can't save or edit articles.

## Screenshots

<table>
  <tr>
    <td><img src="docs/images/reading-list.png" alt="Article list" /></td>
    <td><img src="docs/images/reading-view.png" alt="Archive view" /></td>
  </tr>
</table>

## Features

### Reading Experience

- Focused reader view
- Customize theme, font, spacing, and alignment
- Highlight and annotate text
- Paragraph focus indicator
- Full keyboard navigation (`j/k`, arrow keys)
- Automatic reading progress saves

### Saving & Organization

- Save links with automatic article extraction
- Favorite articles for quick access
- Archive articles to hide them from your reading list
- Organize with tag groups and tags
- Filter by status, priority, read length, and search
- Priority system for intentional reading

### Utilities

- CSV import with field mapping
- Docker Compose support, run locally or as separate web/server processes

## Why Loreo?

Most read-later apps eventually become cluttered: too many features, too much noise, and endless accumulation. Loreo aims to be different by focusing on the core functionality of saving and reading articles, while providing a clean and distraction-free interface.

Loreo is built around a simpler idea: you shouldn't have to consume everything immediately.

Save something once, trust it will be there later, and come back when you actually have the time and focus for it.

The goal is not productivity maximization, but creating a calmer relationship with information.

## Why this exists

I was a [Pocket](https://getpocket.com) user for a decade, but they decided to [shut down their service](https://blog.mozilla.org/en/mozilla/building-whats-next/). I tried finding alternatives, but most of them either just bookmark links without actually saving the content, have cluttered dashboards, or have too many features that I don't need. So I decided to build a calm, focused read-it-later app that I could self-host myself.

## Behind the Name

The name "Loreo" is derived from "Lore" (the story or content). It represents the idea of letting things flow naturally: saving it now and coming back to it later, without pressure. It's a small reflection of the app itself: calm, intentional, and designed around revisiting things when the time feels right

## Stack

This is a monorepo project using pnpm workspaces based on my [monorepo template](https://github.com/technowizard/monorepo-template).

**Frontend**

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite 8](https://vite.dev) - build tool and dev server
- [TanStack Router](https://tanstack.com/router) - file-based routing with typed URL search params
- [TanStack Query](https://tanstack.com/query) - server state, centralized mutation invalidation via `MutationCache`
- [ky](https://github.com/sindresorhus/ky) HTTP client based on native Fetch API
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (Base UI variant)
- [i18next](https://www.i18next.com) - i18n with EN/ID support (can be extended to other languages)
- [Zustand](https://zustand-demo.pmnd.rs) + [Immer](https://immerjs.github.io/immer) - client-only state (ephemeral UI state that doesn't belong in the URL or server cache)
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) + [MSW](https://mswjs.io) - unit and integration tests

**Backend**

- [Hono](https://hono.dev) - lightweight HTTP framework
- [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL - type-safe database access
- [Redis](https://redis.io) + [BullMQ](https://github.com/taskforcesh/bullmq) - background jobs processing
- [Playwright](https://playwright.dev) + [Camoufox](https://github.com/daijiro/camoufox) - browser service for crawling and article extraction
- [Mozilla Readability](https://github.com/mozilla/readability) - content extraction from web pages
- [Zod](https://zod.dev) - request/response validation
- OpenAPI docs via `@hono/zod-openapi` + Scalar UI
- [Vitest](https://vitest.dev) - handler tests with centralized in-memory adapters, no database required

**Monorepo**

- [pnpm workspaces](https://pnpm.io/workspaces) - package management
- [Docker Compose](https://docs.docker.com/compose) - local dev with Postgres
- [Husky](https://typicode.github.io/husky) + [lint-staged](https://github.com/lint-staged/lint-staged) - pre-commit hooks
- [oxlint](https://oxc.rs/docs/guide/usage/linter) + [oxfmt](https://oxc.rs) + [@fdhl/oxlint-config](https://github.com/technowizard/oxlint-config) - fast linting and formatting
- [Commitizen](https://commitizen-tools.github.io/commitizen) + [commitlint](https://commitlint.js.org) - conventional commits

## Note About Development

This project is built as a personal tool I use daily, with a focus on intentional design decisions over feature accumulation. I'm open to suggestions and contributions that align with that philosophy.

## License & Philosophy

Loreo is open source because personal reading infrastructure should be inspectable,
moddable, and self-hostable; not locked behind a service that can shut down.
AGPL-3.0 ensures that hosted forks remain open to the community.

This means:

- You can self-host, modify, and use Loreo freely
- If you host a modified version for others, you must publish your changes under AGPL-3.0
- Commercial use requires a separate agreement

Loreo is not a permissive-licensed library. It is a product with a philosophy.

Licensed under [AGPL-3.0](LICENSE).

## Contributing

Contributions are welcome. Please open an issue before submitting a PR so we can
discuss the approach first. See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

Loreo is intentionally focused on calm, intentional reading and revisitability.
Feature proposals are evaluated against that philosophy — if it adds noise or moves
Loreo toward a general-purpose tool, it's probably not a fit.

## Acknowledgements

Open-source software and transparent architecture discussions helped Loreo tremendously during development, so proper attribution feels important.

- [Karakeep](https://github.com/karakeep-app/karakeep) — inspiration for how scraping works and self-hosting patterns

## Project Structure

```text
loreo/
├── apps/
│   ├── server/          # Hono API, jobs, storage, DB schema, migrations
│   └── web/             # React app, routes, features, shared UI
├── packages/
│   └── config/          # Shared TypeScript configs
├── docs/                # Docs, self-hosting templates
├── docker-compose.yml   # Local development stack
└── docker-compose.prod.yml
```

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker, for the recommended local setup

## Getting Started

Install dependencies:

```bash
pnpm install
```

Copy the root environment example:

```bash
cp .env.example .env
```

Start the Docker stack:

```bash
pnpm dev
```

This starts Postgres, Redis, the browser extraction service, the API, and the web app.

- Web app: http://localhost:3001
- API: http://localhost:3000
- API docs: http://localhost:3000/reference

## Local Development Without Docker

Run Postgres, Redis, and a Camoufox-compatible browser service yourself, then configure app env files:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
```

Start web and server directly:

```bash
pnpm dev:local
```

Or run one app at a time:

```bash
pnpm dev:web
pnpm dev:server
```

## Environment

Root `.env` is used by Docker Compose:

```env
NODE_ENV=development
APP_PORT=3000
FRONTEND_PORT=3001
HOST_IP=localhost
ORIGIN=http://localhost:3001
PUBLIC_URL=http://localhost:3000
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=app
POSTGRES_PORT=5433
REDIS_PORT=6379
CORS_ORIGINS=http://localhost:3001
JWT_SECRET=change-me-to-a-random-secret-at-least-32-chars
```

Server-only local env lives in `apps/server/.env`. Web-only local env lives in `apps/web/.env`:

```env
VITE_API_URL=http://localhost:3000
```

For production, see the [self-hosting section](./README.md#self-hosting).

## Commands

```bash
# Development
pnpm dev
pnpm dev:local
pnpm dev:web
pnpm dev:server

# Build
pnpm build
pnpm build:web
pnpm build:server

# Test
pnpm test
pnpm test:web
pnpm test:server

# Quality
pnpm lint
pnpm lint:fix
pnpm typecheck

# Database
pnpm db:push
pnpm db:migrate
pnpm db:studio

# Commit helper
pnpm commit
```

## Database

The server uses Drizzle migrations under `apps/server/src/db/migrations`.

```bash
# Push schema changes directly
pnpm db:push

# Apply migrations
pnpm db:migrate

# Inspect data
pnpm db:studio
```

## Testing

Frontend tests use Vitest, Testing Library, and MSW.

```bash
pnpm test:web
```

Backend tests are integration tests and require a separate Postgres test database. Start from the example env:

```bash
cp apps/server/.env.test.example apps/server/.env.test
pnpm test:server
```

The server test setup applies test migrations before running the suite.

## Deployment

### Self-Hosting

See [self-hosting guide](docs/SELF_HOSTING.md) for a complete guide covering environment setup, Docker Compose, reverse proxy, SSL, storage, backups, and upgrades.

Use the template files in `docs/self-hosting-templates/` as a starting point for your deployment:

- `base.yml` - Base configuration with shared services and networks
- `neon_with_r2.yml` - Complete setup with Neon PostgreSQL and R2 storage (should be configured with your own credentials)

Production Compose expects published GHCR images. The Docker publish GitHub Actions workflow builds and publishes these images from `main`, version tags, or manual dispatch:

- `ghcr.io/technowizard/loreo-browser:latest`
- `ghcr.io/technowizard/loreo-server:latest`
- `ghcr.io/technowizard/loreo-web:latest`

Build images from the repository root:

```bash
docker build -f apps/server/Dockerfile.browser -t loreo-browser:latest .
docker build -f apps/server/Dockerfile.prod -t loreo-server:latest .
docker build -f apps/web/Dockerfile.prod -t loreo-web:latest .
```

The production web image is portable by default. Browser API calls use the same origin as the web app, and nginx proxies API routes to `API_UPSTREAM` at container startup.

Run production Compose locally:

```bash
cp .env.prod.example .env.prod
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

The production stack serves:

- Web app: http://localhost:3001
- API: http://localhost:3000 by default, or `SERVER_PUBLIC_PORT` when set

> [!IMPORTANT]
> Replace `JWT_SECRET`, database credentials, CORS origins, public URLs, and any storage credentials before an internet-facing deployment.
> The values in `.env.example` are development placeholders, not production secrets. Start hosted deployments from `.env.prod.example`.

## Using External Services

Loreo supports decoupling services for better scalability and reliability. You can use external services for:

- **Database**: PostgreSQL (e.g., Neon)
- **Redis**: For job queue and caching (e.g., Upstash)
- **Storage**: S3-compatible storage for images and other assets (e.g., Cloudflare R2)

I have tested this with Neon as the database provider, Upstash as the Redis provider, and Cloudflare R2 as the storage provider. To get the best performance, make sure each service's region is close to your server location.

### Examples

If you want to use Neon, you can modify the following environment variables:

Remove `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`, then add `DATABASE_URL` to your `.env` file:

```
DATABASE_URL=<your-neon-database-url>
```

For Upstash, you can use the following environment variables:

```
REDIS_URL=<your-upstash-redis-url> # e.g., rediss://default:password@upstash-redis.example.com:6379
```

For Cloudflare R2, you can use the following environment variables:

```
STORAGE_PROVIDER=s3
STORAGE_ENDPOINT=<your-cloudflare-r2-endpoint>
STORAGE_ACCESS_KEY_ID=<your-cloudflare-r2-access-key-id>
STORAGE_SECRET_ACCESS_KEY=<your-cloudflare-r2-secret-access-key>
```

## Operational Notes

- Article extraction uses a Playwright-compatible Camoufox websocket configured by `BROWSER_URL`.
- Local storage is available by default; S3-compatible storage is supported through server env vars.
