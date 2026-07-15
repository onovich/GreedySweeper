<!-- codex-project-git-workflow: initialized -->
<!-- initialized-at: 2026-07-16 04:37:00 +08:00 -->

# Codex Git Workflow

Initialization status: initialized

Project: Greedy Sweeper

Repository root: D:\WebProjects\GreedySweeper

Machine config: `.codex/project-git-workflow.json`

Skill: project-git-workflow

Treat this document and the machine config as the source of truth for this repository's Codex git workflow.

## Validation

Run these checks in order before each functional commit and push:

1. `npm run format:check`
2. `npm run lint`
3. `npm run test:run`
4. `npm run arch:check`
5. `npm run build`

## Staging Policy

Selected files only. Inspect status before staging and preserve unrelated user changes.

## Commit And Push

Use the global project-git-workflow wrappers with a conventional commit message and explicit paths. Do not use `--no-verify`, force push, or bypass the configured validation gate.

## Docs And TODO

Update relevant documentation for code, workflow, or behavior changes before committing.
