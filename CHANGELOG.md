# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- FigJam-style toolbar redesign: shape tool palette with drag-to-draw mode, connector tool, selection tool
- Inline diagram title editing in top bar — click to rename, persists to saved `.diagram.json` and used as the download filename
- App name and version number displayed in top bar
- Context menu on nodes and edges (right-click): group selection, assign to subgraph, bring to front, delete
- Auto-hide subgraph children in collapsed state
- Default edge routing and animated edge settings persist across new connections
- Export PNG, WebP, and PDF formats added alongside SVG

### Changed
- Empty state hint text corrected — removed inaccurate double-click instruction
- Diagram name propagated through Save JSON and Download .mmd filenames
- Layout engine defaults to ELK

### Fixed
- Diagram name and settings now restore correctly when opening a `.diagram.json` file

## [0.1.0] - 2026-03-08

### Added
- 14 node shapes: rectangle, rounded, stadium, subroutine, cylinder, circle, double-circle, diamond, hexagon, parallelogram, parallelogram-alt, trapezoid, trapezoid-alt, asymmetric
- 3 edge line styles (solid, dashed, thick) × 5 arrowhead types (arrow, none, bidirectional, circle, cross)
- 4 flow directions: TD, LR, BT, RL — canvas re-layouts on change via Dagre
- Undo/redo with 50-snapshot history stack (Ctrl+Z / Ctrl+Y)
- Node styling: fill color, stroke color, text color per node
- Edge styling: stroke color per edge
- 5 Mermaid themes (default, dark, forest, neutral, base) + hand-drawn look toggle
- 12 curve styles for edge routing
- Duplicate selected nodes (Ctrl+D)
- Export diagram as SVG
- Import Mermaid flowchart syntax → canvas (live parse feedback)
- Subgraphs: create, drag-assign children, rename, duplicate with children, full serialize/import round-trip
- Copy/paste nodes (Ctrl+C / Ctrl+V)
- Marquee multi-select
- Inspector panel for node/edge properties
- Toolbar with full keyboard accessibility (ARIA labels, focus management)
- `npx mermaid-draw` terminal install — serves static build and opens browser
- CI workflow: lint + audit + build on every push/PR
- Release workflow: automated version bump, npm publish, GitHub Release
