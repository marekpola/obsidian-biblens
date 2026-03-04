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
- Popover shows verse content (superscript label + verse text), or `Verš nenalezen` in italics if not found.
- Popover is fully visible within the viewport (does not clip at edges).
- Popover disappears when mouse leaves the span.
- The Markdown link remains clickable; no popover appears when hovering it.
- No console errors during any of the above steps.

---

## Task 4 – Editor (Live Preview): Reference Decorations

Setup:
- Create a note with:
  "Test Mt 1,3 and Gn 22,1-19 and Iz 11."
- Open the note in **Live Preview** (editor) mode.

Steps:
1. Open the note in Live Preview.
2. Observe the reference text in the editor.
3. Type new text before and after a reference.
4. Scroll in a long note (>100 lines) containing references scattered throughout.

Expected:
- Each detected reference (Mt 1,3, Gn 22,1-19, Iz 11) is underlined with the `biblens-ref` CSS class.
- Non-reference text has no decoration.
- Decorations update immediately after typing without noticeable lag.
- Decorations appear on references that scroll into the visible viewport.
- No console errors during any of the above steps.
- Text selection and cursor placement are not affected.

---

## Task 5 – Editor Tooltip (Live Preview)

Setup:
- Same note as Task 4, open in Live Preview.

Steps:
1. Hover over "Mt 1,3" in the editor.
2. Move mouse away.
3. Hover over "Gn 22,1-19".
4. Hover over "Iz 11".
5. Click inside a reference to place the cursor; then hover over it.
6. Hover over plain text with no reference.

Expected:
- A tooltip appears on hover over each reference.
- Tooltip shows verse content (superscript label + verse text), or `Verš nenalezen` in italics if not found.
- Tooltip disappears when mouse leaves the reference.
- Cursor placement and text selection are not disrupted by hovering.
- No tooltip appears over plain text.
- No console errors during any of the above steps.

---

## Task 6 – Bible Text Data Provider

### 6a – Translation file loading

Setup:
- Ensure `translations/cep.json` exists in the plugin directory.

Steps:
1. Enable BibLens.
2. Open developer console.

Expected:
- No errors on plugin load.
- No "file not found" or JSON parse errors in console.

### 6b – Provider unit check (developer console)

Steps:
1. In developer console, verify `getVerses` resolves correctly by inspecting hover output (see Task 7 tests).
2. Temporarily rename `translations/cep.json` to trigger missing file.
3. Reload plugin.

Expected:
- Plugin does not crash on missing translation file.
- Console shows a descriptive error (not an unhandled promise rejection).
- Hover shows fallback "Verš nenalezen".

---

## Task 7 – Display Bible Text in Popovers

Setup:
- Create a note with:
  `Test Gn 1,1 a Gn 1,1-3 a Mt 1,3 a XYZ 99,99.`
- Ensure `translations/cep.json` is present and loaded.

### 7a – Single verse, Reading View

Steps:
1. Open note in Reading View.
2. Hover over `Gn 1,1`.

Expected:
- Popover appears.
- Content: `Gn 1,1` in superscript, followed by `Na počátku stvořil Bůh nebe a zemi…` in normal font.
- No placeholder "Detected reference" text.

### 7b – Verse range, Reading View

Steps:
1. Hover over `Gn 1,1-3`.

Expected:
- Popover shows three verses inline.
- First label: `Gn 1,1` (superscript). Second label: `2` (superscript). Third label: `3` (superscript).
- All verse texts follow their respective labels.

### 7c – Unknown reference, Reading View

Steps:
1. Hover over `XYZ 99,99` (if detected) or any ref not in cep.json.

Expected:
- Popover shows `Verš nenalezen` in italics.
- No console errors.

### 7d – Single verse, Live Preview editor

Steps:
1. Open note in Live Preview.
2. Hover over `Mt 1,3`.

Expected:
- Editor tooltip appears with `Mt 1,3` (superscript) + verse text.

### 7e – Verse range, Live Preview editor

Steps:
1. Hover over `Gn 1,1-3` in Live Preview.

Expected:
- Tooltip shows all three verses with superscript labels, same format as Reading View.

### 7f – No innerHTML in DOM (security check)

Steps:
1. In developer console, inspect the popover or tooltip DOM element.

Expected:
- No `innerHTML` assignment visible in stack traces.
- Content nodes are text nodes and element nodes only.

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