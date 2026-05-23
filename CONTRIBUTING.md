# Contributing to Loreo

Thanks for helping improve Loreo. This guide captures the repo's current contribution flow and quality gates.

## Before You Start

- Read `README.md` for setup and repo structure.
- Check whether your change is already covered by an active plan under `docs/plans/` or `context/features/`.
- Keep secrets, credentials, and local environment values out of commits.

## Branches

- Work on a dedicated branch, not `main`.
- Prefer descriptive branch names such as `feature/<slug>`, `fix/<slug>`, `chore/<slug>`, or `refactor/<slug>`.
- Keep branch names short and specific to the change.

## Local Checks

Run the relevant checks before asking for review:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For focused changes, run the smallest useful subset first, then the broader checks that cover your files.

## Testing Strategy

- Prefer tests for hooks, utilities, library code, and API/query wrappers.
- Cover happy paths and meaningful error cases.
- Add component or page tests only when the behavior cannot be covered cleanly at a lower layer.
- Skip tests that only restate markup or implementation details.
- Use judgment: a test should add confidence or protect a real regression risk.

## Formatting and Hooks

- Pre-commit hooks run `lint-staged`.
- TypeScript, TSX, JSON, Markdown, YAML, and YML files are formatted through `oxfmt`.
- TypeScript and TSX files are also checked with `oxlint`.
- Commit messages are validated with `commitlint`.

## Commit Messages

- Use conventional commits.
- The repo includes Commitizen, so `pnpm commit` is the easiest way to create a compliant message.
- Keep commits small and logically grouped.

Examples:

```text
feat(web): add article tag filter
fix(server): handle empty import rows
docs: update notes
```

## Pull Requests

- Include a short summary of what changed and why.
- Mention any commands you ran to verify the change.
- Call out known risks, tradeoffs, or follow-up work.
- Reference the related issue or plan when one exists.

## Docs and Release Notes

- Update `README.md` when setup, scripts, or deployment steps change.
- Add or update tests when behavior changes.

## Security

- Do not commit secrets, tokens, passwords, or private URLs.
- Use example environment files as the source of truth for required config.
- Review changes that touch auth, storage, networking, or deployment carefully.

## If You're Unsure

- Ask before making large structural changes.
- Prefer the smallest correct change.
- If a repository convention conflicts with this guide, follow the repo convention.
