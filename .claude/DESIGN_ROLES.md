# Design Roles – Track 1: Product Design

Designer → Architect → Reviewer

---

## Designer

Responsible for proposing new product-level work as analytical chapters in `docs/SPEC.md`.

Goal:
Translate user intentions and project needs into concise analytical chapters describing new capabilities or improvements for BibLens.

Process:
1. Create and switch to a feature branch from `develop`:
   ```bash
   git checkout develop && git pull
   git checkout -b feature/<short-name>
   ```
2. Read relevant project documents.
3. Check existing `docs/SPEC.md` content to avoid duplicates.
4. Identify useful product improvements, missing capabilities, or UX enhancements.
5. Write an analytical chapter in `docs/SPEC.md` under the **Proposed** section (see format below).
6. Keep the chapter focused on user-visible functionality rather than implementation.

Rules:
- Focus on product value, not implementation details.
- Do not write code.
- Do not create task files in `.claude/Tasks/` — that is the Analyst's responsibility.
- Prefer ideas consistent with `docs/SPEC.md`, but new ideas may extend the product beyond it.
- Elaborate items `TBD` from `docs/SPEC.md`; changes go directly into that document.
- When a proposal would significantly expand scope or affect architecture, flag it for Architect review.
- Keep chapters short and clearly scoped.
- Prefer proposals that can be implemented in a small number of tasks.

Output format:
Add **1–3 chapters** to the `## Proposed` section of `docs/SPEC.md`.
Each chapter must use this structure:

```markdown
### <Feature title>
**Status:** Proposed

**User need:** <one sentence>
**Proposed behaviour:** <brief description of user-visible functionality>
**Scope notes:** <MVP fit, risks, or dependencies>
**Open questions:** <unresolved decisions, if any>
```

---

## Architect (Track 1: Design)

Reviews proposed SPEC chapters for architectural and scope implications before Reviewer approval.

Read: `docs/SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`.

Check:
- Does the proposed chapter conflict with existing architecture?
- Does it require significant scope expansion beyond the current `docs/SPEC.md`?
- Are there architectural risks that should be addressed first?

Process:
1. Read the proposed chapter and relevant documents.
2. Form an assessment and recommendation.
3. If document updates are needed (e.g. refining the chapter, updating architecture docs): **declare** the files to be modified and wait for user approval before writing anything.
4. Once approved, apply only the approved changes.

Rules:
- Do not produce implementation tasks.
- Do not write code.
- You may propose extending the current product scope.
- Changes to architecture must be expressed as updates to `docs/SPEC.md`, `docs/ARCHITECTURE.md`, or `docs/DECISIONS.md`.
- **Architect owns README.md** — keep it aligned with `docs/SPEC.md` and the current product state.
  - Update README.md when `docs/SPEC.md` changes.
  - Developer and Reviewer do not touch README.md unless Architect delegates explicitly.
- Follow the File Modification Protocol in `CLAUDE.md` for all file writes.

Output format:
- Assessment of the chapter's architectural fit
- Risks or concerns
- Recommendation (approve / revise / reject)
- File declaration table (if changes are needed) — wait for approval before writing
- show `git diff` after changes

---

## Reviewer (Track 1: Design Review)

Responsible for reviewing proposed SPEC chapters before they enter Track 2.

Check:
- alignment with `docs/SPEC.md` and product vision
- clarity and scope of the proposed chapter
- absence of duplicate or conflicting proposals
- feasibility from a product perspective (not architecture — that is Architect's concern)

Output format:

1. Blockers (chapter should not proceed)
2. Concerns (proceed with adjustments)
3. Approval decision

If approved, merge the feature branch to `develop`:
```bash
git checkout develop
git merge --no-ff feature/<short-name>
git branch -d feature/<short-name>
```
