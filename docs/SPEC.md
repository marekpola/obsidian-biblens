# BibLens – Specification

## Vision

BibLens is an Obsidian plugin that provides instant Bible passage previews on hover.

The project is designed for academic and research workflows and aims to support
parallel texts, multiple translations, and morphology in future versions.

Initial development focuses on Czech Bible reference notation.

The plugin must:

- Work on desktop and mobile
- Operate fully offline
- Use local vault data for Bible texts
- Avoid Node-only runtime dependencies

---

## Versioning Note

Milestone labels in this document use two-part notation (`0.1`, `0.2`, `0.3`) for readability.
`manifest.json`, `package.json`, and `versions.json` use full semver (`0.1.0`, `0.2.0`, `0.3.0`).
The mapping is direct: milestone `0.x` corresponds to release `0.x.0`. Patch versions (`0.x.1`, etc.) are used for bugfix releases within a milestone and are not tracked in this document.

---

## Version 0.1 – MVP

### Goal

When a user writes a Bible reference such as:

- Mt 1,3
- Gn 22,1-19
- Iz 11

and hovers over it in Reading View,
a popover appears displaying a preview.

For MVP:

- The popover displays the actual verse text from a locally bundled translation (Czech CEP).
- Formatting: verse location (e.g. `Gn 1,1`) as superscript, verse text in normal font.
  For ranges, the first label shows only the first verse reference (e.g. `Gn 22,1`, not `Gn 22,1-3`);
  subsequent verses begin with their bare verse number in superscript.
  When a passage spans more than one chapter, the first verse of each new chapter begins on a new line
  and carries a chapter-qualified label (e.g. `2,1` using the active format's chapter-verse separator).
- Translation data is loaded from `translations/cep.json` in the plugin directory at startup.
- No external services are allowed.
- No external backend is allowed.
- Reference detection must work reliably for basic Czech notation.

### Reference Format

The MVP supports Czech-style Bible reference notation.

Characteristics:

- Space between book abbreviation and chapter number
- Comma between chapter and verse
- Dash for verse ranges

Examples:

- Mt 1,3
- Gn 22,1-19
- Iz 11

Notes:

- Multiple Czech abbreviation standards exist.
- The MVP will initially use a predefined internal abbreviation mapping.
- Support for configurable abbreviation systems is planned for future versions.

#### Input abbreviation vs internal bookId

Input abbreviations (e.g. "Mt", "Gn", "Iz") are the user-facing notation in the note text.
Internally, the parser maps each abbreviation to a canonical `bookId` in USFM 3.0 format (e.g. "MAT", "GEN", "ISA") before storing it in `BibleRef`.
USFM 3.0 book identifiers are uppercase ASCII strings defined by the USFM 3.0 standard.
This separation allows multiple abbreviation systems to map to the same internal identifier in future versions.

### Non-Goals

- No cloud services
- No text-fabric backend
- No morphology
- No multi-language UI
- No advanced reference parsing
- No cross-book range parsing

---

## Version 0.2

### Insert Commands

Issue: #3

#### Goal

Allow the user to insert verse text from the Bible reference last detected before cursor position, using two distinct commands.

Features:

- Command `BibLens: Insert verse after previous reference` — scans the entire document, finds the last detected Bible reference before cursor position, and appends its verse text inline immediately after it (` — verse text`).
- Command `BibLens: Replace previous reference with quote` — finds the last detected Bible reference before cursor position and replaces it with a blockquote line (`> Ref verse text`).
- Both commands are a no-op if no references are detected before the cursor.

#### Constraints

- Full-document scan is permitted for user-triggered commands (single one-time operation, not an automatic update handler).
- Insertion uses a CM6 transaction; no `innerHTML`.
- Works in editing mode only (not Reading View).

### Translation Management

#### Goal

Allow the user to work with multiple Bible translations stored locally.

Features:

- Plugin settings include a `Preferred translation` selector listing all files found in `translations/`.
- User can add a translation by dropping a JSON file into `translations/` and reloading the plugin.
- Changing the preferred translation reloads the active translation data without a plugin restart.

#### Constraints

- All translation files must follow the same key format as `cep.json` (`${bookId}.${chapter}.${verse}`).
- Offline operation is preserved; the preferred translation must already be on disk.

---

## Version 0.3

### New standard for translation files

#### Goal

Establish a versioned, self-describing structure for translation files that supports metadata,
display abbreviations, and future multi-language use.

#### File format (version 1)

Translation files must be valid JSON objects with the following structure:

```json
{
  "id": "bible21",
  "name": "Bible21",
  "lang": "cs",
  "source": "dava3.net (Davar .dbk export)",
  "formatVersion": 1,
  "canonicalAbbreviations": {
    "GEN": "Gn",
    "EXO": "Ex"
  },
  "allowedAbbreviations": {
    "GEN": ["Gn", "Gen", "Genesis", "1. Mojžíšova"],
    "EXO": ["Ex", "Exo", "Exodus", "2. Mojžíšova"]
  },
  "verses": {
    "GEN 1:1": "Na počátku Bůh stvořil nebe a zemi.",
    "GEN 1:2": "Země pak byla pustá a prázdná, nad propastí byla tma a nad vodami se vznášel Boží Duch.",
    "GEN 1:3": "Bůh řekl: \"Ať je světlo!\" - a bylo světlo."
  }
}
```

**Mandatory fields:** `id`, `name`, `lang`, `formatVersion`, `verses`

**Optional fields:** `source`, `canonicalAbbreviations`, `allowedAbbreviations`

#### Field definitions

- `id` — unique identifier; lowercase, no spaces; used as the filename base (`${id}.json`) and as the `settings.preferredTranslation` value
- `name` — human-readable display name shown in the settings UI
- `lang` — BCP 47 language tag (e.g. `"cs"`, `"en"`)
- `source` — free-text provenance or attribution; informational only, not displayed in the UI
- `formatVersion` — integer; must be `1` for this format; used by the loader to select the correct parsing path
- `canonicalAbbreviations` — *deprecated as of v0.4*; silently ignored when a reference format pack is active; canonical abbreviations are now owned by the active format pack's `books` map
- `allowedAbbreviations` — *deprecated as of v0.4*; silently ignored when a recognition language pack is active; input aliases are now owned by the active language pack's `books[].aliases`
- `verses` — map of `"USFM_ID CHAPTER:VERSE"` keys to verse text strings

#### Book identifiers

Book identifiers follow the **USFM 3.0** standard (see [USFM 3.0 Book Identifiers](https://ubsicap.github.io/usfm/usfm3.0/identification/books.html)):
uppercase ASCII strings of 2–3 characters (e.g. `GEN`, `EXO`, `LEV`, `MAT`, `REV`).
This is the same `BookId` type used throughout the plugin.

#### Verse key format

Keys in the `verses` object use the format `USFM_ID CHAPTER:VERSE`:

- USFM 3.0 book identifier
- Single space separator
- Chapter number (no leading zeros)
- Colon separator
- Verse number (no leading zeros)

Examples: `"GEN 1:1"`, `"MAT 28:19"`, `"PS 119:176"`

This format is human-readable and consistent with common Bible software conventions.

#### Loader behaviour

`translationLoader.ts` detects the format by the presence of `formatVersion`:

- **`formatVersion: 1`** — new format; loader validates mandatory fields, extracts `verses`,
  and normalises keys from `USFM_ID CHAPTER:VERSE` to `USFM_ID.CHAPTER.VERSE` for internal use.
  This preserves the existing `TranslationData` key format and keeps `provider.ts` unchanged.
- **No `formatVersion` field** — legacy flat `Record<string, string>` with dot-separated keys;
  loaded as-is without transformation.

Both paths produce the same `TranslationData` type for all downstream consumers.

Files with `formatVersion` values other than `1` are rejected with an error; the plugin falls back
to `"Verse not found."` until a valid translation is loaded.

#### Migration

`translations/cep.json` is updated to format version 1 as part of the 0.3 release.
The loader continues to read legacy files indefinitely, so user-dropped translations in the old format remain functional.

### Translation Source Management

#### Goal

Allow the user to discover and download Bible translations from a curated catalog of known HTTP providers, and manage downloaded translations from the settings UI.

#### Features

- Plugin contains a built-in **source catalog**: a static list of known HTTP providers, each with a display name, base URL, adapter type, and list of available translations (language, name, remote identifier). Bundled providers include `getbible-net`, `beblia-xml`, and `biblens-data`; the `biblens-data` provider serves pre-authored translations in BibLens v1 JSON format.
- The settings UI exposes a **Translation Sources** panel:
  - User selects a provider from the catalog.
  - User sees the list of translations available from that provider, with download status (downloaded / not downloaded).
  - Per-translation actions: **Download**, **Delete**, **Update** (= delete + re-download).
- On Download, BibLens:
  1. Fetches raw data from the provider using `requestUrl`.
  2. Transforms the raw response to the canonical `Record<string, string>` key format (`${USFM_BOOK}.${chapter}.${verse}`) using a per-provider **adapter**.
  4. Adds required attributes to the json file.
  3. Writes the result to `translations/${id}.json`.
- Download status is derived from the `translations/` directory listing (no separate tracking file).
- A separate **Installed Translations** panel lists locally available translations with a Delete button.

#### Catalog Update from GitHub

The source catalog (list of providers and their translations) can be refreshed independently from the plugin itself, without requiring a new plugin release. This allows adding or removing providers when sources become available or go offline.

Update modes:

- **Manual** (always available): a "Update catalog" button in settings fetches the current catalog from a hardcoded GitHub URL and caches it locally as `catalog.json` in the plugin directory.
- **Auto-update on startup** (opt-in, default off): if the cached catalog is older than a configurable threshold, the plugin fetches a fresh copy silently on load. The user enables this via a settings toggle.

Fallback chain (in priority order):

1. `plugins/biblens/catalog.json` — locally cached catalog (result of a previous update)
2. Bundled `KNOWN_PROVIDERS` — static snapshot baked into the plugin at release time; always available offline

Constraints:

- The remote catalog URL is a hardcoded constant pointing to the BibLens data repository (`biblens-data`). It is not user-configurable.
- The remote catalog can only update **data** (providers, translations, URLs). It cannot add new adapter types — those require a plugin release.
- Providers in the fetched catalog that reference an unknown adapter type are silently ignored (forward-compatibility: a newer catalog entry won't crash an older plugin).
- Schema validation is performed before accepting any fetched catalog.
- The settings UI shows the date of the last successful catalog update.

#### Constraints

- The source catalog is bundled in plugin source code as an offline fallback.
- All network access is an **explicit user action** or opt-in auto behavior; no silent background activity by default.
- Transformation to canonical format happens before writing to disk; corrupt or non-conforming data is rejected.
- Once translations are downloaded, the plugin operates fully offline.
- New providers and adapters are added by extending the catalog (data) and adapter registry (code) in the plugin; new adapter types always require a plugin release.

---

## Technical Constraints

- Must support mobile Obsidian.
- Must use only Obsidian API for vault access.
- Must not rely on Node runtime features.
- Changes must remain small and incremental.
- Parsing logic must remain testable independently of Obsidian UI.

## Version 0.4

Issue: #10

### Goal

Allow BibLens to recognize Bible references written in any language by supporting independently
downloadable **recognition language packs** (book names per language) and **reference format packs**
(notation rules per style). Multiple formats can exist for one language (e.g. Protestant, Catholic, Jewish).

Data source: the `biblens-data` repository (`https://github.com/marekpola/biblens-data`) provides
pre-authored recognition language packs and reference format packs in BibLens JSON format.
Minimize plugin bundle size: do not bundle the full dataset; download only selected packs on demand.

---

### Recognition Language Packs

A recognition language pack provides the book names and abbreviations needed to identify Bible references
written in a specific natural language.

Each pack:
- maps USFM book identifiers (e.g. `GEN`, `MAT`, `REV`) to recognized input aliases for that language
- canonical display abbreviations are defined by the active reference format pack, not the language pack
- is stored in `recognition-languages/` in the plugin directory

Multiple language packs can be installed simultaneously.
The active pack is selected via **Preferred language for reference recognition** in General settings.

#### Sourcing recognition language packs

Language packs reach the plugin through two paths:

- **Download** — via the Install sources panel; fetched from the `biblens-data` repository using the
  `"biblens-data"` adapter; packs are pre-authored in BibLens format with USFM keys (no OSIS conversion needed)
- **Manual drop** — user places a correctly formatted JSON file into `recognition-languages/` directly;
  the pack appears in the installed list on next settings tab open

Language packs are not bundled with the plugin; the built-in English book names serve as the offline fallback when no pack is selected.

---

### Reference Format Packs

A reference format pack defines the notation rules for a reference style — how chapter and verse are
separated, how ranges are expressed, and what structural patterns are valid.

Examples of distinct formats for the same language:
- Czech Protestant: `1 Te 1,1`
- Czech Catholic: `1 Sol 1,1`

Each pack:
- specifies separator characters and structural rules for parsing and formatting references
- is language-tagged but not locked to one language (a format may apply across languages)
- is stored in `reference-formats/` in the plugin directory

Multiple format packs can be installed simultaneously.
The active format is selected via **Standard reference format** in General settings.

#### Sourcing reference format packs

Reference format packs reach the plugin through three paths:

- **Bundled** — selected well-known notation styles are shipped with the plugin as pre-authored JSON files
  placed in `reference-formats/` at install time. The English pack (`en`) is always bundled.
  The actual offline fallback when no pack is selected is a hardcoded code-level constant (`BUILT_IN_FORMAT_RULES`)
  using English notation; the bundled file is shipped for discoverability only.
- **Download** — via the Install sources panel; fetched from the `biblens-data` repository at
  `resources/reference-formats/<remoteId>.json` using the `"biblens-data"` adapter; no transformation needed
- **Manual drop** — user places a correctly formatted JSON file into `reference-formats/` directly;
  the pack appears in the installed list on next settings tab open

---

### OSIS→USFM Mapping

BibLens uses USFM 3.0 identifiers internally (e.g. `GEN`, `MAT`). All pack files in `biblens-data`
store USFM keys natively — no conversion is needed during download.
The plugin retains a static OSIS→USFM mapping table in `src/osisMapping.ts` for use by future adapters
that source data with OSIS identifiers. This table is not user-configurable and requires no download.

---

### Parsing Modes

A **Parsing rules** setting controls how aggressively the parser identifies references:

- **Strict** — detect only references whose book name matches a canonical abbreviation in the active reference format pack, and whose chapter-verse separator and other notation exactly match the format pack rules. Book names from the language pack that are not in the format pack's canonical list are ignored.
- **Extended** — detect references using all recognized aliases from the active language pack; accept multiple separator variants (comma, colon, period, etc.) regardless of the active format pack; false positives are accepted (recall is favoured over precision). Book names from inactive or unloaded language packs are never matched.

Default: Strict.

Parser chapter–verse interpretation must account for both multi-chapter and single-chapter biblical books. The syntactic patterns recognized by the scanner are: `C`, `C-C`, `C:V`, `C:V-V`, and `C:V-C:V` (where `C` is chapter and `V` is verse). After identifying the book and extracting the numeric pattern, the parser interprets the numbers according to book metadata. For multi-chapter books, `C` denotes a chapter, `C-C` a chapter range, `C:V` a single verse, `C:V-V` a verse range within the same chapter, and `C:V-C:V` a cross-chapter range. For single-chapter books (e.g., Obadiah, Philemon, 2 John, 3 John, Jude), numbers without a verse separator are interpreted as verses: `N` → verse `N` of chapter 1 and `N-N` → verse range `N–N` of chapter 1. Thus `Abd 2-3` is interpreted as `Abd 1,2-3`. Explicit forms such as `Abd 1,2` and `Abd 1,2-3` remain valid but redundant. The resulting `BibleRef` structure always uses `chapterStart`, `verseStart`, `chapterEnd`, and `verseEnd` fields as appropriate, with `chapterStart` fixed to `1` for single-chapter books when only verse numbers are supplied.

---

### Settings Changes

#### Settings tab structure

The settings tab is organized into five areas in order:

- **General** (flat, no heading) — three read-only status rows + Parsing rules dropdown
  - **Translation** — read-only; shows display name of active translation, or “None — verse text unavailable” if none set
  - **Reference format** — read-only; shows display name of active format pack, or “Built-in English” if none set
  - **Recognition language** — read-only; shows display name of active language pack, or “Built-in English” if none set
  - **Parsing rules** — dropdown: Strict / Extended; description: “Identify biblical references only when they follow a standard format”
- **Installed translations** (collapsible, collapsed by default) — list of installed translations; active translation marked; Delete and Set as default buttons; “Install new” row at the bottom with provider + translation dropdowns and Download button (already-installed translations are excluded from the dropdown)
- **Reference formats** (collapsible, collapsed by default) — list of installed format packs with Delete and Set as default buttons; “Install new” row at the bottom with provider + format dropdowns and Download button
- **Recognition languages** (collapsible, collapsed by default) — list of installed language packs with Delete and Set as default buttons; “Install new” row at the bottom with provider + language dropdowns and Download button
- **Advanced** — catalog update button and auto-update toggle

**Auto-default behaviour:** when `display()` renders and the preference for any asset type is empty while at least one item of that type is installed, the first installed item is automatically set as default. This fires on first download, manual file drop (detected on next tab open), and active-item deletion (preference cleared → next available item auto-selected).

---




### Constraints

- Recognition language packs and reference format packs are independent; any combination can be active.
- The built-in English format rules and English book names (hardcoded constants, not read from disk) ensure offline operation without downloading any pack.
- All network access is explicit user action (download button); no silent background downloads by default.
- Manually dropped pack files must conform to the format defined in `docs/ARCHITECTURE.md`; malformed files are rejected with an error.
- Providers in the fetched catalog that reference an unknown pack type are silently ignored.
- Pack file format and sourcing details are defined in `docs/ARCHITECTURE.md`.



---

## Architecture Principles

- Separate reference parsing from UI logic.
- Separate data provider from UI layer.
- Keep parsing logic deterministic and unit-testable.
- All new features must update TESTPLAN.md.
