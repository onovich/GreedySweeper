# Phase 6A - Shared Core and Online Protocol Foundation

Date: 2026-07-17
Status: Goal-mode execution guide for the implementation executor
Project: Greedy Sweeper
Round budget: 16 rounds; rounds 1-12 main delivery, rounds 13-15 repair buffers, round 16 final validation

## 0. Direct Goal Prompt

Restructure Greedy Sweeper into an npm workspaces monorepo without changing gameplay, player-visible behavior, GitHub Pages output, protocol semantics, or local data. Move the existing web application into `apps/web`, extract the pure deterministic game domain into `packages/game-core`, create a strict pure-JavaScript `packages/online-protocol`, and add an ES-module `apps/room-worker` Cloudflare Worker/Durable Object foundation that is testable locally but does not implement playable rooms or deploy remotely. Every round must pass its focused Debug and architecture checks, then commit and push through the repository workflow before the next round.

## 1. Required Context

Read before changing code:

- `ROADMAP.md`
- `CONTEXT.md`
- `ARCHITECTURE.md`
- `CONTRIBUTING.md`
- `docs/phase-6-online-architecture-decision-brief.md`
- `docs/adr/0001-*.md` through `docs/adr/0029-*.md`
- `docs/phase-5-validation-report.md`
- current `package.json`, Vite/Vitest/ESLint/Prettier configuration, GitHub workflows, local launchers, and architecture checker
- current `src/game/**`, `src/progression/**`, `src/application/**`, and relevant tests/evaluation scripts
- official Cloudflare Workers Vitest integration, Durable Object SQLite storage, and eviction-test documentation
- `$donextgoal` and `$project-git-workflow`

Phase 5 at commit `5e74e60` and its planner acceptance at `88862c3` are the behavioral baseline. The Phase 6 architecture interview is binding unless this guide explicitly narrows it.

## 2. Phase Goal

Deliver a stable compile-time and test-time foundation for later authoritative rooms:

- npm workspaces own the web app, room Worker, shared game core, and online protocol.
- The existing pure game engine has one package identity and one source tree consumed by both web and Worker.
- The online protocol has explicit versions, message envelopes, message types, structured errors, and strict deterministic validators.
- The Worker uses Cloudflare ES-module format and has a locally testable Durable Object/SQLite migration scaffold.
- Root commands run all relevant workspace checks while preserving existing developer ergonomics and GitHub Pages output.
- Architecture guards reject dependency reversal, copied game semantics, browser APIs in shared packages, and Worker/platform imports in shared code.

## 3. Fixed Technical Choices

### 3.1 Repository shape

```text
apps/
  web/                  # React/Vite client, application, UI, progression, browser storage
  room-worker/          # Cloudflare Worker and Durable Object host boundaries
packages/
  game-core/            # current pure game domain, AI, challenge, replay, selectors
  online-protocol/      # JSON envelopes, versions, message/error contracts, validators
docs/
scripts/
package.json            # private workspace root and aggregate gates
```

Use npm workspaces. Do not switch package managers.

### 3.2 Language and module format

- Keep the repository in JavaScript/JSX and ES modules for Phase 6A.
- Do not perform a TypeScript migration.
- Use JSDoc only where it materially clarifies exported contracts.
- Worker code must use Cloudflare ES-module format.
- Protocol validation must be deterministic pure JavaScript. Do not add schema code generation or a second runtime model.

### 3.3 Package dependency direction

```text
apps/web -------------> packages/game-core
apps/room-worker -----> packages/game-core
apps/room-worker -----> packages/online-protocol
packages/online-protocol -> packages/game-core public action validation only
packages/game-core ----> no app, protocol, React, DOM, storage, network, timer, or Cloudflare code
```

`packages/game-core` must never import `online-protocol`. `online-protocol` may delegate gameplay-action validation to a documented public `game-core` contract, but must not execute rules or duplicate legal-action semantics.

### 3.4 Shared core boundary

