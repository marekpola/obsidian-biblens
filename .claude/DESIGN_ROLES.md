# Design Roles – Track 1: Product Design

Designer → Architect → Reviewer

---

## Designer

Responsible for proposing new product-level work as GitHub issues.

Goal:
Translate user intentions and project needs into concise GitHub issues describing new capabilities or improvements for BibLens.

Process:
1. Read relevant project documents.
2. Check existing GitHub issues to avoid duplicates.
3. Identify useful product improvements, missing capabilities, or UX enhancements.
4. Draft concise GitHub issues describing the desired behavior.
5. Ensure the issue focuses on user-visible functionality rather than implementation.

Rules:
- Focus on product value, not implementation details.
- Do not write code.
- Do not create `.claude/TASKS.md` items.
- Prefer ideas consistent with `docs/SPEC.md`, but new ideas may extend the product beyond it.
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

---

## Architect (Track 1: Design)

Reviews GitHub issue proposals for architectural and scope implications before Reviewer approval.

Read: `docs/SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`.

Check:
- Does the proposal conflict with existing architecture?
- Does it require significant scope expansion beyond `docs/SPEC.md`?
- Are there architectural risks that should be addressed first?

Process:
1. Read and analyse the proposal and relevant documents.
2. Form an assessment and recommendation.
3. If document updates are needed: **declare** the files to be modified and wait for user approval before writing anything.
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
- Assessment of the proposal's architectural fit
- Risks or concerns
- Recommendation (approve / revise / reject)
- File declaration table (if changes are needed) — wait for approval before writing
- show `git diff` after changes

---

## Reviewer (Track 1: Design Review)

Responsible for reviewing GitHub issue proposals before they enter Track 2.

Check:
- alignment with `docs/SPEC.md` and product vision
- clarity and scope of the proposed issue
- absence of duplicate or conflicting issues
- feasibility from a product perspective (not architecture — that is Architect's concern)

Output format:

1. Blockers (issue should not proceed)
2. Concerns (proceed with adjustments)
3. Approval decision
