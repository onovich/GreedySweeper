# Architecture

Greedy Sweeper keeps gameplay deterministic and portable while React only coordinates browser behavior and rendering. Phase 6A uses npm workspaces so the game core and transport contracts can be consumed without copying rules.

## Dependency Direction

```text
apps/web --------------------> packages/game-core
  |                                    ^
  +-- progression (replay API) --------+
apps/room-worker -----------> packages/online-protocol -> packages/game-core
```

- `packages/game-core/src/` owns serializable state, commands, selectors, board generation, move transitions, replay, challenges, and AI policy. It must not import React, UI files, DOM APIs, timers, storage, networking, or Cloudflare APIs. Its public package exports are the only cross-workspace contract.
- `src/game/engine/rules/` dispatches versioned rules. Classic v1 remains frozen; Greed v2 owns streaks, bonus-pot settlement, and Bank legality. Neither application nor UI copies these rules.
- `apps/web/src/application/` owns React lifecycle, AI delays, pointer intent, cancellation, and RNG injection. It calls the game-core package rather than re-implementing its rules.
- `packages/game-core/src/challenge/`, `random/`, and `replay/` define versioned, serializable seeded-board, action-log, replay, and integrity contracts. Replay re-executes the engine and never re-runs AI choice.
- `packages/game-core/src/ai/` owns the versioned policy contract, public-state projection, candidates, risk estimator, utility ranking, and public-only Bank proposals. It never receives hidden mine locations as policy input.
- `apps/web/src/application/storage/` is the only browser-storage adapter boundary. Storage failures degrade to an empty local history and never enter game-core.
- `apps/web/src/progression/` is a pure, replay-consuming out-of-game domain. It derives immutable facts, statistics, and achievement unlocks from verified completed replays; it never enters game state or imports UI, storage, or React.
- `apps/web/src/ui/` renders state from selectors and sends user intents. It must not calculate score, legal moves, mine counts, turns, or AI choices.
- `packages/online-protocol/` owns strict JSON-only v1 envelopes, IDs, public snapshot validation, and error vocabulary. It may call the public action validator but never executes rules.
- `apps/room-worker/` is a local-only ES-module Cloudflare Worker/Durable Object foundation. Its SQLite fixture is migration-backed and eviction-tested; it has no playable room, WebSocket, authentication, or command execution behavior.

## Commit Self-Check

Before a functional commit, confirm all of the following:

1. State, commands, and results stay JSON-serializable.
2. Rules, scoring, and turn ownership have one source of truth in `packages/game-core/src/`.
3. Randomness and time are injected or contained outside pure transitions.
4. The change does not add networking, persistence, accounts, new gameplay, or a TypeScript migration.
5. `origin/` and unrelated changes remain untouched.
6. `npm run arch:check`, `npm run workspace:check`, and the full validation matrix pass.

## Future Transport Seam

A future online client should submit the existing action contract to an authoritative transport and receive the same serializable state/result shape. It must not fork the engine or copy rules into UI code.
