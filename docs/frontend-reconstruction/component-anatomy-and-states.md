# Component Anatomy and State Contract

Status: accepted for implementation planning. Components are driven only by the UI View Model and Presentation Effects defined in [`backend-integration-contract.md`](./backend-integration-contract.md).

## Composition

```text
AppShell
├── BrandHeader
├── ScoreRail
│   ├── ScoreCapsule(player)
│   ├── MineCounter
│   └── ScoreCapsule(opponent)
├── TurnMessage
├── MatchConfigPanel
├── GameBoard
│   └── GameCell × 256
├── GreedPanel
│   ├── MultiplierColumn × 3
│   ├── BonusPot
│   └── BankButton
├── RewardCircuit
├── UtilityDock
│   └── UtilityTab × 4
└── UtilityDrawer
    ├── ChallengePanel
    ├── ReplayPanel
    ├── RecordPanel
    └── RoomPanel
```

Responsive layouts move these same component instances into new grid areas. They do not render desktop and mobile copies.

## Global state precedence

When multiple states are true, presentation follows this order:

1. terminal verification failure, replaced seat, or unrecoverable error;
2. completed, verified, or abandoned terminal state;
3. reconnecting or server-paused state;
4. authoritative command pending;
5. replay lock or AI/opponent turn;
6. active player turn;
7. setup or empty state.

Lower-priority cues remain available as text where useful but may not re-enable interaction or override the dominant message. Red is reserved for AI identity, wrong/danger states, and errors; `LOCKED` is neutral gray-green.

## AppShell

### Anatomy

- outer deep-space canvas;
- lunar-white two-layer shell;
- named grid regions for score, config, board, Greed, Reward Circuit, and utility dock;
- one persistent status/live region;
- optional utility drawer in normal document flow or a genuine modal dialog when confirmation is destructive.

### States

| State          | Presentation                                                                         | Interaction                                                    |
| -------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `setup`        | Shell, config, empty/ready board, subdued Greed                                      | Configuration and start intents enabled                        |
| `active`       | Full board and active-side identity                                                  | Only View Model-allowed gameplay intents enabled               |
| `waiting`      | Context remains visible; TurnMessage explains AI, opponent, room, or command wait    | Board and Bank carry an explicit Interaction Lock              |
| `replay`       | Replay label and position visible; live identity cues suppressed                     | Gameplay intents locked; replay controls enabled               |
| `reconnecting` | Existing authoritative snapshot remains visible under a neutral status banner        | No gameplay intents; no speculative rollback                   |
| `terminal`     | Board remains inspectable; result panel receives focus once                          | Gameplay locked; restart/replay/room exit may remain available |
| `error`        | Last safe presentation remains visible when possible; actionable message is adjacent | Only safe recovery/dismiss intents enabled                     |

The shell never replaces an unknown board with invented cells or a fake loading score.

## BrandHeader

- Displays `贪婪扫雷` and `GREEDY SWEEPER · LUNAR SYSTEM 1986`.
- It has no gameplay state and never becomes brighter than the board or active score.
- On compact widths the English line may hide visually but remains available to assistive technology; the Chinese product name never truncates.

## ScoreRail, ScoreCapsule, and MineCounter

### ScoreCapsule anatomy

- side label;
- tabular score value;
- textual turn/state label;
- identity dot and 2px identity border;
- optional settlement flash layer driven by a confirmed Presentation Effect.

### ScoreCapsule states

| State            | Required cue                                                                         |
| ---------------- | ------------------------------------------------------------------------------------ |
| `active`         | Full identity accent, textual “当前回合”, restrained glow                            |
| `inactive`       | Accent and border reduced to 75%; text remains contrast-safe                         |
| `pending`        | Score value stays authoritative; pending label appears without amber settlement flow |
| `bank-confirmed` | One 800ms amber-to-identity flash; value is already the confirmed value              |
| `winner`         | “胜利” text and identity accent; no continuous celebration                           |
| `loser`          | “对局结束” text; identity remains recognizable without danger styling                |
| `draw`           | Neutral result label on both capsules                                                |
| `unknown`        | Em dash and “同步中”; never zero-fill missing authority data                         |

### MineCounter states

- `ready`: integer from the authoritative View Model.
- `zero`: displays `0` without celebratory meaning.
- `syncing` or `unknown`: em dash plus accessible “剩余地雷同步中”.
- Negative or non-integer values are adapter errors; show unknown and report the contract violation.

## TurnMessage

TurnMessage is the single polite live region for ordinary state changes. It uses concise canonical copy:

