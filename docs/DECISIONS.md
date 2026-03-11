# Decisions

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
- Loading is async; UI falls back to "Verse not found." if data is not yet available.
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

## D011 – Chapter-only and chapter-range refs return all verses across the spanned chapters
Decision: When a `BibleRef` has no `verseStart`, `getVerses` returns all verses found in `TranslationData` for every chapter in `chapterStart..chapterEnd` (where `chapterEnd` defaults to `chapterStart` when absent), sorted by verse number within each chapter.
- `Gn 22` (`chapterEnd` absent) → all verses of chapter 22.
- `Gn 1-3` (`chapterEnd` = 3) → all verses of chapters 1, 2, and 3 in order.
Reason: A chapter ref should show the full content of the spanned range, not an empty result. This is the most useful behavior for readers navigating by chapter or pericope.
Consequences:
- `provider.ts` iterates `chapterStart..chapterEnd`; for each chapter scans `TranslationData` keys with prefix `${bookId}.${chapter}.`.
- First entry label uses `formatRef` (e.g. `Gn 22`, `Gn 1-3`); subsequent labels are bare verse numbers.
- An unknown chapter range (no matching keys) still returns `[]`, triggering the "Verse not found." fallback.
- Lookup complexity: O(n × chapters spanned).
Supersedes: the "chapter-only returns []" clause from Task 6 DoD.
Date: 2026-03-04 (extended 2026-03-10)

## D012 – Translation registry and selection via settings
Decision: Available translations are discovered at runtime by listing the `translations/` directory.
The active translation is selected via `settings.preferredTranslation` (default: `"cep"`).
A new `src/translationRegistry.ts` module handles discovery. A `src/translationDownloader.ts` module was planned here for direct-URL fetching but was not implemented; `src/translationManager.ts` (D015) covers this responsibility instead.
Reason: D009 established the `translations/` directory pattern. This decision completes it by adding
selection and optional download without requiring plugin rebuilds.
Consequences:
- `src/translationRegistry.ts` (Obsidian-aware): exports `listAvailableTranslations(adapter, pluginDir): Promise<TranslationMeta[]>`
- `src/translationDownloader.ts` — planned but not implemented; superseded by `translationManager.ts`
- `src/types.ts` adds `type TranslationMeta = { id: string; displayName: string }`
- `src/settings.ts` gains `preferredTranslation: string`
- `main.ts` reads `settings.preferredTranslation` on load and reloads on settings change
- `translationLoader.ts` interface is unchanged
Revisit: when a full settings UI with translation manager (list, download, delete) is built.
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
- `src/translationDownloader.ts` was planned for direct-URL download but was never created; `translationManager.ts` serves both purposes
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

`buildRefScanner(map, format?, mode?)` is extended with optional `ReferenceFormatRules` and `ParsingMode` (`'strict' | 'extended'`). All parameters default to built-in English behaviour (`BUILT_IN_FORMAT_RULES`: colon separator, English abbreviations), preserving offline operation without any downloaded packs.

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
Signature: `formatRef(ref: BibleRef, format?: ReferenceFormatRules): string`. When provided, uses `format.books[ref.bookId]` for canonical abbreviation and `format.chapterVerseSeparator`, `format.rangeSeparator`, `format.bookChapterSeparator` for separators. Falls back to built-in English defaults when omitted. All call sites in `refTooltip.ts`, `hover.ts`, and `insertVerse.ts` pass the active `ReferenceFormatRules` from `main.ts`. Change is backwards-compatible.

**5. `BUILT_IN_FORMAT_RULES` exported from `books.ts`.**
A hardcoded `BUILT_IN_FORMAT_RULES: ReferenceFormatRules` constant in `books.ts` provides English separators (colon chapter-verse, hyphen range, space book-chapter) and canonical English abbreviations for all 66 books as a code-level fallback when no format pack is selected. Does not depend on the bundled `en.json` file being present. The bundled file is still shipped for discoverability (appears in installed list), but the plugin's offline operation never reads it as a fallback.

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

## D026 – Parser book-name detection: alias alternation replaces generic character class

Decision: The book-name part of the `buildRefScanner` scan regex is changed from a generic character-class pattern (`[A-ZÁČĎ...][a-záčď...]{0,10}`) to a **compiled alternation of alias strings** derived from the active alias source, sorted longest-first.

