# Phase 1 Validation Report

Date: 2026-07-16

## Result

- Phase: Phase 1 — Foundation, faithful refactor, and GitHub Pages release
- Status: PASS
- Rounds used: 12 main delivery rounds, 0 buffer rounds, 1 final validation round
- Scope deviations: none

## Architecture Delivered

`app -> ui -> application -> game` is enforced by [`ARCHITECTURE.md`](../ARCHITECTURE.md) and `npm run arch:check`. The game layer contains serializable contracts, pure board/transition/AI logic, and selectors. React lifecycle, timers, and pointer intent are isolated in `application/`; UI components render state and emit intents only.

## Behavioral Parity

- 16 × 16 board with 40 mines, human-first turns, safe-reveal combos, +5 correct flags, -5 wrong flags/mines, flood scoring, and game settlement.
- Desktop primary/context-menu paths and keyboard reveal/flag controls are covered by interaction smoke tests.
- Mobile short press and 400 ms long press are covered by pointer-intent tests and a real 320 px local page check.

## Final Local Validation

All passed on 2026-07-16:

```text
npm run format:check
npm run lint
npm run test:run       # 9 files, 24 tests
npm run arch:check
npm run build
git diff --check
```

The production build includes `/GreedySweeper/assets/...` paths in `dist/index.html`.

## Git And Deployment

- Remote: `git@github.com:onovich/GreedySweeper.git`
- Branch: `main`
- GitHub Actions: [Deploy to GitHub Pages run 29449493256](https://github.com/onovich/GreedySweeper/actions/runs/29449493256) — success
- Published URL: [https://blog.onovich.com/GreedySweeper/](https://blog.onovich.com/GreedySweeper/) — HTTP 200 with the game title and project-base assets
- Compatibility URL: [https://onovich.github.io/GreedySweeper/](https://onovich.github.io/GreedySweeper/) — HTTP 200, redirects to the configured custom Pages address

## Commit Trail

| Round             | Commit    |
| ----------------- | --------- |
| Foundation        | `9c58f2e` |
| Contracts         | `77d6172` |
| Board engine      | `7416391` |
| Move transitions  | `fada183` |
| AI policy         | `aaa4d4b` |
| Controller        | `6e09eb5` |
| Pointer intent    | `3b25862` |
| UI composition    | `c18c451` |
| Interaction smoke | `3a63534` |
| Architecture/docs | `8fed9c1` |
| Local launcher    | `ce37888` |
| Pages release     | `d2b41e6` |

## Residual Risk

The repository inherits an existing custom GitHub Pages domain. Its configuration was observed and preserved; the standard GitHub Pages URL correctly redirects to it.
