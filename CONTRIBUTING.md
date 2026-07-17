# Contributing

## Required Checks

Run these commands in order before every functional commit:

```powershell
npm run format:check
npm run lint
npm run test:run
npm run arch:check
npm run build
npm run ai:evaluate
npm run greed:evaluate
npm run progression:evaluate
npm run protocol:evaluate
npm run worker:test
npm run worker:dry-run
npm run workspace:check
git diff --check
```

Use the initialized project Git wrapper with explicit paths and Conventional Commit messages. Do not use `--no-verify`, force push, or bypass validation.

## Pull Request Checklist

- [ ] The change preserves Greedy Sweeper behavior and does not modify `origin/`.
- [ ] Tests cover the relevant rule, controller, or UI intent.
- [ ] Pure game code in `packages/game-core` has no React, DOM, timer, network, or UI import.
- [ ] Web and Worker code use public `@greedy-sweeper/*` package exports, never package `src/` paths.
- [ ] Worker changes keep the ES-module/SQLite foundation local-only: no deployment, WebSocket, room UI, or game authority.
- [ ] UI/controller code does not duplicate engine or AI logic.
- [ ] New text is readable Chinese or English, never mojibake.
- [ ] Documentation and local commands still match the repository.
- [ ] Replay changes retain explicit protocol versions and validate deterministic replay integrity.
- [ ] Browser storage is accessed only through `src/application/storage/` and has a failure fallback.
- [ ] AI policy changes preserve `normal + balanced` compatibility and do not read hidden mine locations.
- [ ] Greed changes preserve the Classic v1 state/replay shape and keep Bank settlement inside `src/game/engine/rules/`.
