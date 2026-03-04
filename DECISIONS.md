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
