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

### Translation Display Priority and Abbreviation Settings

**User need:** Users with multiple translations installed want to control which translations appear in the hover pop-up, in what order, and under what short label.

**Proposed behaviour:**
- Each row in the **Installed translations** list gains two new controls. Layout left to right: `[abbreviation field] [priority dropdown] [Delete button]`.
  - An **abbreviation text field** pre-filled with the translation `id` (e.g. `web`). The user may change it to any short string (e.g. `WEB`, `NIV`). Soft limit of 3 characters enforced by the UI (input beyond 3 characters is accepted but visually flagged). This abbreviation is used as a prefix label in multi-translation pop-ups and inserted text.
  - A **priority dropdown** with options `1`, `2`, `3`, … (up to the number of installed translations) and `-`. A number means "show this translation in the pop-up at this position"; `-` means "do not show this translation in the pop-up."
- **Initial state:** when there is exactly one installed translation it automatically receives priority `1`. When additional translations are installed they default to `-` until the user assigns them a number.
- Priority numbers are always unique and contiguous starting from 1, with no gaps. When the user changes a number:
  - Other translations are renumbered so the sequence remains `1, 2, 3, …` without duplicates or gaps.
  - The list reorders to reflect the new priority: translation 1 at the top, highest number at the bottom, translations with `-` below all numbered ones.
- The order can also be changed by **drag and drop** within the installed translations list. Dragging a row updates the priority numbers to match the new visual order; translations with `-` remain below all active ones.
- Priority and abbreviation values are persisted in plugin settings per translation id. If a translation is deleted and re-downloaded its saved priority and abbreviation are restored (keyed by translation id).

**Scope notes:**
- Priority and abbreviation apply only to translations; reference format and language pack rows are unchanged.
- **Priority 1 replaces `settings.preferredTranslation`**: the translation with priority 1 is the default/active translation used everywhere in v1.0 (hover pop-up when single translation, insert commands). `settings.preferredTranslation` is retired; the active translation is always derived from `translationOrder`. On upgrade from v1.0, the existing `preferredTranslation` value is used to initialise priority 1; the field is then removed from settings.
- The **"Set as default"** button in the installed translations list is removed — assigning priority 1 via the dropdown serves this role.
- The existing auto-default mechanism (D025) that sets `preferredTranslation` when empty is extended: on first install (or after all priorities are cleared), the first installed translation automatically receives priority 1 in `translationOrder`.
- When only one translation has a priority number (all others are `-`), the pop-up behaves identically to v1.0 (no label prefix, no separator lines).
- Drag-and-drop uses the browser-native HTML5 drag API (available in Obsidian desktop and mobile via Electron/WKWebView); no external library required.
- New fields needed in settings: `translationOrder: Record<string, number | null>` and `translationAbbreviations: Record<string, string>`. `preferredTranslation` is removed.

**Open questions:** none.

---

### Multi-Translation Hover Pop-up

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
- If a verse or passage is not found in a given translation, that translation block shows the translation abbreviation only — no verse text and no error message.
- The pop-up remains scrollable (v1.0 behaviour preserved) within each page.
- Text selection continues to work within the visible content.

**Scope notes:**
- "Active translations" are those with a priority number set (not `-`), ordered by priority.
- Translations are separated by a full-width horizontal rule (`<hr>`), consistent with Obsidian's native `<hr>` style.
- **Multi-translation data loading:** `main.ts` currently stores a single `translationData` object. Supporting multiple active translations requires storing a map of all priority-numbered translations (`Record<string, TranslationData>`). The `reloadTranslation()` mechanism must be extended to handle per-translation reloads. This is the largest implementation change in v1.1.
- **`buildVerseDOM` extension:** the multi-translation stacked and paged layouts are structurally different from the current single-translation `VerseEntry[]` input. Implementation will require either a meaningful extension of `buildVerseDOM` or a parallel DOM-builder function for the multi-translation case, keeping the existing single-translation path unchanged.
- **Paged view in editor tooltip:** the Reading View `PopoverManager` uses `_popoverHovered` tracking (D024) to keep the pop-up alive while the user interacts with it. CM6's `hoverTooltip` dismisses when the mouse leaves the decorated token range; whether paged navigation arrows remain reachable in the editor tooltip is an open implementation question. If not viable, the paged view may be limited to the Reading View popover; the editor tooltip would show a simplified multi-translation layout for multi-verse passages.
- The paged-view path requires a lightweight page controller in the DOM builder; no third-party UI library.
- This feature depends on **Translation Display Priority and Abbreviation Settings** being implemented first.

