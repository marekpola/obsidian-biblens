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
- Popover shows verse content (superscript label + verse text), or `Verse not found.` in italics if not found.
- Popover is fully visible within the viewport (does not clip at edges).
- Popover disappears when mouse leaves **both** the reference span and the popover itself.
- Moving the mouse from the reference span into the popover keeps the popover open.
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
- Tooltip shows verse content (superscript label + verse text), or `Verse not found.` in italics if not found.
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
- Hover shows fallback "Verse not found.".

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
- Popover shows `Verse not found.` in italics.
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

## Task 9 – Translation Selection in Settings

### 9a – Dropdown populated from translations/

Setup:
- Ensure at least one `.json` file exists in the plugin's `translations/` folder (e.g. `cep.json`).

Steps:
1. Open Obsidian → Settings → Community Plugins → BibLens.

Expected:
- A `Preferred translation` dropdown appears.
- The dropdown lists each `.json` file found in `translations/` (e.g. `CEP`).
- The current value matches `settings.preferredTranslation`.

### 9b – Switching translation updates hover immediately

Setup:
- At least two translation `.json` files present in `translations/`.
- A note open in Reading View with a known reference (e.g. `Gn 1,1`).

Steps:
1. Open BibLens settings and switch to a different translation.
2. Close settings without reloading the plugin.
3. Hover over `Gn 1,1` in Reading View.

Expected:
- Verse text shown in the popover comes from the newly selected translation.
- No plugin restart required.
- A Notice confirms the switch (e.g. "BibLens: switched to BKR").

### 9c – Switching translation updates editor tooltip immediately

Steps:
1. Open a note in Live Preview.
2. Switch translation in settings (as above).
3. Hover over a reference in the editor.

Expected:
- Editor tooltip shows verse text from the new translation.

### 9d – No translations found fallback

Setup:
- Temporarily move all files out of `translations/`.

Steps:
1. Open BibLens settings.

Expected:
- Settings shows a disabled text field (not a dropdown) with a message that no translation files were found.
- No console errors.

---

## Task 15 – Exclude Blockquote Lines from Reference Detection

Setup:
- Create a note in Live Preview with:
  ```
  Ex 1,1
  > Ex 1,1 — text
  Mt 5,3
  ```

### 15a – No decoration on blockquote line

Steps:
1. Open the note in Live Preview.
2. Observe the three lines.

Expected:
- `Ex 1,1` (line 1) is underlined with `biblens-ref` decoration.
- `> Ex 1,1 — …` (line 2) has **no** underline decoration.
- `Mt 5,3` (line 3) is underlined with `biblens-ref` decoration.

### 15b – No tooltip on blockquote line

Steps:
1. Hover over the reference text on line 2 (`> Ex 1,1 …`).

Expected:
- No tooltip appears.
- No console errors.

### 15c – Normal references still work

Steps:
1. Hover over `Ex 1,1` on line 1 and `Mt 5,3` on line 3.

Expected:
- Tooltip appears with verse content for both.

---

## Task 21 – Language Pack Loader and Registry

### 21a – Loader: valid pack produces correct AbbreviationMap (automated)

Covered by `tests/languagePackLoader.test.ts`:
- Valid pack with USFM-keyed books flattens all aliases into `AbbreviationMap` with normalized keys.
- `meta.id`, `meta.displayName`, `meta.lang` match the JSON fields.
- Throws on unsupported `formatVersion`.
- Throws when mandatory fields (`books`, `displayName`, etc.) are missing.
- Reads from `recognition-languages/${id}.json` path.

### 21b – Loader: no osisMapping import (static check)

Run:
```
grep -r "osisMapping" src/languagePackLoader.ts
```
Expected: no output.

### 21c – Registry: returns empty array when directory absent (automated)

Covered by `tests/languagePackRegistry.test.ts`:
- `adapter.list` throws → returns `[]`, no error propagated.
- Empty file list → returns `[]`.
- Returns correct `LanguagePackMeta` fields for each `.json` file found.
- Ignores non-`.json` files.
- Falls back to id-based meta when a file cannot be read.

### 21d – No DOM API imports (static check)

Run:
```
grep -E "document\.|window\.|navigator\." src/languagePackLoader.ts src/languagePackRegistry.ts
```
Expected: no output.

---

## Task 22 – Reference Format Loader and Registry

### 22a – Loader: valid pack produces correct ReferenceFormatRules (automated)

Covered by `tests/referenceFormatLoader.test.ts`:
- Valid pack returns `rules` with correct `chapterVerseSeparator`, `rangeSeparator`, `bookChapterSeparator`.
- `rules.books` contains USFM → canonical abbreviation entries from the JSON file.
- `meta.id`, `meta.displayName`, `meta.lang` match the JSON fields.
- Reads from `reference-formats/${id}.json` path.
- Throws on unsupported `formatVersion`.
- Throws when mandatory fields (`rules`, `books`, `displayName`, etc.) are missing.

### 22b – Registry: returns empty array when directory absent (automated)

