# Decisions

## D001 – MVP scope: placeholder only, no Bible text data
Decision: MVP will only detect references and show placeholder content (no real Bible text retrieval).
Reason: keep initial release small, avoid data licensing/storage questions, and validate UX first.
Consequences:
- Task 3 popover shows "Detected reference: …" only.
- Data provider work is deferred to Future section in TASKS.md.
Revisit: when starting "Local text provider" work.
Date: 2026-03-04

## D002 – Reference format for MVP: Czech abbreviations and comma notation
Decision: MVP parser supports Czech-style abbreviations and punctuation: "Mt 1,3", "Gn 22,1-19", "Iz 11".
Reason: aligns with the author's workflow and allows a minimal parser and hover UX.
Consequences:
- Parser focuses on one regex/grammar and returns a structured BibleRef.
- Other notations (e.g., "Gen 22:1-19") are deferred to a later task.
Revisit: when adding configurable abbreviation systems and separators.
Date: 2026-03-04

## D003 – Development workflow: AI-agent assisted with controlled documents
Decision: Use control documents (CLAUDE.md, SPEC.md, TASKS.md, TESTPLAN.md, AGENTS.md, ARCHITECTURE.md) as the primary source of truth for agents.
Reason: reduces prompt length, limits scope creep, and improves reproducibility of agent work.
Consequences:
- Tasks must have DoD and be implementable without additional clarification.
- Agents should be instructed to read these documents before modifying code.
Revisit: if documents become redundant or too heavy; simplify instead of expanding.
Date: 2026-03-04