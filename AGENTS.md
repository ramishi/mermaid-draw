# Repository Guidelines

## Project Structure & Module Organization
- `app/`: route entrypoints, global styles, and layout
- `components/`: UI and canvas pieces, including custom React Flow node and edge types
- `lib/`: core logic for parsing, serialization, layout, file I/O, and Zustand state

Keep UI concerns in `components/` and pure diagram logic in `lib/`. Use the `@/*` import alias for cross-folder imports.

## Build, Test, and Development Commands
- `pnpm dev`: start the local dev server on `http://localhost:3000`
- `pnpm build`: create a production build; this should pass before any commit
- `pnpm start`: run the production server locally
- `pnpm lint`: run ESLint with Next.js core-web-vitals and TypeScript rules
- `pnpm test`: run all unit tests in `lib/`

Use `pnpm` only.

## Coding Style & Naming Conventions
Write strict TypeScript and follow the existing style:

- 2-space indentation
- single quotes
- no semicolons unless required
- PascalCase for React components and component files
- camelCase for helpers and store actions
- lowercase utility modules in `lib/` (`serializer.ts`, `parser.ts`)

Lint before opening a PR. No separate formatter is configured.

## Architecture Guardrails
- Canvas state in `lib/store.ts` is the single source of truth; Mermaid syntax must be derived through `serialize()`
- Mermaid import flows only through `parseMermaidFlowchart()` in `lib/parser.ts`
- Do not mutate Zustand state directly; use store actions
- Call `pushHistory()` before any store mutation so undo/redo stays intact
- Keep React Flow types consistent: nodes use `flowNode`, edges use `flowEdge`
- Preserve subgraph behavior: containers use `data.isSubgraph`, children use `parentId` and `extent: 'parent'`

## Testing Guidelines
Tests live beside source files in `lib/` and use `node:test` plus `node:assert`.

- name tests `*.test.ts`
- keep tests near the module they cover
- prefer focused tests for serialization, parsing, store transitions, and subgraphs

Add or update tests when changing `lib/` behavior.

## Commit & Pull Request Guidelines
Recent history favors short, imperative commit subjects such as `Fix broken layout for imported flowcharts with subgraphs`.

- use one-line imperative commit messages
- keep PRs scoped to one concern
- include a description and screenshots/GIFs for UI changes
- call out test and lint results in the PR body

Open an issue first for larger changes.

## Release & Version Bump

Version lives only in `package.json`; the top-bar display and CI derive from it. Semver: bug fix → `patch`, backwards-compatible feature → `minor`, breaking change → `major`.

To cut a release:
1. Run local checks: `pnpm lint`, `pnpm test`, `pnpm build`
2. Bump `version` in `package.json` (never hand-edit `pnpm-lock.yaml` version fields)
3. In `CHANGELOG.md`, move relevant items from `[Unreleased]` into a new `## [X.Y.Z] - YYYY-MM-DD` section
4. Commit and push to `main`

CI (`ci.yml`) then:
- deploys the static export to GitHub Pages at `https://ramishi.github.io/mermaid-draw/`
- runs the `tag` job: if `package.json` version ≠ latest git tag, creates `vX.Y.Z` tag + GitHub Release automatically

Rules:
- Do NOT push tags manually — the `tag` job creates them
- There is NO npm publish — no `release.yml`, no `NPM_TOKEN`; do not reintroduce one
- Nothing to do in repo settings: Pages uses `build_type: workflow`, already configured
- Every push to `main` redeploys Pages, even without a version bump