Covered by `tests/referenceFormatRegistry.test.ts`:
- `adapter.list` throws → returns `[]`, no error propagated.
- Empty file list → returns `[]`.
- Returns correct `ReferenceFormatMeta` fields for each `.json` file found.
- Ignores non-`.json` files.
- Falls back to id-based meta when a file cannot be read.

### 22c – No DOM API imports (static check)

Run:
```
grep -E "document\.|window\.|navigator\." src/referenceFormatLoader.ts src/referenceFormatRegistry.ts
```
Expected: no output.

---

## Task 18 – Initial Source Catalog: 2+ Czech Bible Translation Providers

### 18a – Providers visible in Translation Sources panel

Setup:
- Plugin loaded in Obsidian (no network call needed for bundled catalog).

Steps:
1. Open Settings → BibLens.
2. Scroll to **Translation sources** section.
3. Open the Provider dropdown.

Expected:
- At least 2 providers listed: "GetBible (api.getbible.net)" and "Beblia Holy Bible XML (GitHub)".
- Selecting each provider shows its translation list (BKR, CEP, KJV, etc. for GetBible; CEP 2001, BKR 1613, NIV, ESV, etc. for Beblia).

### 18b – Download from GetBible (getbible-v2 adapter)

Setup:
- Active network connection.
- No `translations/bkr.json` present (delete if exists).

Steps:
1. In Translation Sources, select provider "GetBible".
2. Find "Bible Kralická" (bkr) with status "Not downloaded".
3. Click **Download**.

Expected:
- Button shows "Downloading…" then disappears (row switches to Downloaded state).
- A Notice: "BibLens: Bible Kralická downloaded".
- File `translations/bkr.json` exists in the plugin directory.
- File is valid JSON with `formatVersion: 1`, `id: "bkr"`, `lang: "cs"`, and a `verses` object.
- Verse keys use USFM 3.0 format: `"GEN 1:1"`, `"MAT 1:1"`, etc.
- Preferred Translation dropdown now includes "Bible Kralická".

### 18c – Verse text visible after switching to downloaded translation

Steps:
1. Open Settings → BibLens → Installed translations, click **Set as default** on "Bible Kralická" (bkr).
2. Open a note in Reading View containing `Gn 1,1`.
3. Hover over `Gn 1,1`.

Expected:
- Popover shows verse text from Bible Kralická.
- No "Verse not found." fallback.
- No console errors.

### 18d – Download from Beblia (beblia-xml adapter)

Setup:
- Active network connection.
- No `translations/bkr1613.json` present.

Steps:
1. In Translation Sources, select provider "Beblia Holy Bible XML".
2. Find "Bible Kralická (1613)" (bkr1613), click **Download**.

Expected:
- Notice: "BibLens: Bible Kralická (1613) downloaded".
- File `translations/bkr1613.json` exists, valid v1 format.
- Verse keys use USFM 3.0 format: `"GEN 1:1"`, `"MAT 1:1"`, etc.
- Translation appears in Preferred Translation dropdown immediately.

### 18e – Delete removes translation from both panels

Steps:
1. In Translation Sources, click **Delete** on a downloaded translation (e.g. bkr).
2. Observe both the Translation Sources list and the Installed Translations panel.

Expected:
- Notice: "BibLens: Bible Kralická deleted".
- Translation status reverts to "Not downloaded" in Translation Sources.
- Translation disappears from Installed Translations panel.
- File no longer exists in `translations/`.

### 18f – USFM 3.0 book ID format in downloaded files (static check)

Steps:
1. After downloading any translation, open `translations/{id}.json` in a text editor.
2. Inspect several keys in the `verses` object.

Expected:
- Keys follow the pattern `"USFM_ID CHAPTER:VERSE"`: e.g. `"GEN 1:1"`, `"PSA 119:176"`, `"REV 22:21"`.
- No dot-separated keys (legacy format).
- No unknown book identifiers.

---

## Task 25 – openbibleinfo Language Pack Adapter

### 25a – Adapter unit tests (automated)

Covered by `tests/sources.test.ts`:
- `getLanguagePackAdapter("openbibleinfo")` returns an adapter without throwing.
- `buildUrl` constructs correct URL for Czech: `.../src/cs/data.txt`.
- `transform` maps OSIS ids to USFM keys covering canonical books.
- `transform` expands `$VAR` references into all values (e.g. `$FIRST Mojžíšova` → "První Mojžíšova", "1 Mojžíšova", "I Mojžíšova").
- `transform` skips aliases containing regex meta-characters (`?`, `[`, `]`).
- `transform` skips deuterocanonical books not in the 66-book Protestant canon (e.g. Tob, Sir).
- `transform` ignores comment, variable-def, preferred-names, and order lines.
- `transform` deduplicates identical aliases.
- `transform` returns `formatVersion: 1` and `source: "openbibleinfo/Bible-Passage-Reference-Parser"`.
- `KNOWN_PROVIDERS.languagePackProviders` contains an openbibleinfo entry with ≥14 packs including cs, en, de.
- Each `languagePackProvider` has a registered adapter type.

