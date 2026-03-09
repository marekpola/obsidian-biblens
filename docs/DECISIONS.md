# Decisions

## D001 – MVP scope: placeholder only, no Bible text data *(superseded by D009)*
Decision: MVP will only detect references and show placeholder content (no real Bible text retrieval).
Reason: keep initial release small, avoid data licensing/storage questions, and validate UX first.
Consequences:
- Task 3 hover preview shows "Detected reference: …" only.
- Data provider work is deferred to Future section in TASKS.md.
Superseded by: D009 (Tasks 6–7 promote real verse text to MVP scope).
Date: 2026-03-04

## D002 – Reference format for MVP: Czech abbreviations and comma notation
Decision: MVP parser supports Czech-style abbreviations and punctuation: "Mt 1,3", "Gn 22,1-19", "Iz 11".
Reason: aligns with the author's workflow and allows a minimal parser and hover UX.
Consequences:
- Parser focuses on one regex/grammar and returns a structured BibleRef.
- Other notations (e.g., "Gen 22:1-19") are deferred to a later task.
Revisit: when adding configurable abbreviation systems and separators.
Date: 2026-03-04

## D003 – BibleRef shape: flat object, no verse range as separate type
Decision: BibleRef uses a flat object with optional chapterEnd/verseEnd fields rather than a nested range type.
The book field is named `bookId` (canonical internal identifier, not the raw input abbreviation).
Reason: simplicity for MVP; avoids premature abstraction; `bookId` makes the distinction between input and internal representation explicit.
Revisit: when adding parallel texts or morphology that need richer reference models.
Date: 2026-03-04

## D004 – ParseResult as discriminated union, not exceptions
Decision: `parseCzechBibleRef` returns `ParseResult` (ok/error union) and never throws.
Reason: predictable error handling without try/catch at call sites; consistent with the existing types.ts definition.
Consequences:
- Callers must check `result.ok` before accessing `result.ref`.
- Parser must not throw on invalid input — return `{ ok: false, error: '...' }` instead.
Revisit: if a richer error model (error codes, positions) is needed later.
Date: 2026-03-04

## D005 – Task 2 test cases documented in TESTPLAN.md, not a separate test file
Decision: Parser test cases for Task 2 are added to TESTPLAN.md as manual verification steps.
Reason: no test runner is configured for MVP; keeps testing lightweight and consistent with Task 1 approach.
Consequences:
- No `.test.ts` files until a unit test runner is introduced.
- TESTPLAN.md is the single source of truth for test cases.
Revisit: when adding a unit test runner (e.g., vitest).
Date: 2026-03-04

## D006 – bookId as canonical internal book identifier in OSIS format
Decision: The `BibleRef.book` field is renamed to `bookId`. Input abbreviations (e.g., "Mt", "Gn", "Iz") are mapped to a canonical `bookId` string in OSIS format (e.g., "MAT", "GEN", "ISA") before being stored in `BibleRef`.
Reason: separates user-facing notation from the internal representation; OSIS is a well-established standard for Bible book identifiers, enabling interoperability with future data providers; enables future support for multiple abbreviation systems without changing downstream consumers.
Consequences:
- `src/types.ts` defines `bookId: string` in BibleRef (not `book`); values are OSIS IDs.
- Task 2 parser must perform abbreviation → OSIS bookId mapping (even if minimal for MVP).
- Task 4 (Internal Abbreviation Mapping) formalises the full mapping module.
Revisit: when abbreviation systems become configurable.
Date: 2026-03-04

