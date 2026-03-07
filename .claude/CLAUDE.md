# CLAUDE.md

This file provides persistent context and workflow rules for Claude when working in the BibLens repository.

Claude should always read and follow:

- `docs/SPEC.md` — project specification and MVP boundaries
- `.claude/TASKS.md` — active task and Definition of Done
- `docs/TESTPLAN.md` — manual test steps and test cases
- `.claude/AGENTS.md` — coding conventions and Obsidian plugin rules
- `docs/ARCHITECTURE.md` — module structure, types, and boundaries
- `docs/DECISIONS.md` — recorded design decisions (do not contradict without a new decision)

Role definitions:

- `.claude/DESIGN_ROLES.md` — Designer, Architect, Reviewer (Track 1: Product Design)
- `.claude/DEV_ROLES.md` — Analyst, Architect, Developer, Tester, Reviewer (Track 2: Product Development)

---

# Project Overview

BibLens is an Obsidian plugin that detects Bible references in notes
and provides contextual tools for working with biblical texts.

See `docs/SPEC.md` for the current specification and reference format details.

---

# Two-Track Workflow

Work is organized into two parallel tracks, each with its own sequence of roles.

## Track 1: Product Design

Designer → Architect → Reviewer

Produces accepted GitHub issues ready for implementation.

## Track 2: Product Development

Analyst → Architect → Developer → Tester → Reviewer

Produces implemented, tested, and reviewed features tracked in `.claude/TASKS.md`.

`.claude/TASKS.md` structure:

Active → task currently being implemented
Next → upcoming tasks
Done → completed tasks

Claude should always work on the **Active task** unless instructed otherwise.

**Manager** coordinates both tracks.

**Architect** and **Reviewer** participate in both tracks with different responsibilities in each.

---

# Agent Roles

| Role | Track | Responsibility |
|------|-------|----------------|
| Designer | 1 | Proposes GitHub issues |
| Architect | 1 + 2 | Reviews proposals; ensures architecture alignment |
| Reviewer | 1 + 2 | Design review; code review |
| Analyst | 2 | Converts issues into TASKS.md tasks |
| Developer | 2 | Implements tasks |
| Tester | 2 | Validates behavior |
| Manager | both | Coordinates both tracks (defined below) |

See `.claude/DESIGN_ROLES.md` and `.claude/DEV_ROLES.md` for full role definitions of all other roles.

---

## Manager

Responsible for coordinating both tracks.

Responsibilities:

- oversee Track 1 (Product Design) and Track 2 (Product Development) independently
- ensure only one task is active in Track 2
- move completed tasks to Done
- ensure accepted GitHub issues flow from Track 1 into Track 2

### Track 1 process (Product Design)

1. Check whether new product work is needed.
2. If yes: invoke Designer to propose GitHub issues.
3. Invoke Architect (design context) for all proposals that add new user-facing behaviour or touch existing modules.
4. Invoke Reviewer (design context) to approve or reject the proposal.
5. If approved: label the GitHub issue `accepted` — it is ready for Track 2.
6. If Analyst or Developer flags an issue as under-specified: return it to Designer for revision before re-entering Track 2.

### Track 2 process (Product Development)

An "accepted" issue means: a GitHub issue labelled `accepted`, or explicitly approved by the user in conversation.

1. Read `.claude/TASKS.md` — check Active, Next, Done sections.
2. Check whether there are accepted GitHub issues not yet reflected in `.claude/TASKS.md`.
3. If `.claude/TASKS.md` has no suitable tasks but accepted issues exist: invoke Analyst to convert issues into tasks.
4. For tasks that touch architecture boundaries, invoke Architect (development context) before moving to Active.
5. If Active is empty and Next contains tasks: move one task to Active.
6. If Active task's DoD is met: invoke Reviewer (code context).
   - If Reviewer approves: invoke Tester.
     - If Tester passes: mark task Done and promote next task.
     - If Tester fails: return task to Developer with reproduction steps.
   - If Reviewer rejects: return task to Developer with listed blockers.
7. If Active task is blocked: flag the blocker to the user.

Output format:

- Track 1 state (design pipeline status)
- Track 2 state (active task title or "no active task")
- Next action (which role should act and on what)

---

# Important Notes for Claude

- Do not expand project scope beyond `docs/SPEC.md` unless in role Architect.
- Prefer minimal changes over architectural redesign.
- When uncertain, ask before making large changes.
- Always show `git diff` before committing changes.

---

# Rules

- Agents must read relevant documents before acting.
- Tasks must include Definition of Done.
- Architectural changes must be reflected in the design documents.

---

# Definition of Done (Track 2)

Each task defines its own acceptance criteria in `.claude/TASKS.md`. The following is the minimum technical bar that must also pass for every task:

1. npm run check passes
2. npm run ci passes
3. All tests green
4. Plugin builds successfully

Both the task's own DoD and this global DoD must pass before a task is marked Done.
