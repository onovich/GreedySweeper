# Frontend Reconstruction Plan

Status: planning accepted by architect CheckAndGoal. Phase 7 implementation is authorized only through the linked execution guide and its per-round gates.

## Objective

Reconstruct the approved **CSS Lunar Console / 月面软仪表** direction as accessible, responsive, deterministic visual components while preserving local game-core and online Match Authority boundaries.

## Frozen decisions

- Behavior/data precedence: local game-core or authoritative online state → UI View Model → visual artifacts.
- Visual precedence: approved written contracts/ADRs → final Visual Master `V-01` → artist-history prose → rejected historical images.
- Rendering: semantic DOM, CSS primitives, and small inline SVG; no sprites, bitmap textures, photorealistic hardware, or duplicated mobile/online component trees.
- Integration: separate local and online controllers map through versioned presentation adapters into shared components.
- Delivery: deterministic fixtures and visual baselines precede real controller integration; production UI changes only in the final cutover slice.

## Contract index

| Document                                                               | Purpose                                                                        |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`reference-source-of-truth.md`](./reference-source-of-truth.md)       | Visual evidence, approvals, rejections, and precedence                         |
| [`visual-token-contract.md`](./visual-token-contract.md)               | Color, typography, spacing, size, depth, layer, font, and motion tokens        |
| [`component-anatomy-and-states.md`](./component-anatomy-and-states.md) | Shared component anatomy and complete state matrix                             |
| [`responsive-reflow-contract.md`](./responsive-reflow-contract.md)     | Wide, tablet, and compact reflow, touch, focus, and overflow behavior          |
| [`backend-integration-contract.md`](./backend-integration-contract.md) | UI View Model, Presentation Effects, intents, adapters, and authority boundary |
| [`visual-regression-workflow.md`](./visual-regression-workflow.md)     | Fixtures, browsers, viewports, DPR, thresholds, approval, and baseline updates |
| [`frontend-delivery-workflow.md`](./frontend-delivery-workflow.md)     | Slice order, self-checks, exceptions, validation, cutover, and rollback        |
| [`glossary.md`](./glossary.md)                                         | Canonical frontend reconstruction language                                     |
| [`validation-report.md`](./validation-report.md)                       | Planning evidence, validation, residual risks, and readiness                   |

## Architecture decisions

- [`ADR-0031: Use a CSS-native Lunar Console visual system`](../adr/0031-use-a-css-native-lunar-console-visual-system.md)
- [`ADR-0032: Use dual-track frontend evidence precedence`](../adr/0032-use-dual-track-frontend-evidence-precedence.md)
- [`ADR-0033: Integrate visual components through View Model adapters`](../adr/0033-integrate-visual-components-through-view-model-adapters.md)

## Implementation entry gate

The architect accepted [`validation-report.md`](./validation-report.md). Implementation follows the [Phase 7 controlled reconstruction guide](../phase-7-css-lunar-console-frontend-reconstruction-goal-mode-execution-guide.md); the first slice is tokens/fonts and fixture-only primitives, not a rewrite of game-core, protocol, Worker/Durable Object behavior, or deployment topology.
