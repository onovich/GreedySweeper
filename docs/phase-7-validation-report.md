# Phase 7 Validation Report

Phase: Phase 7 - CSS Lunar Console Frontend Reconstruction and Controlled Integration

Status: **PASS / READY_FOR_CHECK**

Rounds used: 12 main rounds, 2 repair buffers, and 1 final-validation round. Buffer 3 was not used.

## Visual system and shared components

- The approved CSS Lunar Console is implemented with local Noto Sans SC and IBM Plex Mono WOFF2 assets, licensed manifests, semantic tokens, CSS Grid/Flex, borders, radii, gradients, shadows, pseudo-elements, and small inline SVG marks.
- `AppShell`, score capsules, mine counter, turn message, match configuration, the shared 16x16 `GameBoard`, `GameCell`, Greed multiplier/POT/Bank, the 2px Reward Circuit, utility drawers, and room states are props/ViewModel-driven visual components.
- The Reward Circuit rests at low opacity and animates only from a confirmed Bank presentation event. Reduced motion uses the accepted 100ms token.
- The production entry has one shared Lunar component tree. The retired Tailwind prototype, duplicate online board, and their unused dependencies/tests were removed in `e1374a2`.

## Fixtures, responsive behavior, and accessibility

- Twenty-two deterministic fixtures reproduce setup, local/Classic/Greed, Bank pending/confirmed/lost, AI turn, replay, terminal, empty record, room review, pending, reconnecting, paused, rejected, replaced, abandoned, verification-failed, verified, and long-copy states without network access.
- Explicit layout bands cover 1920, 1440, 1280-959, 768-class, 390, and 360 widths. Compact layouts reflow instead of scaling the desktop composition; the board remains first and uses a contained two-axis viewport with 44px cells.
- The semantic grid uses one roving Tab stop with Arrow/Home/End navigation, Enter/click reveal, F/context-menu flag, and touch short-press/long-press/pan cancellation.
- Landmarks, labels, live regions, disabled-state readability, forced-colors rules, reduced motion, compact overflow, and effective 200% layouts pass in Chromium, Firefox, and WebKit.

## Visual regression

- Chromium covers all 22 fixtures at the frozen 1440 baseline plus the reference fixture at six accepted viewports/DPRs.
- Firefox and WebKit cover the key 1440 desktop and 390 mobile reconnect states. The repository contains 31 approved PNG baselines.
- Screenshot readiness blocks service workers and external requests, fixes locale/time zone/color scheme/reduced motion, waits for bundled fonts, asserts geometry, and rejects inline styles.
- Final results: `visual:test` 24 passed / 42 intentionally skipped; `visual:regression` 31 passed / 53 intentionally skipped; `compat:test` 12 passed.

## Local integration

- `createLocalGameUiViewModel` maps the existing local controller into the versioned Game UI ViewModel. The visual layer does not import or recalculate gameplay rules.
- Stable intent bridges preserve random play, Classic/Greed selection, AI configuration, challenge codes, daily challenge, replay controls, local history/progression reset, restart, reveal, flag, and Bank behavior.
- Local Bank effects are derived only from transition presentation events and source revisions.

## Online integration and authority

- `createOnlineGameUiViewModel` maps only room state and public authoritative snapshots. Shared cells never receive mine locations, hidden values, seat tokens, seed/salt, or Worker/Durable Object state.
- A pending command retains the last authoritative board/score/turn. Rejection, pause, reconnect, replacement, abandonment, verification failure, and verified terminal remain distinct locked states.
- `command_accepted` alone does not trigger a Bank effect. The controller requires the matching acceptance and a higher-sequence authoritative snapshot, in either message order, before producing one deduplicated confirmation.
- No gameplay, online protocol, Worker/Durable Object, persistence, deployment topology, DNS, billing, repository visibility, or art-direction behavior changed.

## Cutover, rollback, and public Free Beta

- Dedicated production cutover: `d4cc544`.
- Rollback target: `6c9fa85` (the last pre-cutover production entry). Reverting the dedicated cutover and its two scoped follow-up repairs restores the previous entry without changing game or online authority.
- The Free Beta probe was updated in `0850c75` to identify the Lunar Console and its Classic/Greed room entry instead of the retired English panel marker.
- Final cleanup head: `e1374a2`.
- GitHub Pages deployment [29952188922](https://github.com/onovich/GreedySweeper/actions/runs/29952188922) passed for `e1374a2`.
- Public Free Beta smoke [29952280550](https://github.com/onovich/GreedySweeper/actions/runs/29952280550) passed for `e1374a2`; it fetched the published UI and completed public Worker HTTPS/WSS Classic, Greed, and reconnect flows from a GitHub-hosted network.
- No deployment topology or Worker deployment was changed.

## Final validation

The clean-checkout-equivalent state contained no tracked changes and only the concurrent excluded `docs/domain-migration/**` directory. These commands passed:

```text
npm run format:check
npm run lint
npm run test:run                 # 37 files / 126 tests
npm run ai:evaluate
npm run greed:evaluate
npm run progression:evaluate
npm run protocol:evaluate
npm run online:evaluate
npm run worker:test              # 2 files / 15 tests
npm run online:e2e
npm run online:resilience
npm run online:security
npm run workspace:check
npm run arch:check
npm run build
npm run visual:test              # 24 passed / 42 skipped by matrix
npm run visual:regression        # 31 passed / 53 skipped by matrix
npm run compat:test              # 12 passed
npm run cutover:test             # 1 passed / 2 cross-engine duplicates skipped
git diff --check
```

## Commit trail

Phase commits, all pushed to `origin/main`:

`c3f10c8`, `44ef81d`, `fa18283`, `ee7a1b5`, `cb7a072`, `4aedaef`, `6f03ea9`, `2d2d793`, `2de253a`, `a6dbacd`, `6c9fa85`, `d4cc544`, `0850c75`, and `e1374a2`.

## Residual risks and implementation readiness

Public online snapshot v1 does not project authoritative Greed POT/multiplier, remaining mine count, or flag owner. The adapter therefore omits the online Greed panel, displays an unknown mine count, and uses a neutral flag state instead of inventing values. Extending those fields requires a separately authorized protocol/Worker contract change; this phase deliberately did not cross that boundary.

The GitHub Actions runtime reports that several official actions still target deprecated Node.js 20 and are currently forced onto Node.js 24. This is a maintenance warning, not a Phase 7 functional failure.

Within the accepted Phase 7 scope, the Lunar Console is implemented, integrated, deployed, remotely verified, reversible, and ready for architect CheckAndGoal.
