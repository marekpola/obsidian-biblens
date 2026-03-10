# BibLens – Architecture
This document describes the architecture of the BibLens plugin used by AI agents during development.

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
- src/translationManager.ts
- src/packManager.ts
- src/sources/catalog.ts
- src/sources/adapters.ts
- src/sources/catalogManager.ts
- src/sources/catalogUtils.ts
- src/osisMapping.ts
- src/languagePackLoader.ts
- src/languagePackRegistry.ts
- src/referenceFormatLoader.ts
- src/referenceFormatRegistry.ts
- src/ui/hover.ts
- src/ui/verseDOM.ts
- src/editor/refDecorations.ts
- src/editor/refTooltip.ts
- src/editor/insertVerse.ts

Translation data files live under `translations/` in the plugin directory (not in `src/`):
- translations/*.json  (additional translations dropped by user or downloaded)

Recognition language pack files live under `recognition-languages/` in the plugin directory:
- recognition-languages/*.json  (book names and aliases per language)

Reference format pack files live under `reference-formats/` in the plugin directory:
- reference-formats/*.json  (notation rules per reference style)

## Modules
- src/main.ts
  - Obsidian integration: plugin lifecycle, commands, registrations
  - Exposes `reloadTranslation()` — mutates `translationData` in-place so all consumers (editor extensions, hover) see updated data without re-registration
  - Registers CM6 extensions via `this.registerEditorExtension([...])`
  - Calls `loadTranslation` on `onload()`; stores `translationData`; passes it to UI layers
  - Loads active language pack via `languagePackLoader.ts` (falls back to built-in English defaults if none selected)
  - Loads active reference format pack via `referenceFormatLoader.ts` (falls back to `books.ts: BUILT_IN_FORMAT_RULES` — English notation — if none selected)
  - Builds `AbbreviationMap` from language pack data (USFM keys read directly); falls back to `books.ts: getBuiltInAbbreviationMap()`
  - Builds `RefScanner` via `buildRefScanner(map, formatRules, settings.parsingRules)` and passes it to editor extension factories; passes active `ReferenceFormatRules` as `refFormat` to `refTooltipExtension`, `insertAfterLastRefCommand`, and `replaceLastRefWithQuoteCommand`; also passes `refFormat` to `getVerses` when building Reading View hover content (before calling `PopoverManager.show`)
  - Registers `biblens-insert-verse` command via `this.addCommand(...)`
- src/settingsTab.ts
  - `BibLensSettingTab` class: Obsidian settings UI; imported and registered by `main.ts`
  - `display()` issues a single `Promise.all` over `loadCatalog`, `listAvailableTranslations`, `listAvailableReferenceFormats`, and `listAvailableLanguagePacks`; runs auto-default checks on the resolved data; then renders all sections with consistent, settled values
  - Auto-default: if `settings.preferredTranslation`, `settings.standardReferenceFormat`, or `settings.preferredLanguage` is empty and at least one item of that type is installed, the first item is automatically set as default (save + reload); runs in `display()` before any section renders; covers first install, manual file drop, and active-item deletion
  - `renderGeneral(status)` accepts resolved display names and renders three read-only status rows (Translation · Reference format · Recognition language) plus the Parsing rules dropdown; no dropdowns for asset selection
  - `renderInstalledTranslations`, `renderInstalledFormats`, `renderInstalledLanguages` each receive their pre-fetched list data as a parameter; no internal list calls
  - "Set as default" buttons in the collapsible sections are the sole interactive path for changing the active item of each type
- src/parser.ts
  - Pure parsing functions (no Obsidian imports)
  - Exports: `scanRefs`, `formatRef`, `RefMatch`
  - Exports: `type RefScanner = { scan(text: string): RefMatch[] }`
  - Exports: `type ParsingMode = 'strict' | 'extended'`
  - Exports: `buildRefScanner(map: AbbreviationMap, format?: ReferenceFormatRules, mode?: ParsingMode): RefScanner` — compiles all regexes once at construction time; format and mode default to built-in English behaviour (`BUILT_IN_FORMAT_RULES`). The book-name part of the scan regex is a compiled **alternation over alias strings sorted longest-first** (supports multi-word names such as `1. Mojžíšova` and any writing script). Strict mode: alias source is `fmt.books` canonical abbreviation values only; regex is case-sensitive; `bookChapterSeparator` from `fmt` is enforced exactly; `chapterVerseSeparator` and `rangeSeparator` enforced in the cv pattern. Extended mode: alias source is all keys of `map` (full language pack); regex uses `'i'` flag (case-insensitive; normalized lowercase map keys match any case in text); `bookChapterSeparator` relaxed to `\s+`; cv pattern accepts `,`, `:`, or `.` as separator. If the alias set is empty, returns a no-op stub `{ scan: () => [] }`. Internal helper `parseCVPart(rest, cvRe)` extracts chapter/verse numbers using the mode-appropriate precompiled cv regex.
  - `scanRefs` remains as a convenience default using the built-in map and strict mode
- src/types.ts
  - Shared types (BibleRef, ParseResult, TranslationMeta, etc.)
  - `type TranslationMeta = { id: string; displayName: string; lang?: string; source?: string }`
- src/settings.ts
  - Plugin settings shape and defaults
  - `preferredTranslation: string`
  - `preferredLanguage: string` 
  - `standardReferenceFormat: string` 
  - `parsingRules: 'strict' | 'extended'` (default: `'strict'`)
  - `autoUpdateCatalog: boolean` (default: `false`) — fetch catalog from GitHub on plugin load if cache is stale
  - `catalogLastUpdated: string` (default: `""`) — ISO timestamp of last successful catalog fetch; shown in settings UI
- src/books.ts
  - Definition of standard representation of biblical books and built-in abbreviation mapping
  - Exports: `getBuiltInAbbreviationMap(): AbbreviationMap` — returns the built-in English abbreviation map (standard short forms: `Gen`, `Exod`, `Matt`, etc.); used as offline fallback when no language pack is active
  - Exports: `BUILT_IN_FORMAT_RULES: ReferenceFormatRules` — hardcoded English format rules: colon chapter-verse separator, hyphen range separator, space book-chapter separator, and canonical English abbreviations for all 66 books (e.g. `Gen`, `Matt`); used as offline fallback when no format pack is selected; does not depend on the bundled `en.json` being present on disk
- src/provider.ts
  - Pure data-access module (no Obsidian imports, no DOM)
  - `type VerseEntry = { label: string; text: string }`
  - `type TranslationData = Record<string, string>`
  - Exports: `getVerses(data: TranslationData, ref: BibleRef, refFormat?: ReferenceFormatRules): VerseEntry[]`
  - `refFormat` is passed to `formatRef` for the first-entry label; falls back to built-in English defaults when omitted
  - Key format: `${bookId}.${chapter}.${verse}` matching cep.json keys
  - Four ref types handled:
    - Chapter-only (`verseStart` absent, `chapterEnd` absent): all verses in `chapterStart` (see D011)
    - Chapter range (`verseStart` absent, `chapterEnd` set): all verses in each chapter `chapterStart..chapterEnd` (see D011)
    - Same-chapter verse range (`chapterEnd` absent or equals `chapterStart`): verses `verseStart..verseEnd` in `chapterStart`
    - Cross-chapter verse range (`chapterEnd` > `chapterStart`): `verseStart..end` of `chapterStart`, all verses in intermediate chapters, `1..verseEnd` of `chapterEnd`
  - First entry label: `formatRef(ref, refFormat)`; subsequent entry labels: bare verse number (see D028 for cross-chapter label limitation)
- src/translationLoader.ts
  - Obsidian-aware loader; may import from 'obsidian'
  - Exports: `loadTranslation(adapter: DataAdapter, pluginDir: string, name: string): Promise<TranslationData>`
  - Reads `${pluginDir}/translations/${name}.json` via `adapter.read()`
- src/translationRegistry.ts
  - Obsidian-aware; may import from 'obsidian'
  - Exports: `listAvailableTranslations(adapter: DataAdapter, pluginDir: string): Promise<TranslationMeta[]>`
  - Scans `${pluginDir}/translations/` via `adapter.list()` and returns metadata for each `.json` file found
- src/sources/catalog.ts
  - Pure module (no Obsidian imports)
  - Exports: `type SourceProvider = { id: string; displayName: string; baseUrl: string; adapterType: string; translations: RemoteTranslationEntry[] }`
  - Exports: `type RemoteTranslationEntry = { id: string; displayName: string; language: string; remoteId: string }`
  - Exports: `type LanguagePackProvider = { id: string; displayName: string; baseUrl: string; adapterType: string; packs: RemoteLanguagePackEntry[] }`
  - Exports: `type RemoteLanguagePackEntry = { id: string; displayName: string; language: string; remoteId: string }`
  - Exports: `type ReferenceFormatProvider = { id: string; displayName: string; baseUrl: string; adapterType: string; formats: RemoteReferenceFormatEntry[] }`
  - Exports: `type RemoteReferenceFormatEntry = { id: string; displayName: string; language: string; remoteId: string }`
  - Exports: `KNOWN_PROVIDERS` — static bundled snapshot (translation, language pack, and format pack providers)
- src/osisMapping.ts
  - Pure module (no Obsidian imports)
  - Exports: `osisToUsfm(osisId: string): BookId | undefined` — converts an OSIS book identifier (e.g. `Gen`, `Matt`) to USFM 3.0 `BookId` (e.g. `GEN`, `MAT`)
  - Retained for use by future adapters that source data with OSIS identifiers; not currently imported by `adapters.ts` (all active adapters use USFM keys natively); not used by the loader (pack files store USFM keys)
- src/languagePackLoader.ts
  - Obsidian-aware; may import from 'obsidian'
  - Exports: `loadLanguagePack(adapter: DataAdapter, pluginDir: string, id: string): Promise<{ map: AbbreviationMap; meta: LanguagePackMeta }>`
  - Reads `${pluginDir}/recognition-languages/${id}.json`; book keys are USFM (no conversion needed); flattens aliases into `AbbreviationMap` ready for `buildRefScanner`
- src/languagePackRegistry.ts
  - Obsidian-aware; may import from 'obsidian'
  - Exports: `listAvailableLanguagePacks(adapter: DataAdapter, pluginDir: string): Promise<LanguagePackMeta[]>`
  - Scans `${pluginDir}/recognition-languages/` and returns metadata for each `.json` file found
- src/referenceFormatLoader.ts
  - Obsidian-aware; may import from 'obsidian'
  - Exports: `loadReferenceFormat(adapter: DataAdapter, pluginDir: string, id: string): Promise<{ rules: ReferenceFormatRules; meta: ReferenceFormatMeta }>`
  - Reads `${pluginDir}/reference-formats/${id}.json`; returns `ReferenceFormatRules` for use by `buildRefScanner`
- src/referenceFormatRegistry.ts
  - Obsidian-aware; may import from 'obsidian'
  - Exports: `listAvailableReferenceFormats(adapter: DataAdapter, pluginDir: string): Promise<ReferenceFormatMeta[]>`
  - Scans `${pluginDir}/reference-formats/` and returns metadata for each `.json` file found
- src/sources/adapters.ts
  - Pure module (no Obsidian imports, no DOM)
  - Exports: `interface SourceAdapter { buildUrl(provider: SourceProvider, entry: RemoteTranslationEntry): string; transform(raw: unknown): TranslationData }` — translation adapter
  - Exports: `interface LanguagePackAdapter { buildUrl(provider: LanguagePackProvider, entry: RemoteLanguagePackEntry): string; transform(raw: unknown): LanguagePackFile }` — language pack adapter
  - Exports: `interface ReferenceFormatAdapter { buildUrl(provider: ReferenceFormatProvider, entry: RemoteReferenceFormatEntry): string; transform(raw: unknown): ReferenceFormatFile }` — format pack adapter
  - Exports: `getAdapter(adapterType: string): SourceAdapter` — translation adapter registry; throws on unknown type
  - Exports: `getLanguagePackAdapter(adapterType: string): LanguagePackAdapter` — language pack adapter registry; throws on unknown type
  - Exports: `getReferenceFormatAdapter(adapterType: string): ReferenceFormatAdapter` — format pack adapter registry; throws on unknown type
  - Registered translation adapters: `"getbible-v2"`, `"beblia-xml"`, `"biblens-data"` (transforms v1 JSON → flat TranslationData; key normalization duplicated from `translationLoader.ts` — sharing via import would violate the module boundary)
  - Registered language pack adapter: `"biblens-data"` (pass-through; files are already LanguagePackFile format with USFM keys)
  - Registered reference format adapter: `"biblens-data"` (pass-through; files are already ReferenceFormatFile format)
- src/translationManager.ts
  - Obsidian-aware; may import from 'obsidian' (uses `requestUrl` and `DataAdapter`)
  - Orchestrates the full download pipeline: `requestUrl` → `getAdapter().transform()` → validate → `adapter.write()`
  - Exports: `downloadFromSource(vaultAdapter: DataAdapter, pluginDir: string, provider: SourceProvider, entry: RemoteTranslationEntry): Promise<void>`
  - Exports: `deleteTranslation(vaultAdapter: DataAdapter, pluginDir: string, id: string): Promise<void>`
  - Sole download orchestrator for translations; `translationDownloader.ts` was not implemented
- src/packManager.ts
  - Obsidian-aware; may import from 'obsidian' (uses `requestUrl` and `DataAdapter`)
  - Orchestrates language pack and reference format pack download and delete; mirrors `translationManager.ts` for pack types
  - Exports: `downloadLanguagePack(vaultAdapter: DataAdapter, pluginDir: string, provider: LanguagePackProvider, entry: RemoteLanguagePackEntry): Promise<void>`
  - Exports: `deleteLanguagePack(vaultAdapter: DataAdapter, pluginDir: string, id: string): Promise<void>`
  - Exports: `downloadReferenceFormat(vaultAdapter: DataAdapter, pluginDir: string, provider: ReferenceFormatProvider, entry: RemoteReferenceFormatEntry): Promise<void>`
  - Exports: `deleteReferenceFormat(vaultAdapter: DataAdapter, pluginDir: string, id: string): Promise<void>`
  - Download pipeline per pack type: `requestUrl` → `getLanguagePackAdapter()/getReferenceFormatAdapter()` → `transform(raw)` → validate → `DataAdapter.write`
- src/sources/catalogManager.ts
  - Obsidian-aware; may import from 'obsidian' (uses `requestUrl` and `DataAdapter`)
  - Constant: `CATALOG_REMOTE_URL` — hardcoded GitHub raw URL pointing to `catalog/catalog.json` in the `biblens-data` repository; not user-configurable
  - Exports: `loadCatalog(adapter: DataAdapter, pluginDir: string): Promise<CatalogData>` — returns cached `catalog.json` if present and parseable, falls back to bundled `KNOWN_PROVIDERS`; `CatalogData` contains all three provider arrays
  - Exports: `fetchCatalogUpdate(adapter: DataAdapter, pluginDir: string): Promise<CatalogUpdateResult>` — fetches remote catalog, validates `SourceProvider[]` schema, filters entries with unknown `adapterType`, writes to `catalog.json`, returns result with `updatedAt` timestamp
  - `type CatalogUpdateResult = { ok: true; updatedAt: string; providerCount: number } | { ok: false; error: string }`
  - Providers with unknown `adapterType` are silently filtered (forward-compatibility: newer catalog entries don't crash older plugin versions)
- src/sources/catalogUtils.ts
  - Pure module (no Obsidian imports)
  - Exports: `CATALOG_STALE_DAYS: number` — number of days before the cached catalog is considered stale
  - Exports: `isCatalogStale(catalogLastUpdated: string): boolean` — returns `true` if the cache timestamp is missing, unparseable, or older than `CATALOG_STALE_DAYS`
  - Used by `main.ts` (auto-update check on startup) and `catalogManager.ts`
- src/ui/verseDOM.ts
  - DOM builder for verse content (no Obsidian imports)
  - Exports: `buildVerseDOM(entries: VerseEntry[]): HTMLElement`
    - Returns a `<div class="biblens-verse-content">` containing verse entries as `<sup>label</sup> text` nodes
    - When `entries` is empty, returns a div containing `<em>No verse found.</em>`
  - Used by both `hover.ts` (via main.ts) and `refTooltip.ts`
- src/ui/hover.ts
  - `PopoverManager` class: DOM popover creation, positioning, and teardown
  - `show(anchor: HTMLElement, content: HTMLElement): void` — creates popover, positions it, sets up `mouseenter`/`mouseleave` on the popover element to track hover state
  - `requestHide(): void` — hides the popover only if the mouse is not currently over the popover element; called by the anchor's `mouseleave` handler in `main.ts`
  - `hide(): void` — unconditional teardown; called on plugin unload
  - Used in Reading View only
- src/editor/refDecorations.ts
  - CM6 ViewPlugin that scans visible ranges and applies underline decorations to detected references
  - Exports: `refDecorationsExtension(scanner: RefScanner): Extension` — factory function
  - Uses `scanner.scan()`; may import from `@codemirror/*`
- src/editor/refTooltip.ts
  - CM6 `hoverTooltip` extension that shows verse content on hover in the editor
  - Exports: `refTooltipExtension(scanner: RefScanner, data: TranslationData, refFormat?: ReferenceFormatRules): Extension` — factory function
  - Uses `formatRef`, `scanner.scan()` from parser.ts; `getVerses` from provider.ts; passes `refFormat` to `getVerses`; may import from `@codemirror/*`
- src/editor/insertVerse.ts
  - CM6 command factory; no Obsidian imports
  - Exports: `insertAfterLastRefCommand(scanner: RefScanner, data: TranslationData, refFormat?: ReferenceFormatRules): Command`
    - Scans full document via `view.state.doc.toString()` — permitted for user-triggered commands (see D018)
    - Finds last `RefMatch` whose end position is at or before the cursor → `getVerses(data, ref, refFormat)` → appends ` — verse text` after the reference via CM6 transaction
    - No-op if no references exist before the cursor
  - Exports: `replaceLastRefWithQuoteCommand(scanner: RefScanner, data: TranslationData, refFormat?: ReferenceFormatRules): Command`
    - Scans full document via `view.state.doc.toString()` — permitted for user-triggered commands (see D018)
    - Finds last `RefMatch` whose end position is at or before the cursor → `getVerses(data, ref, refFormat)` → replaces the reference with `> Ref verse text` via CM6 transaction
    - No-op if no references exist before the cursor

## Boundaries
- parser.ts must not import from 'obsidian'
- provider.ts must not import from 'obsidian' or use DOM APIs
- books.ts must not import from 'obsidian'
- ui/hover.ts must not import from 'obsidian'
- ui/verseDOM.ts must not import from 'obsidian'
- editor/*.ts must not import from 'obsidian'; may import from `@codemirror/*` (provided by Obsidian host)
- translationLoader.ts may import from 'obsidian'
- translationRegistry.ts may import from 'obsidian'
- translationManager.ts may import from 'obsidian'
- sources/catalog.ts must not import from 'obsidian'
- sources/catalogUtils.ts must not import from 'obsidian'
- sources/adapters.ts must not import from 'obsidian' or use DOM APIs
- sources/catalogManager.ts may import from 'obsidian'
- src/osisMapping.ts must not import from 'obsidian'
- src/packManager.ts may import from 'obsidian'
- src/languagePackLoader.ts may import from 'obsidian'
- src/languagePackRegistry.ts may import from 'obsidian'
- src/referenceFormatLoader.ts may import from 'obsidian'
- src/referenceFormatRegistry.ts may import from 'obsidian'
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

**Exception — user-triggered commands:**
Commands invoked explicitly by the user (via command palette or keybinding) may scan the full document once. This is a single operation in response to a deliberate user action, not a recurring update handler. `view.state.doc.toString()` is acceptable inside a CM6 `Command` function for this purpose.

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
- Chapter lookup: O(n) within the chapter.
- Chapter-range and cross-chapter verse-range lookup: O(n × number of chapters spanned).

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
→ translationManager.ts (requestUrl)
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

Language pack load:

main.ts
→ settings.preferredLanguage
→ languagePackLoader.ts: loadLanguagePack()
  → AbbreviationMap (USFM keys read directly from pack; no conversion step)
  OR → books.ts: getBuiltInAbbreviationMap() (if no pack selected)

Reference format load:

main.ts
→ settings.standardReferenceFormat
→ referenceFormatLoader.ts: loadReferenceFormat()
  → ReferenceFormatRules
  OR → books.ts: BUILT_IN_FORMAT_RULES (built-in English defaults, if no pack selected)

Scanner construction:

main.ts
→ AbbreviationMap (from language pack or built-in)
→ ReferenceFormatRules (from format pack or built-in)
→ settings.parsingRules ('strict' | 'extended')
→ parser.ts: buildRefScanner(map, formatRules, mode)
→ RefScanner (passed to editor extensions and insert command)

Language pack download (explicit user action):

settings UI
→ sources/catalog.ts (languagePackProviders, RemoteLanguagePackEntry)
→ packManager.ts: downloadLanguagePack()
  → sources/adapters.ts: getLanguagePackAdapter(provider.adapterType).buildUrl()
  → requestUrl (Obsidian API)
  → sources/adapters.ts: getLanguagePackAdapter(provider.adapterType).transform(raw)
  → validate LanguagePackFile format
  → DataAdapter.write → recognition-languages/${id}.json

Language pack delete (explicit user action):

settings UI
→ packManager.ts: deleteLanguagePack()
→ DataAdapter.remove → recognition-languages/${id}.json

Reference format download (explicit user action):

settings UI
→ sources/catalog.ts (referenceFormatProviders, RemoteReferenceFormatEntry)
→ packManager.ts: downloadReferenceFormat()
  → sources/adapters.ts: getReferenceFormatAdapter(provider.adapterType).buildUrl()
  → requestUrl (Obsidian API)
  → sources/adapters.ts: getReferenceFormatAdapter(provider.adapterType).transform(raw)
  → validate ReferenceFormatFile format
  → DataAdapter.write → reference-formats/${id}.json

Reference format delete (explicit user action):

settings UI
→ packManager.ts: deleteReferenceFormat()
→ DataAdapter.remove → reference-formats/${id}.json

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

// v0.4 — language pack and format pack providers follow the same shape
type RemoteLanguagePackEntry = { id: string; displayName: string; language: string; remoteId: string };
type LanguagePackProvider   = { id: string; displayName: string; baseUrl: string; adapterType: string; packs: RemoteLanguagePackEntry[] };

type RemoteReferenceFormatEntry = { id: string; displayName: string; language: string; remoteId: string };
type ReferenceFormatProvider    = { id: string; displayName: string; baseUrl: string; adapterType: string; formats: RemoteReferenceFormatEntry[] };
```

Pack types (defined in `src/types.ts`):

```ts
type LanguagePackMeta     = { id: string; displayName: string; lang: string };
type ReferenceFormatMeta  = { id: string; displayName: string; lang: string };

type ReferenceFormatRules = {
  chapterVerseSeparator: string;       // e.g. "," or ":"
  rangeSeparator: string;              // e.g. "-"
  bookChapterSeparator: string;        // e.g. " "
  books: Record<string, string>;       // USFM BookId → canonical display abbreviation, e.g. { "GEN": "Gn", "MAT": "Mt" }
};

// AbbreviationMap: recognized input string → USFM 3.0 BookId
// Built by languagePackLoader directly from a language pack's books[USFM_ID].aliases
// (book keys in the pack file are already USFM; no conversion needed in the loader).
// Falls back to books.ts: getBuiltInAbbreviationMap() when no pack is selected.
type AbbreviationMap = Record<string, BookId>;

type ParsingMode = 'strict' | 'extended';
```

---

## Pack File Formats

### Recognition language pack (`recognition-languages/${id}.json`)

```json
{
  "id": "cs",
  "displayName": "Czech",
  "lang": "cs",
  "formatVersion": 1,
  "source": "openbibleinfo/Bible-Passage-Reference-Parser",
  "books": {
    "GEN": {
      "aliases": ["Gn", "Gen", "Genesis", "1. Mojžíšova"]
    },
    "MAT": {
      "aliases": ["Mt", "Mat", "Matouš"]
    }
  }
}
```

**Mandatory fields:** `id`, `displayName`, `lang`, `formatVersion`, `books`

**Optional fields:** `source`

**Field definitions:**
- `id` — BCP 47 language tag used as the unique identifier and filename base (`${id}.json`); one pack per language; also used as `settings.preferredLanguage`
- `displayName` — human-readable name shown in settings UI
- `lang` — BCP 47 language tag (e.g. `"cs"`, `"en"`); same value as `id` for language packs
- `source` — free-text provenance; informational only
- `formatVersion` — integer; must be `1` for this format
- `books` — map of **USFM 3.0 book identifiers** (e.g. `GEN`, `MAT`) to book name data:
  - `aliases` — all recognized input strings for this language; flattened into `AbbreviationMap` (string → USFM `BookId`) by `languagePackLoader.ts`; no OSIS conversion needed in the loader

---

### Reference format pack (`reference-formats/${id}.json`)

```json
{
  "id": "cs-protestant",
  "displayName": "Czech Protestant",
  "lang": "cs",
  "formatVersion": 1,
  "source": "manual",
  "books": {
    "GEN": "Gn",
    "EXO": "Ex",
    "MAT": "Mt"
  },
  "rules": {
    "chapterVerseSeparator": ",",
    "rangeSeparator": "-",
    "bookChapterSeparator": " "
  }
}
```

**Mandatory fields:** `id`, `displayName`, `lang`, `formatVersion`, `books`, `rules`

**Optional fields:** `source`

**Field definitions:**
- `id` — unique identifier; used as filename base and as `settings.standardReferenceFormat`
- `displayName` — shown in settings UI
- `lang` — BCP 47 language tag; informational (a format may apply across languages, e.g. Catholic notation shared by multiple languages)
- `formatVersion` — integer; must be `1`
- `source` — free-text provenance (`"manual"` for hand-authored packs, URL or repo reference for downloaded ones)
- `books` — map of USFM 3.0 book identifiers → canonical display abbreviation for this format style; used by `formatRef` to render references while this format pack is active; must cover all 66 canonical books
- `rules` — notation rule fields; all three are mandatory within `rules`:
  - `chapterVerseSeparator` — character between chapter and verse number (e.g. `","` or `":"`)
  - `rangeSeparator` — character between start and end of a verse range (e.g. `"-"`)
  - `bookChapterSeparator` — character between book abbreviation and chapter number (e.g. `" "`)

---

## Pack Sourcing

Packs reach the plugin directory through three independent paths; all three are supported simultaneously.

### Bundled packs (shipped with the plugin)

Reference format packs for well-known notation styles are bundled in the plugin release as pre-authored JSON files. They are placed in `reference-formats/` inside the plugin directory at install time (same mechanism as `translations/cep.json`).

Bundled format packs at v0.4 release: `en` (English — colon notation, standard English abbreviations).

The code-level `BUILT_IN_FORMAT_RULES` constant in `books.ts` is the actual offline fallback when no format pack is selected; the bundled `en.json` file is shipped for discoverability (it appears in the Installed formats list) but the plugin never reads it as a fallback.

Language packs are **not** bundled; the built-in `books.ts: getBuiltInAbbreviationMap()` (English aliases) serves as the offline fallback when no language pack is selected. Additional language packs require a download or manual drop.

### Manual drop

A user can place a correctly formatted JSON file directly into `recognition-languages/` or `reference-formats/` using the file system. The registry scans the directory on settings tab open; the new pack appears in the installed list immediately without restarting the plugin. This is the same pattern as dropping a translation file into `translations/`.

### Download from source catalog

All three resource types are served from the `biblens-data` repository using a flat file layout:
`resources/<category>/<id>.json`. A machine-readable `index.json` in each category directory lists
available files (`items[].path` is relative to the repo root).

- **Translations** — adapter type `"biblens-data"` (biblens-data provider): fetches `resources/translations/${remoteId}.json`; transforms v1 JSON → flat TranslationData; writes to `translations/${id}.json`. Other translation providers (`"getbible-v2"`, `"beblia-xml"`) continue to serve from their own URLs using their own adapters.
- **Language packs** — adapter type `"biblens-data"` (sole provider): fetches `resources/language-packs/${remoteId}.json`; pass-through — file is already `LanguagePackFile` format with USFM keys; writes to `recognition-languages/${id}.json`.
- **Reference format packs** — adapter type `"biblens-data"` (sole provider): fetches `resources/reference-formats/${remoteId}.json`; pass-through — file is already `ReferenceFormatFile` format; writes to `reference-formats/${id}.json`.

Catalog manager types live in `src/sources/catalogManager.ts`:

```ts
type CatalogUpdateResult =
  | { ok: true;  updatedAt: string; providerCount: number }
  | { ok: false; error: string };
```

Shared types (defined in `src/types.ts`):

```ts
type CatalogData = {
  translationProviders: SourceProvider[];
  languagePackProviders: LanguagePackProvider[];
  referenceFormatProviders: ReferenceFormatProvider[];
};

// Shape written to recognition-languages/${id}.json
type LanguagePackFile = {
  id: string;
  displayName: string;
  lang: string;
  formatVersion: number;
  source?: string;
  books: Record<string, { aliases: string[] }>;  // USFM BookId → alias list
};

// Shape written to reference-formats/${id}.json
type ReferenceFormatFile = {
  id: string;
  displayName: string;
  lang: string;
  formatVersion: number;
  source?: string;
  books: Record<string, string>;                 // USFM BookId → canonical abbreviation
  rules: {
    chapterVerseSeparator: string;
    rangeSeparator: string;
    bookChapterSeparator: string;
  };
};
```

Remote catalog file shape — `schemaVersion: 2` (stored in `biblens-data` repo at `catalog/catalog.json`, cached locally as `catalog.json`):

```json
{
  "schemaVersion": 2,
  "updatedAt": "...",
  "translationProviders":    [ /* SourceProvider[] */ ],
  "languagePackProviders":   [ /* LanguagePackProvider[] */ ],
  "referenceFormatProviders":[ /* ReferenceFormatProvider[] */ ]
}
```

`schemaVersion` allows breaking catalog changes to be detected. Older plugin versions (expecting `schemaVersion: 1`) will reject a v2 catalog and fall back to bundled `KNOWN_PROVIDERS`.

## Existing stubs (do not rename)

- `src/parser.ts` exports: `parseCzechBibleRef(input: string): ParseResult`
- `src/parser.ts` exports: `scanRefs(text: string): RefMatch[]`
- `src/parser.ts` exports: `formatRef(ref: BibleRef, refFormat?: ReferenceFormatRules): string` — when `refFormat` is provided, uses `refFormat.books[ref.bookId]` for the abbreviation and `refFormat.chapterVerseSeparator`, `refFormat.rangeSeparator`, `refFormat.bookChapterSeparator` for separators; falls back to built-in English defaults when omitted
- `src/parser.ts` exports: `buildRefScanner(map: AbbreviationMap, format?: ReferenceFormatRules, mode?: ParsingMode): RefScanner`
- `src/provider.ts` exports: `getVerses(data: TranslationData, ref: BibleRef, refFormat?: ReferenceFormatRules): VerseEntry[]`
- `src/ui/hover.ts` exports: `PopoverManager` (methods: `show`, `requestHide`, `hide`)
- `src/ui/verseDOM.ts` exports: `buildVerseDOM(entries: VerseEntry[]): HTMLElement`
- `src/editor/refDecorations.ts` exports: `refDecorationsExtension(scanner: RefScanner): Extension`
- `src/editor/refTooltip.ts` exports: `refTooltipExtension(scanner: RefScanner, data: TranslationData, refFormat?: ReferenceFormatRules): Extension`
- `src/editor/insertVerse.ts` exports: `insertAfterLastRefCommand(scanner: RefScanner, data: TranslationData, refFormat?: ReferenceFormatRules): Command`
- `src/editor/insertVerse.ts` exports: `replaceLastRefWithQuoteCommand(scanner: RefScanner, data: TranslationData, refFormat?: ReferenceFormatRules): Command`
- `src/translationRegistry.ts` exports: `listAvailableTranslations(adapter: DataAdapter, pluginDir: string): Promise<TranslationMeta[]>`

## Build
- esbuild bundles to main.js
- 'obsidian' is external and provided by the host

## Testing
- MVP: documented test cases in TESTPLAN.md
- Later: unit tests for parser