Alias source per mode:
- **Strict** — canonical abbreviation values from `fmt.books` (one per book, from the active reference format pack)
- **Extended** — all keys of `AbbreviationMap` (all aliases from the active language pack)

Case handling: strict mode is case-sensitive (exact canonical forms only); extended mode uses the regex `'i'` flag, allowing normalized lowercase map keys to match any case in text.

`bookChapterSeparator` enforcement: strict mode uses the exact separator from `fmt`; extended mode uses `\s+`.

CV parsing: a precompiled cv-extraction regex replaces the inline `parseChapterVersePart` function; two variants are compiled at scanner construction (strict uses `fmt` separators; extended accepts `,`, `:`, `.`); shared via `parseCVPart(rest, cvRe)` helper.

openbibleinfo attribution: recognition language packs downloaded from openbibleinfo/Bible-Passage-Reference-Parser (MIT license, copyright Stephen Smith 2011–2026) must carry attribution in their `source` field and in `LICENSES.md` at the plugin root.

Reason: The character-class approach silently drops book names outside Czech/ASCII characters and cannot match multi-word aliases (e.g. `1. Mojžíšova`, `First Samuel`). The alternation approach is language-agnostic, supports multi-word names, and makes the alias source explicit and mode-controlled. Case-insensitive matching in extended mode is consistent with the recall-over-precision design of that mode (SPEC.md v0.4 Parsing Modes).

Consequences:
- `src/parser.ts`: `buildRefScanner` internals replaced; `parseCVPart` helper added; `parseChapterVersePart` collapsed to a one-liner wrapper over `parseCVPart` (not removed: `parseCzechBibleRef` depends on it; internal only, not an export stub)
- `src/parser.ts` exported interface unchanged: `buildRefScanner`, `scanRefs`, `parseCzechBibleRef`, `formatRef`, `RefScanner`, `RefMatch` all retain current signatures
- `candidateRegex()` and `scanRefs` remain unchanged (legacy path, not the `buildRefScanner` path)
- No changes to `books.ts`, `types.ts`, `main.ts`, or any caller

Supersedes: the character-class regex portion of D019 (which introduced `buildRefScanner` but did not specify the book-name regex strategy).
Date: 2026-03-09

## D025 – Settings General section as status panel; auto-default on empty preference

Decision: The General section of the settings tab is redesigned as a read-only status panel. The Preferred Translation dropdown is removed. Three non-interactive status rows replace all asset-selection controls in General:

- **Translation** — active translation display name, or "None — verse text unavailable"
- **Reference format** — active format pack display name, or "Built-in English"
- **Recognition language** — active language pack display name, or "Built-in English"

The Parsing rules dropdown remains the only interactive control in General. All asset selection is delegated to the collapsible sections via "Set as default" buttons, which are the sole interactive path for changing the active item of each type.

**Auto-default on empty preference:**
Whenever `display()` renders and `settings.preferredTranslation`, `settings.standardReferenceFormat`, or `settings.preferredLanguage` is empty while at least one item of that type is installed, the first installed item is automatically set as default (save + appropriate reload). Covers:
- First download of any asset type
- Manual file drop detected on next tab open
- Active item deletion (preference cleared → next available item auto-selected)

The condition is purely `settings.preferredX === ''` — it does not override an existing preference.

**Async structure:**
`display()` issues a single `Promise.all` over `loadCatalog`, `listAvailableTranslations`, `listAvailableReferenceFormats`, and `listAvailableLanguagePacks`. Auto-default runs first on the resolved data, then `renderGeneral(status)` and each `renderInstalledX(data)` are called with consistent, settled values. This eliminates the race condition that would arise if General status rows and auto-default ran in independent async chains.

Reason: A status panel answers "what is currently active?" without requiring the user to open any collapsible section. Dropdown selectors in General were redundant with the "Set as default" buttons and created two separate paths to the same setting. Auto-default removes a mandatory second step after first install.

Consequences:
- `src/settingsTab.ts`: `display()` restructured to single `Promise.all`; `renderGeneral(status)` parameterised; `renderInstalledX` accept pre-fetched list data; auto-default logic in `display()`
- No changes to `src/settings.ts`, `src/main.ts`, or any other module
Date: 2026-03-09

## D023 – Two insert commands replace configurable insertion mode

Decision: The `settings.verseInsertionFormat` setting and the "Verse insertion format" dropdown are removed. In their place, two independently named commands are registered:

- `BibLens: Insert verse after previous reference` — appends verse text inline after the last reference before the cursor (` — verse text`)
- `BibLens: Replace previous reference with quote` — replaces the last reference before the cursor with a blockquote line (`> Ref verse text`)

Both commands operate on the last reference whose end is at or before the cursor (same cursor-relative logic as D018).

Reason: Two named commands make the different insertion behaviours self-documenting in the command palette. Users no longer need to visit Settings to switch modes; the intent is expressed by the command chosen. The format parameter is removed from `insertAfterLastRefCommand`; a new `replaceLastRefWithQuoteCommand` factory is added.

Consequences:
- `src/editor/insertVerse.ts`: `insertAfterLastRefCommand` loses `format` param; new `replaceLastRefWithQuoteCommand` export; `InsertionFormat` type removed
- `src/settings.ts`: `verseInsertionFormat` field and `InsertionFormat` type removed from `BibLensSettings` and `DEFAULT_SETTINGS`
- `src/main.ts`: two commands registered (`insert-verse-after-last`, `replace-ref-with-quote`); `verseInsertionFormat` pass-through removed
- `src/settingsTab.ts`: "Verse insertion format" `Setting` block removed from `renderGeneral()`

Supersedes: D014 (which introduced the configurable insertion format).
Date: 2026-03-09

## D024 – Hover popover: scrollable content and text selection

Decision: The Reading View popover and editor tooltip are updated to allow scrolling through large verse blocks and selecting text with standard OS shortcuts (Cmd/Ctrl+C).

Root cause: `styles.css` sets `pointer-events: none` on `.biblens-popover`, which prevents all mouse interaction including text selection. This is removed.

**Reading View popover (`PopoverManager`):**
- `pointer-events: none` removed from `.biblens-popover`; `pointer-events: auto; user-select: text` added
- `max-height: 40vh; overflow-y: auto` added to `.biblens-popover`
- `PopoverManager.show()` sets up `mouseenter`/`mouseleave` on the popover element, tracking a `_popoverHovered` flag
- New `requestHide()` method: hides only when `_popoverHovered` is false; called by the anchor span's `mouseleave` handler in `main.ts` (replacing the direct `hide()` call)
- `hide()` remains for unconditional teardown on plugin unload

**Editor tooltip (`refTooltip.ts` / `.biblens-editor-tooltip`):**
- `user-select: text; pointer-events: auto; max-height: 40vh; overflow-y: auto` added to `.biblens-editor-tooltip` CSS
- No code change to `refTooltip.ts` — CSS only
- Limitation: CM6's `hoverTooltip` dismisses when the mouse leaves the decorated token range; drag-selection from outside the tooltip into the tooltip DOM is not supported. Text selection within the visible tooltip (click inside, Cmd/Ctrl+A/C) works.

**`verseDOM.ts`:**
- Container element changed from `<span>` to `<div class="biblens-verse-content">`; `user-select: text` applied via this class
- `buildVerseDOM` signature unchanged (no options parameter)

Reason: Scrollability is essential for chapter-only references (D011) which may return dozens of verses. Text selection is a baseline expectation for any displayed text content.

Consequences:
- `styles.css`: updated `.biblens-popover` and `.biblens-editor-tooltip` rules
- `src/ui/hover.ts`: `_popoverHovered` flag; `requestHide()` method; `show()` sets up popover mouse events
- `src/main.ts`: span `mouseleave` handler changed from `popover.hide()` to `popover.requestHide()`
- `src/ui/verseDOM.ts`: container `<span>` → `<div class="biblens-verse-content">`

Date: 2026-03-09

## D027 – Migrate sourcing to biblens-data: flat resource layout, unified adapter type, openbibleinfo removed

Decision: All downloadable resource types (translations, language packs, reference format packs) served from the `biblens-data` repository use a single flat file layout and a new `"biblens-data"` adapter type. The `"openbibleinfo"` provider is removed from language pack and reference format downloads. The `"biblens-catalog"` adapter type is removed and replaced by `"biblens-data"`.

**Correction to D022 repository layout.** D022 described nested paths (`resources/<type>/<language>/<resource-id>/`). The actual biblens-data layout is flat:

```
biblens-data/
└─ resources/
   ├─ translations/
   │  ├─ index.json      ← { formatVersion, type, items: [{ id, displayName, lang, path }] }
   │  └─ <id>.json
   ├─ language-packs/
   │  ├─ index.json
   │  └─ <id>.json
   └─ reference-formats/
      ├─ index.json
      └─ <id>.json
```