### 25b – Download Czech language pack (manual, requires network)

Setup:
- Active network connection.
- No `recognition-languages/cs.json` present in the plugin directory.

Steps:
1. Open Settings → BibLens → Install sources → Recognition languages.
2. Select provider "openbibleinfo (Bible-Passage-Reference-Parser)".
3. Select language "Czech".
4. Click **Download**.

Expected:
- Download completes without error; a Notice confirms.
- File `recognition-languages/cs.json` is created in the plugin directory.
- File is valid JSON with `id: "cs"`, `lang: "cs"`, `formatVersion: 1`.
- `books` object contains USFM-keyed entries, e.g. `"GEN"`, `"MAT"`, `"REV"`.
- Each book entry has a non-empty `aliases` array.
- No deuterocanonical entries (e.g. no `"TOB"`, `"SIR"` keys).

### 25c – Language pack appears in installed list (manual)

Steps:
1. After downloading (25b), open Settings → BibLens → Installed recognition languages.

Expected:
- "Czech" appears in the list with language tag `cs`.
- A Delete button is present.

### 25d – Selecting Czech language pack activates Czech book names (manual)

Steps:
1. In Settings → BibLens → Recognition languages, expand the section and click **Set as default** on the Czech pack.
2. Open a note containing `Gn 1,1` (Czech abbreviation).
3. Hover over the reference in Reading View or Live Preview.

Expected:
- Reference is detected and a tooltip/popover displays verse content.
- No console errors.

---

## Task 35 – Default Parsing Rules: Extended

### 35a – Out-of-the-box Czech notation detected (manual)

Setup:
- Fresh plugin state: no language pack, no format pack installed.
- Parsing rules setting at default (Extended).

Steps:
1. Open a note in Live Preview.
2. Type: `Gn 1,1` and `Mt 1,3`.

Expected:
- Both references are underlined with `biblens-ref` decoration.
- Hovering shows verse tooltip.
- No console errors.

### 35b – English colon notation also detected with default settings (manual)

Steps:
1. In the same note, type: `Gen 1:1` and `Matt 1:3`.

Expected:
- Both references are detected and underlined alongside the Czech-style references.

### 35c – Strict mode still enforceable (manual)

Steps:
1. Open Settings → BibLens → Parsing rules → switch to **Strict**.
2. Open a note with `Gn 1,1` (comma separator).
3. Set a format pack that uses `,` as separator, or leave built-in (`:` separator).

Expected:
- With built-in format (`:` separator) and strict mode, `Gn 1,1` is **not** detected.
- `Gen 1:1` is still detected.

---

## Task 33 – Remove Preferred Language and Standard Reference Format Dropdowns from General Settings

### 33a – General section contains only the expected controls (manual)

Steps:
1. Open Settings → BibLens.
2. Inspect the General (flat, no heading) area at the top of the settings tab.

Expected:
- A read-only **Translation** row showing the active translation name (or "None — verse text unavailable").
- A read-only **Reference format** row showing the active format name (or "Built-in English").
- A read-only **Recognition language** row showing the active language name (or "Built-in English").
- A **Parsing rules** dropdown is present and functional.
- No dropdown labelled "Verse insertion format".
- No dropdown labelled "Preferred translation".
- No dropdown labelled "Preferred language for reference recognition".
- No dropdown labelled "Standard reference format".
- No console errors.

### 33b – Active language pack survives reload (manual)

Setup:
- At least one language pack installed in `recognition-languages/`.
- That pack was set as default via the collapsible "Recognition languages" section.

Steps:
1. Note the currently active language pack id in plugin data (or confirm detection works for a reference in that language).
2. Reload Obsidian (Command palette → "Reload app without saving").
3. Open Settings → BibLens.

Expected:
- The previously active language pack is still active after reload.
- The General section still shows no language dropdown.

### 33c – "Set as default" in collapsible section activates lang pack (manual)

Setup:
- At least one language pack installed; currently active pack is different or none is active.

Steps:
1. Open Settings → BibLens → Recognition languages (expand).
2. Click **Set as default** on an installed pack.
3. Dismiss settings and open a note with a reference in that language.

Expected:
- A Notice confirms the activation.
- References in that language are detected (underlined in editor / popover in Reading View).
- No "Preferred language" dropdown appears anywhere in General settings.

---

## Task 34 – Fix openbibleinfo Language Pack Adapter: Canonical Abbreviations as Aliases

### 34a – Adapter includes Short form from preferred-names lines (automated)

Covered by updated test in `tests/sources.test.ts`:
- Input with `*Gen\tPreferred Genesis\tGn` plus alias line `Gen\tGenesis` produces `aliases` containing both `"Genesis"` and `"Gn"`.
- The Short form from the preferred-names line is not duplicated when it already appears in the alias list.
- Comment, variable-def, and order lines still contribute nothing.

### 34b – English language pack: canonical abbreviations are recognised (manual, requires network)

