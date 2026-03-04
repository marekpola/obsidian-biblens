# BibLens – Architecture
This document describes the minimal architecture of the BibLens plugin used by AI agents during development.

## Goals
- Keep parsing logic independent from Obsidian API.
- Keep mobile compatibility.
- Keep changes incremental (MVP first).

## Module Paths

All source files live under `src/`:
- src/main.ts
- src/parser.ts
- src/types.ts
- src/settings.ts

## Modules
- src/main.ts
  - Obsidian integration: plugin lifecycle, commands, registrations
- src/parser.ts
  - Pure parsing functions (no Obsidian imports)
- src/types.ts
  - Shared types (BibleRef, ParseResult, etc.)
- src/settings.ts
  - Settings placeholder — do not modify until a settings task is active

## Boundaries
- parser.ts must not import from 'obsidian'
- main.ts may import parser.ts
- UI/hover logic lives in main.ts or a dedicated ui module (future)

## Key Types (from src/types.ts)

Canonical type definitions live in `src/types.ts`. The snippet below is kept here for quick reference — `src/types.ts` is the source of truth.

```ts
type BibleRef = {
  bookId: string;      // OSIS book identifier (e.g. "MAT", "GEN", "ISA"), not the raw input abbreviation
  chapterStart: number;
  verseStart?: number;
  chapterEnd?: number;
  verseEnd?: number;
};

type ParseResult =
  | { ok: true; ref: BibleRef }
  | { ok: false; error: string };
```

## Existing stubs (do not rename)

- `src/parser.ts` exports: `parseCzechBibleRef(input: string): ParseResult`


## Hover / UI
For MVP (Task 3), hover detection logic should be implemented in:
src/main.ts
If the logic grows significantly (> ~50 lines), it may later be extracted to:
src/ui/hover.ts

## Build
- esbuild bundles to main.js
- 'obsidian' is external and provided by the host

## Testing
- MVP: documented test cases in TESTPLAN.md
- Later: unit tests for parser