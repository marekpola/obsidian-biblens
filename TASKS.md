# BibLens – Task Backlog

This file defines the active development tasks.
Each task must include a clear Definition of Done (DoD).

---

## Active

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


---
## Next


### Task 4 – Internal Abbreviation Mapping (Czech)

#### Goal
Introduce internal mapping of Czech abbreviations to canonical book IDs.

Example:
Mt -> Matthew
Gn -> Genesis
Iz -> Isaiah

#### Definition of Done
- Mapping stored in dedicated module.
- Parser uses mapping.
- Unknown abbreviations handled gracefully.
- Test cases updated.

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


## Future (Not MVP)

- Local text provider
- Parallel text support
- Morphology
- Configurable abbreviation systems
- Editor (Live Preview) support

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