Setup:
- Active network connection.
- English language pack downloaded from openbibleinfo and set as default via Settings → BibLens → Recognition languages.
- No reference format pack selected (built-in English colon format used), or English reference format pack selected.

Steps:
1. Open a note in Live Preview.
2. Type each of the following lines and observe underline decorations:
   ```
   Matt 1:3
   Gen 1:1
   Rev 22:20
   John 3:16
   ```

Expected:
- All four references are underlined with `biblens-ref` decoration.
- Hovering each shows the correct verse tooltip.
- No console errors.

### 34c – Canonical abbreviation not duplicated when it already appears in alias lines (automated)

Covered by `tests/sources.test.ts`:
- If a preferred-names Short form is identical to an alias already present in the alias line, it appears only once in `aliases`.

---

## Task 36 – Two Insert Commands

Setup:
- Create a note in Live Preview with:
  ```
  Gn 1,1 some text after
  Mt 5,3 more text
  ```

### 36a – Insert verse after previous reference (manual)

Steps:
1. Place cursor after `Gn 1,1` (anywhere after the reference on the line, or on the next line).
2. Command palette → `BibLens: Insert verse after previous reference`.

Expected:
- Verse text appended inline immediately after `Gn 1,1`: e.g. `Gn 1,1 — Na počátku stvořil Bůh nebe a zemi.`
- No blockquote prefix.
- No console errors.

### 36b – Replace previous reference with quote (manual)

Steps:
1. Place cursor after `Mt 5,3`.
2. Command palette → `BibLens: Replace previous reference with quote`.

Expected:
- `Mt 5,3` is replaced with a blockquote line: `> Mt 5,3 verse text`
- The blockquote is on its own line with a trailing newline.
- No console errors.

### 36c – No-op when no reference before cursor (manual)

Steps:
1. Place cursor at the very beginning of the note (before any reference).
2. Run both commands.

Expected:
- Neither command inserts or modifies any text.
- No console errors.

### 36d – No "Verse insertion format" in settings (manual)

Steps:
1. Open Settings → BibLens.

Expected:
- No dropdown or control labelled "Verse insertion format" anywhere in the settings tab.

### 36e – Both commands appear in command palette (manual)

Steps:
1. Open command palette, type "BibLens".

Expected:
- `BibLens: Insert verse after previous reference` is listed.
- `BibLens: Replace previous reference with quote` is listed.
- No command named `BibLens: Insert verse text after previous reference` (old name).

---

## Task 37 – Hover: Scrollable Content and Text Selection

Setup:
- Create a note in Reading View containing a chapter-only reference, e.g. `Gn 1`.
- Ensure `translations/cep.json` is loaded (Genesis chapter 1 has 31 verses).

### 37a – Popover scrolls for large content (manual)

Steps:
1. Hover over `Gn 1` in Reading View.

Expected:
- Popover appears and does not exceed viewport height.
- A scrollbar is visible on the right side of the popover (or scroll gesture works).
- Scrolling inside the popover reveals additional verses without closing the popover.

### 37b – Popover stays open when mouse moves into it (manual)

Steps:
1. Hover over a reference to open the popover.
2. Slowly move the mouse from the reference span into the popover area.

Expected:
- Popover remains open while mouse is inside it.
- Popover closes only after mouse leaves both the reference and the popover.

### 37c – Text selection and copy in Reading View popover (manual)

Steps:
1. Hover over a reference; keep mouse inside the popover.
2. Click and drag to select part of the verse text.
3. Press Cmd+C (macOS) or Ctrl+C (Windows/Linux).
4. Paste into a text editor.

Expected:
- Text is selectable by dragging.
- Selected text is copied to clipboard.
- Pasted content matches the selected verse text.

### 37d – Text selection in editor tooltip (manual)

Steps:
1. Open the note in Live Preview.
2. Hover over a reference to show the editor tooltip.
3. Click inside the tooltip to place cursor.
4. Press Cmd+A then Cmd+C.
5. Paste into another location.

Expected:
- Keyboard selection and copy work within the tooltip.
- Note: drag-selection starting outside the tooltip is not supported and is not tested here.

### 37e – No regression: popover still hides on mouse leave (manual)

Steps:
1. Hover over a reference to open the popover.
2. Move mouse entirely away from both the reference and the popover.

Expected:
- Popover closes.
- No popover remains stuck open.

---

## Task 38 – Settings General Section Redesign

### 38a – General section shows three read-only status rows (manual)

Setup:
- At least one translation, one reference format pack, and one language pack installed and set as default.

Steps:
1. Open Settings → BibLens.
2. Inspect the General area.

Expected:
- A **Translation** row shows the display name of the active translation (e.g. "CEP").
- A **Reference format** row shows the display name of the active format pack.
- A **Recognition language** row shows the display name of the active language pack.
- A **Parsing rules** dropdown is present and editable.
- No "Preferred translation" dropdown.
- No console errors.

### 38b – Fallback values when nothing is installed (manual)

Setup:
- No translation files, no format packs, no language packs installed.

