# Visual Token Contract

Status: accepted for implementation planning. This contract translates the approved CSS Lunar Console direction into one centrally owned token vocabulary.

## Ownership and placement

- The implementation must define these tokens once in a dedicated visual-layer stylesheet, planned as `apps/web/src/ui/theme/tokens.css`.
- Components consume semantic custom properties; they do not repeat raw color, spacing, radius, border, shadow, layer, or duration values.
- Tailwind utilities may express structure during migration only when they resolve to this contract. Arbitrary-value utilities and inline styles are not accepted production shortcuts.
- A new raw value requires either an existing token extension reviewed by the Visual Owner or a documented Visual Exception.
- Token names use the `--gs-` prefix. Component aliases may point to global tokens but may not redefine their raw value.

## Color primitives

| Token                      | Value     | Meaning                                                         |
| -------------------------- | --------- | --------------------------------------------------------------- |
| `--gs-color-deep-space`    | `#071416` | Page canvas and deepest negative space                          |
| `--gs-color-lunar-white`   | `#D6D4C3` | Lunar shell, strong light border, light field                   |
| `--gs-color-deep-emerald`  | `#102E2D` | Deep panel and recessed control surface                         |
| `--gs-color-emerald-panel` | `#173F3C` | Primary panel and hidden board cell                             |
| `--gs-color-player-blue`   | `#3182E8` | Human/player identity and active player cue                     |
| `--gs-color-ai-red`        | `#D45248` | AI identity; also aliased separately for danger/error semantics |
| `--gs-color-amber`         | `#F0A62E` | unsettled reward, multiplier, POT, Bank, Reward Circuit         |
| `--gs-color-text`          | `#E9E7D8` | Primary readable text                                           |
| `--gs-color-text-muted`    | `#79918C` | Secondary text and neutral locked state                         |

Semantic aliases must remain distinct even when they share a primitive:

| Token                   | Alias                      | Use                                 |
| ----------------------- | -------------------------- | ----------------------------------- |
| `--gs-surface-canvas`   | `--gs-color-deep-space`    | Browser background                  |
| `--gs-surface-shell`    | `--gs-color-lunar-white`   | Outer lunar frame                   |
| `--gs-surface-panel`    | `--gs-color-emerald-panel` | Standard panel                      |
| `--gs-surface-recessed` | `--gs-color-deep-emerald`  | Recessed board/control field        |
| `--gs-text-primary`     | `--gs-color-text`          | Labels and body copy                |
| `--gs-text-secondary`   | `--gs-color-text-muted`    | Supporting copy                     |
| `--gs-state-player`     | `--gs-color-player-blue`   | Player identity                     |
| `--gs-state-ai`         | `--gs-color-ai-red`        | AI/opponent identity                |
| `--gs-state-reward`     | `--gs-color-amber`         | Unsettled Greed reward only         |
| `--gs-state-locked`     | `--gs-color-text-muted`    | Locked configuration; never red     |
| `--gs-state-danger`     | `--gs-color-ai-red`        | Wrong flag, mine, destructive error |
| `--gs-state-focus`      | `--gs-color-text`          | Keyboard focus ring                 |

### Opacity

| Token                          | Value  | Use                                                             |
| ------------------------------ | ------ | --------------------------------------------------------------- |
| `--gs-opacity-circuit-rest`    | `0.18` | Reward Circuit at rest                                          |
| `--gs-opacity-circuit-off`     | `0.08` | Reward Circuit unavailable                                      |
| `--gs-opacity-inactive-accent` | `0.75` | Inactive player/AI border and accent, not text                  |
| `--gs-opacity-disabled`        | `0.48` | Disabled control ornament; readable label remains contrast-safe |
| `--gs-opacity-scrim`           | `0.72` | Blocking dialog scrim                                           |

Inactive score text must not inherit container opacity. Apply the inactive token only to identity borders, dots, and glow so labels retain WCAG AA contrast.

## Typography and font delivery

| Token                  | Value                                                                     |
| ---------------------- | ------------------------------------------------------------------------- |
| `--gs-font-ui`         | `"Noto Sans SC", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif` |
| `--gs-font-data`       | `"IBM Plex Mono", "Cascadia Mono", "SFMono-Regular", Consolas, monospace` |
| `--gs-weight-medium`   | `500`                                                                     |
| `--gs-weight-semibold` | `600`                                                                     |
| `--gs-weight-black`    | `900`                                                                     |
| `--gs-text-xs`         | `0.75rem`                                                                 |
| `--gs-text-sm`         | `0.875rem`                                                                |
| `--gs-text-md`         | `1rem`                                                                    |
| `--gs-text-lg`         | `1.25rem`                                                                 |
| `--gs-text-xl`         | `1.5rem`                                                                  |
| `--gs-text-score`      | `clamp(2rem, 3vw, 3rem)`                                                  |
| `--gs-text-title`      | `clamp(2rem, 4vw, 4rem)`                                                  |
| `--gs-leading-tight`   | `1.1`                                                                     |
| `--gs-leading-body`    | `1.5`                                                                     |
| `--gs-tracking-data`   | `0.04em`                                                                  |
| `--gs-tracking-label`  | `0.08em`                                                                  |

Font assets must be local WOFF2 files imported through Vite; runtime CDN font requests are forbidden. Package a reviewed UI-glyph subset of Noto Sans SC covering all shipped Simplified Chinese copy, digits, Latin labels, and punctuation, plus an ASCII/digit/punctuation subset of IBM Plex Mono. Keep the upstream license, source URL, subset manifest, and asset hash beside the fonts. Screenshot setup waits for `document.fonts.ready` and fails rather than approving fallback-font output. Any new UI copy must pass a missing-glyph check before merge.

## Spacing, radius, and border

