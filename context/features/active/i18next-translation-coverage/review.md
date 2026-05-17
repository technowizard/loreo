# i18next Translation Coverage Review

## Phase 1: Auth and Home

### Completed

- Added a phase 1 locale coverage test for required English and Indonesian keys.
- Added missing auth/home/route keys to `apps/web/src/locales/en/common.json`.
- Expanded `apps/web/src/locales/id/common.json` to match current English structure for existing auth/home coverage, using English placeholders.
- Replaced hardcoded phase 1 auth strings with i18next calls:
  - Login email placeholder.
  - Login invalid credentials toast.
  - Login success toast.
  - Register generic error toast.
  - Register success toast.
- Replaced hardcoded home `Continue Reading` heading with i18next.
- Replaced auth route metadata titles with i18next lookups.

### Verification

- RED: `bun test src/locales/common.test.ts` failed before locale keys were added.
- GREEN: `bun test src/locales/common.test.ts` passed: 10 tests, 20 assertions.
- Typecheck: `bun run typecheck` passed.
- Touched-file lint/format: `pnpm exec oxlint ... && pnpm exec oxfmt --check ...` passed for the touched TypeScript files.
- Full repo lint: `pnpm lint` failed because `apps/web/src/routeTree.gen.ts` has a formatting issue unrelated to this phase; the file was not changed in this phase.

### Remaining Risks

- `id/common.json` currently mirrors English with English values; it still needs real Indonesian copy.
- Full repo lint remains blocked by pre-existing generated route tree formatting.
