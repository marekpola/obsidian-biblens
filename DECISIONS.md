# Decisions

## D001 – MVP scope: placeholder only, no Bible text data
Decision: MVP will only detect references and show placeholder content (no real Bible text retrieval).
Reason: keep initial release small, avoid data licensing/storage questions, and validate UX first.
Consequences:
- Task 3 hover preview shows "Detected reference: …" only.
- Data provider work is deferred to Future section in TASKS.md.
Revisit: when starting "Local text provider" work.
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