Each category directory contains an `index.json` listing available files (`items[].path` is relative to the repo root), plus one JSON file per resource. All files are pre-authored in BibLens format with USFM book keys — no OSIS conversion or proprietary-format parsing is needed at download time.

**New `"biblens-data"` adapter type** in all three registries:
- Translation adapter: URL `${baseUrl}/resources/translations/${remoteId}.json`; transforms v1 JSON → flat `TranslationData`
- Language pack adapter: URL `${baseUrl}/resources/language-packs/${remoteId}.json`; pass-through JSON (already `LanguagePackFile` format)
- Reference format adapter: URL `${baseUrl}/resources/reference-formats/${remoteId}.json`; pass-through JSON (already `ReferenceFormatFile` format)

**`KNOWN_PROVIDERS` changes:**
- `translationProviders`: add biblens-data entry alongside existing `getbible-net` and `beblia-xml`
- `languagePackProviders`: replace `openbibleinfo` with biblens-data (sole provider)
- `referenceFormatProviders`: replace both `openbibleinfo` and `biblens-catalog` entries with single biblens-data entry

**Removed from `adapters.ts`:**
- `openbibleinfoLanguagePackAdapter` — complex `data.txt` parser with OSIS→USFM conversion
- `openbibleinfoReferenceFormatAdapter` — `data.txt` parser that required separator rules embedded in the catalog entry
- `biblensCatalogFormatAdapter` — replaced by the new biblens-data format adapter
- `"openbibleinfo"` removed from `LANG_REGISTRY` and `FORMAT_REGISTRY`
- `"biblens-catalog"` removed from `FORMAT_REGISTRY`
- `RemoteReferenceFormatEntry.rules` optional field removed (was only used by the openbibleinfo format adapter)
- `ReferenceFormatAdapter.transform` signature simplified from `(raw, entry)` to `(raw)` — `entry` is no longer needed since the biblens-data adapter is a pass-through

`osisMapping.ts` is retained (future adapters may need OSIS→USFM conversion) but is no longer imported by `adapters.ts`.

Reason: The openbibleinfo `data.txt` format required complex variable expansion and OSIS→USFM conversion in the plugin. Moving to pre-authored BibLens-format packs in `biblens-data` eliminates that complexity, ensures consistent pack quality, and makes all three resource types follow the same download pattern. The flat layout simplifies URL construction.

**`normaliseV1Keys` duplication.** The function that converts `"GEN 1:1"` verse keys to `"GEN.1.1"` lives in `translationLoader.ts` as a private helper. `adapters.ts` is a pure module and must not import from Obsidian-aware `translationLoader.ts`. The function is 4 lines and stable; it is duplicated inline inside the biblens-data translation adapter. No shared utility module is introduced.

Consequences:
- `src/sources/adapters.ts`: three adapters removed; three new pass-through/transform adapters added; registries updated; `osisToUsfm` import removed
- `src/sources/catalog.ts`: `KNOWN_PROVIDERS` updated; `RemoteReferenceFormatEntry.rules` field removed
- `src/packManager.ts`: `adapter.transform(response.text, entry)` call on the reference format path changed to `adapter.transform(response.text)` — `entry` continues to be used for metadata population after `transform()`, which is unaffected
- `src/sources/catalogManager.ts`: no logic change; `CATALOG_REMOTE_URL` unchanged
- `src/translationManager.ts`: no change
- `src/osisMapping.ts`: retained but no longer imported by `adapters.ts`
- Previously downloaded openbibleinfo language packs on disk continue to work — the loader is unchanged

Supersedes: D022 repository layout (flat replaces nested paths).
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

## D030 – Verse label scheme: first-verse label and chapter-boundary markers *(supersedes D028)*

Decision: `getVerses` uses a refined label scheme for multi-verse results:

1. **First entry label** — always `formatRef` of the *first verse only* (stripping `verseEnd` and `chapterEnd` from the ref before calling `formatRef`). This gives `Gn 22,1` instead of `Gn 22,1-3` for a range, making the label consistent with the subsequent per-verse labels.

2. **Subsequent entry labels** — bare verse number (`String(v)`), unchanged from D011/D028.