The layout uses an 8px spacing rhythm. A 4px optical nudge is not a spacing token and requires a component-specific explanation.

| Token                | Value    |
| -------------------- | -------- |
| `--gs-space-0`       | `0`      |
| `--gs-space-1`       | `0.5rem` |
| `--gs-space-2`       | `1rem`   |
| `--gs-space-3`       | `1.5rem` |
| `--gs-space-4`       | `2rem`   |
| `--gs-space-5`       | `2.5rem` |
| `--gs-space-6`       | `3rem`   |
| `--gs-space-8`       | `4rem`   |
| `--gs-radius-cell`   | `4px`    |
| `--gs-radius-panel`  | `16px`   |
| `--gs-radius-shell`  | `32px`   |
| `--gs-border-thin`   | `1px`    |
| `--gs-border-strong` | `2px`    |
| `--gs-focus-width`   | `2px`    |
| `--gs-focus-offset`  | `2px`    |

No visual component gains a third border thickness or fourth radius. The focus ring is an accessibility affordance, not a decorative component border.

## Sizing and layout primitives

| Token                      | Value    | Use                                                |
| -------------------------- | -------- | -------------------------------------------------- |
| `--gs-shell-max-inline`    | `1856px` | 1920px reference viewport with 32px outer gutters  |
| `--gs-page-gutter-wide`    | `32px`   | Desktop canvas gutter                              |
| `--gs-page-gutter-compact` | `16px`   | Tablet/mobile canvas gutter                        |
| `--gs-panel-min-config`    | `216px`  | Desktop configuration column minimum               |
| `--gs-board-min-desktop`   | `640px`  | Three-column board minimum                         |
| `--gs-panel-min-greed`     | `240px`  | Desktop Greed column minimum                       |
| `--gs-cell-desktop-min`    | `36px`   | Desktop/tablet fitted board cell minimum           |
| `--gs-cell-desktop-max`    | `44px`   | Desktop fitted board cell maximum                  |
| `--gs-cell-touch`          | `44px`   | Mobile scroll-board cell and general touch minimum |
| `--gs-control-touch-min`   | `44px`   | Interactive control minimum block/inline size      |
| `--gs-board-gap`           | `2px`    | Cell gap                                           |

The board remains a semantic 16×16 grid. Production CSS uses a reviewed class or stylesheet rule for the supported board contract; it does not inject `grid-template-columns` through inline style.

## Depth, gradient, and light budget

| Token                 | Value                                                           |
| --------------------- | --------------------------------------------------------------- |
| `--gs-shadow-inner`   | `inset 0 1px 0 rgb(214 212 195 / 0.16)`                         |
| `--gs-shadow-outer`   | `0 8px 24px rgb(0 0 0 / 0.28)`                                  |
| `--gs-shadow-control` | `0 4px 0 rgb(7 20 22 / 0.9)`                                    |
| `--gs-glow-player`    | `0 0 18px rgb(49 130 232 / 0.24)`                               |
| `--gs-glow-ai`        | `0 0 18px rgb(212 82 72 / 0.20)`                                |
| `--gs-glow-reward`    | `0 0 16px rgb(240 166 46 / 0.26)`                               |
| `--gs-gradient-panel` | `linear-gradient(180deg, rgb(214 212 195 / 0.06), transparent)` |

Each component may apply at most one background gradient, one inner shadow, and one outer shadow. Identity glows replace—not stack with—the component's outer shadow. No blur, noise texture, chrome reflection, glass layer, or drop-shadow chain may be added without a Visual Exception.

## Layer tokens

| Token                | Value | Owner                               |
| -------------------- | ----- | ----------------------------------- |
| `--gs-layer-base`    | `0`   | Canvas and normal flow              |
| `--gs-layer-sticky`  | `10`  | Compact mobile decision strip       |
| `--gs-layer-popover` | `20`  | Nonmodal utility popover            |
| `--gs-layer-dialog`  | `30`  | Modal confirmation/dialog           |
| `--gs-layer-toast`   | `40`  | Status toast or urgent live message |

Components do not invent local z-index values. A native `<dialog>` top layer remains preferred for a genuinely modal interaction.

## Motion tokens

| Token                  | Value                           | Use                                       |
| ---------------------- | ------------------------------- | ----------------------------------------- |
| `--gs-motion-fast`     | `120ms`                         | Press, focus, small state acknowledgement |
| `--gs-motion-standard` | `200ms`                         | Color and opacity transition              |
| `--gs-motion-panel`    | `320ms`                         | Utility panel reveal/reflow               |
| `--gs-motion-bank`     | `800ms`                         | Confirmed Bank sequence                   |
| `--gs-motion-pulse`    | `1200ms`                        | Low-frequency active/AI indicator         |
| `--gs-ease-standard`   | `cubic-bezier(0.2, 0, 0, 1)`    | Standard state change                     |
| `--gs-ease-settle`     | `cubic-bezier(0.16, 1, 0.3, 1)` | Reward settlement                         |

Animate only opacity, transform, color, or SVG `stroke-dashoffset`. Layout properties, filters, and continuous decorative motion are prohibited. `prefers-reduced-motion: reduce` disables travel, dash flow, and pulse and replaces a confirmed Bank sequence with a single transition of at most 100ms plus the same live-region announcement. A `data-motion-tier="minimal"` low-performance mode uses the same no-travel behavior and removes decorative glows; user reduced-motion preference always wins.

## Contract checks

- Search production component styles for raw approved hex values, arbitrary shadows, duration literals, inline `style=`, and arbitrary-value Tailwind classes.
- Test focus visibility, text contrast, disabled-state legibility, and 44px touch targets independently of screenshot diffs.
- A token change that moves a Visual Baseline requires the Baseline Update workflow; changing baselines does not retroactively approve the token.
