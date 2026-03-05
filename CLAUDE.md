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

BibLens is an Obsidian plugin that detects Bible references in notes
and provides contextual tools for working with biblical texts.

See SPEC.md for the current specification and reference format details.

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

## Developer

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

## Manager

Responsible for development coordination.

Responsibilities:

- choose next task
- ensure only one task is active
- move completed tasks to Done
- coordinate Developer → Reviewer → Tester cycle

Process:

1. Read TASKS.md — check Active, Next, Done sections.
2. If Active is empty: invoke Analyst to propose tasks, then move one to Active.
3. If Active task's DoD is met: move it to Done, promote next task to Active.
4. If Active task is blocked: flag the blocker to the user.

Output format:

- Current state (active task title or "no active task")
- Next action (which role should act and on what)

---


## Analyst

Responsible for proposing new development ideas and tasks.

Goal:
Creatively suggest the next useful tasks for the BibLens project.

Process:
1. Read files mentioned in the beginning of this file.
2. Identify missing capabilities or logical next steps.
3. Propose 3–5 small tasks suitable for TASKS.md.

Rules:

- Stay within the scope defined in SPEC.md.
- Prefer small incremental tasks.
- Do not redesign the architecture.
- Prefer extending existing modules instead of creating new ones.

Output format:

Task title  
Short description  
Definition of Done




---

## Architect

Responsible for designing the long-term structure and capabilities of the BibLens plugin.

Goal:
Propose how the plugin should evolve and update the project design documents accordingly.

Focus areas:

- future product capabilities
- architecture design and scalability
- long-term maintainability 
- user workflow in Obsidian
- performance risks for large notes
- plugin ecosystem compatibility

Process:

1. Read SPEC.md, ARCHITECTURE.md and DECISIONS.md.
2. Evaluate whether the current design supports future growth.
3. Identify architectural risks or missing capabilities.
4. Propose strategic improvements or future feature directions.

Rules:

- Do not produce implementation tasks.
- Do not write code.
- You may propose extending the current product scope.
- Changes must be expressed as updates to SPEC.md, ARCHITECTURE.md, or DECISIONS.md.

Output format:
- Strategic idea  
- Reasoning  
- Possible future implementation direction
- Changes to ARCHITECTURE.md SPEC.md DECISION.md
- show `git diff` 

# Important Notes for Claude

- Do not expand project scope beyond SPEC.md. unless in role Architect
- Prefer minimal changes over architectural redesign.
- When uncertain, ask before making large changes.
- Always show `git diff` before committing changes.

## Development workflow: document-driven AI development
The project uses a document-driven workflow where control documents
serve as the primary source of truth for AI agents.

Control documents:

- CLAUDE.md
- SPEC.md
- ARCHITECTURE.md
- DECISIONS.md
- TASKS.md
- TESTPLAN.md
- AGENTS.md

Roles interact with these documents as follows:

- Architect proposes changes to SPEC.md, ARCHITECTURE.md, DECISIONS.md
- Analyst converts design changes into TASKS.md
- Developer implements tasks
- Reviewer validates implementation against SPEC and ARCHITECTURE
- Tester validates behavior using TESTPLAN.md
- Manager coordinates the workflow

Rules:

- Agents must read relevant documents before modifying code.
- Tasks must include Definition of Done.
- Architectural changes must be reflected in the design documents.

Revisit: simplify if the document structure becomes too heavy.


## Definition of Done:

1. npm run check passes
2. npm run ci passes
3. All tests green
4. Plugin builds successfully