## D007 – Use CM6 ViewPlugin for editor reference decorations (Task 4)
Decision: Implement editor reference decorations as a CodeMirror 6 `ViewPlugin` in `src/editor/refDecorations.ts`, registered via `registerEditorExtension` in main.ts.
Reason: `ViewPlugin` has direct access to `view.visibleRanges`, allowing decoration computation to be limited to the visible viewport on each update. This satisfies Task 4's "no lag on large notes" requirement. A `StateField`-based approach would compute decorations across the entire document on every change, which is less appropriate for large notes.
Consequences:
- `src/editor/refDecorations.ts` implements a `ViewPlugin` that iterates `view.visibleRanges`, calls `scanRefs`, and returns a `DecorationSet` of `Decoration.mark({ class: 'biblens-ref' })`.
- `@codemirror/view` is required; it is external (provided by Obsidian host) and must not be bundled.
- `editor/*.ts` must not import from `obsidian` — only from `@codemirror/*` and local `src/` modules.
Revisit: if viewport-only decoration causes issues (e.g., decorations missing during search/scroll); may switch to full-document StateField with incremental update.
Date: 2026-03-04

## D008 – Use CM6 hoverTooltip for editor reference tooltips (Task 5)
Decision: Implement editor hover tooltips using `hoverTooltip` from `@codemirror/view` in `src/editor/refTooltip.ts`.
Reason: `hoverTooltip` is the native CM6 mechanism for position-aware tooltips. It does not use DOM `mouseenter` events, so it does not interfere with cursor placement or text selection (directly addressing Task 5's DoD). Custom DOM event listeners on decorated spans would conflict with CM6's internal event handling.
Consequences:
- `src/editor/refTooltip.ts` exports `refTooltipExtension` built with `hoverTooltip(view, pos, side)`.
- The tooltip handler checks whether `pos` falls within a reference decoration, retrieves the `RefMatch`, and returns a CM6 `Tooltip` DOM element displaying `formatRef(match.ref)`.
- Both `refDecorationsExtension` and `refTooltipExtension` are registered together in main.ts via a single `registerEditorExtension([...])` call.
Revisit: if a richer tooltip (with Bible text) is added later; tooltip content creation may need to be extracted.
Date: 2026-03-04

## D009 – Translation data stored in plugin directory, loaded at startup via vault adapter
Decision: Bible translation files (e.g. `cep.json`) are stored as JSON files in
`.obsidian/plugins/biblens/translations/`. The plugin loads them asynchronously at startup
via `app.vault.adapter.read()`. Files are not bundled into `main.js`.
Reason: supports multiple translations and manual import by dropping a file into the folder,
without requiring a plugin rebuild. `DataAdapter` is mobile-compatible. Keeps vault content clean.
Consequences:
- `src/translationLoader.ts` handles Obsidian adapter access; `src/provider.ts` remains pure.
- `main.ts` awaits `loadTranslation()` in `onload()` and stores the result.
- `cep.json` must be included in plugin release artifacts under `translations/`.
- Loading is async; UI falls back to "Verš nenalezen" if data is not yet available.
Revisit: if a translation manager UI (import, select, delete) is added.
Date: 2026-03-04

## D010 – Verse popup content built via DOM construction, not innerHTML
Decision: Verse content in popovers and tooltips is built using `createElement` / `appendChild` /
`createTextNode`, never via `innerHTML` or `insertAdjacentHTML`.
Reason: prevents XSS if verse text ever contains HTML-like characters; aligns with Obsidian
security conventions.
Consequences:
- `PopoverManager.show()` accepts `HTMLElement` instead of `string`.
- Both `hover.ts` and `refTooltip.ts` build DOM trees explicitly.
Revisit: if a sanitizing markdown renderer is introduced for verse formatting.
Date: 2026-03-04

## D011 – Chapter-only refs return all verses in the chapter
Decision: When a `BibleRef` has no `verseStart` (e.g. `Gn 22`), `getVerses` returns all verses found in `TranslationData` for that chapter, sorted by verse number.
Reason: A chapter-only hover should show the full chapter content, not an empty result. This is the most useful behavior for readers navigating by chapter.
Consequences:
- `provider.ts` scans `TranslationData` keys with prefix `${bookId}.${chapter}.` to collect available verses.
- First entry label uses `formatRef` (e.g. `Gn 22`); subsequent labels are verse numbers.
- An unknown chapter (no matching keys) still returns `[]`, triggering the "Verš nenalezen" fallback.
Supersedes: the "chapter-only returns []" clause from Task 6 DoD.
Date: 2026-03-04

## D012 – Translation registry and selection via settings
Decision: Available translations are discovered at runtime by listing the `translations/` directory.
The active translation is selected via `settings.preferredTranslation` (default: `"cep"`).
A new `src/translationRegistry.ts` module handles discovery; a new `src/translationDownloader.ts` handles
fetching translation files from external URLs using Obsidian's `requestUrl` (mobile-compatible, no Node).
Reason: D009 established the `translations/` directory pattern. This decision completes it by adding
selection and optional download without requiring plugin rebuilds.
Consequences:
- `src/translationRegistry.ts` (Obsidian-aware): exports `listAvailableTranslations(adapter, pluginDir): Promise<TranslationMeta[]>`
- `src/translationDownloader.ts` (Obsidian-aware): exports `downloadTranslation(adapter, pluginDir, url, name): Promise<void>`
- `src/types.ts` adds `type TranslationMeta = { id: string; displayName: string }`
- `src/settings.ts` gains `preferredTranslation: string`
- `main.ts` reads `settings.preferredTranslation` on load and reloads on settings change
- `translationLoader.ts` interface is unchanged
Revisit: when a full settings UI with translation manager (list, download, delete) is built.
Date: 2026-03-05

## D013 – Abbreviation map parameterization: scanner factory pattern
Decision: The parser regex is compiled from the active abbreviation map at startup via a new
`buildRefScanner(map: AbbreviationMap): RefScanner` factory in `src/parser.ts`.
Editor extensions (`refDecorationsExtension`, `refTooltipExtension`) change from exported values
to exported factory functions that accept the scanner as a parameter, removing the static import of `scanRefs`.
User-defined abbreviations are stored in `settings.customAbbreviations` and merged with built-in
defaults by `buildAbbreviationMap(custom)` in `src/books.ts`. Custom entries win on conflict.
Reason: D006 deferred this; D002 hardcoded Czech abbreviations. This is the minimal generalization
that enables user configuration without redesigning the parser internals. Compiling once at startup
satisfies the performance constraint (no regex allocation in hot loops).
Consequences:
- `src/books.ts` exports `type CustomAbbreviations = Record<string, BookId>` and `buildAbbreviationMap(custom)`
- `src/parser.ts` exports `type RefScanner = { scan(text: string): RefMatch[] }` and `buildRefScanner(map): RefScanner`
- Abbreviation keys are regex-escaped before insertion into the compiled pattern
- `refDecorationsExtension(scanner): Extension` — factory function
- `refTooltipExtension(scanner, data): Extension` — factory function
- `src/settings.ts` gains `customAbbreviations: CustomAbbreviations`
- `main.ts` builds the scanner on load and after settings change
Supersedes: D002 (hardcoded Czech abbreviations become the built-in default set, not the only set).
Revisit: when a UI editor for abbreviation lists is built.
Date: 2026-03-05

## D014 – Verse insertion as a CM6 command; insertion format configurable
Decision: A new `src/editor/insertVerse.ts` module exports a CM6 command factory
`insertVerseCommand(scanner: RefScanner, data: TranslationData): Command`.
The command finds the reference spanning the cursor on the current line, retrieves verses via `getVerses`,
and inserts the formatted text via a CM6 transaction dispatch.
The exact insertion format (inline append / blockquote on next line / replace reference) is deferred
to a `settings.verseInsertionFormat` option defined in a later task.
Reason: All required machinery (parser, provider, CM6 editor access) already exists.
A command factory pattern keeps the module free of Obsidian imports and independently testable.
Consequences:
- `src/editor/insertVerse.ts` — no Obsidian imports; uses CM6 only
- `main.ts` registers the command via `this.addCommand({ id: 'biblens-insert-verse', ... })`
- Insertion format default: append verse text on the same line separated by ` — `
- No insertion occurs if the cursor is not on a detected reference
Revisit: when settings UI exposes the insertion format option.
Date: 2026-03-05

## D015 – Translation source catalog and per-provider adapter pattern
Decision: Bible translation downloads are structured around a **source catalog** (`src/sources/catalog.ts`)
and a **per-provider adapter registry** (`src/sources/adapters.ts`).
The catalog is a static list of `SourceProvider` objects bundled in plugin source. Each provider
declares its available translations (`RemoteTranslationEntry[]`) and an `adapterType` string.
Each `SourceAdapter` implementation is responsible for two things: constructing the fetch URL
and transforming the provider's raw response into the canonical `TranslationData` format
(`Record<string, string>` with `${OSIS_BOOK}.${chapter}.${verse}` keys, matching cep.json).
A new `src/translationManager.ts` module (Obsidian-aware) orchestrates the full pipeline:
URL build → `requestUrl` → adapter transform → validate → write to `translations/${id}.json`.
Download status is derived from the `translations/` directory listing; no separate tracking file.
Delete is a file removal via `DataAdapter`. Update = delete + download.
Reason: The raw-URL download in D012/Task 10 places the burden of knowing API URLs and response
formats on the user. This abstraction makes download a discoverable, guided UI action, and
isolates provider-specific logic behind a clean interface so new providers can be added without
touching existing modules.
Consequences:
- `src/sources/catalog.ts` — pure; no Obsidian imports; exports `KNOWN_PROVIDERS` and types
- `src/sources/adapters.ts` — pure; exports `SourceAdapter` interface and `getAdapter(type)`
- `src/translationManager.ts` — Obsidian-aware; exports `downloadFromSource`, `deleteTranslation`
- `src/translationDownloader.ts` remains for direct-URL download (Task 10); not removed
- `src/translationRegistry.ts` and `src/translationLoader.ts` are unchanged (local-only concern)
- Settings UI gains a Translation Sources panel and an Installed Translations panel
- New providers require: a new `SourceProvider` entry in catalog + a new adapter in adapters.ts
Revisit: if a provider offers a dynamic catalog endpoint (then translations[] may be fetched on demand).
Date: 2026-03-05

## D018 – Full-document scan permitted for user-triggered commands; cursor-relative "last" reference
Decision: The performance constraint "never scan the entire document on every update" applies
exclusively to automatic editor handlers (CM6 `ViewPlugin` update callbacks, `hoverTooltip` handlers).
User-triggered commands — invoked explicitly via the command palette or a keybinding — may perform
a single full-document scan via `view.state.doc.toString()`. This is a deliberate, one-time user
action; latency is acceptable and expected.
`insertAfterLastRefCommand` scans the full document but inserts after the **last reference whose end
position is at or before the cursor**. References beyond the cursor are ignored. This is the intended
UX: the command acts on the reference the user has most recently passed, not on a reference that may
be far ahead in the document.
Reason: Scanning the full document is needed because the target reference may be outside the visible
viewport. Filtering by cursor position makes the command predictable and cursor-aware — the user
controls which reference is "last" by placing the cursor. A purely document-order "last" would
produce surprising insertions when the cursor is near the top of a long note.
Consequences:
- `insertAfterLastRefCommand` in `src/editor/insertVerse.ts` uses `view.state.doc.toString()` for
  the scan, then filters to `m.end <= cursor` before selecting the last match
- Returns `false` (no-op) when the cursor precedes all references in the document
- The performance exception is documented in ARCHITECTURE.md under "Editor processing"
- No other automatic extensions may use this exception
Revisit: if users find cursor-relative behavior confusing; could add a separate "insert after last
reference in document" variant that ignores cursor position.
Date: 2026-03-06

## D017 – Copy button in verse DOM via Web API; no Obsidian import
Decision: The copy-to-clipboard button (Issue #2) is rendered inside `buildVerseDOM` when
`options.copyButton` is true. Clicking it calls `navigator.clipboard.writeText(formatVerseText(entries))`.
`navigator.clipboard` is standard Web API available in Electron (desktop) and Obsidian's mobile
WKWebView — no Obsidian import is required, preserving the `verseDOM.ts` purity boundary.
A new `formatVerseText(entries: VerseEntry[]): string` export in `verseDOM.ts` produces the
plain-text clipboard string independently of DOM construction; it can be unit-tested without a browser.
Both `hover.ts` and `refTooltip.ts` pass `{ copyButton: true }` when calling `buildVerseDOM`.
Reason: Centralising the button in `verseDOM.ts` means both Reading View and editor tooltip get the
feature with no duplication and no changes to caller signatures beyond adding the option flag.
Using Web API instead of a platform abstraction keeps the module pure and avoids Obsidian deprecation risk.
Consequences:
- `buildVerseDOM` signature gains `options?: { copyButton?: boolean }` (backwards-compatible)
- New export: `formatVerseText(entries: VerseEntry[]): string` from `src/ui/verseDOM.ts`
- `hover.ts` and `refTooltip.ts` pass `{ copyButton: true }` — no other changes to those modules
- `verseDOM.ts` boundary unchanged: still no Obsidian imports
Revisit: if `navigator.clipboard` requires a permission prompt on some platforms; fall back to
`document.execCommand('copy')` as a degradation path.
Date: 2026-03-06

## D016 – Remote catalog update from GitHub; fallback to bundled catalog
Decision: The source provider catalog (`SourceProvider[]`) can be refreshed from a hardcoded
GitHub raw URL without releasing a new plugin version. The update mechanism separates two concerns:
(a) **catalog data** — which providers exist and which translations they list — can be updated remotely;
(b) **adapter code** — how to fetch and transform a provider's data — always requires a plugin release.
The local resolution order is: cached `catalog.json` (from last successful update) → bundled
`KNOWN_PROVIDERS` (release-time snapshot). The bundled snapshot ensures the plugin always has a
working catalog offline even on first install.
Manual update: a "Update catalog" button in settings triggers `fetchCatalogUpdate()`, which calls
`requestUrl(CATALOG_REMOTE_URL)`, validates schema, filters providers with unknown `adapterType`
(forward-compatibility — a newer catalog entry won't crash an older plugin), then writes the result
to `catalog.json` in the plugin directory. The timestamp is saved to `settings.catalogLastUpdated`
and shown in the settings UI.
Auto-update: an opt-in toggle (`settings.autoUpdateCatalog`, default false) causes the plugin to
silently refresh the catalog on startup when the cache is stale. This is disabled by default to
comply with Obsidian's expectation that plugins do not make unsolicited network calls. When enabled,
it is functionally equivalent to pressing the button; no background polling occurs.
`CATALOG_REMOTE_URL` is a hardcoded constant (not user-configurable) to prevent SSRF. It points to
`catalog/providers.json` at a specific path in the official BibLens GitHub repository.
The remote catalog file includes a `schemaVersion` integer; the plugin rejects catalogs with an
unrecognised version rather than silently misinterpreting them.
Reason: Without this, every provider addition or removal requires users to update the plugin.
The adapter boundary ensures the remote file cannot introduce executable logic — it is pure data.
Consequences:
- `src/sources/catalogManager.ts` — Obsidian-aware; exports `loadCatalog`, `fetchCatalogUpdate`
- `CATALOG_REMOTE_URL` is a compile-time constant in `catalogManager.ts`; not exposed in settings
- `src/settings.ts` gains `autoUpdateCatalog: boolean` and `catalogLastUpdated: string`
- `catalog/catalog.json` is maintained in the `biblens-data` repository as the source-of-truth catalog file
- `src/sources/catalog.ts` `KNOWN_PROVIDERS` is regenerated from the `biblens-data` catalog at each plugin release
- Settings UI gains: last-updated label, "Update Now" button, "Auto-update on startup" toggle
Revisit: if catalog size grows enough that full replacement is wasteful (consider delta updates).
Date: 2026-03-05

## D019 – v0.4: Language pack and format pack architecture for multi-language reference recognition

Decision: Reference recognition is generalized through two independently downloadable pack types:

1. **Recognition language packs** — JSON files in `recognition-languages/`; one pack per language (id = BCP 47 language tag); provide recognized input aliases per book keyed by **USFM 3.0 identifiers**; loader builds `AbbreviationMap` directly without any conversion step.
2. **Reference format packs** — JSON files in `reference-formats/`; define notation rules (`ReferenceFormatRules`: separators, range notation) **and canonical display abbreviations per book** for a reference style; multiple formats can exist per language (e.g. Protestant, Catholic, Jewish). Canonical abbreviations live here, not in the language pack.

`buildRefScanner(map, format?, mode?)` is extended with optional `ReferenceFormatRules` and `ParsingMode` (`'strict' | 'extended'`). All parameters default to built-in Czech Protestant behaviour, preserving offline operation without any downloaded packs.

`customAbbreviations` is removed from `settings.ts` and `books.ts`; language packs subsume its role. `buildAbbreviationMap(custom)` is removed; replaced by `getBuiltInAbbreviationMap()` (offline fallback).

The source catalog schema advances from `schemaVersion: 1` to `schemaVersion: 2`, adding `languagePackProviders` and `referenceFormatProviders` arrays alongside the existing `translationProviders`. Older plugin versions reject a v2 catalog and fall back to bundled `KNOWN_PROVIDERS` — safe degradation via the existing `schemaVersion` guard (D016).

A new pure module `src/osisMapping.ts` centralizes OSIS→USFM conversion for use by adapters (e.g. the `"openbibleinfo"` adapter converts OSIS keys during download transformation before writing USFM-keyed pack files). The loader does not use `osisMapping.ts` — pack files already contain USFM keys.

New Obsidian-aware loader/registry pairs follow the translation pattern (D009, D012):
- `src/languagePackLoader.ts` / `src/languagePackRegistry.ts` — `recognition-languages/` directory
- `src/referenceFormatLoader.ts` / `src/referenceFormatRegistry.ts` — `reference-formats/` directory

Reason: Decoupling book names (language pack) from notation rules and canonical abbreviations (format pack) allows any combination to be active, enabling e.g. Czech book names with Catholic notation. Storing USFM keys in pack files means the loader is a simple read with no conversion; OSIS→USFM conversion is isolated to adapters where the openbibleinfo source data is handled. The catalog schema version bump ensures forward-compatible degradation in older plugin versions.

Consequences:
- `src/osisMapping.ts` — pure; no Obsidian imports
- `src/languagePackLoader.ts`, `src/languagePackRegistry.ts` — Obsidian-aware
- `src/referenceFormatLoader.ts`, `src/referenceFormatRegistry.ts` — Obsidian-aware
- `src/settings.ts` gains: `preferredLanguage`, `standardReferenceFormat`, `parsingRules`; loses `customAbbreviations`
- `src/books.ts` gains: `getBuiltInAbbreviationMap()`; loses `CustomAbbreviations` type and `buildAbbreviationMap(custom)`
- `src/parser.ts` `buildRefScanner` signature extended (backwards-compatible via optional params)
- `src/sources/catalog.ts` schema updated to v2; `KNOWN_PROVIDERS` structure updated accordingly
- Settings UI gains: Preferred language and Standard reference format dropdowns; Parsing rules toggle; Installed recognition languages and Installed reference formats sections; Install sources extended with language pack and format pack sub-sections

Supersedes: D013 (custom abbreviation mechanism — replaced by language packs).
Date: 2026-03-08

## D020 – v0.4 architectural completions: adapter interfaces, pack manager, formatRef, built-in fallback, translation field deprecation

Decision: Five open architectural questions from v0.4 are resolved as follows.

**1. Separate adapter interfaces per pack type.**
`src/sources/adapters.ts` defines three independent adapter interfaces: `SourceAdapter` (translations, unchanged), `LanguagePackAdapter`, and `ReferenceFormatAdapter`. Each has its own `buildUrl` and `transform` typed to the correct input/output. Three separate registry functions: `getAdapter`, `getLanguagePackAdapter`, `getReferenceFormatAdapter`. This preserves type safety without generics complexity.

**2. New `src/packManager.ts` for pack downloads and deletes.**
Language pack and format pack lifecycle (download, delete) is handled by a new `src/packManager.ts` module (Obsidian-aware), parallel to `translationManager.ts`. It exports `downloadLanguagePack`, `deleteLanguagePack`, `downloadReferenceFormat`, `deleteReferenceFormat`. `translationManager.ts` is unchanged.

**3. `loadCatalog` returns `CatalogData`, not `SourceProvider[]`.**
`CatalogData = { translationProviders, languagePackProviders, referenceFormatProviders }`. This aligns the return type with the v2 catalog schema and makes all three provider arrays accessible to callers. The bundled `KNOWN_PROVIDERS` fallback is restructured to the same shape.

**4. `formatRef` extended with optional `format` parameter.**
Signature: `formatRef(ref: BibleRef, format?: ReferenceFormatRules): string`. When provided, uses `format.books[ref.bookId]` for canonical abbreviation and `format.rules.*` for separators. Falls back to built-in Czech Protestant defaults when omitted. All call sites in `refTooltip.ts`, `hover.ts`, and `insertVerse.ts` pass the active `ReferenceFormatRules` from `main.ts`. Change is backwards-compatible.

**5. `BUILT_IN_FORMAT_RULES` exported from `books.ts`.**
A hardcoded `BUILT_IN_FORMAT_RULES: ReferenceFormatRules` constant in `books.ts` provides Czech Protestant separators and canonical abbreviations for all 66 books as a code-level fallback when no format pack is selected. Does not depend on the bundled `cs-protestant.json` file being present. The bundled file is still shipped for discoverability (appears in installed list), but the plugin's offline operation never reads it as a fallback.

**6. `canonicalAbbreviations` and `allowedAbbreviations` in translation files deprecated.**
Both optional v0.3 fields in translation files are silently ignored in v0.4 when a format pack or language pack is active. The format pack `books` map and language pack `aliases` are the sole authoritative sources. Existing translation files with these fields continue to load without error. No migration required.

Consequences:
- `src/sources/adapters.ts` gains `LanguagePackAdapter`, `ReferenceFormatAdapter` interfaces and `getLanguagePackAdapter`, `getReferenceFormatAdapter` registry functions
- `src/packManager.ts` — new Obsidian-aware module
- `src/sources/catalogManager.ts` `loadCatalog` return type changes to `CatalogData`
- `src/sources/catalog.ts` `KNOWN_PROVIDERS` restructured to `CatalogData` shape
- `src/parser.ts` `formatRef` gains optional second parameter
- `src/books.ts` gains `BUILT_IN_FORMAT_RULES: ReferenceFormatRules`
- `src/types.ts` gains `LanguagePackFile`, `ReferenceFormatFile`, `CatalogData` types
- Translation loader silently ignores `canonicalAbbreviations` and `allowedAbbreviations`
Date: 2026-03-08

## D022 – Separate `biblens-data` repository for distributable data packages

Decision: Distributable data packages (translations, language packs, reference format packs) are maintained in a dedicated `biblens-data` repository, separate from the main BibLens plugin source.

The repository is data-oriented: no plugin runtime logic is stored there. Its layout is:

```
biblens-data/
├─ catalog/
│  └─ catalog.json          ← main catalog entry point for the plugin
├─ resources/
│  ├─ translations/<language>/<id>/
│  ├─ language-packs/<language>/<id>/
│  └─ reference-formats/<language>/<id>/
└─ scripts/
```

Every resource lives at `resources/<type>/<language>/<resource-id>/` and contains a `manifest.json` plus its data files. Directory paths are stable identifiers (lowercase, kebab-case, no version numbers). Versions are declared inside `manifest.json`.

The plugin's `CATALOG_REMOTE_URL` constant points to `catalog/catalog.json` in this repository.
The `"biblens-catalog"` adapter fetches reference format pack files from `resources/reference-formats/<language>/<resource-id>/format.json`.

Reason: Separating data from plugin code allows resources to be published without a plugin release, enables independent licensing per resource, and makes community contributions to datasets easier to manage. The adapter boundary ensures the remote repository contains only data — no executable logic can be introduced remotely.

Consequences:
- `CATALOG_REMOTE_URL` in `src/sources/catalogManager.ts` points to the `biblens-data` repo, not the main BibLens repo
- The `"biblens-catalog"` adapter constructs URLs under `resources/reference-formats/<language>/<remoteId>/`
- `catalog/catalog.json` in `biblens-data` is the source-of-truth; `KNOWN_PROVIDERS` in the plugin is regenerated from it at each release
- Plugin code, plugin data, and data contributions evolve on independent release cycles
Date: 2026-03-09

## D021 – v0.4: `refFormat` propagation through call stack; English as international default; `CatalogData` in types.ts

**B1 — `refFormat` propagation.**
`getVerses` gains an optional third parameter `refFormat?: ReferenceFormatRules` and passes it to `formatRef` for the first-entry label. The editor factory functions `refTooltipExtension`, `insertVerseCommand`, and `insertAfterLastRefCommand` each gain a corresponding optional `refFormat?` parameter and forward it to `getVerses`. `main.ts` passes the active `ReferenceFormatRules` to all three factories at construction time. All changes use optional parameters for backwards compatibility.
The parameter is named `refFormat` (not `format`) to avoid collision with the existing `format: InsertionFormat` parameter in the insert commands.

**C1 — English as the international default.**
The built-in fallback is changed from Czech Protestant to English (colon notation):
- `getBuiltInAbbreviationMap()` in `books.ts` returns English aliases (`Gen`, `Exod`, `Matt`, etc.)
- `BUILT_IN_FORMAT_RULES` in `books.ts` uses colon chapter-verse separator, hyphen range separator, space book-chapter separator, and standard English canonical abbreviations for all 66 books
- The bundled format pack shipped with the plugin is `en` (English); the Czech Protestant pack is available for download, not bundled
- The code-level constants are the actual offline fallback; the bundled `en.json` file is for discoverability only
Reason: the plugin targets international users; Czech-specific defaults are inappropriate as a universal fallback. English (SBL/common notation) is the most widely recognised Bible reference format internationally.

**C2 — `CatalogData` lives in `src/types.ts`.**
Consistent with all other shared types. `catalogManager.ts` references `CatalogData` from `src/types.ts`; it does not define it.

Consequences:
- `src/provider.ts` `getVerses` signature gains optional `refFormat?: ReferenceFormatRules`
- `src/editor/refTooltip.ts` `refTooltipExtension` gains optional `refFormat?: ReferenceFormatRules`
- `src/editor/insertVerse.ts` `insertVerseCommand` and `insertAfterLastRefCommand` gain optional `refFormat?: ReferenceFormatRules`
- `src/books.ts` `getBuiltInAbbreviationMap()` returns English aliases; `BUILT_IN_FORMAT_RULES` uses English notation
- Bundled format pack changes from `cs-protestant` to `en`
- `CatalogData` type defined in `src/types.ts`
Date: 2026-03-08
