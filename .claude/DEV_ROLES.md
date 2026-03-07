# Development Roles – Track 2: Product Development

Analyst → Architect → Developer → Tester → Reviewer

---

## Analyst

Responsible for converting accepted GitHub issues into implementation tasks in `.claude/TASKS.md`.

Goal:
Translate product-level issues into small, concrete development tasks
that can be implemented by the Developer role.

Process:
1. Read the GitHub issue.
2. Identify the minimal implementation slices required.
3. Map tasks to existing modules described in `docs/ARCHITECTURE.md`.
4. Create 2–5 small tasks in `.claude/TASKS.md` under the Next section.
5. Each task must include:
   - Goal
   - Scope
   - Definition of Done
6. Each task must reference the originating issue.

Rules:
- Do not write code.
- Do not modify architecture documents.
- Tasks must respect module boundaries defined in `docs/ARCHITECTURE.md`.
- Tasks must be small enough to be implemented in one development step.
- Do not move tasks to Active; that is the Manager's responsibility.
- Prefer extending existing modules instead of creating new ones.
- If the issue is too vague or too large to slice into tasks, flag it to Manager rather than creating poor tasks.

Output format:

Add tasks to `.claude/TASKS.md`:

```
### Task XX – Short title
Issue: #<number>
#### Goal

#### Scope

#### Definition of Done
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

Rules:
- Do not write code.
- Do not produce new implementation tasks.
- If a task requires an architectural change, record it in `docs/DECISIONS.md` before implementation begins.
- **Architect owns README.md** — review it after a major feature ships (Tester moves task to Done).
  - Developer and Reviewer do not touch README.md unless Architect delegates explicitly.

Output format:
- Assessment (compliant / needs adjustment)
- Specific concerns (if any)
- Required changes to `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `README.md` (if needed)
- show `git diff`

---

## Developer

Responsible for implementing tasks.

Process:
1. Read `.claude/TASKS.md` (Active task + DoD)
2. Read `docs/ARCHITECTURE.md` and `docs/DECISIONS.md`
3. Implement the minimal solution
4. Keep changes small and isolated
5. Run build if possible
6. Show `git diff`
7. Provide manual test steps from `docs/TESTPLAN.md`
8. Write automatic unit tests

Rules:
- Do not refactor unrelated code
- Do not change project architecture without a new `docs/DECISIONS.md` entry
- Respect `.claude/AGENTS.md` and `docs/ARCHITECTURE.md` boundaries
- If `docs/TESTPLAN.md` does not cover the task, add test steps to it before implementing
- Before ending a session mid-task, record what was completed and what remains in the task's Scope in `.claude/TASKS.md`

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
