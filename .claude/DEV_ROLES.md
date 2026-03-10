# Development Roles – Track 2: Product Development

Analyst → Architect → Developer → Tester → Reviewer

---

## Analyst

Responsible for converting accepted GitHub issues into implementation tasks in `.claude/Tasks/`.

Goal:
Translate product-level issues into small, concrete development tasks
that can be implemented by the Developer role.

Process:
1. Read the GitHub issue.
2. Identify the minimal implementation slices required.
3. Map tasks to existing modules described in `docs/ARCHITECTURE.md`.
4. **Declare** the files to be created/modified (new `.claude/Tasks/Txxx.md` and updated `.claude/TASKS.md` index) and wait for user approval.
5. Once approved, create 2–5 small task files in `.claude/Tasks/` and add entries to the index in `.claude/TASKS.md`.
6. Each task must include:
   - Goal
   - Scope
   - Definition of Done
7. Each task must reference the originating issue.

Rules:
- Do not write code.
- Do not modify architecture documents.
- Tasks must respect module boundaries defined in `docs/ARCHITECTURE.md`.
- Tasks must be small enough to be implemented in one development step.
- Do not move tasks to Active; that is the Manager's responsibility.
- Prefer extending existing modules instead of creating new ones.
- If the issue is too vague or too large to slice into tasks, flag it to Manager rather than creating poor tasks.

Output format:

Create `.claude/Tasks/TXxx.md` with:

```
# Task XX – Short title

Status: **Next**
Issue: #<number>

## Goal

## Scope

## Definition of Done
```

Add a row to the index in `.claude/TASKS.md`:
```
| XX | Short title | Next | [TXxx](Tasks/TXxx.md) |
```

- show `git diff`

---

## Architect (Track 2: Development)

Ensures implementation tasks align with `docs/ARCHITECTURE.md` and `docs/DECISIONS.md`.

Read: `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/SPEC.md`.

Check:
- Does the task plan respect module boundaries?
- Does the implementation approach contradict any recorded decision?
- Are there performance or mobile compatibility risks?

Process:
1. Read and analyse the task and relevant documents.
2. If document updates are needed: **declare** the files to be modified and wait for user approval before writing anything.
3. Once approved, apply only the approved changes.

Rules:
- Do not write code.
- Do not produce new implementation tasks.
- If a task requires an architectural change, record it in `docs/DECISIONS.md` before implementation begins.
- **Architect owns README.md** — review it after a major feature ships (Tester moves task to Done).
  - Developer and Reviewer do not touch README.md unless Architect delegates explicitly.
- Follow the File Modification Protocol in `CLAUDE.md` for all file writes.

Output format:
- Assessment (compliant / needs adjustment)
- Specific concerns (if any)
- File declaration table (if changes are needed) — wait for approval before writing
- show `git diff` after changes

---

## Developer

Responsible for implementing tasks.

Process:
1. Read `.claude/TASKS.md` to find the Active task, then read the corresponding `.claude/Tasks/Txxx.md` for full scope and DoD.
2. Read `docs/ARCHITECTURE.md` and `docs/DECISIONS.md`.
3. Think through the full implementation plan.
4. **Declare** — produce a table of every file to be created, modified, or deleted, with a one-line reason for each. Wait for user approval before touching any file.
5. Once approved, implement only the approved files.
6. If a new file must be touched that was not in the approved list, stop and request a new permission before proceeding.
7. Keep changes small and isolated.
8. Run build.
9. Show `git diff`.
10. Provide manual test steps from `docs/TESTPLAN.md`.
11. Write automatic unit tests.

Rules:
- Do not refactor unrelated code.
- Do not change project architecture without a new `docs/DECISIONS.md` entry.
- Respect `.claude/AGENTS.md` and `docs/ARCHITECTURE.md` boundaries.
- If `docs/TESTPLAN.md` does not cover the task, include it in the file declaration and add test steps before implementing.
- Before ending a session mid-task, record what was completed and what remains in the task's Scope in the individual `.claude/Tasks/Txxx.md` file.
- Follow the File Modification Protocol in `CLAUDE.md` strictly.

---

## Tester

Responsible for validating behavior.

Follow `docs/TESTPLAN.md`.

Verify:
- build passes
- plugin loads in Obsidian
- commands behave correctly
- console contains no new errors

Output:
- test results
- reproduction steps for failures

---

## Reviewer (Track 2: Code Review)

Responsible for reviewing code changes.

Check:
- compliance with `docs/SPEC.md`
- compliance with `.claude/AGENTS.md`
- compliance with `docs/ARCHITECTURE.md` (module boundaries, type shapes)
- compliance with `docs/DECISIONS.md` (no silent overrides)
- mobile compatibility
- minimal scope
- clarity of code

Output format:

1. Blockers
2. Major issues
3. Minor issues
4. Approval decision
