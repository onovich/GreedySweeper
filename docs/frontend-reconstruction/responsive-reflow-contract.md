# Responsive Reflow Contract

Status: accepted for implementation planning. Reflow preserves one component tree and changes grid areas, ordering, density, and disclosure; it never scales the desktop composition as a bitmap.

## Layout bands

Breakpoints describe available layout space rather than device brands.

| Band            | CSS viewport                      | Primary composition                                     |
| --------------- | --------------------------------- | ------------------------------------------------------- |
| `wide`          | `>= 1280px` and height `>= 720px` | Desktop three-column Lunar Console                      |
| `medium-wide`   | `960px–1279px`                    | Two-column board + Greed, compact config row            |
| `medium-narrow` | `768px–959px`                     | Single-column board-first tablet flow                   |
| `compact`       | `< 768px`                         | Single-column touch flow with scrollable board viewport |

Height-constrained landscape screens below 720px use `medium-wide` density even when width exceeds 1280px. CSS container queries may refine component internals, but the bands above remain the screenshot and acceptance vocabulary.

## Persistent information priority

The following remains visible without opening a utility drawer at every band:

1. both scores and active-side identity;
2. remaining mines;
3. current turn, pending, reconnect, or terminal message;
4. GameBoard;
5. in Greed mode, multiplier, Bonus Pot, and the single BankButton.

Match configuration may collapse to a summary. Challenge, replay, record, and room controls may collapse into the UtilityDock, but urgent room state is promoted to TurnMessage and is never hidden inside a closed drawer.

## Wide: desktop three-column

Reference layout: 1920×1080 CSS pixels, DPR 1.

```text
┌──────────────── ScoreRail / BrandHeader ────────────────┐
│ config (216–280) │ board (dominant, ~60%) │ Greed (240–320) │
│                  │ TurnMessage             │ RewardCircuit   │
├──────────────────── UtilityDock ─────────────────────────┤
└───────────────────────────────────────────────────────────┘
```

- `AppShell` is centered with a maximum inline size of 1856px and 32px canvas gutters.
- Columns use proportional tracks equivalent to `minmax(216px, 0.7fr) minmax(640px, 2fr) minmax(240px, 0.85fr)` with 24px gaps.
- Board cells fit between 36px and 44px; the complete 16×16 board is visible without internal scrolling.
- UtilityDrawer expands below the main grid and does not cover the board.
- The Reward Circuit may cross named grid regions only within the shell SVG overlay and must not intercept pointer input.

If the 640px board minimum cannot be preserved, the layout changes band rather than squeezing all three columns.

## Medium-wide: tablet landscape / small desktop

```text
┌────────── ScoreRail + compact config summary ──────────┐
│ board (min 60%)                     │ Greed panel       │
├──────────────── UtilityDock / drawer ──────────────────┤
└─────────────────────────────────────────────────────────┘
```

- MatchConfigPanel becomes one horizontal, read-only summary row after play starts.
- Board remains the first content region and fits entirely when 36px cells are possible.
- GreedPanel stays in the second column; the Reward Circuit shortens to Greed → active score without decorative detours.
- At insufficient height, utilities follow the grid in document flow and the page scrolls; the board itself is not vertically cropped merely to keep utilities visible.

## Medium-narrow: tablet portrait

Order:

1. compact BrandHeader and ScoreRail;
2. TurnMessage;
3. GameBoard;
4. horizontal GreedPanel/Bank decision strip when applicable;
5. MatchConfig summary;
6. UtilityDock and active drawer.

- Use 16px page gutters.
- The board may reduce cells to 36px but may not go below that size in this band.
- When `16 × cell + gaps` exceeds the available inline size, use the compact scroll-board behavior instead of further scaling.
- The GreedPanel changes from three vertical columns to three short horizontal segment stacks while preserving `×1/×2/×3`, POT, and the one BankButton.

## Compact: mobile

Order:

1. product label and compact three-item ScoreRail;
2. TurnMessage / urgent online status;
3. Greed decision strip in Greed mode;
4. GameBoard scroll viewport;
5. locked MatchConfig summary;
6. UtilityDock and active drawer.

### Compact score and Greed treatment

- ScoreRail uses a two-column player/opponent row with MineCounter centered on its own compact line or in the center grid cell when 390px permits.
- Labels stay visible; scores use tabular digits and may step down only to `--gs-text-xl`.
- GreedPanel is the same component reflowed into a horizontal decision strip. It may become sticky below TurnMessage while the board viewport has focus, but it may not be duplicated or obscure focused cells.
- Sticky positioning accounts for `env(safe-area-inset-top)` and must release before the UtilityDrawer so it does not cover terminal actions.

### Compact board interaction

A 16×16 board cannot fit a 360–430px viewport at a safe touch size. The accepted behavior is an explicit two-axis board viewport, not proportional shrinkage:

- each cell is 44×44 CSS pixels with a 2px gap;
- the viewport spans the available width and at most `min(68svh, 560px)` height;
- native two-axis panning remains available with overscroll contained inside the board;
- row and column coordinates remain sticky at the viewport edges;
- keyboard focus scrolls the focused cell into view without moving focus;
- pointer travel greater than 8px cancels tap and 400ms long-press intents so a pan never reveals or flags a cell;
- a long press with travel at or below 8px flags; a short release reveals; desktop right-click and keyboard Enter/F remain unchanged;
- no pinch-zoom interception is added. Browser/page zoom remains available for accessibility.

The first render scrolls to the top-left because no rule-derived “interesting region” may be guessed. Returning from a utility drawer restores the previous board scroll position and focused cell.

## Touch and keyboard requirements

- All controls and cells meet a 44×44 CSS pixel minimum target in touch layouts.
- Adjacent destructive and primary actions require at least 8px separation.
- Focus order follows visual reading order in every band; CSS visual reordering may not diverge from DOM order.
- A transient Interaction Lock preserves the last focused cell and exposes the lock reason. On unlock, focus is restored only if the user has not moved it elsewhere.
- Focus rings are never clipped by panel or board overflow; provide a 2px internal allowance around the scroll viewport.

## Text overflow and localization

- Product name, score, remaining mines, POT, Bank primary label, and urgent status never ellipsize.
- TurnMessage may wrap to two lines. It does not reduce below 14px.
- Secondary config and utility labels use one line on wide/medium layouts and at most two lines on compact layouts.
- Room codes use the data font and `overflow-wrap: anywhere`; invitation URLs may wrap, but the visible Room Code remains grouped and selectable.
- Noncritical long labels may ellipsize only when their full text is available through the accessible name and a non-hover-only disclosure.
- Chinese text uses normal word breaking; do not apply arbitrary English letter spacing to Chinese sentences.
- User- or server-provided errors wrap naturally and never widen the shell.

## Reflow acceptance scenarios

Each band must be checked with:

- Classic mode without GreedPanel;
- Greed `×3 / POT 18 / Bank enabled`;
- local AI turn;
- online command pending;
- reconnecting and server-paused states;
- terminal result;
- UtilityDrawer open with its longest approved copy;
- browser zoom at 200% on the primary desktop viewport.

No acceptance screenshot may hide overflow with `overflow: hidden` on page content, reduce cell or text sizes below this contract, or substitute a separate mobile component tree.