**Open questions:** none.

---

### Insert Commands — Multi-Translation Behaviour

**User need:** Users want fine-grained control over what is inserted: a quick single-translation insert for the primary source, and a full multi-translation insert when capturing a comparative study.

**Proposed behaviour:**
- The two existing commands change behaviour when multiple translations are active:
  - `BibLens: Insert verse after previous reference` — inserts the verse text from the **priority-1 translation only**, appended after the last reference before the cursor (` — abbr verse text`). Behaviour is identical to v1.0 except the active translation is always the priority-1 one.
  - `BibLens: Replace previous reference with quote` — replaces the last reference before the cursor with a block quote containing **all active translations** in priority order, one per line, separated by a single newline:
    ```
    > web Ex 1,1 verse text
    > niv Ex 1,1 verse text
    ```
- When only one translation is active (priority 1, all others `-`), both commands produce output identical to v1.0.
- When translation returns no text, nothing is put into quote.
- Each line uses the translation's configured abbreviation (from the abbreviation field in Settings) followed by the formatted reference and the verse text.
- If a verse is not found in a given translation, that translation's line is omitted from the inserted text.

**Scope notes:**
- Both commands use the same cursor-relative "last reference before cursor" logic as v1.0 (D018).
- `Insert verse after previous reference` requires no iteration — it reads the priority-1 translation only; implementation change is minimal.
- `Replace previous reference with quote` iterates active translations in priority order; implementation extends the existing `replaceLastRefWithQuoteCommand` factory. The factory signature changes from `(scanner, data, refFormat)` to an ordered list of `{ abbreviation: string; data: TranslationData }` pairs plus `refFormat`; `insertVerse.ts` remains a pure module.
- This feature depends on **Translation Display Priority and Abbreviation Settings** being implemented first.

**Open questions:** none.

### Insert Book Abbreviation

**User need:** Users who cannot recall the canonical abbreviation for a book can insert it directly at the cursor without typing it manually.

**Proposed behaviour:**
- Command `BibLens: Insert book abbreviation` opens a filterable `SuggestModal` listing all canonical book abbreviations from the active reference format pack (e.g. `Gen`, `Ex`, `Mt`).
- The user filters by typing any part of the abbreviation string.
- Selecting an entry inserts the abbreviation at the cursor in the active editor.
- No-op (shows a Notice) when invoked outside an editing context (e.g. Reading View, no active editor).
- Falls back to USFM identifiers (e.g. `GEN`) when no format pack is active.

**Scope notes:**
- The current data model (`ReferenceFormatRules.books`) maps USFM id → canonical display abbreviation only; full book names are not stored. The modal therefore shows abbreviations only — there is no "full name" column. Filtering is limited to matching against the abbreviation string.
- Future improvement: if a recognition language pack is active its `aliases` list includes full-name strings (e.g. `Genesis`, `Exodus`) which could be surfaced alongside the abbreviation for richer filtering. This is not in scope for the initial implementation.
- Uses Obsidian's built-in `SuggestModal`; works on desktop and mobile.
- Reads abbreviations from `ReferenceFormatRules.books`; no new data source needed.
- Insertion uses a CM6 transaction (same pattern as existing insert commands); no `innerHTML`.
- Source modules: `src/main.ts` (command registration), `src/ui/bookAbbreviationModal.ts` (new).

**Open questions:** none.

---

# Next version

Items in this section are prepared for the implementation of future versions.

## Proposed

Chapters in this section are design proposals awaiting Architect review and Reviewer approval.
Once accepted, the Analyst moves each chapter into the appropriate version section and removes the `**Status:** Proposed` line.

<!-- New proposed chapters go here -->
