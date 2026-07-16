# Phase 3 Validation Report

Phase: Phase 3 - AI difficulty and play styles  
Status: PASS

## Delivery

- Versioned AI policy contract: `easy`, `normal`, `hard` and `balanced`, `conservative`, `greedy`; default remains `normal + balanced`.
- AI consumes a public-board projection only. Hidden mine locations are excluded before candidates, certainty rules, risk estimates, and utilities run.
- Easy uses injected RNG over legal candidates; normal preserves original certainty-first and random-fallback behavior; hard uses public risk after certainty rules.
- Conservative selects the lowest public risk; greedy uses a documented `0.75` risk cap and stable tie breaks.
- Policy is selectable before the first move, locked for a game, shown in the UI and replay controls, stored with local completed replay history, and fixed to the default for daily challenges.

## Evidence

- Fixed tests cover default compatibility, deterministic RNG, public-layout equivalence, certain moves, risk fallback, style ranking, invalid policies, and UI controls.
- `scripts/evaluate-ai-policies.mjs` provides a small repeatable seeded batch sample for policy comparison.
- Replay continues to consume recorded commands; architecture checking rejects replay imports from `src/game/ai/`.

## Validation

```text
npm run format:check PASS
npm run lint PASS
npm run test:run PASS (23 files / 61 tests)
npm run arch:check PASS
npm run build PASS
git diff --check PASS
```

## Commits

- `9a17e7a` policy contract
- `21dd5dd` public board view
- `8cd0cc6` candidate refactor
- `e9b6bb9` normal compatibility
- `2af4ea5` easy policy
- `cac2122` public risk estimator
- `7e03ca9` hard/style utility
- `7f85f57` UI selection and game lock
- `45ef55e` replay metadata and anti-cheat guard

Scope deviations: none.  
Residual risk: automated Pages browser navigation remains unavailable in this executor environment; retain the established manual HTTPS/playability confirmation during release acceptance.
