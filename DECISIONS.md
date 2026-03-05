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
- `catalog/providers.json` is added to the BibLens repository as the source-of-truth catalog file
- `src/sources/catalog.ts` `KNOWN_PROVIDERS` is regenerated from `catalog/providers.json` at each plugin release
- Settings UI gains: last-updated label, "Update Now" button, "Auto-update on startup" toggle
Revisit: if catalog size grows enough that full replacement is wasteful (consider delta updates).
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