Move the current `src/game/**` domain as one coherent package. Preserve Classic v1, Greed v2, AI policies, challenge codes, seeded randomness, action logs, replay and integrity behavior exactly. Expose explicit package exports rather than importing internal file paths across workspaces.

Keep `src/progression/**` in the web application during Phase 6A. It consumes public replay APIs from `game-core`; it is not server authority and is not moved into `game-core`.

### 3.5 Online protocol foundation

Define, validate, and fixture at least:

- `ONLINE_PROTOCOL_VERSION = "1"`
- strict base envelope fields and JSON-serializability limits
- client messages: `authenticate`, `submit_command`, `pong`
- server messages: `authenticated`, `snapshot`, `command_accepted`, `command_rejected`, `match_paused`, `match_resumed`, `match_terminal`, `ping`, `protocol_error`
- shared identifiers and constraints for Room Code, Seat Token input, Command ID, sequence, rules/replay versions, and message size
- public snapshot and Public Board Projection contracts that cannot contain hidden mine locations
- structured protocol, authentication, sequence, rate, lifecycle, validation, incompatibility, and internal error codes
- unknown-type, unknown-field, missing-field, malformed-value, unsupported-version, oversize, stale-sequence, duplicate-ID, and incompatible-rules fixtures

Phase 6A defines contracts and validators only. It does not open a WebSocket, authenticate real seats, create rooms, execute online commands, reveal seeds, or expose UI.

### 3.6 Worker foundation

- Add Wrangler configuration for local/preview and production bindings without real secrets or production routes.
- Use SQLite-backed Durable Object migration declarations.
- Add a minimal Worker router/health response and one exported Durable Object class.
- Add minimal storage schema/migration initialization proving transactional strongly consistent storage can persist across object eviction.
- Do not implement room creation, Room Code lookup, Seat Tokens, gameplay command acceptance, timers, alarms, WebSockets, CORS production policy, logs, rate limits, or deployment.
- Add Cloudflare Workers Vitest integration using the current repository Vitest major. Use official `cloudflare:test` eviction helpers where supported.
- Keep any WebSocket-specific shared-storage workaround documented for Phase 6B; do not add placeholder WebSocket behavior now.

## 4. Explicit Non-Scope

- No player-visible Online button, room screen, invite flow, second-player controller, or online progression.
- No functional room creation/join/authentication, WebSocket, command execution, reconnect, hibernation socket, seed commitment, alarm, retention, rate limiting, Turnstile, logging, or load test.
- No `workers.dev` or production deployment.
- No Cloudflare account, token, secret, Paid-plan, custom-domain, DNS, Cargo, or Nameserver operation.
- Do not touch `docs/domain-migration/**`; it belongs to the dedicated domain-migration task.
- No accounts, matchmaking, rankings, spectator, rematch, chat, nickname, telemetry, or cloud profile.
- No gameplay, scoring, balance, AI, challenge-code, action-log, replay, integrity, storage, achievement, or UI redesign.
- Do not modify `origin/` or unrelated user files.

## 5. Per-Round Fixed Workflow

Every round response must contain:

- round goal and smallest player/maintainer value
- completed files and boundary changes
- Debug self-check
- architecture self-check
- validation commands and exact results
- commit hash, branch, and push result
- next-round goal
- whether a buffer round was consumed

Progression rules:

- Validation failure: do not commit, push, or enter the next round.
- Commit failure: do not enter the next round.
- Push failure: do not enter the next round.
- Push success: record the hash and `origin/main`, then continue.
- Stage only phase-relevant files. Never stage `docs/domain-migration/**` or unrelated concurrent changes.
- Use Conventional Commits and the repository wrapper. Never use `--no-verify`, force push, or destructive Git commands.

## 6. Debug Self-Check

Each round must answer:

