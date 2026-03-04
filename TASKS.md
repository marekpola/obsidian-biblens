# BibLens – Task Backlog

This file defines the active development tasks.
Each task must include a clear Definition of Done (DoD).

---

## Active

---

## Next



---

## Future (Not MVP)
- Additional translations (loader already supports them; add translation selector in settings)
- Parallel text support
- Morphology
- Configurable abbreviation systems

---
## Done
### Task 1 – Remove Sample Logic & Add Diagnostics Command
#### Goal
Clean the sample plugin code and replace it with a minimal BibLens structure.
#### Scope
- Remove sample commands and example logic.
- Keep minimal plugin bootstrap.
- Add a command: "BibLens: Show Diagnostics".
- The command should display a Notice with:
  - Plugin version
  - Confirmation that plugin is active
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
DoD: underline refs in editor, no lag on large notes, no console errors

### Task 5 – Editor tooltip
DoD: hover shows tooltip with normalized ref, works after edits, doesn’t break selection/cursor

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


