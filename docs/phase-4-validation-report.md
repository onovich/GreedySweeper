# Phase 4 validation report: Greed and push-your-luck mechanics

Status: ready for planner acceptance

Guide: `docs/phase-4-greed-risk-mechanics-goal-mode-execution-guide.md`

## Delivered player value

- New ordinary games default to **Greed v2**; players can select **Classic v1** before
  the first move, after which mode is locked.
- Greed displays its streak and unbanked pot and offers an accessible Bank button.
  Bank is legal only after a safe reveal and ends the turn.
- Safe reveals retain their immediate base score and add `points * min(max(streak -
1, 0), 3)` to the pot. Correct flags cash the pot; wrong flags and explosions lose
  it. All turn-ending settlements reset the streak/pot.
- AI Bank decisions use only the existing public projection, pot, policy, public-risk
  estimate, and injected RNG. Certain safe/mine actions remain higher priority.

## Rules and protocol versions

- Classic: `rulesVersion: "1"`, `mode: "standard"`, frozen v1 state and integrity
  summary shape.
- Greed: `rulesVersion: "2"`, `mode: "greed"`, state adds only serializable
  `greed: { streak, bonusPot }` fields.
- Challenge codes remain `GS1`; the descriptor explicitly carries the rules/mode pair.
  Old GS1 descriptors remain valid.
- Action records/replays: Classic v1 records/replay use version `1`; Greed records/
  replay use version `2`. Readers reject a rules-to-record version mismatch rather
  than reinterpreting history.
- New daily challenges use `greedy-sweeper.daily.v2` and Greed v2. Existing v1 daily
  descriptors/history stay readable as Classic.

## Determinism and replay integrity

- Tests cover Classic v1 state-shape preservation, Greed pot multiplier/cap, illegal
  Bank, Bank settlement, correct-flag cashout, explosion loss, v2 records, v2 replay,
  and v2 integrity summaries.
- The v1 integrity payload code path is unchanged; v2 summaries additionally serialize
  rules, mode, streak, and pot. Replay always re-executes recorded commands and never
  reruns AI selection.

## AI and balance evidence

- `npm run ai:evaluate` records certain-safe priority, conservative Bank at public risk
  > = 0.30, greedy Bank only for pot >= 12 and risk >= 0.50, and the Easy injected-RNG
  > branch.
- `npm run greed:evaluate` validates the configured multiplier progression `0,1,2,3,3`
  and deterministic sample pot total `35`; it documents zero-pot Bank, loss, and cap
  behavior. The cap prevents unbounded multiplier escalation.

## Validation

- `npm run format:check`: PASS
- `npm run lint`: PASS
- `npm run test:run`: PASS — 26 files, 68 tests
- `npm run ai:evaluate`: PASS
- `npm run greed:evaluate`: PASS
- `npm run arch:check`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS

## Commit trail

- `19e813e` — Phase 4 goal guide
- `f917aa3` — planner dispatch routing record
- `fb32906` — Classic v1 freeze ADR and fixture
- `35c5348` — versioned Greed rules, replay, AI, UI, tests, evaluation, and docs

## Release evidence and residual risk

Earlier Pages acceptance recorded an approved certificate, HTTPS enforcement, passing
Actions deployment, and explicit manual confirmation that the HTTPS site rendered and
was playable. Browser automation previously timed out during deployed-page navigation,
so automated real-browser rendering remains a documented environmental limitation; this
phase adds no deployment configuration or network behavior.

Rounds used: 12 main / 0 buffer / 1 final documentation round.
