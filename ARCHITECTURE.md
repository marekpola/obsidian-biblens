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
- src/books.ts
- src/provider.ts
- src/translationLoader.ts
- src/ui/hover.ts
- src/editor/refDecorations.ts
- src/editor/refTooltip.ts

Translation data files live under `translations/` in the plugin directory (not in `src/`):
- translations/cep.json

## Modules
- src/main.ts
  - Obsidian integration: plugin lifecycle, commands, registrations
  - Registers CM6 extensions via `this.registerEditorExtension([...])`
  - Calls `loadTranslation` on `onload()`; stores `translationData`; passes it to UI layers
- src/parser.ts
  - Pure parsing functions (no Obsidian imports)
  - Exports: `parseCzechBibleRef`, `scanRefs`, `formatRef`, `RefMatch`
- src/types.ts
  - Shared types (BibleRef, ParseResult, etc.)
- src/settings.ts
  - Settings placeholder — do not modify until a settings task is active
- src/books.ts
  - Definition of standard representation of biblical books and mapping
- src/provider.ts
  - Pure data-access module (no Obsidian imports, no DOM)
  - `type VerseEntry = { label: string; text: string }`
  - `type TranslationData = Record<string, string>`
  - Exports: `getVerses(data: TranslationData, ref: BibleRef): VerseEntry[]`
  - Key format: `${bookId}.${chapterStart}.${verse}` matching cep.json keys
  - Chapter-only refs (no `verseStart`) return all verses found in the chapter (see D011)
- src/translationLoader.ts
  - Obsidian-aware loader; may import from 'obsidian'
  - Exports: `loadTranslation(adapter: DataAdapter, pluginDir: string, name: string): Promise<TranslationData>`
  - Reads `${pluginDir}/translations/${name}.json` via `adapter.read()`
- src/ui/verseDOM.ts
  - DOM builder for verse content (no Obsidian imports)
  - Exports: `buildVerseDOM(entries: VerseEntry[]): HTMLElement`
  - Used by both `hover.ts` (via main.ts) and `refTooltip.ts`
- src/ui/hover.ts
  - `PopoverManager` class: DOM popover creation, positioning, and teardown
  - Current: `show(anchor: HTMLElement, content: string): void`
  - Target (Task 7): `show(anchor: HTMLElement, content: HTMLElement): void` — accepts DOM element, not string
  - Used in Reading View only
- src/editor/refDecorations.ts
  - CM6 ViewPlugin that scans visible ranges and applies underline decorations to detected references
  - Exports: `refDecorationsExtension` (an `Extension`)
  - Uses `scanRefs` from parser.ts; may import from `@codemirror/*`
- src/editor/refTooltip.ts
  - CM6 `hoverTooltip` extension that shows verse content on hover in the editor
  - Exports: `refTooltipExtension` (an `Extension`)
  - Uses `formatRef`, `scanRefs` from parser.ts; `getVerses` from provider.ts; may import from `@codemirror/*`

## Boundaries
- parser.ts must not import from 'obsidian'
- provider.ts must not import from 'obsidian' or use DOM APIs
- ui/hover.ts must not import from 'obsidian'
- ui/verseDOM.ts must not import from 'obsidian'
- editor/*.ts must not import from 'obsidian'; may import from `@codemirror/*` (provided by Obsidian host)
- translationLoader.ts may import from 'obsidian'
- main.ts may import any src/ module
- `@codemirror/*` packages are external (provided by Obsidian) — do not bundle them
- Do not use `innerHTML` for verse content — use DOM construction only (see D010)

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
- `src/editor/refDecorations.ts` exports: `refDecorationsExtension: Extension`
- `src/editor/refTooltip.ts` exports: `refTooltipExtension: Extension`

## Build
- esbuild bundles to main.js
- 'obsidian' is external and provided by the host

## Testing
- MVP: documented test cases in TESTPLAN.md
- Later: unit tests for parser