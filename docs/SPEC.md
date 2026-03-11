# BibLens – Specification

## Vision

BibLens is an Obsidian plugin that detects Bible references in notes and provides contextual tools for biblical text study.

The plugin:
- Works on desktop and mobile
- Operates fully offline
- Uses local vault data for Bible texts
- Avoids Node-only runtime dependencies

---

# Version 1.0

## What BibLens Does

- Detects Bible references in notes and underlines them in the editor
- Shows verse text on hover (Reading View popover and editor tooltip)
- Inserts verse text via two commands:
  - `BibLens: Insert verse after previous reference` — appends verse text inline after the last reference before the cursor (` — verse text`)
  - `BibLens: Replace previous reference with quote` — replaces the reference with a blockquote line (`> Ref verse text`)
- Manages multiple Bible translations stored locally
- Supports reference recognition in any language via downloadable language packs
- Supports multiple reference notation styles via downloadable format packs

---

## Reference Recognition

### Book identifiers

Internally, all book identifiers follow **USFM 3.0** format: uppercase ASCII strings of 2–3 characters (e.g. `GEN`, `MAT`, `REV`).

### Recognition language packs

A recognition language pack provides book names and aliases to identify Bible references written in a specific natural language. Each pack maps USFM book identifiers to recognized input strings.

- Stored in `recognition-languages/` in the plugin directory
- Active pack selected via **Recognition language** in Settings
- Multiple packs can be installed simultaneously; only one is active

### Reference format packs

A reference format pack defines the notation rules for a reference style — separators, range notation, and canonical display abbreviations per book.

Examples of distinct formats for the same language:
- Czech Protestant: `1 Te 1,1`
- Czech Catholic: `1 Sol 1,1`

- Stored in `reference-formats/` in the plugin directory
- Active format selected via **Reference format** in Settings
- Multiple format packs can be installed simultaneously; only one is active

### Parsing modes

**Strict** — detect only references matching canonical abbreviations from the active format pack, with exact separator matching.

**Extended** — detect using all aliases from the active language pack; accept multiple separator variants (comma, colon, period); recall favoured over precision.

### Single-chapter books

For single-chapter books (`OBA`, `PHM`, `2JN`, `3JN`, `JUD`), bare numbers are interpreted as verses, not chapters. `Abd 2-3` → verse range `Abd 1,2-3`. Explicit notation (`Abd 1,2`) remains valid.

### Syntactic patterns recognized

Multi-chapter books: `C`, `C-C`, `C:V`, `C:V-V`, `C:V-C:V`.
Single-chapter books: `N`, `N-N` (interpreted as verses of chapter 1).

---

## File Formats

### Translation file (`translations/${id}.json`)

```json
{
  "id": "web",
  "name": "World English Bible",
  "lang": "en",
  "source": "GetBible (api.getbible.net)",
  "formatVersion": 1,
  "verses": {
    "GEN 1:1": "In the beginning, God created the heavens and the earth.",
  }
}
```

**Mandatory:** `id`, `name`, `lang`, `formatVersion`, `verses`
**Optional:** `source`

- `id` — unique identifier; filename base (`${id}.json`); value of `settings.preferredTranslation`
- `name` — display name shown in Settings
- `lang` — BCP 47 language tag
- `formatVersion` — integer; must be `1`
- `verses` — map of `"USFM_ID CHAPTER:VERSE"` keys to verse text (e.g. `"GEN 1:1"`, `"MAT 28:19"`); no leading zeros

Deprecated fields `canonicalAbbreviations` and `allowedAbbreviations` are silently ignored.

---

### Recognition language pack (`recognition-languages/${id}.json`)

```json
{
  "id": "en",
  "displayName": "English",
  "lang": "en",
  "formatVersion": 1,
  "source": "cleaned",
  "books": {
    "GEN": {
      "aliases": [
        "Genesis",["Gn", "Gen", "Genesis", "1. Mojžíšova"] },
        "MAT": { "aliases": ["Mt", "Mat", "Matouš"] }
  }
}
```

**Mandatory:** `id`, `displayName`, `lang`, `formatVersion`, `books`
**Optional:** `source`

- `id` — BCP 47 language tag; filename base; value of `settings.preferredLanguage`
- `books` — USFM 3.0 book identifiers → `{ aliases: string[] }` flattened into `AbbreviationMap` by the loader

---

### Reference format pack (`reference-formats/${id}.json`)

```json
{
  "id": "cs-cek",
  "displayName":"Czech (Český ekumenický komentář)",
  "lang": "cs",
  "formatVersion": 1,
  "books": { "GEN": "Gn", "EXO": "Ex", "MAT": "Mt" },
  "rules": {
    "chapterVerseSeparator": ",",
    "rangeSeparator": "-",
    "bookChapterSeparator": " "
  }
}
```

**Mandatory:** `id`, `displayName`, `lang`, `formatVersion`, `books`, `rules`
**Optional:** `source`

