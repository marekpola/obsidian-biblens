# BibLens – Task Backlog

This file defines the active development tasks.
Each task must include a clear Definition of Done (DoD).

## Definition of Done

Each task defines its own acceptance criteria in `.claude/TASKS.md`. The following is the minimum technical bar that must also pass for every task:

1. npm run check passes
2. npm run ci passes
3. All tests green
4. Plugin builds successfully

Both the task's own DoD and this global DoD must pass before a task is marked Done.

---

## Active

### Task 24 – Settings UI and main.ts Wiring
Issue: #10

#### Goal
Wire language pack and reference format pack loading into plugin startup; expose new settings controls in the settings tab.

#### Scope
- `src/types.ts`: add `LanguagePackFile`, `ReferenceFormatFile`, `CatalogData` types
- `src/sources/catalog.ts`: restructure `KNOWN_PROVIDERS` to `CatalogData` shape (`{ translationProviders, languagePackProviders, referenceFormatProviders }`)
- `src/sources/catalogManager.ts`: change `loadCatalog` return type from `SourceProvider[]` to `CatalogData`
- `src/sources/adapters.ts`: add `LanguagePackAdapter` and `ReferenceFormatAdapter` interfaces; add `getLanguagePackAdapter` and `getReferenceFormatAdapter` registry functions
- `src/packManager.ts`: new Obsidian-aware module; exports `downloadLanguagePack`, `deleteLanguagePack`, `downloadReferenceFormat`, `deleteReferenceFormat`
- `src/main.ts`:
  - On `onload()`: call `loadCatalog()` → `CatalogData`; load active language pack via `languagePackLoader.ts` (fall back to `getBuiltInAbbreviationMap()` if none selected); load active format pack via `referenceFormatLoader.ts` (fall back to `BUILT_IN_FORMAT_RULES` from `books.ts` if none selected); call `buildRefScanner(map, formatRules, settings.parsingRules)` and pass resulting `RefScanner` to editor extensions and insert commands; pass active `ReferenceFormatRules` as `refFormat` to `refTooltipExtension`, `insertVerseCommand`, and `insertAfterLastRefCommand`
- `src/settingsTab.ts`:
  - General section: add **Preferred language for reference recognition** dropdown (from `listAvailableLanguagePacks`), **Standard reference format** dropdown (from `listAvailableReferenceFormats`), **Parsing rules** dropdown (Strict / Extended); changes trigger scanner rebuild via `plugin.reloadScanner()`
  - After Installed translations: add **Installed reference formats** section (name, language, Delete button) and **Installed recognition languages** section (name, language, Delete button); Delete calls `packManager.ts: deleteReferenceFormat()`/`deleteLanguagePack()`
  - Install sources section renamed from "Get translations" to "Install sources"; add **Reference formats** sub-section (provider dropdown + format dropdown + Download button) and **Recognition languages** sub-section (provider dropdown + language dropdown + Download button); Download calls `packManager.ts: downloadReferenceFormat()`/`downloadLanguagePack()`

#### Definition of Done
- Changing Preferred language or Standard reference format in settings immediately re-applies detection without plugin restart
- Installed packs appear in their respective sections with working Delete buttons
- Install sources section downloads a format or language pack and the new pack appears in the installed list
- `formatRef` uses the active format pack's canonical abbreviations when formatting references in tooltips and insertions
- `npm run check` and `npm run ci` pass

---
## Next


### Task 13 – Copy Verse Text to Clipboard
Issue: #2

#### Goal
Add a copy button to the hover popover and editor tooltip that copies the full formatted verse text to the clipboard.

#### Scope
- `src/ui/verseDOM.ts`: implement `buildVerseDOM` `copyButton` option — when `true`, append a `<button>` that calls `navigator.clipboard.writeText(formatVerseText(entries))`
- `src/ui/verseDOM.ts`: implement `formatVerseText(entries: VerseEntry[]): string` — join entries as `<label> <text>` separated by single space
- `src/ui/hover.ts` and `src/editor/refTooltip.ts`: pass `{ copyButton: true }` when calling `buildVerseDOM`
- No Obsidian imports — `navigator.clipboard` is Web API; mobile-compatible