3. **Chapter boundary** — the first verse of each new chapter in a cross-chapter result receives:
   - A chapter-qualified label (chapter and verse, e.g. `2,1` using the active format's `chapterVerseSeparator`, omitting the book abbreviation).
   - `chapterBreak: true` on its `VerseEntry`, which causes `buildVerseDOM` to insert a `<br>` before that entry.

`VerseEntry` gains an optional field: `chapterBreak?: boolean`.

Example — `Gn 1,31-2,2` produces:
- `{ label: "Gn 1,31", text: "...", chapterBreak: undefined }`
- `{ label: "32", text: "...", chapterBreak: undefined }`
- `{ label: "2,1", text: "...", chapterBreak: true }`
- `{ label: "2", text: "...", chapterBreak: undefined }`

Reason: Resolves the D028 revisit case. The first label as a full range ref was redundant — the range is already implied by the sequence of verse labels. Chapter boundaries in cross-chapter passages are invisible with bare verse numbers, causing `1` to be ambiguous (chapter 1 verse 1 vs chapter 2 verse 1). The `chapterBreak` flag keeps the data/render separation clean: `provider.ts` signals structure, `buildVerseDOM` renders it.

Consequences:
- `src/types.ts` (or `src/provider.ts`): `VerseEntry` gains `chapterBreak?: boolean`.
- `provider.ts` `addChapterVerses` takes a `chapter` parameter; tracks whether this is the first entry and whether a chapter boundary has been crossed; sets label and `chapterBreak` accordingly.
- `verseDOM.ts` `buildVerseDOM`: before appending an entry with `chapterBreak: true`, inserts a `<br>` element instead of a space.
- Insert commands (`insertVerse.ts`) use only `label` and `text` — unaffected by `chapterBreak`.
- Chapter-only and chapter-range refs (D011) also benefit: first label becomes the first-verse ref (e.g. `Gn 22,1`) rather than the chapter ref (e.g. `Gn 22`). This is a minor change in behaviour; the chapter ref is still conveyed by the user's hover trigger.

Date: 2026-03-10

## D029 – Single-chapter book semantic: plain numbers parsed as verses, not chapters

Decision: For the five USFM single-chapter books (`OBA`, `PHM`, `2JN`, `3JN`, `JUD`), when the user writes a reference with no chapter-verse separator (e.g. `Abd 2` or `Abd 2-3`), the parser interprets the numbers as verses of chapter 1, producing `chapterStart: 1, verseStart: 2` (or with `verseEnd: 3`). Explicit notation (`Abd 1,2`) remains valid but is treated as redundant. `formatRef` omits the chapter number when formatting such refs — a single-chapter book ref with a `verseStart` is rendered as `abbr bookChapSep verseStart[-verseEnd]`.

Reason: these books have only one chapter; a bare number is unambiguous as a verse reference, and requiring explicit `1,N` notation would be needlessly verbose and inconsistent with how readers normally cite them.

Consequences:
- `books.ts` exports `SINGLE_CHAPTER_BOOKS: Set<BookId>` checked in both `parseCVPart` and `formatRef`.
- `parseCVPart` accepts a `bookId` parameter specifically to support this branch.
- Applies in both `buildRefScanner` (scanner path) and `parseCzechBibleRef` (legacy path via `parseChapterVersePart`).

Revisit: if more complex multi-chapter-with-no-verse patterns are needed for single-chapter books.
Date: 2026-03-10

## D031 – Remove catalog management UI; catalog loaded transparently on settings-tab open

Decision: The Advanced section (catalog update button, auto-update-on-startup toggle) has been removed from the BibLens settings UI. The catalog is now loaded transparently each time the settings tab opens via `loadCatalog()`, which reads the cached `catalog.json` or falls back to the bundled `KNOWN_PROVIDERS`. No explicit user action or network call is needed to populate the provider dropdowns.

Reason: Simplification. The Advanced section added visible complexity and a startup network call (`autoUpdateCatalog`) that brought no user-visible benefit over the transparent fallback. Keeping the catalog fresh is better handled by a future background mechanism if needed.

Consequences:
- `autoUpdateCatalog` and `catalogLastUpdated` removed from `BibLensSettings` and `DEFAULT_SETTINGS`.
- `fetchCatalogUpdate` and `isCatalogStale` removed from the codebase.
- `src/sources/catalogUtils.ts` deleted.
- Existing user data with leftover `autoUpdateCatalog`/`catalogLastUpdated` keys is silently ignored by the `Object.assign({}, DEFAULT_SETTINGS, saved)` merge pattern.

Revisit: if a background catalog-refresh mechanism is added in a future version.
Date: 2026-03-11
