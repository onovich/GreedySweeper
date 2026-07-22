# Visual Regression Workflow

Status: accepted for implementation planning. Visual regression proves the written contracts; it does not turn current output into the specification.

## Baseline renderer and reference environment

The primary executable reference is a pinned Playwright Chromium build recorded by the future visual-test lockfile. It is separate from Visual Master `V-01`.

Primary desktop reference settings:

| Setting             | Value                                                             |
| ------------------- | ----------------------------------------------------------------- |
| viewport            | `1920 × 1080` CSS pixels                                          |
| device scale factor | `1`                                                               |
| browser             | Playwright-bundled Chromium, exact revision pinned                |
| zoom                | `100%`                                                            |
| locale              | `zh-CN`                                                           |
| timezone            | `Asia/Shanghai`                                                   |
| color scheme        | `dark`                                                            |
| reduced motion      | `reduce` for steady-state screenshots                             |
| fonts               | repository-owned WOFF2 assets; wait for `document.fonts.ready`    |
| network             | blocked except the local test server; no CDN/font/room dependency |

The test manifest records browser revision, OS runner image, Node version, viewport, DPR, locale, font asset hashes, fixture ID, View Model schema version, and Git commit.

## Browser support policy

| Tier                | Browser family                                                                                      | Requirement                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Tier 1 desktop      | current and previous stable Chrome, Edge, Firefox, and Safari major releases                        | Full functional/accessibility smoke; approved layout must remain usable                     |
| Tier 1 mobile       | current and previous iOS Safari major releases; current and previous Android Chrome stable releases | Touch, scroll-board, safe-area, and utility-flow smoke                                      |
| Baseline engine     | pinned Playwright Chromium                                                                          | Full screenshot matrix and blocking pixel diff                                              |
| Cross-engine visual | pinned Playwright Firefox and WebKit                                                                | Key-state screenshots at one desktop and one mobile viewport with engine-specific baselines |

Internet Explorer and legacy embedded browsers are out of scope. The policy advances with releases; implementation reports record the exact tested versions rather than silently changing the policy.

## Screenshot viewport matrix

| ID                 | Viewport    | DPR | Purpose                                       |
| ------------------ | ----------- | --- | --------------------------------------------- |
| `desktop-1920`     | `1920×1080` | `1` | Primary Visual Master reconstruction baseline |
| `desktop-1440`     | `1440×900`  | `1` | Compact desktop three-column boundary         |
| `tablet-landscape` | `1180×820`  | `1` | Two-column reflow                             |
| `tablet-portrait`  | `820×1180`  | `1` | Board-first single-column reflow              |
| `mobile-primary`   | `390×844`   | `2` | Primary compact touch and safe-area layout    |
| `mobile-narrow`    | `360×800`   | `2` | Narrow overflow and text stress               |

Firefox/WebKit key-state runs use `desktop-1440` and `mobile-primary`. A separate non-pixel accessibility run covers desktop at 200% browser zoom.

## Deterministic fixtures

Fixtures are validated UI View Model v1 objects with fixed copy, scores, board cells, room codes, sequence/revision, and Presentation Effects. They do not use live controllers, time, randomness, storage, Worker, or network.

Minimum fixture catalog:

| Fixture ID                         | State proven                                                 |
| ---------------------------------- | ------------------------------------------------------------ |
| `local-setup-greed`                | editable mode/difficulty/style, empty interaction history    |
| `local-greed-player-x3-pot18`      | reference player turn, 240–180, remaining 23, Bank enabled   |
| `local-greed-bank-pending`         | pending lock with no optimistic score/POT movement           |
| `local-greed-bank-confirmed-start` | deterministic effect progress `0`                            |
| `local-greed-bank-confirmed-mid`   | deterministic effect progress `0.5`                          |
| `local-greed-bank-confirmed-end`   | deterministic effect progress `1`, settled score and handoff |
| `local-greed-pot-lost`             | wrong flag/mine and confirmed POT loss                       |
| `local-classic-active`             | no Greed panel or Reward Circuit                             |
| `local-ai-turn`                    | inactive player and active AI lock state                     |
| `replay-midpoint`                  | replay lock, step controls, stable board projection          |
| `local-terminal-win`               | final board and result actions                               |
| `utility-empty-record`             | empty record/progression drawer                              |
| `room-review`                      | immutable online rules and accept action                     |
| `online-command-pending`           | last authoritative snapshot preserved                        |
| `online-reconnecting`              | reconnect message and locked shared board                    |
| `online-paused`                    | server-paused state                                          |
| `online-command-rejected`          | stable state plus recoverable error                          |
| `online-replaced`                  | seat-replaced terminal alert                                 |
| `online-abandoned`                 | no-winner terminal state                                     |
| `online-verification-failed`       | integrity failure, no verified result                        |
| `online-verified-terminal`         | verified result and progression eligibility                  |
| `long-copy-stress`                 | longest approved Chinese/error/room copy                     |

