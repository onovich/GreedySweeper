# Phase 7 - CSS Lunar Console Frontend Reconstruction and Controlled Integration

Date: 2026-07-23
Status: Goal-mode execution guide for the frontend implementation owner
Project: Greedy Sweeper
Round budget: 16 rounds; rounds 1-12 main delivery, rounds 13-15 repair buffers, round 16 final validation

## 0. Direct Goal Prompt

Reconstruct the accepted CSS Lunar Console interface from the frozen frontend contracts. Work fixture-first and component-first, then connect the existing local and online controllers only through versioned presentation adapters. Preserve game-core and online Match Authority as the behavior sources of truth, preserve the current public Free Beta, and replace the production UI only after deterministic state fixtures, responsive behavior, accessibility, visual baselines, local integration, and online integration pass. Every round must validate, commit, and push before the next round begins.

## 1. Required Context

Read before changing code:

- `README.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `CONTEXT.md`, `CONTRIBUTING.md`, and `Role.md`
- `docs/frontend-reconstruction/README.md` and every contract linked from it
- `docs/frontend-reconstruction/validation-report.md`
- ADR-0031, ADR-0032, and ADR-0033
- ADR-0007 and ADR-0025 for command authority and separate controllers
- `docs/phase-6c-validation-report.md`
- existing `apps/web` UI, local controller, online controller, tests, build, and Pages smoke workflows
- `$donextgoal`, `$project-git-workflow`, and the repository contribution workflow

Accepted planning baseline: commit `ad0e0f9fa6fbcb5b4def3e744884bdfea7108ee5`.

## 2. Phase Goal

- Deliver the approved CSS Lunar Console visual system with local WOFF2 fonts, centralized `--gs-*` tokens, semantic DOM/CSS, and small inline SVG only.
- Build one shared visual component tree for local, replay, and online modes.
- Make every important normal, empty, pending, error, reconnect, pause, replay, terminal, and reduced-motion state reproducible through deterministic fixtures.
- Implement explicit wide, medium-wide, medium-narrow, and compact reflow; do not scale the desktop layout down as a single image.
- Add pinned screenshot and geometry regression coverage before connecting controllers.
- Map local and online state through separate adapters into a versioned UI View Model and Presentation Effects.
- Preserve authoritative online behavior: no optimistic board, score, POT, multiplier, turn, Bank, or terminal settlement.
- Cut over through one dedicated reversible commit only after old and new functional behavior, accessibility, visual, build, and public Free Beta smoke gates pass.

## 3. Fixed Decisions

### 3.1 Evidence and authority

- Behavior/data precedence: game-core or authoritative online state, then UI View Model, then visual artifacts.
- Visual precedence: approved written contracts and ADRs, then Visual Master `V-01`, then artist-history prose, then rejected historical images.
- Written corrections override image defects, including the red LOCKED indicator, always-on Reward Circuit, and overly bright inactive AI state.

### 3.2 Visual ownership

- Visual tokens live once under the visual layer and use the `--gs-*` namespace.
- Shared visual components own DOM, CSS, accessibility, and presentation only.
- Raw approved colors, arbitrary shadows, arbitrary duration values, component-local z-index values, inline layout styles, and copied mobile/online component trees are forbidden.
- Sprites, bitmap textures, photoreal hardware, screws, vacuum tubes, chrome, and decorative continuous glow are forbidden.

### 3.3 Integration ownership

- Local and online controllers remain separate.
- Presentation adapters map controller state into the versioned UI View Model and emit Presentation Effects; they do not execute rules.
- Visual components do not import game-core, online protocol, controllers, storage, Worker, or Durable Object modules.
- Hidden online board state never enters fixtures, View Models, screenshots, errors, or browser logs.
- The online Bank sequence starts only from the matching advanced authoritative snapshot, not command submission or receipt alone.

### 3.4 Reference and accessibility

- Pinned Chromium at 1920x1080 CSS pixels, DPR 1, and 100% zoom is the primary reference.
- Chromium owns the full matrix; Firefox and WebKit own the key-state compatibility matrix.
- Compact board cells and interactive controls use a 44px minimum target.
- `prefers-reduced-motion` and minimal-motion mode remove travel, pulse, and dash flow while preserving state meaning and announcements.
- Screenshots wait for local fonts and deterministic readiness; fallback-font captures fail.

## 4. Explicit Non-Scope

- No gameplay, scoring, AI, balance, challenge, replay protocol, progression semantics, room lifecycle, or online authority changes.
- No new account, matchmaking, ranking, chat, spectator, rematch, or social features.
- No Worker/Durable Object deployment, Cloudflare Pages project, custom domain, DNS, DNSSEC, repository visibility, billing, or Workers Paid change.
- No whole-design regeneration and no new art direction.
- Do not edit or stage `docs/domain-migration/**` or unrelated concurrent files.
- Do not weaken existing tests, security gates, architecture guards, Free Beta smoke, or Pages rollback behavior.

## 5. Delivery and Dependency Model

The phase is fixture-first and controller-last. Rounds 2-8 may prepare nonconflicting assets and fixtures in parallel, but commits remain focused and serially gated. Adapter work begins only after component contracts and visual baselines are green. Online integration begins only after the local adapter proves the View Model seam.

Strict order:

1. Red architecture and visual-regression guards.
2. Tokens, fonts, primitives, fixture schema, and static shared components.
3. Responsive and complete state matrix.
4. Screenshot/geometry baselines.
5. Local adapter.
6. Online adapter and authoritative effects.
7. Reversible production UI cutover.
8. Existing Pages and public Free Beta smoke.

## 6. Per-Round Fixed Workflow

Every round response must include:

- round goal and player-visible value
- completed files and component/adapter boundary changes
- smallest deterministic fixture or workflow proving the change
- Debug self-check
- architecture and visual-contract self-check
- validation commands and exact results
- commit hash, branch, and push result
- next round and whether a buffer round was consumed

Progression rules:

- A failed validation blocks commit and the next round.
- A failed commit or push blocks the next round.
- Stage only phase-owned files; preserve `docs/domain-migration/**` and unrelated changes.
- Use Conventional Commits; never use `--no-verify`, force push, destructive Git, or bulk screenshot-baseline acceptance.
- A baseline-changing author cannot be the only approver.

## 7. Debug Self-Check

- Can the change be reproduced by one named deterministic fixture without a network dependency?
- Can failure be localized to token, font, primitive, component, reflow, screenshot harness, local adapter, online adapter, effect deduplication, or cutover?
- Are normal, empty, pending, failure, stale, reconnect, reduced-motion, and terminal states covered where relevant?
- Do keyboard, pointer, touch, focus restoration, live-region, overflow, and text-expansion paths remain usable?
- Does reconnect or rerender avoid replaying an already-consumed Presentation Effect?
- If a screenshot moves, is geometry separately asserted and is the baseline update explicit?
- If a controller is connected, does its previous behavioral test remain unchanged or receive an equivalent stronger assertion?

## 8. Architecture and Visual Self-Check

- Are game-core and online Match Authority still the sole behavior sources of truth?
- Do visual components consume only the UI View Model, intents, and Presentation Effects?
- Are local and online controllers still separate?
- Is there exactly one shared GameBoard and one shared set of gameplay components?
- Are hidden state, credentials, room secrets, and source-identifying data absent from visual surfaces and fixtures?
- Are all raw visual values represented by accepted tokens or a documented Visual Exception?
- Does responsive behavior reflow rather than duplicate or proportionally shrink the whole UI?
- Does online pending state retain the last authoritative snapshot and lock conflicting commands?
- Did the round avoid deployment-topology, domain, billing, and unrelated feature scope?

## 9. Validation Matrix

Focused gates introduced during this phase must become reusable package scripts and CI gates where practical. Use repository-native names; the final matrix must cover:

```text
npm run format:check
npm run lint
npm run test:run
npm run ai:evaluate
npm run greed:evaluate
npm run progression:evaluate
npm run protocol:evaluate
npm run online:evaluate
npm run worker:test
npm run online:e2e
npm run online:resilience
npm run online:security
npm run workspace:check
npm run arch:check
npm run build
npm run visual:test
npm run visual:regression
git diff --check
```

If `visual:test` or `visual:regression` does not exist at phase start, create it in the round that introduces the corresponding harness. Do not invent passing placeholders. The final public gate also runs the existing GitHub Pages deployment and public Free Beta HTTPS/WSS smoke against the cutover commit.

## 10. Round Plan

1. **Red gates and fixture contract**: add architecture scans for forbidden visual imports/inline values/duplicate boards, define the versioned UI View Model fixture catalog, freeze screenshot environment, and capture current functional behavior without approving the old look.
2. **Fonts, tokens, and primitive surfaces**: package licensed local WOFF2 subsets and manifests; implement tokens, reset, shell/panel/button/label primitives, focus behavior, glyph checks, and contrast checks.
3. **Static AppShell and desktop composition**: build fixture-only top score capsules, left configuration panel, central board region, right Greed panel, and utility dock for 1920 and 1440 layouts.
4. **Shared board and gameplay components**: implement the semantic 16x16 GameBoard, cells, mine counter, turn message, score states, keyboard navigation, focus, and geometry assertions without importing rules.
5. **Greed signature and confirmed Bank effect**: implement multiplier columns, POT, Bank states, 2px Reward Circuit, the finite 800ms confirmed sequence, reduced/minimal motion, live announcements, and replay-safe effect fixtures.
6. **Utility, history, replay, progression, and room states**: implement shared drawers/panels and every accepted empty, waiting, error, reconnect, replaced, abandoned, verification-failed, verified, and terminal state using fixtures only.
7. **Responsive reflow and input behavior**: implement medium-wide, medium-narrow, 768, 390, and 360 layouts; board-first ordering, compact decision strip, two-axis board viewport, 44px targets, focus restoration, overflow, and long-copy behavior.
8. **Visual harness and accepted baselines**: add pinned Chromium full-matrix screenshots, geometry assertions, DPR coverage, Firefox/WebKit key states, artifact reporting, deterministic readiness, explicit baseline governance, and no bulk update path.
9. **Local presentation adapter**: move presentation derivation out of `GameScreen`, connect local/random/challenge/daily/replay/progression flows through the versioned View Model, and preserve existing rules and tests.
10. **Online presentation adapter**: replace the duplicate `OnlineBoard`, connect room lifecycle and authoritative snapshots to shared components, deduplicate Presentation Effects by source revision, and prove no optimistic Bank/board/score/turn behavior.
11. **Integrated accessibility and compatibility**: exercise local and online workflows across keyboard/touch/reduced motion, Chromium/Firefox/WebKit, reconnect, replay, terminal verification, error recovery, and compact layouts; repair only contract deviations.
12. **Reversible cutover and public Free Beta smoke**: switch production UI in one dedicated commit, retain a documented rollback target, run the full local matrix, deploy through the existing GitHub Pages workflow, and pass public page plus Classic/Greed/reconnect HTTPS/WSS smoke. Do not change deployment topology.
13. **Buffer 1**: repair only rounds 1-12 failures; no speculative enhancement.
14. **Buffer 2**: repair only rounds 1-12 failures; no speculative enhancement.
15. **Buffer 3**: repair only rounds 1-12 failures; no speculative enhancement.
16. **Final validation**: rerun the complete matrix from a clean checkout-equivalent state, audit architecture and visual boundaries, verify remote Pages/Free Beta behavior, and write `docs/phase-7-validation-report.md`.

## 11. Hard Gates

| Gate                 | PASS evidence                                                                                        | Failure action            |
| -------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------- |
| Authority            | local rules and online authority unchanged; no optimistic online mutation                            | block integration/cutover |
| Hidden information   | fixtures, View Models, DOM, logs, screenshots, and errors expose no hidden online state              | block release             |
| Visual contract      | tokens, component states, reference precedence, and Visual Exceptions are enforced                   | block baseline approval   |
| Responsive           | accepted viewports reflow with board priority, 44px targets, and usable focus/overflow               | block cutover             |
| Accessibility        | keyboard, focus, contrast, live regions, labels, reduced motion, and touch pass                      | block cutover             |
| Regression           | deterministic screenshots and geometry assertions pass in the accepted matrix                        | block cutover             |
| Local compatibility  | random/challenge/daily/replay/progression behavior remains covered                                   | block cutover             |
| Online compatibility | Classic/Greed, pending, reconnect, replacement, terminal verification, and effect deduplication pass | block cutover             |
| Public Free Beta     | Pages plus HTTPS/WSS Classic/Greed/reconnect smoke pass after cutover                                | roll back cutover         |

## 12. PASS Criteria

- The approved CSS Lunar Console direction is recognizable and implemented without forbidden raster/physical-console shortcuts.
- Tokens, fonts, components, fixtures, responsive behavior, and visual baselines match the frozen contracts.
- One shared component tree serves local, replay, and online flows through separate adapters.
- No visual component imports or duplicates gameplay, protocol, controller, storage, Worker, or Durable Object semantics.
- Online visual changes follow authoritative snapshots and deduplicated Presentation Effects only.
- Accessibility, responsive, visual-regression, local, online, architecture, build, and public Free Beta gates pass.
- The cutover is isolated, reversible, pushed, remotely verified, and recorded without changing deployment topology.
- Concurrent domain-migration and unrelated files remain untouched.

## 13. Final Report Template

```text
Phase: Phase 7 - CSS Lunar Console Frontend Reconstruction and Controlled Integration
Status: PASS | BLOCKED
Rounds used: <main>/<buffer>/<final>
Visual system: <tokens/fonts/primitives evidence>
Components/states: <fixture and shared-component evidence>
Responsive/accessibility: <viewport/input/a11y evidence>
Visual regression: <browser/DPR/baseline/geometry evidence>
Local adapter: <random/challenge/daily/replay/progression evidence>
Online adapter: <authority/pending/reconnect/terminal/effect evidence>
Cutover/rollback: <commit and rollback target>
Public Free Beta: <Pages run and HTTPS/WSS smoke>
Validation: <commands and exact results>
Commits: <round -> hash>
Remote: origin/main <push result>
Concurrent exclusions: <domain-migration and unrelated evidence>
Visual Exceptions: <none or accepted identifiers>
Residual risks: <explicit accepted risks only>
Return to planner: 019f6768-2328-76f2-a6e4-da752c6eb85c
```
