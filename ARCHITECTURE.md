# BibLens – Architecture
This document describes the minimal architecture of the BibLens plugin used by AI agents during development.

## Goals
- Keep parsing logic independent from Obsidian API.
- Keep mobile compatibility.
- Keep changes incremental (MVP first).

## Module Paths

All source files live under `src/`:
- src/main.ts
- src/settingsTab.ts
- src/parser.ts
- src/types.ts
- src/settings.ts
- src/books.ts
- src/provider.ts
- src/translationLoader.ts
- src/translationRegistry.ts
- src/translationDownloader.ts
- src/translationManager.ts
- src/sources/catalog.ts
- src/sources/adapters.ts
- src/sources/catalogManager.ts
- src/ui/hover.ts
- src/ui/verseDOM.ts
- src/editor/refDecorations.ts
- src/editor/refTooltip.ts
- src/editor/insertVerse.ts

Translation data files live under `translations/` in the plugin directory (not in `src/`):
- translations/cep.json
- translations/*.json  (additional translations dropped by user or downloaded)

## Modules
- src/main.ts
  - Obsidian integration: plugin lifecycle, commands, registrations
  - Exposes `reloadTranslation()` — mutates `translationData` in-place so all consumers (editor extensions, hover) see updated data without re-registration
  - Registers CM6 extensions via `this.registerEditorExtension([...])`
  - Calls `loadTranslation` on `onload()`; stores `translationData`; passes it to UI layers
  - Builds active abbreviation map via `buildAbbreviationMap(settings.customAbbreviations)`
  - Builds `RefScanner` via `buildRefScanner(map)` and passes it to editor extension factories
  - Registers `biblens-insert-verse` command via `this.addCommand(...)`
- src/settingsTab.ts
  - `BibLensSettingTab` class: Obsidian settings UI; imported and registered by `main.ts`
  - Discovers available translations via `listAvailableTranslations` and renders a dropdown
  - On change: saves settings, calls `plugin.reloadTranslation()`, shows Notice
- src/parser.ts
  - Pure parsing functions (no Obsidian imports)
  - Exports: `parseCzechBibleRef`, `scanRefs`, `formatRef`, `RefMatch`
  - Exports: `type RefScanner = { scan(text: string): RefMatch[] }`
  - Exports: `buildRefScanner(map: AbbreviationMap): RefScanner` — compiles regex once from map keys (keys are regex-escaped)
  - `scanRefs` remains as a convenience default using the built-in map
- src/types.ts
  - Shared types (BibleRef, ParseResult, TranslationMeta, etc.)
  - `type TranslationMeta = { id: string; displayName: string }`
- src/settings.ts
  - Plugin settings shape and defaults
  - `preferredTranslation: string` (default: `"cep"`)
  - `customAbbreviations: CustomAbbreviations` (default: `{}`)
  - `verseInsertionFormat: 'inline' | 'blockquote'` (default: `'inline'`)
  - `autoUpdateCatalog: boolean` (default: `false`) — fetch catalog from GitHub on plugin load if cache is stale
  - `catalogLastUpdated: string` (default: `""`) — ISO timestamp of last successful catalog fetch; shown in settings UI
- src/books.ts
  - Definition of standard representation of biblical books and mapping
  - Exports: `type CustomAbbreviations = Record<string, BookId>`
  - Exports: `buildAbbreviationMap(custom: CustomAbbreviations): AbbreviationMap` — merges built-in + custom; custom wins
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
- src/translationRegistry.ts
  - Obsidian-aware; may import from 'obsidian'
  - Exports: `listAvailableTranslations(adapter: DataAdapter, pluginDir: string): Promise<TranslationMeta[]>`
  - Scans `${pluginDir}/translations/` via `adapter.list()` and returns metadata for each `.json` file found
- src/translationDownloader.ts
  - Obsidian-aware; may import from 'obsidian' (uses `requestUrl`)
  - Exports: `downloadTranslation(adapter: DataAdapter, pluginDir: string, url: string, name: string): Promise<void>`
  - Fetches JSON from `url`, validates format, writes to `${pluginDir}/translations/${name}.json`
- src/sources/catalog.ts
  - Pure module (no Obsidian imports)
  - Exports: `type SourceProvider = { id: string; displayName: string; baseUrl: string; adapterType: string; translations: RemoteTranslationEntry[] }`
  - Exports: `type RemoteTranslationEntry = { id: string; displayName: string; language: string; remoteId: string }`
  - Exports: `KNOWN_PROVIDERS: SourceProvider[]` — static list of bundled providers
- src/sources/adapters.ts
  - Pure module (no Obsidian imports, no DOM)
  - Exports: `interface SourceAdapter { buildUrl(provider: SourceProvider, entry: RemoteTranslationEntry): string; transform(raw: unknown): TranslationData }`
  - Exports: `getAdapter(adapterType: string): SourceAdapter` — registry lookup; throws on unknown type
  - Each adapter is responsible for: URL construction, raw-to-`TranslationData` transformation, OSIS book ID mapping
- src/translationManager.ts
  - Obsidian-aware; may import from 'obsidian' (uses `requestUrl` and `DataAdapter`)
  - Orchestrates the full download pipeline: `requestUrl` → `getAdapter().transform()` → validate → `adapter.write()`
  - Exports: `downloadFromSource(vaultAdapter: DataAdapter, pluginDir: string, provider: SourceProvider, entry: RemoteTranslationEntry): Promise<void>`
  - Exports: `deleteTranslation(vaultAdapter: DataAdapter, pluginDir: string, id: string): Promise<void>`
  - Wraps and supersedes `translationDownloader.ts` for source-catalog flows; raw-URL download remains in `translationDownloader.ts`
- src/sources/catalogManager.ts
  - Obsidian-aware; may import from 'obsidian' (uses `requestUrl` and `DataAdapter`)
  - Constant: `CATALOG_REMOTE_URL` — hardcoded GitHub raw URL pointing to `catalog/providers.json` in the BibLens repo; not user-configurable
  - Exports: `loadCatalog(adapter: DataAdapter, pluginDir: string): Promise<SourceProvider[]>` — returns cached `catalog.json` if present and parseable, falls back to bundled `KNOWN_PROVIDERS`
  - Exports: `fetchCatalogUpdate(adapter: DataAdapter, pluginDir: string): Promise<CatalogUpdateResult>` — fetches remote catalog, validates `SourceProvider[]` schema, filters entries with unknown `adapterType`, writes to `catalog.json`, returns result with `updatedAt` timestamp
  - `type CatalogUpdateResult = { ok: true; updatedAt: string; providerCount: number } | { ok: false; error: string }`
  - Providers with unknown `adapterType` are silently filtered (forward-compatibility: newer catalog entries don't crash older plugin versions)
- src/ui/verseDOM.ts
  - DOM builder for verse content (no Obsidian imports)
  - Exports: `buildVerseDOM(entries: VerseEntry[]): HTMLElement`
  - Used by both `hover.ts` (via main.ts) and `refTooltip.ts`
- src/ui/hover.ts
  - `PopoverManager` class: DOM popover creation, positioning, and teardown
  - `show(anchor: HTMLElement, content: HTMLElement): void` — accepts DOM element
  - Used in Reading View only
- src/editor/refDecorations.ts
  - CM6 ViewPlugin that scans visible ranges and applies underline decorations to detected references
  - Exports: `refDecorationsExtension(scanner: RefScanner): Extension` — factory function
  - Uses `scanner.scan()`; may import from `@codemirror/*`
- src/editor/refTooltip.ts
  - CM6 `hoverTooltip` extension that shows verse content on hover in the editor
  - Exports: `refTooltipExtension(scanner: RefScanner, data: TranslationData): Extension` — factory function
  - Uses `formatRef`, `scanner.scan()` from parser.ts; `getVerses` from provider.ts; may import from `@codemirror/*`
- src/editor/insertVerse.ts
  - CM6 command factory; no Obsidian imports
  - Exports: `insertVerseCommand(scanner: RefScanner, data: TranslationData, format: InsertionFormat): Command`
  - Logic: find reference spanning cursor on current line → `getVerses` → format text → CM6 transaction dispatch
  - No-op if cursor is not on a detected reference
  - `InsertionFormat = 'inline' | 'blockquote'`

## Boundaries
- parser.ts must not import from 'obsidian'
- provider.ts must not import from 'obsidian' or use DOM APIs
- books.ts must not import from 'obsidian'
- ui/hover.ts must not import from 'obsidian'
- ui/verseDOM.ts must not import from 'obsidian'
- editor/*.ts must not import from 'obsidian'; may import from `@codemirror/*` (provided by Obsidian host)
- translationLoader.ts may import from 'obsidian'
- translationRegistry.ts may import from 'obsidian'
- translationDownloader.ts may import from 'obsidian'
- translationManager.ts may import from 'obsidian'
- sources/catalog.ts must not import from 'obsidian'
- sources/adapters.ts must not import from 'obsidian' or use DOM APIs
- sources/catalogManager.ts may import from 'obsidian'
- main.ts may import any src/ module
- `@codemirror/*` packages are external (provided by Obsidian) — do not bundle them
- Do not use `innerHTML` for verse content — use DOM construction only (see D010)

## Performance Constraints

BibLens must not introduce typing lag in large notes.

### Editor processing

Reference detection must never scan the entire document on every update.

Rules:

- CodeMirror extensions must operate only on `view.visibleRanges`.
- Parsing must be limited to visible viewport ranges.
- Avoid scanning `view.state.doc.toString()` or equivalent full-document operations.
- Avoid heavy synchronous computation in editor update handlers.

### Decorations

Editor decorations must be computed incrementally.

Rules:

- Decorations must be implemented using a CM6 `ViewPlugin`.
- Decoration computation must iterate only over `visibleRanges`.
- Recompute decorations only when relevant document changes occur.
- Avoid allocating large temporary objects inside update loops.

### Translation data

Translation data must be loaded once and reused.

Rules:

- `translationLoader.ts` loads the translation file during plugin initialization.
- The loaded `TranslationData` must be cached in memory.
- `provider.ts` must perform only in-memory lookups.

Expected complexity:

- Verse lookup: O(1)
- Chapter lookup: O(n) within the chapter only.

### Data Flow

Translation loading:

main.ts
→ settings.preferredTranslation
→ translationLoader.ts
→ TranslationData (cached in memory)

Translation discovery:

main.ts / settings UI
→ translationRegistry.ts
→ TranslationMeta[]

Translation download from URL (explicit user action, legacy):

settings UI
→ translationDownloader.ts (requestUrl)
→ translations/${name}.json (written to disk)

Catalog load (on plugin startup and settings tab open):

main.ts / settings UI
→ sources/catalogManager.ts: loadCatalog()
  → catalog.json (if cached in plugin dir)      [priority 1]
  OR → sources/catalog.ts: KNOWN_PROVIDERS      [bundled fallback]
→ SourceProvider[] (active in memory)

Catalog update (explicit user action OR opt-in auto on startup):

settings UI / main.ts (if autoUpdateCatalog = true and cache is stale)
→ sources/catalogManager.ts: fetchCatalogUpdate()
  → requestUrl(CATALOG_REMOTE_URL)
  → validate SourceProvider[] schema
  → filter entries with unknown adapterType (forward-compat)
  → DataAdapter.write → catalog.json
→ CatalogUpdateResult { ok, updatedAt, providerCount }
→ settings UI: display last updated date

Translation download from source catalog (explicit user action):

settings UI
→ sources/catalog.ts (KNOWN_PROVIDERS, RemoteTranslationEntry selection)
→ translationManager.ts
  → sources/adapters.ts: getAdapter(provider.adapterType).buildUrl()
  → requestUrl (Obsidian API)
  → sources/adapters.ts: getAdapter(provider.adapterType).transform(raw)
  → validate TranslationData
  → DataAdapter.write → translations/${entry.id}.json

Translation delete (explicit user action):

settings UI
→ translationManager.ts: deleteTranslation()
→ DataAdapter.remove → translations/${id}.json

Abbreviation map + scanner construction:

main.ts
→ settings.customAbbreviations
→ books.ts: buildAbbreviationMap()
→ parser.ts: buildRefScanner(map)
→ RefScanner (passed to editor extensions and insert command)

Reference detection:

editor/refDecorations.ts
→ scanner.scan() (RefScanner from parser.ts)

Verse retrieval:

hover.ts / refTooltip.ts / insertVerse.ts
→ getVerses (provider.ts)
→ TranslationData

Verse insertion:

editor/insertVerse.ts
→ scanner.scan() on current line
→ getVerses (provider.ts)
→ CM6 transaction dispatch



### Regular expressions

Reference detection relies on regex scanning.

Rules:

- Regex patterns must be precompiled.
- Avoid creating new regex objects inside hot loops.
- Avoid running regex over entire documents.

### DOM safety

Verse content must be constructed using DOM APIs.

Rules:

- Never use `innerHTML` for verse rendering.
- Build DOM nodes explicitly (`createElement`, `textContent`).
- Prevent injection issues from translation data.

### Performance targets

Typical editor update cost:

- Target: <5 ms
- Hard limit: <10 ms





## Key Types (from src/types.ts and src/sources/catalog.ts)

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

Source catalog types live in `src/sources/catalog.ts`:

```ts
type RemoteTranslationEntry = {
  id: string;          // local file id, e.g. "bkr"
  displayName: string; // e.g. "Bible Kralická"
  language: string;    // BCP 47, e.g. "cs"
  remoteId: string;    // provider-specific key used in URL construction
};

type SourceProvider = {
  id: string;                          // e.g. "getbible-net"
  displayName: string;                 // e.g. "GetBible (getbible.net)"
  baseUrl: string;
  adapterType: string;                 // key into adapter registry
  translations: RemoteTranslationEntry[];
};
```

Catalog manager types live in `src/sources/catalogManager.ts`:

```ts
type CatalogUpdateResult =
  | { ok: true;  updatedAt: string; providerCount: number }
  | { ok: false; error: string };
```

Remote catalog file shape (stored in repo at `catalog/providers.json` and cached locally as `catalog.json`):

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-03-05",
  "providers": [ /* SourceProvider[] */ ]
}
```

`schemaVersion` allows future breaking changes to the catalog format to be detected and handled gracefully by older plugin versions.

## Existing stubs (do not rename)

- `src/parser.ts` exports: `parseCzechBibleRef(input: string): ParseResult`
- `src/parser.ts` exports: `scanRefs(text: string): RefMatch[]`
- `src/parser.ts` exports: `formatRef(ref: BibleRef): string`
- `src/parser.ts` exports: `buildRefScanner(map: AbbreviationMap): RefScanner`
- `src/ui/hover.ts` exports: `PopoverManager` (methods: `show`, `hide`)
- `src/editor/refDecorations.ts` exports: `refDecorationsExtension(scanner: RefScanner): Extension`
- `src/editor/refTooltip.ts` exports: `refTooltipExtension(scanner: RefScanner, data: TranslationData): Extension`
- `src/editor/insertVerse.ts` exports: `insertVerseCommand(scanner: RefScanner, data: TranslationData, format: InsertionFormat): Command`
- `src/translationRegistry.ts` exports: `listAvailableTranslations(adapter: DataAdapter, pluginDir: string): Promise<TranslationMeta[]>`
- `src/translationDownloader.ts` exports: `downloadTranslation(adapter: DataAdapter, pluginDir: string, url: string, name: string): Promise<void>`

## Build
- esbuild bundles to main.js
- 'obsidian' is external and provided by the host

## Testing
- MVP: documented test cases in TESTPLAN.md
- Later: unit tests for parser