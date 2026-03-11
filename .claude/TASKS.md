# BibLens – Task Index

## Global Definition of Done

Each task defines its own acceptance criteria above these:

1. `npm run check` passes
2. `npm run ci` passes
3. All tests green
4. Plugin builds successfully

Both the task's own DoD and this global DoD must pass before a task is marked Done.

---

## Tasks (newest first)

| #  | Title | Status | File |
|----|-------|--------|------|
| 58 | Insert book abbreviation command | Next | [T058](Tasks/T058.md) |
| 57 | Multi-translation insert commands | Next | [T057](Tasks/T057.md) |
| 56 | Multi-translation verse DOM | Next | [T056](Tasks/T056.md) |
| 55 | Multi-translation data loading | Done | [T055](Tasks/T055.md) |
| 54 | Translation priority/abbreviation: settings UI | Done | [T054](Tasks/T054.md) |
| 53 | Translation priority/abbreviation: settings data model | Done | [T053](Tasks/T053.md) |
| 52 | Implement Beblia listAvailable via GitHub Contents API | Done | [T052](Tasks/T052.md) |
| 51 | Fix Load button: tooltip, biblens-data result display, layout | Done | [T051](Tasks/T051.md) |
| 50 | Fix write-once flag for bundled starter packs | Done | [T050](Tasks/T050.md) |
| 49 | Remove Advanced (Catalog Management) section from Settings | Done | [T049](Tasks/T049.md) |
| 48 | Settings panel heading and spacing conventions | Done | [T048](Tasks/T048.md) |
| 47 | CM6 StateField/StateEffect live scanner propagation | Done | [T047](Tasks/T047.md) |
| 46 | Settings UI: "Load" button for live provider item discovery | Done | [T046](Tasks/T046.md) |
| 45 | Adapter listAvailable interface extension and biblens-data implementation | Done | [T045](Tasks/T045.md) |
| 44 | Remove built-in fallback constants BUILT_IN_FORMAT_RULES and getBuiltInAbbreviationMap | Done | [T044](Tasks/T044.md) |
| 43 | Bundle WEB English translation on first install | Done | [T043](Tasks/T043.md) |
| 42 | Bundle English language pack and reference format pack on first install | Done | [T042](Tasks/T042.md) |
| 41 | Verse label refinement and chapter-boundary markers in hover display | Done | [T041](Tasks/T041.md) |
| 40 | Fix `formatRef` no-arg fallback; remove `BOOK_DISPLAY` and `getDisplayAbbr` | Done | [T040](Tasks/T040.md) |
| 39 | Refactor `buildRefScanner`: alias alternation and per-mode regex | Done | [T039](Tasks/T039.md) |
| 38 | Settings General Section Redesign | Done | [T038](Tasks/T038.md) |
| 37 | Hover: Scrollable Content and Text Selection | Done | [T037](Tasks/T037.md) |
| 36 | Two Insert Commands | Done | [T036](Tasks/T036.md) |
| 35 | Default Parsing Rules Changed to Extended | Done | [T035](Tasks/T035.md) |
| 34 | Fix openbibleinfo Language Pack Adapter: Include Canonical Abbreviations as Recognition Aliases | Done | [T034](Tasks/T034.md) |
| 33 | Remove Preferred Language and Standard Reference Format Dropdowns from General Settings | Done | [T033](Tasks/T033.md) |
| 32 | Refresh Editor Views After Scanner Reload | Done | [T032](Tasks/T032.md) |
| 31 | Replace `buildAbbreviationMap` with `getBuiltInAbbreviationMap` | Done | [T031](Tasks/T031.md) |
| 30 | Fix `biblens-data` Repository URL and Path References | Done | [T030](Tasks/T030.md) |
| 29 | Settings UI Reorganisation | Done | [T029](Tasks/T029.md) |
| 28 | Open Plugin Settings Command | Done | [T028](Tasks/T028.md) |
| 27 | Static Czech Protestant Reference Format Pack | Done | [T027](Tasks/T027.md) |
| 26 | openbibleinfo Reference Format Pack Adapter | Done | [T026](Tasks/T026.md) |
| 25 | openbibleinfo Language Pack Adapter | Done | [T025](Tasks/T025.md) |
| 24 | Settings UI and main.ts Wiring | Done | [T024](Tasks/T024.md) |
| 23 | buildRefScanner: Format Rules and Parsing Mode | Done | [T023](Tasks/T023.md) |
| 22 | Reference Format Loader and Registry | Done | [T022](Tasks/T022.md) |
| 21 | Language Pack Loader and Registry | Done | [T021](Tasks/T021.md) |
| 20 | OSIS→USFM Mapping | Done | [T020](Tasks/T020.md) |
| 19 | Settings UI Restructure | Done | [T019](Tasks/T019.md) |
| 18 | Initial Source Catalog: 2+ Czech Bible Translation Providers | Done | [T018](Tasks/T018.md) |
| 17 | Translation Source Management UI | Done | [T017](Tasks/T017.md) |
| 16 | Translation File Format v1: Versioned Loader and cep.json Migration | Done | [T016](Tasks/T016.md) |
| 15 | Exclude Blockquote Lines from Reference Detection | Done | [T015](Tasks/T015.md) |
| 14 | Insert Verse After Last Reference in Note (format fix) | Done | [T014](Tasks/T014.md) |
| 13 | Copy Verse Text to Clipboard | Next | [T013](Tasks/T013.md) |
| 9  | Translation Selection in Settings | Done | [T009](Tasks/T009.md) |
| 8  | Plugin Settings Foundation | Done | [T008](Tasks/T008.md) |
| 7  | Display Bible Text in Popovers | Done | [T007](Tasks/T007.md) |
| 6  | Bible Text Data Provider | Done | [T006](Tasks/T006.md) |
| 5  | Editor Tooltip | Done | [T005](Tasks/T005.md) |
| 4  | Editor (Live Preview): Detect References with CodeMirror Decorations | Done | [T004](Tasks/T004.md) |
| 3  | Reading View Hover Detection | Done | [T003](Tasks/T003.md) |
| 2  | Create Reference Parser (Czech MVP) | Done | [T002](Tasks/T002.md) |
| 1  | Remove Sample Logic & Add Diagnostics Command | Done | [T001](Tasks/T001.md) |

---

## Future Ideas

- Parallel text support
- Morphology
- Configurable abbreviation systems
- Migrate `BOOK_ALIASES` from `books.ts` to a bundled Czech language pack (`recognition-languages/cs.json`); refactor `scanRefs`/`parseCzechBibleRef` to use `buildRefScanner` internally; remove `BOOK_ALIASES` and `resolveBookId()` from `books.ts`