- Can the change be explained with the smallest package import, protocol fixture, Worker request, or Durable Object eviction fixture?
- Can failures be localized to workspace wiring, web build, game-core export, protocol validation, Worker runtime, storage/migration, test pool, CI, or Pages packaging?
- Are success, malformed, empty, stale, duplicate, oversize, incompatible, storage-restart, and missing-binding states covered where relevant?
- Does moving a file preserve its old behavior and deterministic fixture output byte-for-byte or value-for-value?
- Can the existing local game, challenge, replay, AI, Greed, progression, and Pages build still run through documented root commands?
- Does the Worker test run in the Workers runtime rather than a Node-only mock?

## 7. Architecture Self-Check

Each round must answer:

- Is `packages/game-core` still the sole source of gameplay truth?
- Does `online-protocol` describe transport contracts without executing or copying rules?
- Do web and Worker import public package exports rather than package internals?
- Are React, DOM, browser storage, timers, network, and Cloudflare APIs absent from shared pure packages?
- Is progression still a replay-consuming out-of-game web domain?
- Is the Worker host thin, with no copied board/scoring/action/replay semantics?
- Are protocol, rules, replay, facts, and storage versions explicit and distinct?
- Did this round avoid Phase 6B/6C, DNS, deployment, and domain-migration scope?
- Are unrelated files and concurrent task output left untouched?

## 8. Commit and Push Gates

The final aggregate matrix must be available as root scripts and included in the project Git workflow configuration:

```text
npm run format:check
npm run lint
npm run test:run
npm run ai:evaluate
npm run greed:evaluate
npm run progression:evaluate
npm run protocol:evaluate
npm run worker:test
npm run worker:dry-run
npm run workspace:check
npm run arch:check
npm run build
git diff --check
```

During early migration rounds, run every already-available gate plus the focused workspace gate introduced in that round. Once a new aggregate gate exists, it becomes mandatory for all later commits and must be added to the reusable project workflow wrapper/configuration.

## 9. Round Plan

1. **Boundary contract and red architecture fixtures**: document final package ownership/export map, capture baseline deterministic/evaluation outputs, and add failing architecture/workspace fixtures that prove forbidden dependency directions before moving code.
2. **Workspace root and web relocation**: create npm workspaces, move the existing Vite app into `apps/web`, preserve root developer commands, local launcher behavior, test environment, `/GreedySweeper/` base path, and GitHub Pages artifact shape.
3. **Extract game-core**: move `src/game/**` into `packages/game-core`, add explicit exports, update web/progression imports, and prohibit cross-package internal paths.
4. **Core parity and evaluation ownership**: relocate or rewire pure game tests/evaluation scripts, prove all Classic/Greed/AI/challenge/replay/integrity fixtures remain identical, and keep progression consuming public replay exports.
5. **Protocol package base contracts**: add `packages/online-protocol`, base envelope, version separation, identifier/size contracts, structured result/error vocabulary, and JSON round-trip tests.
6. **Protocol message validators**: implement every agreed client/server message contract, strict unknown-field/type rejection, public snapshot shapes, and delegated game-action validation without rule duplication.
7. **Compatibility and adversarial fixtures**: add supported/unsupported protocol and rules fixtures plus malformed, stale, duplicate, oversize, hidden-field, and deterministic serialization evaluation; expose `protocol:evaluate`.
8. **Worker ES-module scaffold**: add `apps/room-worker`, Wrangler local/preview/production environment declarations with placeholders, health route, binding validation, package imports, and `worker:dry-run`; do not deploy.
9. **SQLite Durable Object foundation**: add one minimal Durable Object and additive migration scaffold proving atomic storage initialization and a persisted non-game fixture; no room lifecycle or online gameplay.
10. **Workers runtime test harness**: configure official Cloudflare Vitest integration, isolated storage tests, explicit eviction/reconstruction test, missing-binding/error paths, and root `worker:test`.
11. **Architecture and workspace enforcement**: expand guards for workspace existence, package exports, forbidden imports, Node/browser/Cloudflare boundaries, no copied game semantics, no hidden fields in public snapshots, and no web dependency from Worker/shared packages.
12. **CI, Pages, launchers, and documentation**: update GitHub workflows, root/local commands, README, ARCHITECTURE, CONTRIBUTING, roadmap links, workflow wrapper configuration, and maintainer setup; prove Pages remains unchanged and Worker stays undeployed.
13. **Buffer 1**: repair only issues found in rounds 1-12. If unused, report unused and create no commit.
14. **Buffer 2**: repair only issues found in rounds 1-12. If unused, report unused and create no commit.
15. **Buffer 3**: repair only issues found in rounds 1-12. If unused, report unused and create no commit.
16. **Final validation**: run the complete matrix, package-boundary scans, deterministic parity evidence, Worker eviction test, dry-run artifact inspection, GitHub Pages build inspection, commit/push audit, and final report. Commit only if final repairs or report updates are needed.