#### Definition of Done
- Copy button appears in both Reading View popover and editor tooltip
- Clicking the button copies plain-text verse content to clipboard
- `src/ui/verseDOM.ts` has no Obsidian imports
- `npm run check` and `npm run ci` pass

---

## Future (Not MVP)
- Parallel text support
- Morphology
- Configurable abbreviation systems

---
## Done

### Task 23 – buildRefScanner: Format Rules and Parsing Mode
Issue: #10

#### Goal
Extend the parser with `buildRefScanner` that compiles a regex once from a given `AbbreviationMap`, optional `ReferenceFormatRules`, and `ParsingMode`; add v0.4 settings fields.

#### Scope
- `src/parser.ts`: implement `buildRefScanner(map: AbbreviationMap, format?: ReferenceFormatRules, mode?: ParsingMode): RefScanner`
  - Strict mode: enforce format pack separators (chapterVerseSeparator, rangeSeparator, bookChapterSeparator)
  - Extended mode: accept all plausible separator variants regardless of format pack
  - Falls back to `BUILT_IN_FORMAT_RULES` (from `books.ts`) when no format pack is provided
- `src/parser.ts`: extend `formatRef(ref: BibleRef, refFormat?: ReferenceFormatRules): string` — when `refFormat` is provided, uses `refFormat.books[ref.bookId]` for abbreviation and `refFormat.rules.*` for separators; falls back to built-in English defaults when omitted
- `src/provider.ts`: extend `getVerses(data: TranslationData, ref: BibleRef, refFormat?: ReferenceFormatRules): VerseEntry[]` — passes `refFormat` to `formatRef` for the first-entry label; no Obsidian imports
- `src/books.ts`: export `BUILT_IN_FORMAT_RULES: ReferenceFormatRules` — hardcoded English colon-notation separators and canonical abbreviations for all 66 books (e.g. `GEN → "Gen"`, `MAT → "Matt"`); no Obsidian imports
- `src/settings.ts`: add `preferredLanguage: string` (default `""`), `standardReferenceFormat: string` (default `""`), `parsingRules: 'strict' | 'extended'` (default `'strict'`) to `BibLensSettings` and `DEFAULT_SETTINGS`

#### Definition of Done
- `buildRefScanner` with built-in English defaults detects `Matt 1:3` and `Gen 22:1-19` in strict mode
- Extended mode additionally detects `Matt 1,3` and `Gen 22,1-19` (comma separator variant)
- `formatRef(ref, BUILT_IN_FORMAT_RULES)` produces `"Gen 1:1"` for `{ bookId: "GEN", chapterStart: 1, verseStart: 1 }`
- `src/parser.ts` and `src/books.ts` have no Obsidian imports
- `npm run check` and `npm run ci` pass



### Task 22 – Reference Format Loader and Registry
Issue: #10

#### Goal
Implement reading and listing of reference format packs from `reference-formats/` in the plugin directory.

#### Scope
- `src/referenceFormatLoader.ts`: implement `loadReferenceFormat(adapter, pluginDir, id): Promise<{ rules: ReferenceFormatRules; meta: ReferenceFormatMeta }>` — reads `reference-formats/${id}.json`, validates mandatory fields (`rules` + `books`), returns `ReferenceFormatRules` (which includes `books: Record<string, string>`)
- `src/referenceFormatRegistry.ts`: implement `listAvailableReferenceFormats(adapter, pluginDir): Promise<ReferenceFormatMeta[]>` — scans `reference-formats/` and returns metadata from each `.json` file

#### Definition of Done
- Loading a valid format pack JSON produces a correct `ReferenceFormatRules` object including `books` (USFM → canonical abbreviation map)
- Registry returns an empty array (not an error) when the directory does not exist
- Both modules may import from `obsidian`; neither imports from DOM APIs
- `npm run check` and `npm run ci` pass




### Task 21 – Language Pack Loader and Registry
Issue: #10

#### Goal
Implement reading and listing of recognition language packs from `recognition-languages/` in the plugin directory.

#### Scope
- `src/languagePackLoader.ts`: implement `loadLanguagePack(adapter, pluginDir, id): Promise<{ map: AbbreviationMap; meta: LanguagePackMeta }>` — reads `recognition-languages/${id}.json`; book keys are USFM (no conversion needed); flattens `books[usfmId].aliases` into `AbbreviationMap`
- `src/languagePackRegistry.ts`: implement `listAvailableLanguagePacks(adapter, pluginDir): Promise<LanguagePackMeta[]>` — scans `recognition-languages/` and returns metadata from each `.json` file