- `id` — unique identifier; filename base; value of `settings.standardReferenceFormat`
- `books` — USFM book identifiers → canonical display abbreviation for this format style; must cover all 66 books
- `rules.chapterVerseSeparator` — character between chapter and verse (e.g. `","` or `":"`)
- `rules.rangeSeparator` — character between range start and end (e.g. `"-"`)
- `rules.bookChapterSeparator` — character between book abbreviation and chapter (e.g. `" "`)

---

## Settings

The settings tab has four areas:

**General** (flat, no heading):
- **Translation** — read-only; active translation name, or "None — verse text unavailable"
- **Reference format** — read-only; active format pack name, or "Built-in English"
- **Recognition language** — read-only; active language pack name, or "Built-in English"
- **Parsing rules** — dropdown: Strict / Extended

**Installed translations** (collapsible) — list with Delete and Set as default buttons; "Install new" row with provider dropdown, Load button, items dropdown, and Download button. Already-installed items excluded from dropdown.

**Reference formats** (collapsible) — same structure.

**Recognition languages** (collapsible) — same structure.

**Auto-default:** when `display()` renders and a preference is empty while at least one item of that type is installed, the first installed item is automatically set as default. Covers first install, manual file drop, and active-item deletion.

---

## Bundled Packs

On first install, BibLens writes three assets from data bundled into `main.js` at build time. Each file is written once (tracked by a write-once flag in plugin data) and never rewritten afterwards — even if deleted by the user:

- `recognition-languages/en.json` — English book names and abbreviations
- `reference-formats/en.json` — English colon notation
- `translations/en-web.json` — World English Bible (public domain)

These appear in installed lists and are auto-defaulted on first run, requiring zero configuration from a new user.

---

## Provider Discovery

Each "Install new" row has a **Load** button between the provider dropdown and the items dropdown. Clicking Load queries the selected provider for its current item list and repopulates the items dropdown.

- Before any load: dropdown shows catalog-based list (offline-safe).
- After load: live result replaces the catalog list for the current session only; not cached.
- Load failure: notice shown; catalog list retained.
- Providers without a discovery API: Load button is hidden.

All network access is an explicit user action; no silent background downloads.

---

## Technical Constraints

- Mobile Obsidian compatible; Obsidian API for vault access; no Node runtime features.
- No `innerHTML` for verse content — DOM construction only.
- Reference detection scans visible viewport only; never full document on automatic updates.
- User-triggered commands may perform a single full-document scan.
- Regex patterns precompiled at scanner construction; not created in hot loops.
- Editor update cost target: <5 ms; hard limit: <10 ms.

---

## Architecture Principles

- Separate reference parsing from UI logic.
- Separate data provider from UI layer.
- Keep parsing logic deterministic and unit-testable.
- All new features must update TESTPLAN.md.

---

# Version 1.1


# Next version
Items in this section are prepared for the implementation of the future versions


## Proposed

Chapters in this section are design proposals awaiting Architect review and Reviewer approval.
Once accepted, the Analyst moves each chapter into the appropriate version section and removes the `**Status:** Proposed` line.

<!-- New proposed chapters go here -->

### Translation Display Priority and Abbreviation Settings

**Status:** Proposed

**User need:** Users with multiple translations installed want to control which translations appear in the hover pop-up, in what order, and under what short label.

**Proposed behaviour:**
- Each row in the **Installed translations** list gains two new controls placed to the left of the Delete button:
  - A **priority dropdown** with options `1`, `2`, `3`, … (up to the number of installed translations) and `-`. A number means "show this translation in the pop-up at this position"; `-` means "do not show this translation in the pop-up."
  - A **abbreviation text field** pre-filled with the translation `id` (e.g. `web`). The user may change it to any short string (e.g. `WEB`, `NIV`). This abbreviation is used as a prefix label in multi-translation pop-ups and inserted text.
- When the user changes a priority number:
  - Any other translation previously holding that number receives the displaced number (swap), or is renumbered so that the assigned numbers remain a contiguous sequence starting at 1 with no duplicates.
  - The list reorders to reflect the new priority: translation 1 at the top, highest number at the bottom, translations with `-` below all numbered ones.
- The order can also be changed by **drag and drop** within the installed translations list. Dragging a row updates the priority numbers to match the new visual order; translations with `-` remain below all active ones.
- Priority and abbreviation values are persisted in plugin settings per translation id.

**Scope notes:**
- Priority and abbreviation apply only to translations; reference format and language pack rows are unchanged.
- When only one translation has a priority number (all others are `-`), the pop-up behaves identically to v1.0 (no label prefix, no separator lines).
- Drag-and-drop uses the browser-native HTML5 drag API (available in Obsidian desktop and mobile via Electron/WKWebView); no external library required.
- New fields needed in settings: `translationOrder: Record<string, number | null>` and `translationAbbreviations: Record<string, string>`.

**Open questions:**
- Should the abbreviation field have a character limit? Recommendation: soft limit of 8 characters enforced by UI only.
- When a translation is deleted and re-downloaded, should its saved priority and abbreviation be restored? Recommendation: yes — keyed by translation id.