| State             | Copy pattern                             |
| ----------------- | ---------------------------------------- |
| player turn       | `你的回合 · 继续探测或收手`              |
| AI/local opponent | `AI 回合 · 棋盘已锁定`                   |
| online opponent   | `对手回合 · 等待权威状态`                |
| command pending   | `命令已发送 · 等待服务器确认`            |
| reconnecting      | `连接中断 · 正在取回席位`                |
| server paused     | `对局暂停 · 等待席位重连`                |
| replay            | `回放 · 第 {position}/{total} 步`        |
| terminal          | Result-specific text from the View Model |

Unrecoverable errors, seat replacement, abandonment, and verification failure use a separate assertive alert once; they are not repeatedly announced on every render.

## MatchConfigPanel

### Anatomy

- ruleset/mode summary;
- difficulty summary;
- AI style summary;
- lock indicator with text;
- editable controls only during eligible local setup or online room setup/review.

### States

| State         | Presentation and behavior                                                 |
| ------------- | ------------------------------------------------------------------------- |
| `editable`    | Inputs are visible, labeled, and meet 44px touch minimum                  |
| `review`      | Invited online player sees immutable rules and an explicit accept intent  |
| `locked`      | Summary tiles only; neutral gray-green dot and `LOCKED` label             |
| `invalid`     | Specific field message; start/accept remains unavailable                  |
| `unavailable` | Preserves current accepted values and explains why editing is unavailable |

Lock state never uses AI/error red and never looks like a failed connection.

## GameBoard

### Anatomy

- semantic grid label and row/column description;
- optional visible coordinates on wide layouts and sticky coordinates inside the compact scroll viewport;
- exactly one `GameCell` for every View Model cell;
- board-level status and Interaction Lock reason;
- focus management that restores the last focused cell after transient locks.

### Board states

| State                       | Visual                                                     | Input                                      |
| --------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| `ready`                     | Full contrast; active-side border                          | Allowed cell intents only                  |
| `ai-turn` / `opponent-turn` | Board stays readable; active border subdued                | Locked                                     |
| `command-pending`           | No speculative cell change; pending cue at board edge      | Locked until authority advances or rejects |
| `paused` / `reconnecting`   | Last authoritative snapshot visible; neutral overlay label | Locked                                     |
| `replay`                    | Cells show replay projection; replay step announced        | Locked to gameplay                         |
| `empty`                     | Framed empty-state message, not 256 placeholder cells      | Start/recovery actions only                |
| `error`                     | Last safe board if available; failed region identified     | Locked except recovery                     |
| `terminal`                  | Final board remains inspectable                            | Gameplay locked                            |

Transient locks use `aria-disabled="true"` plus intent suppression so keyboard focus is not destroyed. Permanently noninteractive revealed/terminal cells may use native disabled semantics when focus recovery is handled by the board.

## GameCell

| State              | Content                                | Required distinction                                                   |
| ------------------ | -------------------------------------- | ---------------------------------------------------------------------- |
| `hidden`           | None                                   | Emerald raised surface                                                 |
| `hidden-hover`     | None                                   | Pointer-only light shift; no layout movement                           |
| `hidden-pressed`   | None                                   | One-step inset cue                                                     |
| `revealed-empty`   | None                                   | Lunar recessed surface                                                 |
| `revealed-number`  | `1`–`8`                                | Text plus accessible neighbor count; color is not sole cue             |
| `flagged-player`   | Simple blue inline SVG flag            | Label names player flag                                                |
| `flagged-opponent` | Simple red inline SVG flag             | Label names opponent/AI flag                                           |
| `wrong-flag`       | Red X plus underlying value when known | Error text; no pulse under reduced motion                              |
| `exploded`         | Simple danger mark/focal heat spot     | Strong only for the current event; historical terminal view is subdued |
| `focused`          | 2px visible focus ring                 | Never clipped by board overflow                                        |
| `locked`           | Existing content unchanged             | Cursor/copy communicates lock reason at board level                    |

Mobile pointer movement beyond the gesture threshold cancels reveal/long-press so panning cannot trigger a cell. Long press remains 400ms and keyboard remains Enter to reveal / F to flag.

## GreedPanel, MultiplierColumn, BonusPot, and BankButton

### GreedPanel states

| State            | Presentation                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| `absent`         | Classic mode omits the Greed panel and Reward Circuit; board expands into the available region    |
| `idle`           | `×1/×2/×3` columns off, POT `0`, Bank copy explains current reward `0` when Bank is legal         |
| `x1`, `x2`, `x3` | Completed columns are stable amber; current column is one controlled step brighter                |
| `pending`        | Bank locks and reads `等待确认`; multiplier, POT, score, and circuit do not settle optimistically |
| `confirmed`      | Consumes one `bank-confirmed` Presentation Effect and runs the Bank sequence                      |
| `rejected`       | State remains authoritative; error copy appears; no reward flow or score flash                    |
| `lost`           | POT becomes confirmed `0`; concise loss message; no fake transfer to score                        |

