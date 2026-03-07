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
  For ranges, subsequent verses begin with their verse number in superscript.
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

### Insert Verse After Last Reference

Issue: #3

#### Goal

Allow the user to insert verse text after the Bible reference last detected before cursor position

Features:

- Command `BibLens: Insert verse text after previous reference` available in the Obsidian command palette.
- Scans the entire document, finds the last detected Bible reference before cursor position, and inserts its verse text immediately after it.
- Uses the same insertion format as `BibLens: Insert verse text` (inline or blockquote, per settings).
- Command is a no-op if no references are detected in the note.

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
- `canonicalAbbreviations` — optional map of USFM 3.0 book ID → preferred display abbreviation for this translation; when present, `formatRef` uses these abbreviations instead of the built-in defaults while this translation is active
- `allowedAbbreviations` — optional map of USFM 3.0 book ID → array of recognized input strings; when present, these are merged into the active abbreviation map (extends built-in defaults; does not replace them)
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
to `"Verš nenalezen"` until a valid translation is loaded.

#### Migration

`translations/cep.json` is updated to format version 1 as part of the 0.3 release.
The loader continues to read legacy files indefinitely, so user-dropped translations in the old format remain functional.

### Book Abbreviation Configuration

#### Goal

Allow users to define custom book abbreviations that supplement or override the built-in defaults.

Features:

- Settings include a `Custom abbreviations` field where the user maps input strings to USFM 3.0 book IDs.
  Example: `Jr, Jer, Jeremiáš → JER`
- Custom abbreviations are merged with built-in defaults; custom entries win on conflict.
- The parser regex is compiled from the active merged map at plugin startup.
- Reference detection and hover previews respect the active abbreviation set.

#### Constraints

- Built-in abbreviations remain as the default; the user does not need to redefine them.
- Abbreviation keys are validated to prevent broken regex patterns.
- Parser performance is unaffected: regex is compiled once, not on every keystroke.

### Translation Source Management

#### Goal

Allow the user to discover and download Bible translations from a curated catalog of known HTTP providers, and manage downloaded translations from the settings UI.

#### Features

- Plugin contains a built-in **source catalog**: a static list of known HTTP providers, each with a display name, base URL, adapter type, and list of available translations (language, name, remote identifier).
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

- The remote catalog URL is a hardcoded constant pointing to the BibLens GitHub repository. It is not user-configurable.
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

---

## Architecture Principles

- Separate reference parsing from UI logic.
- Separate data provider from UI layer.
- Keep parsing logic deterministic and unit-testable.
- All new features must update TESTPLAN.md.
