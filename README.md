# BibLens

An [Obsidian](https://obsidian.md) plugin that detects Bible references in your notes and shows the verse text as a hover preview — in the editor and in Reading View.

Works fully offline. No external services required.

---

<video src="docs/demo_1.mp4" width="900" controls></video>

---

## Features

**Reference detection** — BibLens recognises Bible references directly in your note text, e.g. `Gen 1:3`, `Genesis 22:1-19`, `Isa 11`. References are underlined; hovering shows a tooltip or popover with the verse text and a copy button.

**Multiple translations** — select the active translation in settings; switch without restarting.

**Insert verse text** — command palette command inserts the verse text of the nearest reference before the cursor, in inline or blockquote format.

**Language & format packs** — download recognition language packs (book names for a given language) and reference format packs (notation rules, e.g. English, Czech Protestant, Czech Catholic) from within settings. Any combination can be active simultaneously. You can also author your own packs and drop them directly into the plugin folder.

**Parsing modes** — *Strict* matches only canonical notation; *Extended* accepts aliases and separator variants.

---

## Translations

Bible translations are **not bundled** with the plugin. You download only what you need:

- Use **Settings → BibLens → Installed translations → Install new** to browse and download from the built-in catalog of providers.
- Drop a compatible `.json` file directly into the `translations/` folder in the plugin directory.

The catalog can be refreshed in **Advanced → Update catalog**. Auto-update on startup is available as an opt-in toggle.

Multiple providers are supported. Once a translation is on disk the plugin operates fully offline.

---

## Language and Format Packs

Recognition language packs (book names) and reference format packs (notation rules) are managed the same way as translations — download from the catalog or drop files manually:

- `recognition-languages/` — one file per language
- `reference-formats/` — one file per notation style

You can author your own packs in the JSON format defined in the [Translation File Format](#translation-file-format) section below, using the same approach for pack files. Manually placed files appear in the installed list the next time the settings tab is opened.

---

## Requirements

- Obsidian desktop or mobile
- No internet connection required for core features (translations and packs must be on disk)

---

## Installation

### From the Community Plugin List

1. **Settings → Community plugins → Browse**
2. Search for **BibLens**, click **Install**, then **Enable**.

### Manual

1. Download `main.js`, `styles.css`, and `manifest.json` from the latest release.
2. Copy to `<vault>/.obsidian/plugins/biblens/`.
3. Enable in **Settings → Community plugins**.
4. Download at least one translation from **Settings → BibLens → Installed translations**.

---

## Translation File Format

Translation files are versioned JSON:

```json
{
  "id": "web",
  "name": "World English Bible",
  "lang": "en",
  "formatVersion": 1,
  "verses": {
    "GEN 1:1": "In the beginning, God created the heavens and the earth."
  }
}
```

Required: `id`, `name`, `lang`, `formatVersion`, `verses`. Legacy flat-format files also load.

Verse keys use USFM 3.0 identifiers: `BOOK CHAPTER:VERSE` (e.g. `GEN 1:1`, `MAT 28:19`).

---

## Settings Reference

| Setting | Description |
|---|---|
| Translation | Active translation (read-only status row) |
| Reference format | Active format pack (read-only status row) |
| Recognition language | Active language pack (read-only status row) |
| Parsing rules | Strict / Extended |
| Verse insertion format | Inline or Blockquote |
| Installed translations | Manage and download translations |
| Reference formats | Manage and download format packs |
| Recognition languages | Manage and download language packs |
| Advanced | Catalog update and auto-update toggle |

---

## Roadmap

Planned for future versions:

- Working with multiple translation languages simultaneously
- Support for Hebrew and Greek source texts
- Morphological analysis

---

## Changelog

### 0.4.0

- **Recognition language packs** — downloadable book-name definitions per language.
- **Reference format packs** — downloadable notation rules (e.g. English, Czech Protestant, Czech Catholic). Own packs can be authored and dropped manually.
- **Parsing modes** — Strict (canonical only) or Extended (aliases and separator variants).
- Built-in English fallback; no download required for basic English use.
- Restructured settings tab.

### 0.3.0

- Translation file format v1 (versioned, self-describing JSON).
- Translation Source Management: download from a curated catalog; delete installed translations.
- Catalog update from GitHub (manual + opt-in auto-update).
- Custom abbreviations in settings.

### 0.2.0

- Multiple translations with settings dropdown.
- Insert verse text command (inline and blockquote).
- Copy-to-clipboard button.

### 0.1.0

- Initial release: Czech reference detection, hover popover, editor underline decoration.

---

## Privacy

BibLens makes no network requests by default. Download and catalog update use network access only on explicit user action or when the opt-in auto-update toggle is enabled. No note content is ever transmitted.

---

## License

MIT
