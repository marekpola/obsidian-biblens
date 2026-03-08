# BibLens – Git Workflow

This document defines the branching model and release process for the BibLens repository.

The goal is to keep the repository stable while allowing incremental development.

---

# Branches

main  
Production branch.  
Must always be stable and buildable.

develop  
Integration branch for completed development work.

feature/*  
Short-lived branches for implementing a specific task or feature.

fix/*  
Short-lived branches for bug fixes.

docs/*  
Branches for documentation changes.

---

# Core Rules

1. Never implement new functionality directly on `main`.

2. Development work must happen on a short-lived branch created from `develop`.

3. Completed work is merged into `develop` first.

4. `main` is updated only when preparing a release.

5. All merges into `main` must follow:
   - successful build
   - passing tests
   - manual testing

6. Agents must not commit directly to `main`.

7. If the current branch is `main`, the agent must stop and warn the user before implementation begins.

8. Branch creation and merges are controlled by the user unless explicitly instructed.

---

# Development Cycle

1. Create a branch from `develop`

```bash
git checkout develop
git pull
git checkout -b feature/<name>
```

2. Implement the task and commit changes.

3. Merge the branch into `develop`

```bash
git checkout develop
git merge --no-ff feature/<name>
```

4. Delete the feature branch.

---

# Release Process

1. Ensure `develop` is stable.

2. Merge `develop` into `main`.

```bash
git checkout main
git merge --no-ff develop
```

3. Create a version tag.

```bash
git tag vX.Y.Z
git push origin main develop --tags
```

4. Publish the release.

---

# Versioning

BibLens follows Semantic Versioning.

MAJOR  
Breaking changes.

MINOR  
New functionality.

PATCH  
Bug fixes.