Steps:
1. Open Settings → BibLens.

Expected:
- Translation row shows "None — verse text unavailable".
- Reference format row shows "Built-in English".
- Recognition language row shows "Built-in English".

### 38c – Auto-default on first download (manual)

Setup:
- No translation installed (`translations/` folder empty or only non-JSON files).
- `settings.preferredTranslation` is empty.

Steps:
1. Open Settings → BibLens → Installed translations.
2. Download any translation.
3. After download completes, close and reopen the settings tab.

Expected:
- The downloaded translation is automatically set as default (no manual "Set as default" step required).
- Translation row in General shows the downloaded translation's name.
- Hovering a reference shows verse text from that translation.

### 38d – Auto-default on active-item deletion (manual)

Setup:
- Two translations installed; one set as default.

Steps:
1. Open Settings → BibLens → Installed translations.
2. Delete the currently active translation.
3. Observe the General section on next tab open.

Expected:
- The remaining translation is automatically set as default.
- Translation row in General shows the remaining translation's name.
- No "None — verse text unavailable" shown when another translation is available.

### 38e – Exactly one async round-trip per display() (developer check)

Steps:
1. Open developer console → Network tab.
2. Open Settings → BibLens.

Expected:
- `loadCatalog`, `listAvailableTranslations`, `listAvailableReferenceFormats`, `listAvailableLanguagePacks` are each called exactly once per settings tab open (visible in console logs or network if remote catalog is fetched).
- No duplicate calls.

---

## Task 39 – buildRefScanner: alias alternation and per-mode regex

All cases covered by `tests/parser.test.ts`. No manual steps required (pure parser logic).

### 39a – Multi-word alias detected in extended mode (automated)

Cases:
- `AbbreviationMap` contains normalized key `"1. mojžíšova"` → `GEN`
- Input text `"1. Mojžíšova 1,1"` → one match, `bookId: "GEN"`, `chapterStart: 1`, `verseStart: 1`
- Input text `"1. MOJŽÍŠOVA 1,1"` → one match (case-insensitive)
- Input text `"1. Mojžíšova1,1"` (no space) → no match (book-chapter separator required)

### 39b – Case insensitivity in extended mode (automated)

Cases:
- Normalized alias `"mt"` → `MAT` in map
- Extended mode: `"Mt 1,3"`, `"mt 1,3"`, `"MT 1,3"` → all produce one match each
- Extended mode: `"mT 1,3"` → one match (mixed case)

### 39c – Case sensitivity in strict mode (automated)

Cases:
- `fmt.books` contains `"MAT": "Mt"` (canonical abbreviation is `"Mt"`)
- Strict mode: `"Mt 1,3"` → one match
- Strict mode: `"mt 1,3"` → no match
- Strict mode: `"MT 1,3"` → no match

### 39d – `bookChapterSeparator` enforced in strict mode (automated)

Cases:
- Format pack: `bookChapterSeparator: " "` (single space)
- Strict mode: `"Gn 1,1"` → one match
- Strict mode: `"Gn  1,1"` (double space) → no match
- Extended mode: `"Gn  1,1"` (double space) → one match (`\s+` relaxed)

### 39e – CV separator enforcement in strict mode (automated)

Cases:
- Format pack: `chapterVerseSeparator: ","`, `rangeSeparator: "-"`
- Strict mode: `"Gn 1,1"` → match, `verseStart: 1`
- Strict mode: `"Gn 1:1"` → no match (colon rejected)
- Extended mode: `"Gn 1:1"` → match
- Extended mode: `"Gn 1.1"` → match
- Extended mode: `"Gn 1,1"` → match

### 39f – Empty alias source returns no-op scanner (automated)

Cases:
- `buildRefScanner({}, fmt, 'strict')` where `fmt.books` is `{}` → `scan("Gn 1,1")` returns `[]`
- `buildRefScanner({}, fmt, 'extended')` where map is `{}` → `scan("Gn 1,1")` returns `[]`
- No exception thrown in either case

### 39g – Existing scanner behaviour preserved (automated)

Cases:
- All pre-existing `tests/parser.test.ts` assertions continue to pass without modification

---

## Task 40 – `formatRef` no-arg fallback

All cases covered by `tests/parser.test.ts`. No manual steps required (pure parser logic).

### 40a – No-arg fallback uses USFM BookId as abbreviation (automated)

Cases:
- `formatRef({ bookId: "GEN", chapterStart: 1, verseStart: 1 })` → `"GEN 1:1"` (no book map active)

### 40b – Existing explicit-refFormat tests unchanged (automated)

Cases:
- All pre-existing `formatRef` test cases that pass an explicit `refFormat` continue to pass without modification

---

## Task 41 – Verse label refinement and chapter-boundary markers

### 41a – Same-chapter range: first label is first-verse ref (automated)

Covered by `tests/provider.test.ts`:
- `GEN 1:1-3` → labels `"Gen 1:1"`, `"2"`, `"3"` (no range suffix on first label)
- No `chapterBreak` set on any entry

