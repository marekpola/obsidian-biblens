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

## MVP (Version 0.1)

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

---

## Reference Format (MVP)

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

### Input abbreviation vs internal bookId

Input abbreviations (e.g. "Mt", "Gn", "Iz") are the user-facing notation in the note text.
Internally, the parser maps each abbreviation to a canonical `bookId` in OSIS format (e.g. "MAT", "GEN", "ISA") before storing it in `BibleRef`.
OSIS identifiers are uppercase, 3-character (or longer) ASCII strings defined by the OSIS Bible standard.
This separation allows multiple abbreviation systems to map to the same internal identifier in future versions.

---

## Non-Goals (MVP)

- No cloud services
- No text-fabric backend
- No morphology
- No multi-language UI
- No advanced reference parsing
- No cross-book range parsing

---

## Version 0.2 – Translation Management

### Goal

Allow the user to work with multiple Bible translations stored locally.

Features:

- Plugin settings include a `Preferred translation` selector listing all files found in `translations/`.
- User can add a translation by dropping a JSON file into `translations/` and reloading the plugin.
- Plugin can download a translation file from a URL directly into `translations/` using Obsidian's
  `requestUrl` API (mobile-compatible; no Node runtime required).
- Changing the preferred translation reloads the active translation data without a plugin restart.

Constraints:

- All translation files must follow the same key format as `cep.json` (`${bookId}.${chapter}.${verse}`).
- No external services are contacted at startup — download is an explicit user action.
- Offline operation is preserved; the preferred translation must already be on disk.

---

## Version 0.2 – Book Abbreviation Configuration

### Goal

Allow users to define custom book abbreviations that supplement or override the built-in Czech defaults.

Features:

- Settings include a `Custom abbreviations` field where the user maps input strings to OSIS book IDs.
  Example: `Jr, Jer, Jeremiáš → JER`
- Custom abbreviations are merged with built-in defaults; custom entries win on conflict.
- The parser regex is compiled from the active merged map at plugin startup.
- Reference detection and hover previews respect the active abbreviation set.

Constraints:

- Built-in abbreviations remain as the default; the user does not need to redefine them.
- Abbreviation keys are validated to prevent broken regex patterns.
- Parser performance is unaffected: regex is compiled once, not on every keystroke.

---

## Version 0.2 – Insert Verse Text Command

### Goal

Allow the user to insert the text of a detected Bible reference directly into the editor.

Features:

- Command `Insert verse text` available in the Obsidian command palette.
- When the cursor is positioned on a detected reference, the command fetches the verse(s) and
  inserts the text into the editor.
- Default insertion format: append verse text on the same line, separated by ` `.
  Example: `Jr 1,1 Slova Jeremjáše, syna Chilkijášova…`
- Future option: insert as a blockquote on the next line.

Constraints:

- Command is a no-op if the cursor is not on a detected reference.
- Insertion uses a CM6 transaction (no `innerHTML`, no clipboard manipulation).
- Works in editing mode only (not Reading View).

---

## Version 0.3 – Translation Source Management

### Goal

Allow the user to discover and download Bible translations from a curated catalog of known HTTP providers, and manage downloaded translations from the settings UI.

### Features

- Plugin contains a built-in **source catalog**: a static list of known HTTP providers, each with a display name, base URL, adapter type, and list of available translations (language, name, remote identifier).
- The settings UI exposes a **Translation Sources** panel:
  - User selects a provider from the catalog.
  - User sees the list of translations available from that provider, with download status (downloaded / not downloaded).
  - Per-translation actions: **Download**, **Delete**, **Update** (= delete + re-download).
- On Download, BibLens:
  1. Fetches raw data from the provider using `requestUrl`.
  2. Transforms the raw response to the canonical `Record<string, string>` key format (`${OSIS_BOOK}.${chapter}.${verse}`) using a per-provider **adapter**.
  3. Writes the result to `translations/${id}.json`.
- Download status is derived from the `translations/` directory listing (no separate tracking file).
- A separate **Installed Translations** panel lists locally available translations with a Delete button.

### Catalog Update from GitHub

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

### Constraints

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