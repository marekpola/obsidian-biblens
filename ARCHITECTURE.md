# BibLens – Architecture

## Goals
- Keep parsing logic independent from Obsidian API.
- Keep mobile compatibility.
- Keep changes incremental (MVP first).

## Modules
- src/main.ts
  - Obsidian integration: plugin lifecycle, commands, registrations
- src/parser.ts
  - Pure parsing functions (no Obsidian imports)
- src/types.ts
  - Shared types (BibleRef, ParseResult, etc.)
- src/settings.ts
  - Settings placeholder (future tasks)

## Boundaries
- parser.ts must not import from 'obsidian'
- main.ts may import parser.ts
- UI/hover logic lives in main.ts or a dedicated ui module (future)

## Build
- esbuild bundles to main.js
- 'obsidian' is external and provided by the host

## Testing
- MVP: documented test cases in TESTPLAN.md
- Later: unit tests for parser