#### Definition of Done
- Loading a valid language pack JSON (USFM-keyed) produces a correct `AbbreviationMap`
- `languagePackLoader.ts` does not import `osisMapping.ts`
- Registry returns an empty array (not an error) when the directory does not exist
- Both modules may import from `obsidian`; neither imports from DOM APIs
- `npm run check` and `npm run ci` pass

### Task 20 – OSIS→USFM Mapping
Issue: #10

#### Goal
Implement the static OSIS→USFM 3.0 lookup table used by adapters to convert OSIS book identifiers (e.g. `Gen`, `Matt`) to USFM identifiers (e.g. `GEN`, `MAT`) during download transformation. Pack files store USFM keys; this module is not used by the loaders.

#### Scope
- `src/osisMapping.ts`: implement `osisToUsfm(osisId: string): BookId | undefined` — static map covering all 66 canonical books; no Obsidian imports

#### Definition of Done
- `osisToUsfm("Gen")` returns `"GEN"`, `osisToUsfm("Matt")` returns `"MAT"`, unknown input returns `undefined`
- Module has no Obsidian imports
- `npm run check` and `npm run ci` pass

---


### Task 19 – Settings UI Restructure
Issue: #9

#### Definition of Done
- Settings tab renders four sections in order: General (no heading), Installed translations, Get translations, Advanced ✓
- General section retains Preferred Translation dropdown; its value stays in sync with [Set as default] actions ✓
- Each installed translation shows Name, Language, Source (if present) and [Set as default] + [Delete] buttons ✓
- [Set as default] immediately switches the active translation (hover/tooltip update) ✓
- [Delete] works for all translations including the active one; auto-selects first remaining or clears if none remain ✓
- Get translations shows provider dropdown + translation dropdown + single Download button; Download disabled until translation selected ✓
- No "Update" button anywhere in settings ✓
- `TranslationMeta` includes optional `source` field; `listAvailableTranslations` reads it from v1 files ✓
- `docs/ARCHITECTURE.md` Key Types section updated with new `TranslationMeta` shape ✓
- `npm run check` and `npm run ci` pass ✓

---

### Task 18 – Initial source catalog: 2+ Czech Bible translation providers
Issue: #7

#### Definition of Done
- At least 2 providers visible in the Translation Sources panel ✓
- Downloading a translation from each provider produces a valid v1 `translations/${id}.json` ✓
- Verse text from a newly downloaded translation is visible in hover/tooltip after selecting it ✓
- Book IDs in downloaded files use USFM 3.0 format ✓
- `npm run check` and `npm run ci` pass ✓

---

### Task 17 – Translation Source Management UI
Issue: #6

#### Definition of Done
- User can see available providers and their translations in settings ✓
- Download writes a valid file to `translations/`; translation appears in Preferred Translation dropdown immediately ✓
- Delete removes the file; it disappears from both panels ✓
- "Update catalog" button fetches and caches `catalog.json`; last-updated date updates in UI ✓
- Auto-update toggle persists across plugin reload ✓
- `npm run check` and `npm run ci` pass ✓

---

### Task 16 – Translation file format v1: versioned loader and cep.json migration
Issue: #8

#### Goal
Implement the v1 translation file format: versioned loader with format detection, key normalisation, and migration of `cep.json`.

#### Definition of Done
- v1 `cep.json` loads correctly; hover and tooltips show verse text as before ✓
- Legacy flat JSON file still loads without error ✓
- File with unknown `formatVersion` is rejected; no crash, falls back gracefully ✓
- Settings dropdown shows `name` from metadata instead of bare filename for v1 files ✓
- `npm run check` and `npm run ci` pass ✓

### Task 14 – Insert Verse After Last Reference in Note (format fix)
Issue: #3, #4

#### Goal
Fix the blockquote insertion format in `insertAfterLastRefCommand` per Issue #4: inserted verse text must appear on its own line prefixed with `>`, surrounded by newlines so it does not run into adjacent text.

