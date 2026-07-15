# Phase 1 - Foundation, Faithful Refactor, and GitHub Pages Release

Date: 2026-07-16  
Status: READY for the project executor  
Project: Greedy Sweeper / 贪婪扫雷  
Remote: `git@github.com:onovich/GreedySweeper.git`  
Round budget: 16 total; rounds 1-12 main delivery, rounds 13-15 repair buffer, round 16 final validation.

## 0. Direct Goal Prompt for the Executor

Initialize Greedy Sweeper as a maintainable React/Vite repository, faithfully reproduce the behavior and visual experience in `origin/App.jsx`, refactor the monolith along the architecture boundaries in this guide, establish mandatory validation and architecture-drift gates for every functional commit, deploy the resulting static app to GitHub Pages, and push all accepted rounds to `git@github.com:onovich/GreedySweeper.git`. Do not add game features or redesign the product. Use `$donextgoal` to execute this guide round by round. A round may advance only after its validation succeeds and its commit is pushed.

## 1. Required Reading and Sources of Truth

Read before changing files:

- `origin/design.md`: product rules, scoring, interactions, and original architecture notes.
- `origin/App.jsx`: behavioral and visual reproduction baseline. Keep `origin/` unchanged.
- This guide: authoritative scope, target architecture, commit gates, and PASS criteria.
- `$gemini-to-github`, `$canvas-app-refactor`, `$bilingual-readme-generator`, `$gh-pages-action-deployer`, and `$project-git-workflow` skill instructions.

Resolve the apparent encoding damage in the supplied Chinese source text deliberately. Do not propagate mojibake into production UI or documentation. Recover copy from context and product rules while preserving intended meaning.

If the implementation and `origin/design.md` disagree, preserve observable game behavior unless the difference is an obvious syntax or encoding defect. Report material discrepancies instead of inventing rules.

## 2. Phase Goal

- Run locally as a React/Vite app and reproduce the existing player-versus-AI game.
- Preserve desktop left/right click and mobile tap/400 ms long-press behavior.
- Preserve scoring, turns, flood reveal, AI behavior, game over, responsive layout, and feedback states.
- Separate deterministic rules from React, browser events, timers, and rendering.
- Use serializable state and explicit action/result contracts so a future network transport can submit commands without UI imports.
- Add truthful bilingual docs, architecture/contribution rules, and a reusable local launcher.
- Enforce lint, tests, build, and architecture checks before functional commits and pushes.
- Deploy through GitHub Actions to `https://onovich.github.io/GreedySweeper/`.

## 3. Non-Scope

- No new gameplay, smarter AI, accounts, persistence, matchmaking, server, WebSocket implementation, analytics, monetization, or custom domain.
- No visual redesign except fixes required for valid rendering, encoding, accessibility, or responsive parity.
- No speculative framework, state library, animation library, backend SDK, or networking dependency.
- No TypeScript migration in this phase. Focused JSDoc contracts are allowed; record TypeScript as a later option.
- Do not modify or delete `origin/`.

## 4. Architecture Boundaries

Create only modules with real responsibilities:

```text
src/
  app/                 # bootstrap and dependency composition
  game/
    config/            # board, scoring, timing, tuning constants
    model/             # serializable state/action/result contracts and factories
    engine/            # pure board, neighbors, flood, and move transitions
    ai/                # pure move selection from visible game state
    selectors/         # pure derived reads for UI/protocol adapters
  application/
    useGameController  # lifecycle, timers, RNG injection, orchestration
  ui/
    screens/           # page composition
    components/        # board, cell, score, status, controls, instructions
  styles/              # Tailwind entry and shared styling
tests/                 # domain-focused tests
scripts/               # architecture and local-run tooling
```

Dependency direction:

```text
app -> ui -> application -> game
                 |           ^
                 +-----------+
```

Rules:

- `game/**` must not import React, DOM APIs, timers, Tailwind, Lucide, browser events, or UI modules.
- The engine accepts serializable state plus a command and returns a new state plus domain results/events without input mutation.
- Board and AI randomness receive injected RNG; tests use deterministic fixtures.
- `application/**` owns effects, refs, AI delay, pointer intent translation, and cancellation, but no game rules.
- `ui/**` renders data and emits intents; it does not calculate scores, legal moves, turns, mines, or AI choices.
- Constants have one source of truth under `game/config`; do not duplicate them in UI.
- Future online play should replace the controller command transport, not fork the engine. Do not build transport now.
- Avoid catch-all `utils`, `helpers`, and `common`; name modules by domain responsibility.
- Prefer named domain exports. Split by stable responsibility, not line count.

## 5. Mandatory Round Workflow

Every round reports its goal, completed scope, Debug self-check, architecture self-check, exact validations/results, commit hash, branch, push result, working-tree status, buffer use, and next goal.

Progression gate:

- Validation failure: no commit, push, or advance.
- Commit failure: no push or advance.
- Push failure: no advance.
- Only a successfully pushed round is complete.
- Stage only round-relevant files; never absorb unrelated changes or generated output.

Initialize `$project-git-workflow` in round 1 with selected-file staging and validation in this order:

```text
npm run format:check
npm run lint
npm run test:run
npm run arch:check
npm run build
```

If script names require a tool-compatible adjustment, preserve checks and order. The wrapper must validate before staging/commit. Forbid `--no-verify`, force push, and bypassing the documented wrapper. Use Conventional Commits, for example `refactor(engine): extract pure move transition`.

Architecture drift requires both:

- A human checklist in `ARCHITECTURE.md` or `CONTRIBUTING.md` covering dependency direction, source-of-truth ownership, serializable contracts, deferred scope, and unrelated changes.
- A real `npm run arch:check` script that fails on enforceable forbidden imports and required-boundary violations; it must not merely print success.

## 6. Debug Self-Check for Every Round

- Can the change be demonstrated by the smallest fixture or user workflow?
- Can failure be localized to config, model, engine, AI, controller, UI, tooling, deployment, or remote configuration?
- Are success, failure, empty, stale-timer, duplicate-input, game-over, and incompatible states covered where relevant?
- For UI changes, were desktop/mobile and mouse/touch-equivalent interactions checked?
- For state changes, are serialization, deterministic input, command validation, and immutable transitions intact?
- Were original rules and interactions preserved without silent feature additions?

## 7. Architecture Self-Check for Every Round

- Does `game/**` remain the sole source of truth for rules and transitions?
- Did UI/controller avoid duplicating engine or AI semantics?
- Are contracts, commands, events/results, selectors, controller state, and views separated?
- Are randomness, time, and browser effects injected or isolated outside pure rules?
- Is the future transport seam retained without networking now?
- Did the change avoid deferred scope, empty abstractions, dumping-ground modules, and circular imports?
- Were `origin/`, unrelated files, generated outputs, and user changes untouched?

## 8. Round Plan

1. Preflight/foundation: check toolchain, preserve `origin/`, scaffold React/Vite/Tailwind, repair Chinese copy, initialize Git `main`, add confirmed SSH remote, initialize project Git workflow, validate, commit, push.
2. Domain contracts/config: serializable state, players, actions/results, factories, constants, RNG seam, tests.
3. Board engine: neighbors, generation, counts, flood reveal, immutability, deterministic tests.
4. Move transition: reveal/flag scoring, turns, mines, game over/winner, invalid commands, tests.
5. AI policy: deterministic inference and injected-random fallback with parity tests; no smarter AI.
6. Application controller: state, timers, refs, stale-callback protection, restart, AI scheduling/cancellation.
7. Interaction adapter: mouse, context menu, pointer leave, tap, and 400 ms long press without duplicate action.
8. UI composition: cohesive screen/components preserving classes, responsive layout, feedback, and icons.
9. Parity: repeatable smoke coverage for core flows and desktop/mobile; repair reproduction defects only.
10. Maintenance policy: `ARCHITECTURE.md`, `CONTRIBUTING.md`, architecture script, Conventional Commits, PR checklist, bilingual `README.md`.
11. Developer ergonomics: `RunLocal.cmd` plus port-fallback script; validate every documented command.
12. Pages release: Vite base `/GreedySweeper/`, official Pages Actions, all local gates, commit, push.
13. Buffer 1: only failures/drift from earlier rounds; otherwise report unused with no commit.
14. Buffer 2: only failures/drift from earlier rounds; otherwise report unused with no commit.
15. Buffer 3: only failures/drift from earlier rounds; otherwise report unused with no commit.
16. Final validation: full local matrix, Actions result, live Pages desktop/mobile, remote `main`, scope audit, final report to planner. Commit/push only for required fixes.

## 9. Validation Matrix

| Concern | Required evidence |
| --- | --- |
| Formatting | `npm run format:check` passes |
| Static quality | `npm run lint` passes without ignored new violations |
| Domain behavior | deterministic engine, scoring, turns, flood, game-over, and AI tests pass |
| Architecture | `npm run arch:check` and manual checklist pass |
| Production | `npm run build`; `dist/index.html` and assets exist |
| Reproduction | desktop/mobile core flow and all input modes evidenced |
| Git workflow | selected staging, pre-commit validation, hash, push recorded per round |
| Pages paths | built asset paths use `/GreedySweeper/` |
| Deployment | official Pages workflow succeeds and live URL is checked |
| Docs | README commands match scripts; architecture docs match code |

## 10. PASS Criteria

- `main` is pushed to `git@github.com:onovich/GreedySweeper.git` without force push.
- Full local validation passes and the app reproduces the game without feature/visual expansion.
- Production code is no longer monolithic; pure engine/AI have deterministic tests and no browser/React imports.
- UI/controller duplicate no scoring, legality, turn, mine, or AI rules.
- The Git workflow enforces pre-commit validation and architecture self-check.
- README is concise, bilingual, truthful, and names Greedy Sweeper / 贪婪扫雷.
- Official Pages Actions succeeds and `https://onovich.github.io/GreedySweeper/` loads with correct assets.
- `origin/` is unchanged, unrelated files are excluded, and online scope remains deferred.
- Final hashes, remote branch, workflow result, URL, validations, deviations, and risks are reported to planner.

## 11. Final Report Template

```text
Phase: Phase 1 - Foundation, faithful refactor, and GitHub Pages release
Status: PASS | BLOCKED
Rounds used: <main>/<buffer>/<final>
Architecture delivered: <boundaries and dependency direction>
Behavioral parity: <desktop/mobile and input evidence>
Validation: <commands and results>
Git workflow: <policy/gate evidence>
Commits: <round -> hash>
Remote: git@github.com:onovich/GreedySweeper.git, branch <branch>, push <result>
Pages workflow: <run/result>
Pages URL: https://onovich.github.io/GreedySweeper/ <checked result>
Scope deviations: <none or explicit list>
Residual risks: <explicit list>
Return to planner: 019f6768-2328-76f2-a6e4-da752c6eb85c
```
