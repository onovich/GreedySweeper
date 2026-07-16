# Architecture

Greedy Sweeper keeps gameplay deterministic and portable while React only coordinates browser behavior and rendering.

## Dependency Direction

```text
app -> ui -> application -> game
                 |          ^
                 +----------+
```

- `src/game/` owns serializable state, commands, selectors, board generation, move transitions, and AI policy. It must not import React, UI files, DOM APIs, or timers.
- `src/application/` owns React lifecycle, AI delays, pointer intent, cancellation, and RNG injection. It calls the game layer rather than re-implementing its rules.
- `src/game/challenge/`, `src/game/random/`, and `src/game/replay/` define versioned, serializable seeded-board, action-log, replay, and integrity contracts. Replay re-executes the engine and never re-runs AI choice.
- `src/game/ai/` owns the versioned policy contract, public-state projection, candidates, risk estimator, and utility ranking. It never receives hidden mine locations as policy input.
- `src/application/storage/` is the only browser-storage adapter boundary. Storage failures degrade to an empty local history and never enter `src/game/`.
- `src/ui/` renders state from selectors and sends user intents. It must not calculate score, legal moves, mine counts, turns, or AI choices.
- `src/app/` composes the controller and screen.

## Commit Self-Check

Before a functional commit, confirm all of the following:

1. State, commands, and results stay JSON-serializable.
2. Rules, scoring, and turn ownership have one source of truth in `src/game/`.
3. Randomness and time are injected or contained outside pure transitions.
4. The change does not add networking, persistence, accounts, new gameplay, or a TypeScript migration.
5. `origin/` and unrelated changes remain untouched.
6. `npm run arch:check` and the full validation matrix pass.

## Future Transport Seam

A future online client should submit the existing action contract to an authoritative transport and receive the same serializable state/result shape. It must not fork the engine or copy rules into UI code.