#### Scope
- `src/editor/insertVerse.ts`: blockquote mode replaces the original reference with the `> …` line (no duplication); leading `\n` suppressed when reference is at line start
- `src/settingsTab.ts`: added "Verse insertion format" dropdown (Inline / Blockquote)
- Inline format remains unchanged

#### Definition of Done
- Running the command with blockquote format inserts on a new line: `\n> Ex 1,1 verse text\n`
- No surrounding text is run together with the inserted blockquote
- `npm run check` and `npm run ci` pass

---

### Task 15 – Exclude Blockquote Lines from Reference Detection
Issue: #4

#### Goal
Prevent the plugin from detecting Bible references on lines that begin with `>` (Markdown blockquote prefix), so that inserted verse quotations are not re-decorated or re-tooltipped.

#### Scope
- `src/parser.ts`: `scanRefs` filters out lines starting with `>` before matching; no call-site changes needed

#### Definition of Done
- References on lines starting with `>` produce no decorations and no hover tooltip
- References on normal lines continue to work correctly
- Unit tests cover both cases
- `npm run check` and `npm run ci` pass

---

### Task 9 – Translation Selection in Settings

#### Goal
Allow the user to choose which locally available translation is active.

#### Scope
- `src/translationRegistry.ts`: implement `listAvailableTranslations(adapter, pluginDir): Promise<TranslationMeta[]>` — scans `translations/` via `adapter.list()`
- Extract `BibLensSettingTab` from `main.ts` into `src/settingsTab.ts` to keep `main.ts` focused on plugin lifecycle
- Settings tab: add `Preferred translation` dropdown populated from discovered translations
- `main.ts`: read `settings.preferredTranslation` on load and reload `translationData` on settings change (no plugin restart required)

#### Definition of Done
- Switching preferred translation in settings causes hover/tooltip to immediately show text from the new translation
- `src/translationRegistry.ts` is Obsidian-aware; `provider.ts` and `parser.ts` unchanged
- `BibLensSettingTab` lives in `src/settingsTab.ts`; `main.ts` only imports and registers it
- `npm run check` and `npm run ci` pass



### Task 1 – Remove Sample Logic & Add Diagnostics Command
#### Goal
Clean the sample plugin code and replace it with a minimal BibLens structure.
#### Scope
- Remove sample commands and example logic.
- Keep minimal plugin bootstrap.
- Add a command: "BibLens: Show Diagnostics".
- The command should display a Notice with:
  - Plugin version
7  - Confirmation that plugin is active
#### Definition of Done
- No sample plugin commands remain.
- Command palette contains: "BibLens: Show Diagnostics".
- Triggering the command shows a working Notice.
- No build errors.
- Works after Reload app.

### Task 2 – Create Reference Parser (Czech MVP)
#### Goal
Implement minimal reference parsing for Czech-style notation.
#### Scope
Support:
- Mt 1,3
- Gn 22,1-19
- Iz 11
Parsing must produce a structured object (see `src/types.ts` for canonical definition):

{
  bookId: BookId,      // OSIS book identifier mapped from input abbreviation (e.g. "Mt" → "MAT")
  chapterStart: number,
  verseStart?: number,
  chapterEnd?: number,
  verseEnd?: number
}

The parser must map input abbreviations to OSIS bookIds:
- Mt → MAT
- Gn → GEN
- Iz → ISA

A minimal inline mapping is acceptable for MVP. A dedicated mapping module is planned in Task 4.

Parser must be independent of Obsidian API.

#### Definition of Done
- Parser implemented in separate module (e.g., parser.ts).
- Basic unit tests or test cases documented.
- Correct parsing of the 3 example formats.
- No UI integration yet.


### Task 3 – Reading View Hover Detection
Issue: #1

#### Goal
Detect Bible references in Reading View and display a popover.

#### Scope
- Use simple regex detection.
- When hovering a detected reference:
  - Show popover.
  - Display placeholder text:
    "Detected reference: <normalized reference>"

No real Bible data yet.

#### Definition of Done
- Hover works in Reading View.
- No errors in console.
- No interference with normal Markdown links.
- Works on desktop.
- Does not break mobile compatibility.

### Task 4 – Editor (Live Preview): detect references with CodeMirror decorations
Issue: #1
DoD: underline refs in editor, no lag on large notes, no console errors

