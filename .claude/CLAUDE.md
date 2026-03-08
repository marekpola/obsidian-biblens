# CLAUDE.md

Persistent project context and workflow rules for Claude when working in the BibLens repository.

Claude must read the relevant documents from the list below before performing work and follow them:

- `docs/SPEC.md` — project specification and MVP boundaries
- `.claude/TASKS.md` — active task tracking and task-specific Definition of Done
- `docs/TESTPLAN.md` — manual test steps and test cases
- `.claude/AGENTS.md` — coding conventions and Obsidian plugin rules
- `docs/ARCHITECTURE.md` — module structure, types, and boundaries
- `docs/DECISIONS.md` — recorded design decisions (do not contradict without a new decision)
- `docs/GIT_WORKFLOW.md` — repository branching and release rules

Role definitions:

- `.claude/DESIGN_ROLES.md`
- `.claude/DEV_ROLES.md`

---

# Project Overview

BibLens is an Obsidian plugin that detects Bible references in notes and provides contextual tools for biblical text study. See `docs/SPEC.md` for the specification.

---

# Roles and Track Processes

Track 1  
Designer → Architect → Reviewer

Track 2  
Analyst → Architect → Developer → Tester → Reviewer

# Tasks

`.claude/TASKS.md` structure:

Active → task currently being implemented  
Next → upcoming tasks  
Done → completed tasks

In Track 2, Claude should work on the Active task unless instructed otherwise.

---

## Manager

The Manager coordinates both tracks and maintains `.claude/TASKS.md`.
Ensures only one Active task exists and that accepted issues flow from Track 1 to Track 2.

### Track 1 process (Product Design)

Designer proposes issues → Architect reviews architecture → Reviewer approves.  
Approved issues are labelled `accepted` by the user.

### Track 2 process (Product Development)

Analyst converts accepted issues to tasks → Developer implements → Reviewer reviews → Tester validates → task moves to Done.

### Manager role output format

- Track 1 state (design pipeline status)
- Track 2 state (active task title or "no active task")
- Next action (which role should act and on what)

---

# File Modification Protocol

This protocol is mandatory for every agent that creates, edits, or deletes files.

**Steps — in strict order:**

1. **Think** — read all relevant documents and reason about what needs to be done. Do not touch any file yet.
2. **Declare** — produce a table listing every file the agent plans to create, modify, or delete, with a one-line reason for each.
3. **Wait for approval** — present the declaration to the user and stop. Do not modify any file until the user explicitly approves.
4. **Implement** — once approved, modify only the files that were approved. Work through them completely.
5. **New permission required** — if during implementation the agent discovers it must modify a file that was not in the approved list, stop immediately. Declare the additional file and reason, and wait for a new approval before proceeding.

An agent must never modify a file that has not been explicitly approved in the current permission grant.

Roles that do not write files are exempt from steps 2–5 but must still follow step 1.

---

# Rules

- Agents must read relevant documents before acting.
- Tasks must include Definition of Done.
- Architectural changes must be reflected in the design documents.
- Every agent that writes files must follow the File Modification Protocol above.