## 10. Validation Matrix

| Concern        | Required evidence                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| Workspaces     | clean npm install, lockfile, explicit package graph, root scripts, no duplicate package ownership                    |
| Web parity     | local UI/controller/storage/progression tests, Vite build, `/GreedySweeper/` asset paths, Pages workflow artifact    |
| Game core      | all prior deterministic tests/evaluations, explicit exports, no app/protocol/platform imports                        |
| Protocol       | all message types, strict fields, version separation, JSON round-trip, size/identifier boundaries, structured errors |
| Hidden state   | public snapshot fixtures cannot encode mine truth or hidden cell values                                              |
| Worker         | ES-module format, bindings/config validation, health route, dry-run, no remote deploy                                |
| Durable Object | SQLite migration scaffold, atomic fixture, persistence after forced eviction, no memory-only authority               |
| Architecture   | enforced package direction, no internal-path imports, no copied gameplay semantics, no network in shared core        |
| Compatibility  | Classic v1, Greed v2, GS1, replay/integrity, AI, daily, history, progression all unchanged                           |
| Non-scope      | no room UI, WebSocket, auth, online command execution, DNS, deployment, or domain-migration edits                    |
| Git            | selected files only, per-round commit/push, clean expected worktree aside from known concurrent task files           |

## 11. PASS Criteria

- The repository is a documented npm workspaces monorepo with the agreed four workspace boundaries.
- The current web game behaves and builds identically, including GitHub Pages base-path output and all 77+ existing tests.
- `game-core` is the only gameplay source of truth and is independently importable in Node/Workers-compatible ES-module contexts.
- `online-protocol` provides strict pure versioned contracts and adversarial fixtures without copied game rules or hidden-state leakage.
- The Worker/DO foundation runs and tests locally in the Cloudflare runtime, persists its minimal fixture across forced eviction, and passes a Wrangler dry-run.
- No player-visible online feature or remote Worker/DNS operation exists.
- Architecture and workspace guards prevent dependency reversal and internal import drift.
- Every required gate passes; every implementation round is committed and pushed to `origin/main`.
- `docs/phase-6a-validation-report.md` records package graph, deterministic parity, protocol versions, Worker configuration/migrations, test evidence, commit trail, remote state, scope deviations, and residual risks.

## 12. Final Report Template

```text
Phase: Phase 6A - Shared Core and Online Protocol Foundation
Status: PASS | BLOCKED
Rounds used: <main>/<buffer>/<final>
Workspace graph: <root/apps/packages and dependency evidence>
Web parity: <tests/build/Pages artifact evidence>
Game-core extraction: <exports/import boundaries/deterministic parity>
Online protocol: <version/messages/validators/adversarial fixtures>
Worker foundation: <ES-module/config/health/dry-run>
Durable Object foundation: <SQLite migration/transaction/eviction evidence>
Architecture evidence: <workspace and forbidden-import checks>
Validation: <commands and exact results>
Commits: <round -> hash>
Remote: origin/main <push result>
Remote deployment: none (required)
Concurrent files excluded: docs/domain-migration/** <evidence>
Scope deviations: <none or explicit list>
Residual risks: <explicit list for Phase 6B>
Return to planner: 019f6768-2328-76f2-a6e4-da752c6eb85c
```
