# BibLens – Task Backlog

# Structure

Active → task currently being implemented  
Next → upcoming tasks  
Done → completed tasks (also in file TASKS_done.md)

This file defines the active development tasks.
Each task must include a clear Definition of Done (DoD).

# Definition of Done

Each task defines its own acceptance criteria above those: 

1. npm run check passes
2. npm run ci passes
3. All tests green
4. Plugin builds successfully

Both the task's own DoD and this global DoD must pass before a task is marked Done.

---
# Tasks

## Active

---

## Next



---

## Future

### Task 13 – Copy Verse Text to Clipboard
Issue: #2

#### Goal
Add a copy button to the hover popover and editor tooltip that copies the full formatted verse text to the clipboard.

#### Scope
- `src/ui/verseDOM.ts`: implement `buildVerseDOM` `copyButton` option — when `true`, append a `<button>` that calls `navigator.clipboard.writeText(formatVerseText(entries))`
- `src/ui/verseDOM.ts`: implement `formatVerseText(entries: VerseEntry[]): string` — join entries as `<label> <text>` separated by single space
- `src/ui/hover.ts` and `src/editor/refTooltip.ts`: pass `{ copyButton: true }` when calling `buildVerseDOM`
- No Obsidian imports — `navigator.clipboard` is Web API; mobile-compatible

#### Definition of Done
- Copy button appears in both Reading View popover and editor tooltip
- Clicking the button copies plain-text verse content to clipboard
- `src/ui/verseDOM.ts` has no Obsidian imports
- `npm run check` and `npm run ci` pass

---

- Parallel text support
- Morphology
- Configurable abbreviation systems

---
## Done
