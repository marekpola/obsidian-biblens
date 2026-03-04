# CLAUDE.md

This file provides persistent context and workflow rules for Claude when working in the BibLens repository.

Claude should always read and follow:

- SPEC.md — project specification and MVP boundaries
- TASKS.md — active task and Definition of Done
- TESTPLAN.md — manual test steps and test cases
- AGENTS.md — coding conventions and Obsidian plugin rules
- ARCHITECTURE.md — module structure, types, and boundaries
- DECISIONS.md — recorded design decisions (do not contradict without a new decision)

---

# Project Overview

BibLens is an Obsidian plugin that provides instant Bible passage previews when hovering over references.

The project is currently in **MVP phase**. MVP goal: detect references and display a hover preview.

See SPEC.md for full specification and reference format details.

---

# Development Workflow

Development is organized through TASKS.md.

Structure:

Active → task currently being implemented
Next → upcoming tasks
Done → completed tasks

Claude should always work on the **Active task** unless instructed otherwise.

---

# Agent Roles

Claude may operate in different roles.

## Implementer

Responsible for implementing tasks.

Process:

1. Read TASKS.md (Active task + DoD)
2. Read ARCHITECTURE.md and DECISIONS.md
3. Implement the minimal solution
4. Keep changes small and isolated
5. Run build if possible
6. Show `git diff`
7. Provide manual test steps from TESTPLAN.md

Rules:

- Do not refactor unrelated code
- Do not change project architecture without a new DECISIONS.md entry
- Respect AGENTS.md and ARCHITECTURE.md boundaries

---

## Reviewer

Responsible for reviewing code changes.

Check:

- compliance with SPEC.md
- compliance with AGENTS.md
- compliance with ARCHITECTURE.md (module boundaries, type shapes)
- compliance with DECISIONS.md (no silent overrides)
- mobile compatibility
- minimal scope
- clarity of code

Output format:

1. Blockers
2. Major issues
3. Minor issues
4. Approval decision

---

## Tester

Responsible for validating behavior.

Follow TESTPLAN.md.

Verify:

- build passes
- plugin loads in Obsidian
- commands behave correctly
- console contains no new errors

Output:

- test results
- reproduction steps for failures

---

## Orchestrator

Responsible for development coordination.

Responsibilities:

- choose next task
- ensure only one task is active
- move completed tasks to Done
- coordinate Implementer → Reviewer → Tester cycle

---

# Important Notes for Claude

- Do not expand project scope beyond SPEC.md.
- Prefer minimal changes over architectural redesign.
- When uncertain, ask before making large changes.
- Always show `git diff` before committing changes.
- Parsing produces `bookId` in OSIS format (e.g. "MAT", "GEN", "ISA"), not the raw input abbreviation. See D006 in DECISIONS.md and `src/types.ts`.

## Development workflow: AI-agent assisted with controlled documents
Decision: Use control documents (CLAUDE.md, SPEC.md, TASKS.md, TESTPLAN.md, AGENTS.md, ARCHITECTURE.md, DECISIONS.md) as the primary source of truth for agents.
Reason: reduces prompt length, limits scope creep, and improves reproducibility of agent work.
Consequences:
- Tasks must have DoD and be implementable without additional clarification.
- Agents should be instructed to read these documents before modifying code.
Revisit: if documents become redundant or too heavy; simplify instead of expanding.
