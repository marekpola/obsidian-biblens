# CLAUDE.md

This file provides persistent context and workflow rules for Claude when working in the BibLens repository.

Claude should always read and follow:

- SPEC.md
- TASKS.md
- TESTPLAN.md
- AGENTS.md

These documents define the project specification, development tasks, testing procedures, and engineering rules.

---

# Project Overview

BibLens is an Obsidian plugin that provides instant Bible passage previews when hovering over references.

Example references:

- Mt 1,3
- Gn 22,1-19
- Iz 11

Initial development focuses on Czech Bible notation.

The project is currently in **MVP phase**.

MVP goal:
detect references and display a hover preview.

---

# Key Constraints

All implementations must follow these constraints:

- Plugin must work on **desktop and mobile**.
- Avoid **Node-only runtime APIs**.
- No external services during MVP.
- Keep code **incremental and minimal**.
- Do not introduce unnecessary dependencies.

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

1. Read the Active task in TASKS.md
2. Implement the minimal solution
3. Keep changes small and isolated
4. Run build if possible
5. Show `git diff`
6. Provide manual test steps from TESTPLAN.md

Rules:

- Do not refactor unrelated code
- Do not change project architecture without reason
- Respect AGENTS.md

---

## Reviewer

Responsible for reviewing code changes.

Check:

- compliance with SPEC.md
- compliance with AGENTS.md
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

# Coding Guidelines

Use TypeScript.

General rules:

- prefer small modules
- avoid global state
- separate parsing logic from UI
- keep pure logic independent from Obsidian API

Example architecture:

src/
main.ts  
parser.ts  
types.ts  
settings.ts

Parser code must remain **independent from Obsidian** so it can be tested easily.

---

# Reference Parsing (MVP)

Supported formats:

- Mt 1,3
- Gn 22,1-19
- Iz 11

Normalized representation example:

Mt 1,3 → Mt 1:3


Parser must produce a structured object:


{
book: string,
chapterStart: number,
verseStart?: number,
chapterEnd?: number,
verseEnd?: number
}


---

# Important Notes for Claude

- Do not expand project scope beyond SPEC.md.
- Prefer minimal changes over architectural redesign.
- When uncertain, ask before making large changes.
- Always show `git diff` before committing changes.