---

### Multi-Translation Hover Pop-up

**Status:** Proposed

**User need:** Users who have multiple translations active want to compare verse text from all active translations in a single hover interaction, without switching settings.

**Proposed behaviour:**
- **Single active translation** (only one translation has a priority number): behaviour is identical to v1.0 — no change.
- **Multiple active translations** (two or more translations have a priority number):
  - **Single verse or single-chapter reference identified:**
    - The pop-up shows each active translation's verse text in priority order.
    - Translations are separated by a horizontal rule (`<hr>`).
    - Each translation block begins with the translation abbreviation followed by the formatted reference, then the verse text. Example for `Ex 1,1` with translations `web` and `niv`:
      ```
      web Ex 1,1  Now these are the names of the sons of Israel…
      niv Ex 1,1  These are the names of the sons of Israel…
      ```
  - **Multiple verses or chapter-range reference identified:**
    - The pop-up becomes a **paged view**: each page shows all verses for one translation.
    - Navigation arrows (previous / next) allow switching between translation pages.
    - The current translation abbreviation is shown as the page heading.
    - Page state resets to the first translation each time a new pop-up is opened.
- The pop-up remains scrollable (v1.0 behaviour preserved) within each page.
- Text selection continues to work within the visible content.

**Scope notes:**
- "Active translations" are those with a priority number set (not `-`), ordered by priority.
- The single-verse path requires fetching verse text from all active translations; translation data for each must be loaded and cached in memory (parallel to how v1.0 caches a single `TranslationData`).
- The paged-view path requires a lightweight page controller in the DOM builder; no third-party UI library.
- Both Reading View popover and editor tooltip should reflect the same multi-translation layout.
- This feature depends on **Translation Display Priority and Abbreviation Settings** being implemented first.

**Open questions:**
- Should the horizontal rule separator be full-width or indented? Recommendation: full-width, consistent with Obsidian's native `<hr>` style.
- If a verse is missing in one translation, should that translation be skipped silently or show a placeholder? Recommendation: show a brief "not available" placeholder so the user knows the translation was checked.

---

### Insert All Translations Command

**Status:** Proposed

**User need:** Users want to capture the full multi-translation pop-up content as text in their note with a single command, mirroring what the hover pop-up shows.

**Proposed behaviour:**
- Two new commands are added, parallel to the existing single-translation insert commands:
  - `BibLens: Insert all translations after previous reference` — appends text for all active translations after the last reference before the cursor. Each translation is on its own line, prefixed by its abbreviation and the reference: `web Ex 1,1 — verse text` followed by `niv Ex 1,1 — verse text`.
  - `BibLens: Replace previous reference with all-translation quote` — replaces the last reference before the cursor with a block quote containing each active translation on its own line: `> web Ex 1,1 verse text` / `> niv Ex 1,1 verse text`.
- When only one translation is active, these commands produce output identical to the existing single-translation commands (no visible change for users who have not configured multiple translations).
- The reference used as the label for each line uses the translation's configured abbreviation (from the abbreviation field in Settings).
- Command order and output order both follow the priority order defined in Settings.

**Scope notes:**
- These commands operate on the last reference before the cursor, using the same cursor-relative logic as the existing insert commands (D018).
- Implementation follows the existing `insertVerse.ts` pattern; the multi-translation variant iterates active translations in priority order and concatenates their output.
- This feature depends on **Translation Display Priority and Abbreviation Settings** and **Multi-Translation Hover Pop-up** being implemented first.
- Existing commands (`Insert verse after previous reference`, `Replace previous reference with quote`) are unchanged.

**Open questions:**
- Should there be a blank line between translations in the inserted text, or only a newline? Recommendation: single newline only, keeping the block compact.

### Insert Book Abbreviation

**Status:** Proposed

**User need:** Users who cannot recall the canonical abbreviation for a book can insert it directly at the cursor without typing it manually.

**Proposed behaviour:**
- Command `BibLens: Insert book abbreviation` opens a filterable `SuggestModal` showing all canonical book abbreviations from the active reference format pack as `<abbreviation> — <full book name>` (e.g. `Gen — Genesis`).
- The user filters by typing any part of the abbreviation or book name.
- Selecting an entry inserts the abbreviation at the cursor in the active editor.
- No-op (shows a Notice) when invoked outside an editing context (e.g. Reading View, no active editor).
- Falls back to USFM identifiers (e.g. `GEN`) when no format pack is active.

**Scope notes:**
- Uses Obsidian's built-in `SuggestModal`; works on desktop and mobile.
- Reads abbreviations from `ReferenceFormatRules.books`; no new data source needed.
- Insertion uses a CM6 transaction (same pattern as existing insert commands); no `innerHTML`.
- Source modules: `src/main.ts` (command registration), `src/ui/bookAbbreviationModal.ts` (new).

**Open questions:**
- Should the modal show both abbreviation and full name, or abbreviation only? Recommendation: show both for discoverability.
