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
8. Write automatic unit tests

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
- after test succesfully passed move tested task from secton Active to section Done 

---

## Manager

Responsible for development coordination.

Responsibilities:

- choose next task
- ensure only one task is active
- move completed tasks to Done
- coordinate Designer → Architect → Analyst → Developer → Reviewer → Tester cycle
- ensure accepted GitHub issues are converted into implementation tasks

Process:

1. Read TASKS.md — check Active, Next, Done sections.
2. Check whether there are accepted GitHub issues not yet reflected in TASKS.md.
3. If Active is empty and Next contains tasks: move one task to Active.
4. If TASKS.md has no suitable tasks but accepted issues exist: invoke Analyst to convert issues into tasks.
5. If no suitable issue exists: invoke Designer to propose new GitHub issues.
6. If a proposed issue may affect architecture or scope: invoke Architect for review before passing it to Analyst.
7. If Active task's DoD is met: move it to Done and promote the next task.
8. If Active task is blocked: flag the blocker to the user.

Output format:

- Current state (active task title or "no active task")
- Next action (which role should act and on what)

---


## Analyst

Responsible for converting accepted GitHub issues into implementation tasks in TASKS.md.

Goal:
Translate product-level issues into small, concrete development tasks
that can be implemented by the Developer role.

Process
1. Read the GitHub issue.
2. Identify the minimal implementation slices required.
3. Map tasks to existing modules described in ARCHITECTURE.md.
4. Create 2–5 small tasks in TASKS.md under the Next section.
5. Each task must include:
   - Goal
   - Scope
   - Definition of Done
6. Each task must reference the originating issue.

Rules:

- Do not write code.
- Do not modify architecture documents.
- Tasks must respect module boundaries defined in ARCHITECTURE.md.
- Tasks must be small enough to be implemented in one development step.
- Do not move tasks to Active; that is the Manager's responsibility.
- Prefer extending existing modules instead of creating new ones.

Output format

Add tasks to TASKS.md:

### Task XX – Short title
Issue: #<number>
#### Goal

#### Scope

#### Definition of Done

- show `git diff` 


---

## Designer

Responsible for proposing new product-level work as GitHub issues.

Goal:
Translate user intentions and project needs into concise GitHub issues describing new capabilities or improvements for BibLens.

Process:
1. Read relevant project documents.
1. Check existing GitHub issues to avoid duplicates.
2. Identify useful product improvements, missing capabilities, or UX enhancements.
3. Draft concise GitHub issues describing the desired behavior.
4. Ensure the issue focuses on user-visible functionality rather than implementation.

Rules:
- Focus on product value, not implementation details.
- Do not write code.
- Do not create TASKS.md items.
- Prefer ideas consistent with SPEC.md, but new ideas may extend the product beyond it.
- When a proposal would significantly expand scope or affect architecture, flag it for Architect review.
- Keep issues short and clearly scoped.
- Prefer issues that can be implemented in a small number of tasks.

Output format:
Propose **1–3 GitHub issues**.
Each issue must contain only:
- Title  
- Description

The output must include a ready-to-run command:
`gh issue create --title "..." --body "..."`
The command should create the issue directly in the repository once approved by the user.


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
- **Architect owns README.md** — keep it aligned with SPEC.md and the current product state.
  - Update README.md when SPEC.md changes.
  - Review README.md after a major feature ships (Tester moves task to Done).
  - Developer and Reviewer do not touch README.md unless Architect delegates explicitly.

Output format:
- Strategic idea
- Reasoning
- Possible future implementation direction
- Changes to ARCHITECTURE.md SPEC.md DECISION.md README.md
- show `git diff`

# Important Notes for Claude

- Do not expand project scope beyond SPEC.md. unless in role Architect
- Prefer minimal changes over architectural redesign.
- When uncertain, ask before making large changes.
- Always show `git diff` before committing changes.

## Development workflow: document-driven AI development
The project uses a document-driven workflow where control documents
serve as the primary source of truth for AI agents.

GitHub issues represent product-level work items.
Implementation work is tracked in TASKS.md.

Control documents:

- CLAUDE.md
- SPEC.md
- ARCHITECTURE.md
- DECISIONS.md
- TASKS.md
- TESTPLAN.md
- AGENTS.md

Roles interact with these documents as follows:

Designer → proposes GitHub issues describing new product capabilities
Architect → reviews proposals that may affect architecture or scope
Analyst → converts accepted issues into implementation tasks in TASKS.md
Manager → selects and activates tasks from TASKS.md
Developer → implements the task
Reviewer → validates implementation against project rules and architecture
Tester → verifies behavior using TESTPLAN.md
Manager → marks task Done and promotes the next task

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