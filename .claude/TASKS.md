# BibLens – Task Backlog

# Structure

Active → task currently being implemented  
Next → upcoming tasks  
Done → completed tasks (also in file TASKS_done.md)

This file defines the active development tasks.
Each task must include a clear Definition of Done (DoD).

# Definition of Done

Each task defines its own acceptance criteria above those: 

1. npm run check passes
2. npm run ci passes
3. All tests green
4. Plugin builds successfully

Both the task's own DoD and this global DoD must pass before a task is marked Done.

---
# Tasks

## Active

---


### Task 40 – Fix `formatRef` no-arg fallback; remove `BOOK_DISPLAY` and `getDisplayAbbr`

#### Goal

Make `formatRef()` consistent with the v0.4 design: when called without a `refFormat` argument it
must use `BUILT_IN_FORMAT_RULES` (English) as the fallback, not the hardcoded Czech abbreviations
and comma separator that remain from the pre-v0.4 code. Once the fallback is unified, `BOOK_DISPLAY`
and `getDisplayAbbr()` become dead code and must be deleted.

#### Scope

- `src/parser.ts`
  - In `formatRef`, replace `getDisplayAbbr(ref.bookId)` with
    `BUILT_IN_FORMAT_RULES.books[ref.bookId] ?? ref.bookId`
  - Replace hardcoded separator fallbacks (`','`, `'-'`, `' '`) with the corresponding
    `BUILT_IN_FORMAT_RULES` fields (`chapterVerseSeparator`, `rangeSeparator`,
    `bookChapterSeparator`)
  - Remove the `getDisplayAbbr` import
- `src/books.ts`
  - Delete `BOOK_DISPLAY` constant
  - Delete `getDisplayAbbr()` function
- `tests/parser.test.ts`
  - Update the test *"falls back to Czech notation when no refFormat given"*: rename it to
    *"falls back to English notation (BUILT_IN_FORMAT_RULES) when no refFormat given"* and change
    the expected value from `"Gn 1,1"` to `"Gen 1:1"`

No other files change. All existing `formatRef` calls that pass an explicit `refFormat` are
unaffected.

#### Definition of Done

- `formatRef({ bookId: "GEN", chapterStart: 1, verseStart: 1 })` returns `"Gen 1:1"`
- `BOOK_DISPLAY` and `getDisplayAbbr` are absent from `src/books.ts`
- `parser.ts` does not import `getDisplayAbbr`
- All existing `formatRef` tests that pass an explicit `refFormat` continue to pass unchanged
- `npm run check` and `npm run ci` pass

## Next
---

## Future

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

- Parallel text support
- Morphology
- Configurable abbreviation systems
- Migrate `BOOK_ALIASES` from `books.ts` to a bundled Czech language pack (`recognition-languages/cs.json`); refactor `scanRefs`/`parseCzechBibleRef` to use `buildRefScanner` internally; remove `BOOK_ALIASES` and `resolveBookId()` from `books.ts`

---
## Done


### Task 39 – Refactor `buildRefScanner`: alias alternation and per-mode regex
Decision: D026

#### Goal
Replace the generic character-class book-name regex in `buildRefScanner` with a compiled alias
alternation derived from the active alias source. Enforce `bookChapterSeparator` exactly in strict
mode. Add a shared `parseCVPart` helper with a precompiled cv-extraction regex per mode.

#### Scope
`src/parser.ts` only. No other source files change. `tests/parser.test.ts` is extended with new
cases. `docs/TESTPLAN.md` section Task 39 is already written.

Changes inside `buildRefScanner`:

1. **Alias alternation** — collect alias strings (strict: `Object.values(fmt.books)`; extended:
   `Object.keys(map)`); sort longest-first; escape and join with `|` to form the book-name group.
   Guard: if the alias list is empty return `{ scan: () => [] }`.

2. **Case flag** — strict: no `'i'` flag (case-sensitive). Extended: `'i'` flag (case-insensitive;
   normalized lowercase map keys match any case in text).

3. **`bookChapterSeparator`** — strict: `escapeRegex(fmt.bookChapterSeparator)` (exact match).
   Extended: `\s+`.

4. **CV scan pattern** (inside main regex) — strict: exact `fmt` separators. Extended: accepts
   `,`, `:`, `.`.

5. **Alias reverse-lookup** — strict: invert `fmt.books` through `normalizeBookKey`. Extended: use
   `map` directly.

6. **`parseCVPart(rest, cvRe)`** — new internal helper; takes a precompiled cv-extraction regex;
   replaces `parseChapterVersePart`. Two variants compiled once at scanner construction: strict uses
   exact `fmt` separators; extended accepts `,`, `:`, `.`.

7. **`parseChapterVersePart` collapsed to thin wrapper** — kept as a one-liner delegating to `parseCVPart` because `parseCzechBibleRef` depends on it; not removed (internal only, not an export stub).

Unchanged: `scanRefs`, `parseCzechBibleRef`, `candidateRegex`, `formatRef`, `escapeRegex`, all
exported types and function signatures.

#### Definition of Done
- `buildRefScanner` contains no character-class book-name regex
- Multi-word alias (e.g. `"1. mojžíšova"` in map) is matched in extended mode text
- Extended mode matches `"Mt"`, `"mt"`, `"MT"` for a normalized alias `"mt"`
- Strict mode does not match wrong-case input (e.g. `"mt 1,1"` when canonical is `"Mt"`)
- Strict mode rejects double-space `"Gn  1,1"` when `bookChapterSeparator` is `" "`
- Empty alias source → scanner returns `[]` with no crash
- All pre-existing `tests/parser.test.ts` cases still pass
- New unit test cases from TESTPLAN.md Task 39 are implemented and pass
- `npm run check` and `npm run ci` pass
