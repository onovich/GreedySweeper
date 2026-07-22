# Frontend Reconstruction Planning Validation Report

Status: READY_FOR_CHECK after planning-only commit and push.

- Date: 2026-07-23
- Owner: frontend / task `019f7bae-ad15-70b1-a8b3-29729e5ae289`
- Architect route: task `019f6768-2328-76f2-a6e4-da752c6eb85c`

## Scope

This report validates documentation-only planning for reconstructing Greedy Sweeper's CSS Lunar Console UI. No React, CSS, game-core, protocol, Worker/Durable Object, test, build, deployment, or production UI implementation is included.

## Evidence reviewed

- Final Visual Master `V-01`, 1672×941, SHA-256 `9CB3A0A11BD745913E2EC16B6F7E01F00F5E87950582BFF6C9649C273FA88251`.
- Rejected historical image `H-01`, SHA-256 `04C23E1556A51AFFAB17C0D2941435C52BD956D05EE1B12589B2E7C02886132F`.
- Heavy accumulator historical image `H-02`, SHA-256 `3CCF412EFBCE9396BCEC97A150E1DCDB096F755081542F38ABBD6C85D9F91F68`.
- Complete artist-task history `019f7016-1c79-7682-879a-9589a7691bb4`.
- Architect acceptance and repair route from `019f6768-2328-76f2-a6e4-da752c6eb85c`.
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md), [`ADR-0007`](../adr/0007-command-driven-authoritative-synchronization.md), [`ADR-0025`](../adr/0025-separate-local-and-online-controllers.md), and [`phase-6b-boundary-contract.md`](../phase-6b-boundary-contract.md).
- Current local/online controllers and UI components, inspected read-only to identify integration states and migration gaps.

## Decisions resolved

| Decision                       | Accepted outcome                                                                                              | Evidence / contract                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence conflicts             | Dual track: behavior/authority before View Model/art; written visual contract before `V-01`/history           | [`reference-source-of-truth.md`](./reference-source-of-truth.md), ADR-0032                                                             |
| Visual system                  | CSS-native Lunar Console, semantic DOM/CSS/small SVG, no sprite or photoreal hardware dependency              | [`visual-token-contract.md`](./visual-token-contract.md), ADR-0031                                                                     |
| Desktop reference              | Pinned Chromium, 1920×1080 CSS px, DPR 1, 100% zoom                                                           | [`visual-regression-workflow.md`](./visual-regression-workflow.md)                                                                     |
| Browser support                | Latest/current two stable family policy; pinned Chromium full matrix; Firefox/WebKit key states               | [`visual-regression-workflow.md`](./visual-regression-workflow.md)                                                                     |
| Responsive behavior            | Three-column wide, two-column medium-wide, board-first medium-narrow, 44px two-axis board viewport on compact | [`responsive-reflow-contract.md`](./responsive-reflow-contract.md)                                                                     |
| Persistent compact information | scores, remaining mines, status, board, and Greed decision remain outside utility drawers                     | [`responsive-reflow-contract.md`](./responsive-reflow-contract.md)                                                                     |
| Fonts                          | Local WOFF2 Noto Sans SC UI subset + IBM Plex Mono data subset; system fallbacks; font-ready screenshots      | [`visual-token-contract.md`](./visual-token-contract.md)                                                                               |
| Motion                         | 800ms confirmed Bank sequence; no optimistic online flow; reduced/minimal motion removes travel/pulse         | [`component-anatomy-and-states.md`](./component-anatomy-and-states.md), [`visual-token-contract.md`](./visual-token-contract.md)       |
| Component states               | Normal, empty, waiting, pending, error, reconnect, pause, replay, and terminal states frozen                  | [`component-anatomy-and-states.md`](./component-anatomy-and-states.md)                                                                 |
| Integration                    | Separate controllers → adapters → versioned UI View Model/effects → shared components                         | [`backend-integration-contract.md`](./backend-integration-contract.md), ADR-0033                                                       |
| Integration order              | Evidence/tokens → fixture shell → states/reflow → screenshots → local adapter → online adapter → cutover      | [`frontend-delivery-workflow.md`](./frontend-delivery-workflow.md)                                                                     |
| Pixel tolerance                | Chromium threshold `0.18`, ratio 0.15% DPR1 / 0.25% DPR2; geometry remains separately blocking                | [`visual-regression-workflow.md`](./visual-regression-workflow.md)                                                                     |
| Approval                       | Author triages; Visual Owner reviews; architect approves exceptions/baseline contract changes                 | [`visual-regression-workflow.md`](./visual-regression-workflow.md), [`frontend-delivery-workflow.md`](./frontend-delivery-workflow.md) |
| Exceptions/rollback            | Documented `VE-YYYY-NNN`; no bulk baseline acceptance; dedicated final cutover commit is reverted on failure  | [`frontend-delivery-workflow.md`](./frontend-delivery-workflow.md)                                                                     |

