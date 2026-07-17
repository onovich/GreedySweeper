# Phase 6A Validation Report

Phase: Phase 6A - Shared Core and Online Protocol Foundation
Status: PASS
Rounds used: 12 main, 0 buffer, 1 final

## Workspace graph

The private npm-workspace root owns `apps/web`, `apps/room-worker`, `packages/game-core`, and `packages/online-protocol`. The web application consumes public `@greedy-sweeper/game-core/*` exports. The protocol package delegates command-shape validation to the public game-core action contract. The Worker imports the public online protocol version only; it has no game authority.

## Web and game-core parity

The Vite app now builds from `apps/web` with the existing `/GreedySweeper/` base path and produces `apps/web/dist`. The Pages workflow uploads that exact artifact. The pure source has one owner at `packages/game-core/src`; the temporary `apps/web/src/game` symlink is test-only compatibility plumbing and resolves to that same source tree. The web suite preserves 28 files and 77 Classic, Greed, AI, challenge, replay, integrity, history, and progression tests.

## Online protocol

`@greedy-sweeper/online-protocol` provides `ONLINE_PROTOCOL_VERSION = "1"`, strict JSON envelope/size checks, client messages (`authenticate`, `submit_command`, `pong`), server messages, public snapshot/board-projection validation, public action validation, and structured malformed/version/type/field/oversize/sequence/duplicate/incompatible/hidden-state error vocabulary. `npm run protocol:evaluate` exercises valid, malformed, unsupported-version, unknown-type/field, invalid action, oversize, and hidden-state fixtures.

## Worker and Durable Object foundation

`apps/room-worker` uses ES-module Worker format with a local Wrangler configuration, a health route, and a SQLite Durable Object migration declaration. The object initializes an additive `room_foundation` fixture with `CREATE TABLE IF NOT EXISTS` and `INSERT OR IGNORE`. Official `@cloudflare/vitest-pool-workers` runs the Worker runtime test; it invokes `cloudflare:test` `evictDurableObject()` and proves the initialized fixture is available after reconstruction. `npm run worker:dry-run` bundles locally and reports the sole `ROOM` Durable Object binding; no Worker was deployed.

## Architecture and scope evidence

`npm run workspace:check` validates the workspace graph and package contracts. `npm run arch:check` rejects internal package imports, package-direction reversal, copied Worker game semantics, browser/platform APIs in shared packages, and game-core duplication. The Worker does not expose room, WebSocket, authentication, or command routes. `docs/domain-migration/**` was excluded from staging and remains the concurrent domain task's untracked directory.

## Validation

All commands passed locally on 2026-07-17:

```text
npm run format:check
npm run lint
npm run test:run                 # 28 files, 77 tests
npm run ai:evaluate
npm run greed:evaluate
npm run progression:evaluate
npm run protocol:evaluate
npm run worker:test              # 1 file, 2 official Workers-runtime tests
npm run worker:dry-run           # local bundle only; ROOM binding reported
npm run workspace:check
npm run arch:check
npm run build                    # apps/web/dist with /GreedySweeper/ base path
git diff --check
```

## Commits and remote

Implementation trail: `fabaf8c` workspace/protocol foundation; `0ed315d` web relocation; `0fe7a58` game-core extraction; `1ef4f0e` protocol envelopes; `fbf2331` Worker toolchain; `47c1887` Wrangler formatting; final closure commit follows this report. The final closure is pushed to `origin/main`.

Remote deployment: none (required). GitHub Pages remains the existing static deployment path; this phase changes its artifact path only.

Scope deviations: none.

Residual risks: Phase 6B must design real seat authentication, room lifecycle, command sequencing/idempotency storage, authoritative game execution, WebSocket hibernation/reconnect, production Worker deployment, and security/rate-limiting controls. None are implemented here.

Return to planner: 019f6768-2328-76f2-a6e4-da752c6eb85c