### Task 5 – Editor tooltip
Issue: #1
DoD: hover shows tooltip with normalized ref, works after edits, doesn't break selection/cursor

### Task 6 – Bible Text Data Provider

#### Goal
Create a pure data-access module that resolves a `BibleRef` to an ordered list of verse texts,
and a separate Obsidian-aware loader that reads translation JSON files from the plugin directory.

#### Scope
- Add `src/provider.ts` (no Obsidian imports):
  - `type VerseEntry = { label: string; text: string }`
  - `type TranslationData = Record<string, string>`
  - `getVerses(data: TranslationData, ref: BibleRef): VerseEntry[]`
  - Key format: `${bookId}.${chapterStart}.${verse}` (e.g. `GEN.1.1`), matching cep.json exactly.
  - First entry label: Czech-style reference string (e.g. `Gn 1,1`), produced via `formatRef`.
  - Subsequent entry labels: verse number only (e.g. `"2"`, `"3"`).
  - Chapter-only refs (no `verseStart`) return `[]`.
  - Missing keys return no entry for that verse (skip silently).
- Add `src/translationLoader.ts` (may use Obsidian `DataAdapter`):
  - `loadTranslation(adapter: DataAdapter, pluginDir: string, name: string): Promise<TranslationData>`
  - Reads `${pluginDir}/translations/${name}.json` via `adapter.read()`.
  - Returns parsed JSON or throws on read/parse error.
- Update `main.ts`:
  - On `onload()`, call `loadTranslation` for `"cep"`.
  - Store result as `this.translationData: TranslationData`.
  - Pass `translationData` to UI layers (hover, tooltip) via constructor or parameter.
- Place `cep.json` in `translations/cep.json` inside the plugin directory (not bundled into main.js).

#### Definition of Done
- `getVerses` resolves `{ bookId: "GEN", chapterStart: 1, verseStart: 1, verseEnd: 3 }` → 3 entries.
- `getVerses` returns `[]` for chapter-only ref or unknown key.
- `loadTranslation` reads and parses `translations/cep.json` without error.
- `src/provider.ts` has no Obsidian imports.
- Build passes, no console errors on plugin load.

### Task 7 – Display Bible Text in Popovers
Issue: #1

#### Goal
Replace placeholder text with actual verse content in both the Reading View popover and the Editor tooltip,
using the formatted output from `getVerses`.

#### Scope
- Update `src/ui/hover.ts`:
  - Change `PopoverManager.show(anchor, content)` to accept `HTMLElement` instead of `string`.
  - Build the verse DOM from `getVerses` result: each entry renders as `<sup>label</sup> text`.
  - Entries are separated by a single space (inline, not block).
  - When `getVerses` returns `[]`: show `<em>Verš nenalezen</em>`.
- Update `src/editor/refTooltip.ts`:
  - Call `getVerses` to build the same formatted DOM inside `div.biblens-editor-tooltip`.
  - Same fallback as above.
- Do not use `innerHTML` for security — build DOM via `createElement` / `appendChild` / `createTextNode`.
- `translationData` is passed into both modules from `main.ts` (no module-level singleton).

#### Definition of Done
- Hover over `Gn 1,1` in Reading View shows: `Gn 1,1` (superscript) + `Na počátku stvořil Bůh nebe a zemi…`
- Hover over `Gn 1,1-3` shows all three verses inline: `Gn 1,1 … ²… ³…`
- Hover over an unknown ref shows `Verš nenalezen` in italics.
- Works in both Reading View and Live Preview editor.
- No `innerHTML` usage for verse content.
- No console errors.
- Build passes.

### Task 8 – Plugin Settings Foundation

#### Goal
Add the Obsidian settings infrastructure needed by all 0.2 features.

#### Scope
- `src/settings.ts`: `BibLensSettings` type with fields `preferredTranslation: string`, `customAbbreviations: CustomAbbreviations`, `verseInsertionFormat: 'inline' | 'blockquote'`, and `DEFAULT_SETTINGS`
- `main.ts`: load/save settings via `loadData`/`saveData`
- Register a settings tab in Obsidian (basic layout scaffold, no functional controls yet)

#### Definition of Done
- Settings tab opens from Obsidian → Settings → Community Plugins → BibLens
- Values persist across plugin reload
- `npm run check` and `npm run ci` pass

