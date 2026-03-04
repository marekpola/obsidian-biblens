# BibLens – Test Plan

This document defines manual and lightweight automated checks for BibLens.

All behavioral changes must update this file.

---

## Test Environment

- Obsidian desktop (macOS)
- A dev vault with the plugin installed from:
  `.obsidian/plugins/biblens`
- Build watcher running:
  `npm run dev`

---

## Smoke Tests (Every Change)

1. Build
- `npm run dev` shows no errors.

2. Load
- Obsidian: Command palette -> "Reload app"
- Plugin appears in Settings -> Community plugins -> Installed plugins
- Plugin can be enabled without errors.

3. Console
- Developer tools console shows no new errors caused by BibLens.

---

## Task 1 – Diagnostics Command

Steps:
1. Enable BibLens.
2. Command palette -> run "BibLens: Show Diagnostics".

Expected:
- A Notice appears.
- Notice includes plugin name and version.
- No console errors.

---

## Task 2 – Reference Parser (Czech MVP)

Run (manual / developer check):
- Execute unit tests if present.
- Otherwise verify by running a small test script or by checking documented test cases.

Test cases:
- "Mt 1,3" -> book=Mt, chapterStart=1, verseStart=3
- "Gn 22,1-19" -> book=Gn, chapterStart=22, verseStart=1, verseEnd=19
- "Iz 11" -> book=Iz, chapterStart=11, verseStart=undefined

Expected:
- Parser returns `{ ok: true, ref: BibleRef }` for valid inputs.
- Parser returns `{ ok: false, error: string }` for invalid inputs (never throws, never returns null).

---

## Task 3 – Reading View Hover (Placeholder)

Setup:
- Create a note with:
  "Test Mt 1,3 and Gn 22,1-19 and Iz 11."
- Also include a Markdown link, e.g. `[Mt 1,3](https://example.com)`.

Steps:
1. Open the note in Reading View.
2. Hover over each plain-text reference (Mt 1,3, Gn 22,1-19, Iz 11).
3. Move mouse away.
4. Hover over the Markdown link that contains a reference.

Expected:
- A popover appears on hover over each plain-text reference.
- Popover text is exactly: "Detected reference: <bookId> <chapter>[,<verse>[-<verseEnd>]]"
  e.g. "Detected reference: MAT 1,3"
- Popover is fully visible within the viewport (does not clip at edges).
- Popover disappears when mouse leaves the span.
- The Markdown link remains clickable; no popover appears when hovering it.
- No console errors during any of the above steps.

---

## Mobile Compatibility (Periodic Check)

Note:
- Mobile has no mouse hover. Features must not crash mobile.
- The plugin must load without runtime errors on mobile.

Periodic steps (when available):
1. Install the dev version on mobile (or install from a release build).
2. Open vault and ensure BibLens can be enabled.
3. Open a note containing references.

Expected:
- No crash.
- No persistent errors.

---

## Regression Checklist

- Plugin still loads after Obsidian reload.
- No changes to plugin id.
- No Node-only runtime imports added.
- No external network calls added for MVP.