## Architecture boundary validation

- `game-core` remains the local rules/scoring/turn authority.
- Online Match Authority and its snapshots remain canonical; no optimistic board, score, POT, multiplier, or turn update is permitted.
- Local and online controllers remain separate as required by ADR-0025.
- Presentation adapters own mapping only; they do not execute rules or receive hidden online board data.
- Visual components own DOM/CSS/accessibility presentation only and do not import controllers, core, protocol, Worker, Durable Object, or storage modules.
- Backend functionality extends the UI through View Model fields/states and deterministic fixtures, not CSS/DOM changes.
- One shared GameBoard and shared state components serve local, replay, and online modes.

## Planning-owned files

- `Role.md`
- `CONTEXT.md`
- `README.md`
- `docs/adr/0031-use-a-css-native-lunar-console-visual-system.md`
- `docs/adr/0032-use-dual-track-frontend-evidence-precedence.md`
- `docs/adr/0033-integrate-visual-components-through-view-model-adapters.md`
- `docs/frontend-reconstruction/README.md`
- `docs/frontend-reconstruction/reference-source-of-truth.md`
- `docs/frontend-reconstruction/visual-token-contract.md`
- `docs/frontend-reconstruction/component-anatomy-and-states.md`
- `docs/frontend-reconstruction/responsive-reflow-contract.md`
- `docs/frontend-reconstruction/backend-integration-contract.md`
- `docs/frontend-reconstruction/visual-regression-workflow.md`
- `docs/frontend-reconstruction/frontend-delivery-workflow.md`
- `docs/frontend-reconstruction/glossary.md`
- `docs/frontend-reconstruction/validation-report.md`

## Validation

The repair route explicitly limits this documentation-only change to documentation checks; implementation test suites are not run.

| Check                                               | Result                                                                |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| Prettier formatting for planning-owned Markdown     | PASS — all 16 selected files match Prettier                           |
| Required file and decision-term presence            | PASS — 13 required contract/ADR files and 12 decision terms           |
| Relative Markdown link resolution                   | PASS — 61 links resolved across 15 indexed files                      |
| UTF-8 without BOM                                   | PASS — 17 relevant root/planning/ADR files audited                    |
| Forbidden scope/import/implementation file audit    | PASS — no `apps/**`, `packages/**`, workflow, or deployment changes   |
| `git diff --check`                                  | PASS                                                                  |
| Explicit staged-path and concurrent-exclusion audit | PASS — 16 selected files; `docs/domain-migration/**` remains excluded |

## Known migration gaps

- Current `GameScreen.jsx` imports game-core config/selectors and computes presentation state; the local adapter must absorb that mapping.
- Current `OnlineRoomPanel.jsx` contains a separate `OnlineBoard`; it must be replaced by the shared GameBoard through the online adapter.
- Current GameBoard sets its column template with inline style; the supported 16×16 contract must move to reviewed stylesheet classes/tokens.
- Current compact cells are 20px and do not meet the future 44px compact touch/scroll contract.

These gaps are documented inputs for future slices, not changes in this planning repair.

## Residual risks

| Risk                                                                               | Owner / mitigation point                                                                                |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Temporary Visual Master files may expire                                           | Visual Owner; hashes/dimensions/history are frozen, and missing pixels do not authorize invention       |
| Font subset size, license packaging, and glyph coverage are not yet measured       | Slice B owner; manifest, missing-glyph test, and performance budget before baseline approval            |
| Two-axis compact board panning may need usability tuning                           | Slice D owner; 360/390px touch tests, gesture cancellation, focus restoration                           |
| Initial pixel thresholds may expose runner-specific font/AA drift                  | Slice E owner; pin environment, calibrate through explicit review, never weaken geometry or bulk-accept |
| Firefox/WebKit layout and SVG stroke rendering may differ                          | Slice E owner; engine-specific key baselines and Tier 1 smoke                                           |
| Adapter migration could accidentally duplicate settlement effects across reconnect | Slice G owner; source-revision deduplication tests                                                      |

## Readiness

Planning and documentation validation are complete. The package is **READY_FOR_CHECK** after its planning-only commit is pushed. The architect must rerun CheckAndGoal before UI implementation or the next phase starts.