`MultiplierColumn` uses 6–8 equal segments but the segment count is a component token, not gameplay arithmetic. The displayed `×1/×2/×3` comes from the View Model and never recomputes the Greed rule.

### BankButton copy and availability

| Condition                        | Primary / secondary copy                          |
| -------------------------------- | ------------------------------------------------- |
| enabled, positive POT            | `收手` / `入账 +{pot} · 结束回合`                 |
| enabled, zero POT                | `收手` / `结束回合 · 当前奖励 0`                  |
| online pending                   | `等待确认` / `服务器正在处理`                     |
| unavailable turn/replay/terminal | Preserve last meaningful copy; expose lock reason |

### Confirmed Bank sequence

The total duration is 800ms:

1. `0–120ms`: Bank presses and locks.
2. `120–360ms`: `×3 → ×2 → ×1` accents extinguish.
3. `240–600ms`: the Reward Circuit carries amber flow from multiplier/POT toward the active score.
4. `480–680ms`: POT presents confirmed `0`; score flashes amber then returns to its identity color.
5. `680–800ms`: active identity hands off and the board adopts the next authoritative lock state.

Under reduced/minimal motion, render the confirmed final state with a ≤100ms color acknowledgement and the same live-region message. Online `command_accepted` without the matching advanced authoritative snapshot is not sufficient to start this sequence.

## RewardCircuit

- One inline SVG with a 2px semantic stroke; decorative duplicates are prohibited.
- `off`: 8% opacity when Greed is absent/unavailable.
- `rest`: 18% opacity; no movement.
- `pending`: remains at rest; it does not imply acceptance.
- `bank-confirmed`: one finite `stroke-dashoffset` flow tied to the Presentation Effect.
- `reduced`: no travel; one short opacity/color change.

The circuit never glows continuously and never represents network connectivity.

## UtilityDock and UtilityDrawer

The dock contains Challenge, Replay, Record, and Room tabs. Only one tab may be active. Tabs use text, icon, and state—not colored dots alone.

| Tab state   | Behavior                                                                       |
| ----------- | ------------------------------------------------------------------------------ |
| `idle`      | Low-emphasis border, readable label                                            |
| `active`    | Player-blue border and `aria-selected="true"`                                  |
| `disabled`  | Reason exposed; label remains readable                                         |
| `attention` | Small semantic badge for error/waiting; no pulse                               |
| `empty`     | Drawer explains no replay/history/room yet and offers the eligible next action |
| `error`     | Inline actionable error; drawer remains open until dismissed or recovered      |

Opening a drawer does not cover the board on desktop. On compact layouts it follows the board in document flow; only destructive progression reset or another genuinely modal confirmation may use a dialog.

## RoomPanel and online lifecycle

The adapter maps existing controller states without exposing raw protocol messages:

| State                                                 | Required UI                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| `unavailable`                                         | Build-level unavailable message; no dead controls             |
| `idle`                                                | Create Classic/Greed and review-invite actions                |
| `creating`, `inspecting`, `joining`, `authenticating` | One named progress state; repeat action locked                |
| `waiting`                                             | Room code/invite action and waiting explanation               |
| `review`                                              | Immutable ruleset with explicit accept action                 |
| `ready`                                               | Explicit connect action                                       |
| `connected`                                           | Shared GameBoard and authoritative turn state                 |
| `command-pending`                                     | Last snapshot, pending message, gameplay lock                 |
| `reconnecting`                                        | Reclaim message; last snapshot retained                       |
| `paused`                                              | Server pause reason; last snapshot retained                   |
| `replaced`                                            | Assertive seat-replaced terminal alert; no auto-retry         |
| `abandoned`                                           | Terminal no-winner explanation; no progression eligibility    |
| `verification-failed`                                 | Terminal integrity alert; result is not presented as verified |
| `verified`                                            | Verified terminal result and eligible progression outcome     |
| `error`                                               | Stable error vocabulary and eligible retry/back action        |

Online gameplay reuses `GameBoard`, `ScoreCapsule`, `GreedPanel`, and terminal components. A room-specific duplicate board is forbidden.

## Error, empty, and terminal principles

- Empty states name what is absent and provide at most one primary next action.
- Waiting states name who or what is being waited on; they never use indefinite decorative animation as the only cue.
- Recoverable errors preserve user-entered room/challenge values.
- Disconnect and reconnect preserve only the last authoritative snapshot and visibly lock commands.
- Terminal state is explicit: completed/verified, abandoned, replaced, or verification-failed are not interchangeable.
- No error, animation, or layout state may cause `game-core`, protocol, Worker, or Durable Object logic to move into visual components.
