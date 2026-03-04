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
- src/ui/hover.ts

## Modules
- src/main.ts
  - Obsidian integration: plugin lifecycle, commands, registrations
- src/parser.ts
  - Pure parsing functions (no Obsidian imports)
  - Exports: `parseCzechBibleRef`, `scanRefs`, `formatRef`, `RefMatch`
- src/types.ts
  - Shared types (BibleRef, ParseResult, etc.)
- src/settings.ts
  - Settings placeholder — do not modify until a settings task is active
- src/books.ts
  - Definition of standard representation of biblical books and mapping
- src/ui/hover.ts
  - `PopoverManager` class: DOM popover creation, positioning, and teardown

## Boundaries
- parser.ts must not import from 'obsidian'
- ui/hover.ts must not import from 'obsidian'
- main.ts may import parser.ts and ui/hover.ts

## Key Types (from src/types.ts)

Canonical type definitions live in `src/types.ts`. The snippet below is kept here for quick reference — `src/types.ts` is the source of truth.

```ts
type BibleRef = {
  bookId: BookId; //BookId contains all known books      
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
- `src/parser.ts` exports: `scanRefs(text: string): RefMatch[]`
- `src/parser.ts` exports: `formatRef(ref: BibleRef): string`
- `src/ui/hover.ts` exports: `PopoverManager` (methods: `show`, `hide`)

## Build
- esbuild bundles to main.js
- 'obsidian' is external and provided by the host

## Testing
- MVP: documented test cases in TESTPLAN.md
- Later: unit tests for parser