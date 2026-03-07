# BibLens

An [Obsidian](https://obsidian.md) plugin that detects Bible references in your notes
and displays the verse text as a hover preview — in both Reading View and the editor.

Designed for academic and research workflows. Works fully offline. No external services required.

---

## Features

### Reference Detection

BibLens recognises Bible references written in Czech notation directly in your note text:

- `Mt 1,3` — single verse
- `Gn 22,1-19` — verse range
- `Iz 11` — whole chapter

References are underlined in the editor and trigger a tooltip on hover.
In Reading View, hovering a reference opens a popover with the verse text.

### Hover Preview

- **Reading View:** a popover appears above the reference with formatted verse text.
- **Editor (Live Preview):** a CodeMirror tooltip shows the same content on hover.

Each verse entry is displayed as a superscript label followed by the verse text.
Unknown references show *Verš nenalezen*.

A **copy button** in the popover/tooltip copies the full verse text to the clipboard.

### Insert Verse Text

Two commands are available in the command palette:

- **BibLens: Insert verse text after previous reference** — scans the document and inserts
  text after the last detected reference before the cursor position.

Insertion format is configurable: **Inline** (appended on the same line) or **Blockquote**
(inserted on the next line as `> Reference verse text`).

Blockquote lines are excluded from reference detection, so inserted quotations are not
re-decorated.

### Multiple Translations

Select the active translation from **Settings → BibLens → Preferred translation**.
The plugin reads all `.json` translation files from the `translations/` folder in the
plugin directory. Changing the selection takes effect immediately without restarting Obsidian.

### Translation Source Management

Download Bible translations directly from within the plugin settings:

1. Open **Settings → BibLens → Translation Sources**.
2. Select a provider from the list.
3. Browse available translations and click **Download**.

Downloaded translations are saved to `translations/` and appear in the **Preferred translation**
dropdown immediately.

To remove a translation, use the **Installed Translations** panel and click **Delete**.

The provider catalog is bundled with the plugin. You can refresh it independently:

- Click **Update catalog** in settings to fetch the latest provider list from GitHub.
- Enable **Auto-update on startup** to refresh automatically when the cached catalog is stale
  (disabled by default — no background network activity without opt-in).


---

## Requirements

- Obsidian desktop or mobile
- No internet connection required for core functionality (translations must be on disk)
- No external services or backends

---

## Installation

### From the Community Plugin List

1. Open **Settings → Community plugins → Browse**.
2. Search for **BibLens**.
3. Click **Install**, then **Enable**.

### Manual Installation

1. Download `main.js`, `styles.css`, and `manifest.json` from the latest release.
2. Copy them to `<your vault>/.obsidian/plugins/biblens/`.
3. Download `translations/cep.json` from the release and place it in
   `<your vault>/.obsidian/plugins/biblens/translations/`.
4. Enable the plugin in **Settings → Community plugins**.

---

## Adding Translations

BibLens ships with the **Czech CEP** translation. You can add others in two ways:

**Download from the catalog (recommended):**
Open **Settings → BibLens → Translation Sources** and download a translation from a listed provider.

**Drop a file manually:**
Copy a compatible `.json` translation file into the `translations/` folder in the plugin directory,
then reload the plugin (or toggle it off and on).

### Translation File Format

Translation files must be valid JSON with the following structure (format version 1):

```json
{
  "id": "bible21",
  "name": "Bible21",
  "lang": "cs",
  "source": "optional attribution text",
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
    "GEN 1:2": "Země pak byla pustá a prázdná…"
  }
}
```

**Required fields:** `id`, `name`, `lang`, `formatVersion`, `verses`
**Optional fields:** `source`, `canonicalAbbreviations`, `allowedAbbreviations`

Verse keys use the format `USFM_BOOK CHAPTER:VERSE` (e.g. `GEN 1:1`, `MAT 28:19`).
Book identifiers follow the [USFM 3.0 standard](https://ubsicap.github.io/usfm/usfm3.0/identification/books.html).

Legacy flat-format files (plain `Record<string, string>` with dot-separated keys) continue
to load without modification.

---

## Settings Reference

| Setting | Description |
|---|---|
| Preferred translation | Active translation used in hover previews and verse insertion |
| Verse insertion format | Inline or Blockquote |
| Custom abbreviations | Additional book abbreviation → USFM ID mappings |
| Translation Sources | Browse providers and download translations |
| Installed Translations | Manage locally downloaded translations |
| Auto-update catalog on startup | Silently refresh the provider catalog when stale (opt-in) |
| Last catalog update | Timestamp of the most recent successful catalog refresh |

---

## Changelog

### 0.3.0

- **New translation file format (v1):** versioned, self-describing JSON with metadata,
  canonical display abbreviations, and allowed input abbreviations per translation.
  `cep.json` migrated to v1. Legacy files continue to load.
- **Translation Source Management:** download translations from a curated catalog of
  HTTP providers. Delete installed translations from the settings UI.
- **Catalog update:** refresh the provider catalog from GitHub without a plugin update.
  Manual button + opt-in auto-update on startup.
- **Custom abbreviations:** define additional book abbreviations in settings.

### 0.2.0

- Multiple locally installed translations with a settings dropdown.
- Insert verse text command (inline and blockquote formats).
- Insert verse after last detected reference before cursor.
- Blockquote lines excluded from reference detection.
- Copy-to-clipboard button in hover previews and tooltips.

### 0.1.0

- Initial release.
- Czech Bible reference detection (`Mt 1,3`, `Gn 22,1-19`, `Iz 11`).
- Hover popover in Reading View with CEP verse text.
- Reference underline decorations in editor (Live Preview).
- Editor tooltip on hover.

---

## Privacy

BibLens makes no network requests by default. The Translation Sources feature and catalog
update use network access only when you explicitly click **Download** or **Update catalog**,
or when you enable the auto-update toggle. No data about your notes is ever transmitted.

---

## License

MIT