### 41b – Single verse: label unchanged (automated)

Covered by `tests/provider.test.ts`:
- `MAT 5:3` → single entry, label `"Matt 5:3"`

### 41c – Chapter-only ref: first label is first-verse ref (automated)

Covered by `tests/provider.test.ts`:
- `GEN 1` → labels `"Gen 1:1"`, `"2"`, `"3"` (first label references first verse, not chapter)

### 41d – Cross-chapter range: chapter-boundary label and `chapterBreak` flag (automated)

Covered by `tests/provider.test.ts`:
- `GEN 1:3–2:1` → `"Gen 1:3"` (no flag), `"2:1"` (`chapterBreak: true`)
- `GEN 1:3–2:2` → `"Gen 1:3"`, `"2:1"` (break), `"2"` (no flag)

### 41e – Cross-chapter popover shows line break at chapter boundary (manual)

Setup:
- Create a note in Reading View containing a cross-chapter reference, e.g. `Gn 1,31-2,3`.
- Ensure `translations/cep.json` is loaded.

Steps:
1. Open note in Reading View.
2. Hover over `Gn 1,31-2,3`.

Expected:
- Popover appears.
- First label: `Gn 1,31` (superscript), followed by verse text for 1:31, then `32`, etc.
- At the start of chapter 2: a line break separates it from the preceding verses.
- First verse of chapter 2 is labelled `2,1` (using the active format's separator), not just `1`.
- Subsequent verses in chapter 2 use bare verse numbers (`2`, `3`).
- No console errors.

### 41f – Same-chapter range popover shows first-verse label (manual)

Setup:
- Note in Reading View with `Gn 22,1-3`.

Steps:
1. Hover over `Gn 22,1-3`.

Expected:
- First label: `Gn 22,1` (not `Gn 22,1-3`).
- Subsequent labels: `2`, `3`.

---

## Task 42 – Bundle English language pack and reference format pack on first install

### 42a – Packs written on first install (manual)

Setup:
- Remove `recognition-languages/en.json` and `reference-formats/en-sbl.json` from the plugin
  directory if they exist.
- Ensure `settings.preferredLanguage` and `settings.standardReferenceFormat` are empty
  (clear plugin data or use a fresh vault).

Steps:
1. Build the plugin: `npm run build`.
2. Enable BibLens in Obsidian (or reload it).
3. Check the plugin directory.

Expected:
- `recognition-languages/en.json` exists and is valid JSON with `"id": "en"`,
  `"formatVersion": 1`, and a `books` object with `aliases` arrays.
- `reference-formats/en-sbl.json` exists and is valid JSON with `"id": "en-sbl"`,
  `"formatVersion": 1`, a `books` map, and a `rules` object.
- No console errors on plugin load.

### 42b – Packs appear in installed lists (manual)

Steps:
1. Open Settings → BibLens → Recognition languages (expand).
2. Open Settings → BibLens → Reference formats (expand).

Expected:
- "English" appears in the installed recognition languages list.
- "English (SBL style)" appears in the installed reference formats list.
- Both have a Delete button and a Set as default button.

### 42c – Auto-default activates packs on first install (manual)

Setup:
- Same as 42a (neither pack was present; preferences are empty).

Steps:
1. After first load (42a), open Settings → BibLens.
2. Observe the General section.

Expected:
- Recognition language row shows "English" (auto-selected).
- Reference format row shows "English (SBL style)" (auto-selected).
- Parsing rules dropdown still present and functional.

### 42d – Files not overwritten on subsequent loads (manual)

Setup:
- Both files present from 42a.
- Manually edit `recognition-languages/en.json` to add a sentinel comment or change a value.

Steps:
1. Reload BibLens (Command palette → "Reload app" or disable/enable plugin).
2. Re-read the file.

Expected:
- The sentinel change is still present; the file was not overwritten.

### 42e – Deletion not undone on reload (manual)

Steps:
1. Delete `recognition-languages/en.json` from the plugin directory.
2. Reload BibLens.
3. Check the plugin directory.

Expected:
- `recognition-languages/en.json` is NOT recreated (deletion is intentional).
- No console errors.

---

## T046 – Settings UI "Load" button for live provider item discovery

### 46a – Load button present for biblens-data provider

Steps:
1. Open Settings → BibLens.
2. Open any of the three sections (Translations, Reference formats, Recognition languages).
3. Verify the "Install new" row shows: provider dropdown | **Load** button | items dropdown | Download button.

Expected:
- The Load button is visible when the selected provider is "BibLens Data" (or any provider whose adapter implements `listUrl`).

### 46b – Load button hidden for providers without listAvailable

Steps:
1. Open Settings → BibLens → Translations section.
2. Switch the provider dropdown to a provider that does NOT implement `listUrl` (e.g. "GetBible.net").

Expected:
- The Load button is not visible for that provider.

### 46c – Load repopulates dropdown with live list

Steps:
1. Open Settings → BibLens → Translations section.
2. Ensure the "BibLens Data" provider is selected.
3. Click Load.

Expected:
- The items dropdown repopulates with entries fetched from the live index.
- Already-installed items are excluded.
- A "Loading…" label appears briefly on the button during the fetch.

### 46d – Load on network failure retains catalog list and shows Notice

Steps:
1. Disconnect from the network (or modify hosts to block the provider URL).
2. Open Settings → BibLens → Translations section.
3. Click Load.

Expected:
- A Notice appears: "BibLens: load failed — …".
- The items dropdown retains the catalog-based list.

### 46e – Reopening settings resets to catalog-based list

Steps:
1. Click Load in Translations; the dropdown shows the live list.
2. Close and reopen Settings.

Expected:
- The items dropdown shows the catalog-based list (not the live list).

### 46f – Description text visible

Steps:
1. Open any of the three collapsible sections.

Expected:
- A description reads: "Items shown are from the catalog. Click load to fetch the current list from the provider."

---

## Task 44 – Remove built-in fallback constants

### 44a – No packs active: scanner is no-op, status shows "None" (manual)

Setup: clear `preferredLanguage` and `standardReferenceFormat` from saved plugin data (or remove the bundled pack files) so neither pack is active.

Steps:
1. Enable BibLens. Open **Settings → BibLens**.
2. Observe the General section rows for Reference format and Recognition language.
3. Open a note containing `Gen 1:1` and observe the editor.
4. Open Dev Tools console.

Expected:
- General status shows **"None"** for Reference format and Recognition language.
- No underline decoration appears on `Gen 1:1` (scanner is no-op).
- No hover tooltip appears on references.
- No BibLens console errors.

### 44b – Packs installed and active: behaviour unchanged (manual)

Steps:
1. Ensure `recognition-languages/en.json` and `reference-formats/en-sbl.json` are present and selected.
2. Reload Obsidian.
3. Open **Settings → BibLens**; verify Reference format shows `en-sbl` and Language shows `en`.
4. Open a note containing `Gen 1:1` and `Matt 5:3`.

Expected:
- References are underlined in the editor.
- Hovering shows verse text in a tooltip.
- Behaviour identical to pre-T044.

### 44c – No references to removed exports in source (automated)

- `grep -r "BUILT_IN_FORMAT_RULES\|getBuiltInAbbreviationMap" src/` returns no matches.
- `npm run test` passes (133 tests green).
- `npm run build` succeeds.

---

## T047 – CM6 StateField scanner propagation

### 47a – Parsing rules live update (manual)

Preconditions: Plugin loaded, at least one language pack and reference format pack active.

Steps:
1. Open a note containing a known Bible reference (e.g. "John 3:16").
2. Confirm the reference is highlighted in the editor (Live Preview).
3. Open Settings → BibLens → Parsing rules and switch between Strict and Extended.
4. Return to the note immediately (without reloading).

Expected:
- Highlight updates within the same editor session without requiring a plugin reload.
- No console errors.

### 47b – Language/format pack live update (manual)

Preconditions: Plugin loaded, initial pack selected.

Steps:
1. Open a note with a reference matched by the current language pack (e.g. "John 3:16").
2. Confirm the reference is highlighted.
3. Open Settings → BibLens → Language pack and switch to a different pack (or "None").
4. Return to the note immediately.

Expected:
- If switched to "None": highlight disappears without reload.
- If switched to another pack: only references recognised by the new pack are highlighted.
- Tooltip follows the same updated scanner.

### 47c – Hover tooltip regression (manual)

Steps:
1. Open a note with a recognisable reference in Live Preview mode.
2. Hover the mouse over the highlighted reference text.

Expected:
- Tooltip appears with the verse text.
- No "scanner undefined" console errors.

### 47d – Insert-verse and replace-ref commands regression (manual)

Steps:
1. Place the cursor after a recognised reference (e.g. "John 3:16").
2. Run command "Insert verse after previous reference".
3. Run command "Replace previous reference with quote".

Expected:
- Both commands execute correctly and produce verse text.
- No console errors.

### 47e – Reading View hover regression (manual)

Steps:
1. Switch the note to Reading View.
2. Hover over a highlighted reference span.

Expected:
- Popover appears with verse text.
- Behaviour identical to pre-T047.

### 47f – Automated checks

- `npm run build` succeeds with no TypeScript errors.
- `npm run test` passes (all tests green).
- `grep -r "StateEffect.appendConfig" src/` returns no matches (old re-render hack removed).

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

## T048 – Settings panel heading and spacing conventions

### 48a – Heading style (manual)

Steps:
1. Open **Settings → BibLens**.
2. Observe the "Current" section heading.

Expected:
- The heading renders using the Obsidian heading style (same appearance as other plugin settings headings — bold, styled by the active theme).
- No raw `<h3>` element is visible in DevTools for this heading.

### 48b – Theme compatibility (manual)

Steps:
1. Switch to a community theme (or toggle dark/light mode).
2. Open **Settings → BibLens**.

Expected:
- Section headings and spacing adapt correctly to the theme.
- No hardcoded colours or fixed pixel spacings override the theme.

### 48c – No inline style attributes (automated)

- `grep -n "style=" src/settingsTab.ts` returns no matches.
- `grep -n "createEl('h3'" src/settingsTab.ts` returns no matches.
- `npm run ci` passes with 0 errors.

---

## T043 – Bundle WEB English translation on first install

### 43a – Translation written on clean install (manual)

Steps:
1. Delete `translations/web.json` from the plugin folder and clear `bundledPacksWritten` from plugin data (or use a fresh vault).
2. Reload the plugin.
3. Open **Settings → BibLens → Translations** (expand).

Expected:
- `translations/web.json` is present in the plugin folder.
- The translation appears in the installed list.
- If no preferred translation was set, it is auto-selected as the active translation.

### 43b – File not overwritten on subsequent load (manual)

Steps:
1. Note the modification time of `translations/web.json`.
2. Reload the plugin.

Expected:
- Modification time is unchanged — the file was not rewritten.

### 43c – WEB attribution in LICENSES.md (automated)

- `grep -i "World English Bible\|WEB" LICENSES.md` returns a match.

### 43d – CI (automated)

- `npm run ci` passes with 0 errors.

---

## T049 – Remove Advanced (Catalog Management) section from Settings

### 49a – Advanced section absent (manual)

Steps:
1. Open **Settings → BibLens**.
2. Scroll through the entire settings tab.

Expected:
- No "Advanced" heading or section is visible.
- No "Update catalog" button is present.
- No "Auto-update catalog on startup" toggle is present.

### 49b – No startup catalog network request (manual)

Steps:
1. Open **DevTools → Network**.
2. Reload Obsidian (or disable and re-enable the plugin).
3. Observe network activity during plugin load.

Expected:
- No network request to the catalog URL is made on startup.

### 49c – Fields removed from settings interface (automated)

- `grep -n "autoUpdateCatalog\|catalogLastUpdated" src/settings.ts` returns no matches.
- `grep -n "autoUpdateCatalog\|catalogLastUpdated\|fetchCatalogUpdate\|isCatalogStale\|catalogUtils" src/main.ts src/settingsTab.ts src/sources/catalogManager.ts` returns no matches.
- `npm run ci` passes with 0 errors.

---

## T050 – Fix write-once flag for bundled starter packs

### 50a – Deleted bundled pack is not recreated (manual)

Steps:
1. Confirm the plugin has loaded at least once (all three bundled packs written and flags set).
2. Delete `recognition-languages/en.json` from the plugin folder.
3. Reload the plugin (Command palette → **Reload app**).
4. Check whether `recognition-languages/en.json` has reappeared.

Expected:
- The file is **not** recreated.

Steps (repeat for remaining packs):
- Repeat steps 2–4 for `reference-formats/en-sbl.json`.
- Repeat steps 2–4 for `translations/web.json`.

Expected:
- Neither file is recreated.

### 50b – Write-once flags persisted in plugin data (manual)

Steps:
1. Open **DevTools → Console** and run:
   `app.plugins.plugins['biblens'].loadData().then(d => console.log(d.bundledPacksWritten))`
2. Observe the output.

Expected:
- An object is logged containing truthy entries for all three paths:
  `recognition-languages/en.json`, `reference-formats/en-sbl.json`, `translations/web.json`.

### 50c – CI (automated)

- `npm run ci` passes with 0 errors.

---

## T051 – Fix Load button: tooltip, result display, layout

### 51a – Load button tooltip (manual)

Steps:
1. Open **Settings → BibLens → Translations** (expand).
2. Hover over the **Load** button in the Install new row.
3. Repeat for **Reference formats** and **Recognition languages** sections.

Expected:
- A tooltip reading "Fetch the current list of available items from the selected provider." appears in all three sections.

### 51b – All items installed placeholder (manual)

Steps:
1. Ensure all items from the selected provider are already installed.
2. Press **Load** in the Install new row.

Expected:
- After loading, the items dropdown shows "All items installed".
- The Download button remains disabled.
- The row does not collapse or show an error state.

### 51c – Live results populate dropdown (manual)

Steps:
1. Ensure at least one item from the selected provider is not yet installed.
2. Press **Load**.

Expected:
- The items dropdown is repopulated with the live list from the provider.
- The Download button becomes enabled.

### 51d – No layout shift on dropdown repopulation (manual)

Steps:
1. Press **Load** in any Install new row.
2. Observe the provider dropdown, Load button, and Download button during and after repopulation.

Expected:
- Provider dropdown, Load button, and Download button do not shift or resize.
- The items dropdown absorbs available space and does not push other controls.

### 51e – Layout fix applies to all three sections (manual)

- Verify steps 51d in the Translations, Reference formats, and Recognition languages sections.

### 51f – CI (automated)

- `npm run ci` passes with 0 errors.

---

## Regression Checklist

- Plugin still loads after Obsidian reload.
- No changes to plugin id.
- No Node-only runtime imports added.
- No external network calls added for MVP.