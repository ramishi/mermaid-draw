# Contributing to MermaidDraw

## Dev Setup

```bash
git clone https://github.com/ramishi/mermaid-draw.git
cd mermaid-draw
pnpm install
pnpm dev        # http://localhost:3000
```

**Package manager:** always use `pnpm`. Never `npm install` or `yarn`.

## Making Changes

1. Create a branch: `git checkout -b feature/your-feature`
2. Make changes — see Architecture Rules below
3. Run `pnpm lint` and `pnpm build` before pushing
4. Open a PR against `master`

## Architecture Rules

- **Canvas state is the single source of truth.** Mermaid syntax is always *derived* via `serialize()` in `lib/serializer.ts`. Import (`lib/parser.ts`) is the only reverse direction.
- **Never mutate store state directly.** Use store actions (`addNode`, `updateNodeShape`, etc.) in `lib/store.ts`.
- **Always call `pushHistory()` before any mutation** — required for undo/redo to work.
- **Edge type is always `flowEdge`** (not `default`). Node type is always `flowNode`.
- **Mermaid security level is `strict`** — do not change this; it prevents XSS from diagram content.

See `AGENTS.md` for the full architecture reference including type definitions and serializer format.

## PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Update `CHANGELOG.md` under `[Unreleased]` with what you added/changed/fixed
- Run `pnpm build` locally and confirm `out/` is generated before opening the PR

## Versioning

| Change type | Version bump |
|-------------|-------------|
| Bug fix | `patch` (0.1.0 → 0.1.1) |
| New feature, backwards-compatible | `minor` (0.1.0 → 0.2.0) |
| Breaking change | `major` (0.1.0 → 1.0.0) |

## Cutting a Release

Releases are automatic on push to `main`:

1. Bump `version` in `package.json` (patch / minor / major per the table above)
2. Update `CHANGELOG.md` — move items from `[Unreleased]` to a new `## [X.Y.Z] - YYYY-MM-DD` section
3. Run `pnpm lint` and `pnpm build` locally before pushing
4. Commit and push to `main`

CI then deploys to GitHub Pages, creates the `vX.Y.Z` tag, and publishes a GitHub Release automatically. Do not push tags manually — the CI `tag` job creates them. There is no npm publish.
