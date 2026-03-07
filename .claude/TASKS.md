# BibLens – Task Backlog

This file defines the active development tasks.
Each task must include a clear Definition of Done (DoD).

---

## Active

### Task 18 – Initial source catalog: 2+ Czech Bible translation providers
Issue: #7

#### Goal
Populate `KNOWN_PROVIDERS` with at least two verified, key-free HTTP providers offering Czech translations, each with a working adapter.

#### Scope
- Research and verify at least 2 working endpoints offering Czech Bible translations (no API key required)
- `src/sources/catalog.ts`: add `SourceProvider` entries to `KNOWN_PROVIDERS` for each verified provider
- `src/sources/adapters.ts`: implement a `SourceAdapter` for each new provider — URL construction + raw response → `TranslationData` transformation with USFM 3.0 book ID normalisation
- `catalog/providers.json`: add the same provider entries as the bundled snapshot
- Downloaded files must conform to v1 format (requires Task 16)

#### Definition of Done
- At least 2 providers visible in the Translation Sources panel
- Downloading a translation from each provider produces a valid v1 `translations/${id}.json`
- Verse text from a newly downloaded translation is visible in hover/tooltip after selecting it
- Book IDs in downloaded files use USFM 3.0 format
- `npm run check` and `npm run ci` pass

---

### Task 10 – Translation Download

#### Goal
Allow the user to download a translation JSON file from a URL directly into `translations/`.

#### Scope
- `src/translationDownloader.ts`: implement `downloadTranslation(adapter, pluginDir, url, name): Promise<void>` using `requestUrl` (mobile-compatible, no Node)
- Validate downloaded JSON: must be a non-empty `Record<string, string>`
- Settings tab: add URL input and "Download" button; show success/error as Obsidian Notice

#### Definition of Done
- Downloaded file appears in `translations/` and shows up in the preferred translation dropdown on settings reopen
- No Node runtime features used; works on mobile
- `npm run check` and `npm run ci` pass

---

### Task 11 – Custom Book Abbreviations

#### Goal
Allow users to define custom abbreviations that supplement or override built-in Czech defaults.

#### Scope
- `src/books.ts`: implement `buildAbbreviationMap(custom: CustomAbbreviations): AbbreviationMap` — merges built-in defaults with custom; custom wins on conflict; keys are regex-escaped
- `src/parser.ts`: implement `buildRefScanner(map: AbbreviationMap): RefScanner` — compiles regex once from map keys; `scanRefs` delegates to a default scanner built from the built-in map
- `refDecorationsExtension(scanner)` and `refTooltipExtension(scanner, data)` become factory functions; `main.ts` wires them with the built scanner
- Settings tab: add `Custom abbreviations` text area (one `KEY → OSIS_ID` entry per line)
- Scanner rebuilt after settings save

#### Definition of Done
- Custom abbreviation is detected in hover preview and editor decorations after settings save
- Regex compiled once at startup/settings change, not per keystroke
- `npm run check` and `npm run ci` pass

---

### Task 12 – Insert Verse Text Command
Issue: #4

#### Goal
Allow the user to insert verse text for a detected reference at the cursor into the editor.

#### Scope
- `src/editor/insertVerse.ts`: implement `insertVerseCommand(scanner: RefScanner, data: TranslationData, format: InsertionFormat): Command` — no Obsidian imports; uses CM6 transaction dispatch
- Inline format: appends ` — <verse text>` after the reference on the same line
- Blockquote format: inserts `> <ref label> — <verse text>` on the next line (reference label included inside the `>` prefix, per Issue #4)
- Command is no-op if cursor is not on a detected reference
- `main.ts`: register command id `biblens-insert-verse` via `this.addCommand(...)`
- Settings tab: expose `verseInsertionFormat` toggle (Inline / Blockquote)

#### Definition of Done
- Command appears in Obsidian command palette as `BibLens: Insert verse text`
- Inline and blockquote insertion formats both work correctly
- Blockquote format produces `> Jr 1,1 Slova Jeremjáše…` (label inside blockquote, single space separator)
- No `innerHTML` usage; CM6 transaction only
- `npm run check` and `npm run ci` pass

---

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
- Additional translations (loader already supports them; add translation selector in settings)
- Parallel text support
- Morphology
- Configurable abbreviation systems

---
## Done

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

