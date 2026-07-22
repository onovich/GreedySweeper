# Frontend Reconstruction Reference Source of Truth

Status: accepted. Evidence inventory verified on 2026-07-20; dual-track precedence accepted by the architect on 2026-07-23.

## Purpose

This document identifies the visual evidence for reconstructing Greedy Sweeper's gameplay UI. It freezes what was approved or rejected without treating generated-image mistakes as new product behavior.

## Evidence inventory

| ID     | Evidence                                                                                             | Availability                 | Integrity / dimensions                                                               | Intended use                                              |
| ------ | ---------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `V-01` | `C:\Users\Administrator\AppData\Local\Temp\codex-clipboard-102e6af2-cabf-43cc-8e15-e3ddf8e8c218.png` | Verified 2026-07-20          | SHA-256 `9CB3A0A11BD745913E2EC16B6F7E01F00F5E87950582BFF6C9649C273FA88251`; 1672×941 | Final approved programmatic UI visual master              |
| `H-01` | `C:\Users\Administrator\AppData\Local\Temp\codex-clipboard-1a526f14-e970-4bf9-8be2-747450a73357.png` | Verified 2026-07-20          | SHA-256 `04C23E1556A51AFFAB17C0D2941435C52BD956D05EE1B12589B2E7C02886132F`; 1672×941 | Rejected early industrial-console direction               |
| `H-02` | `C:\Users\Administrator\AppData\Local\Temp\codex-clipboard-a4afed77-c4bb-463a-a04b-0562b9b7638d.png` | Verified 2026-07-20          | SHA-256 `3CCF412EFBCE9396BCEC97A150E1DCDB096F755081542F38ABBD6C85D9F91F68`; 1672×941 | Historical heavy accumulator / vacuum-tube direction      |
| `T-01` | Artist task `019f7016-1c79-7682-879a-9589a7691bb4`                                                   | Full history read 2026-07-20 | Seven turns, including all three named images and final approval                     | Written rationale, approvals, rejections, and corrections |
| `R-01` | Architect route from task `019f6768-2328-76f2-a6e4-da752c6eb85c`                                     | Present in this task         | Routes the approved art conclusions and architectural boundaries                     | Planning constraints and required interview decisions     |

The 1672×941 asset dimensions describe the generated evidence only. They are not the browser screenshot baseline. The executable baseline environment is frozen in [`visual-regression-workflow.md`](./visual-regression-workflow.md).

## Accepted precedence

The two tracks must never be collapsed into one ranking:

1. **Behavior and data:** local `game-core` results or authoritative online state → UI View Model contract → visual artifacts.
2. **Visual presentation:** approved written visual contracts and ADRs → final Visual Master `V-01` → artist-task historical prose → rejected historical images `H-02` and `H-01`.

The current production UI is evidence of required functionality and existing integration seams only. It has no visual authority. If local `game-core` and an authoritative online snapshot ever appear to disagree, the UI must stop presentation inference and surface the integration failure; it must not pick the prettier result.

## Approved direction

- Direction name: **CSS Lunar Console / 月面软仪表**.
- Use DOM, CSS Grid/Flex, borders, radii, gradients, shadows, pseudo-elements, and a small amount of inline SVG.
- Do not use sprites, bitmap textures, photorealistic hardware, screws, glass tubes, mechanical levers, or complex chrome reflections.
- Palette: deep space `#071416`; lunar white `#D6D4C3`; deep emerald `#102E2D`; emerald panel `#173F3C`; player blue `#3182E8`; AI red `#D45248`; amber `#F0A62E`; main text `#E9E7D8`; muted text `#79918C`.
- Use an 8px spacing system, radii of 4/16/32px, and 1/2px borders. Each component may have at most one background gradient, one inner shadow, and one outer shadow.
- Keep the board as the visual center. Desktop uses a three-column composition with the board at about 60%, locked match configuration on the left, and Greed/POT/Bank on the right.
- The identifying elements are the segmented amber `×1 / ×2 / ×3` columns, the Bonus Pot, and the 2px Reward Circuit.
- Bank settles the Bonus Pot into the score and ends the turn. Online presentation must wait for Authoritative Confirmation before portraying settlement.
- The final bitmap is a desktop art-direction reference. Responsive reflow, exact typography, sizing, accessibility, and interaction must be resolved in real browser prototypes rather than inferred by shrinking the bitmap.

## Written corrections that override `V-01`

- `LOCKED` is drawn with a red point, while the approved written correction assigns neutral gray-green or dim amber to lock state.
- The inactive AI capsule remains visually strong, while the approved correction reduces inactive AI emphasis by about 25% without sacrificing readable text.
- The Reward Circuit appears persistently bright, while the approved behavior keeps it at 15%–20% opacity at rest and animates energy flow only for confirmed Bank settlement.
- Generated board numbers, flags, labels, and scores illustrate composition; game-core and authoritative snapshots own actual gameplay state.

## Rejected inheritance

- `H-01`: dense feature overview, repeated bilingual labels, screws, knobs, mechanical counters, equal-weight panels, and generic industrial-console styling.
- `H-02`: photorealistic shell, vacuum tubes, liquid/heat treatment, heavy physical Bank lever, complex reflections, and a silhouette too expensive to reproduce responsively.
- Do not create a third style to reconcile these directions. Historical images explain rejected branches; they do not contribute missing details to the final visual system.

## Temporary-source risk

All three image files currently live under a temporary directory. If an image later disappears, retain its path, hash, dimensions, and the artist-task conclusions as an explicit evidence record. Missing pixels are an evidence gap, not permission to invent a new style.

## Decision record

- [`ADR-0031`](../adr/0031-use-a-css-native-lunar-console-visual-system.md) freezes the CSS-native visual direction.
- [`ADR-0032`](../adr/0032-use-dual-track-frontend-evidence-precedence.md) freezes evidence precedence.
- [`ADR-0033`](../adr/0033-integrate-visual-components-through-view-model-adapters.md) freezes the integration boundary.
