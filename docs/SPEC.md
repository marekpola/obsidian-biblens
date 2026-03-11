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

# Next version
Items in this section are prepared for the implementation of the future versions


## Proposed

Chapters in this section are design proposals awaiting Architect review and Reviewer approval.
Once accepted, the Analyst moves each chapter into the appropriate version section and removes the `**Status:** Proposed` line.

<!-- New proposed chapters go here -->

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