Bank animation frames are selected through a test-only deterministic effect-progress seam. Tests do not wait 400ms or capture a wall-clock race.

## Screenshot setup

Before every capture:

1. load exactly one fixture by stable ID;
2. block unexpected network requests;
3. wait for local fonts and application readiness;
4. set fixed locale, timezone, color scheme, and motion preference;
5. disable caret blink, selection highlight, and unrelated transition clocks through the visual-test harness;
6. reset scroll, then apply the fixture's explicit board/drawer scroll position;
7. assert no console error, missing glyph, View Model validation error, or horizontal page overflow;
8. capture the named component/page region.

No fixture may randomize mine placement, room code, timestamp, score, copy, or active tab.

## Naming and storage

```text
apps/web/tests/visual/__screenshots__/
  {engine}/
    {viewport-id}@{dpr}x/
      {fixture-id}--{target}.png
```

Examples:

```text
chromium/desktop-1920@1x/local-greed-player-x3-pot18--app-shell.png
chromium/mobile-primary@2x/online-reconnecting--app-shell.png
webkit/mobile-primary@2x/local-greed-player-x3-pot18--game-board.png
```

Diff and actual-output artifacts are CI outputs and are not committed. Approved baseline PNGs, the manifest, and the approval record are committed together.

## Pixel and geometry thresholds

Primary Chromium thresholds:

| Matrix               | Per-pixel threshold | Maximum differing pixel ratio |
| -------------------- | ------------------- | ----------------------------- |
| desktop/tablet DPR 1 | `0.18`              | `0.0015` (0.15%)              |
| mobile DPR 2         | `0.18`              | `0.0025` (0.25%)              |

Engine-specific Firefox/WebKit baselines use `0.20` and a maximum ratio of `0.0030` (0.30%). They are never compared directly to Chromium baselines.

Pixel tolerance handles normal glyph-edge anti-aliasing only. It does not excuse:

- a board, score, POT, Bank, or panel edge shifted by more than 1 CSS pixel;
- a cell/touch target below its contract minimum;
- clipped focus rings or text;
- the wrong semantic color/state;
- hidden content or unexpected page scrollbars.

Add DOM geometry assertions alongside screenshots for shell bounds, named grid regions, board square/cell sizes, 44px touch targets, Reward Circuit stroke width, and page overflow. A screenshot may pass its pixel ratio and still fail geometry.

## Masks and allowed variance

- Default: no masks.
- Deterministic fixtures remove timestamps, live room codes, carets, and network output rather than masking them.
- Text regions are not blanket-masked. Local fonts and the pixel threshold own anti-aliasing tolerance.
- A necessary mask requires a Visual Exception naming its selector, exact rectangle/region, reason, owner, and expiry. Masking the board, scores, Greed panel, Bank, status, or focus state is forbidden.

## Failure triage

The implementation author owns initial triage and labels the failure:

1. **behavior/data mismatch** — fixture or adapter violates game-core/authority; do not update a baseline;
2. **contract regression** — token, component, responsive, accessibility, or geometry contract changed unintentionally; fix the implementation;
3. **environment drift** — browser/font/runner revision changed; restore the pinned environment or deliberately requalify it;
4. **intentional visual change** — open a Visual Exception/baseline proposal;
5. **test defect** — fix determinism without weakening coverage.

Any diff affecting game meaning, command authority, hidden information, or terminal verification is escalated to the architect and relevant backend owner before visual review.

## Baseline update and approval

1. Reproduce the failure locally with the recorded manifest.
2. Review expected, actual, diff, geometry assertions, and the relevant written contract.
3. State the intentional change and why existing tokens/components cannot express the requirement unchanged.
4. Obtain Visual Owner review; obtain architect approval for a Visual Exception, source-of-truth change, responsive behavior change, or cross-component update.
5. Generate only the affected named baselines; bulk `update snapshots` is forbidden.
6. Commit baseline images, manifest changes, contract/exception record, and approval evidence together.
7. Re-run the complete matrix impacted by the changed token or shared component.

The author of a baseline-changing implementation cannot be its sole approver. Backend owners approve semantics, the Visual Owner approves presentation consistency, and the architect approves exceptions and evidence-precedence changes.

## Release gate

Production UI replacement is blocked until:

- all required fixtures exist and validate;
- the full Chromium matrix passes;
- Firefox/WebKit key states pass their own baselines;
- touch, keyboard, reduced-motion, 200% zoom, and contrast checks pass;
- no unapproved masks or Visual Exceptions remain;
- the local and online adapters prove authoritative/pending/reconnect behavior;
- the architect accepts the visual regression report.
