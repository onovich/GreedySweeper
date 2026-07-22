# Backend Integration Contract

Status: accepted for implementation planning. This contract extends the dependency direction in [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md), the authoritative synchronization decision in [`ADR-0007`](../adr/0007-command-driven-authoritative-synchronization.md), and the separate-controller decision in [`ADR-0025`](../adr/0025-separate-local-and-online-controllers.md).

## Boundary

```text
game-core ──> local controller ──┐
                                ├─> presentation adapter ─> UI View Model + Presentation Effects
protocol / Worker / DO ─> online controller ─┘                         │
                                                                       v
                                                              visual components
                                                                       │
                                                                       v
                                                                 intent events
```

The arrows do not reverse. Visual components never import `game-core`, selectors, rules, replay engines, online protocol, Worker/Durable Object modules, controller hooks, storage adapters, or network clients.

## Ownership

| Layer                      | Owns                                                                                      | Must not own                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `packages/game-core`       | rules, scoring, legal actions, turns, board transitions, selectors                        | React, DOM, CSS, network state                                |
| `packages/online-protocol` | serialized envelopes, public snapshot and error vocabulary                                | visual copy, CSS, DOM, rule execution                         |
| `apps/room-worker`         | authoritative commands, sequence, persistence, reconnect lifecycle                        | client layout, animation, component state                     |
| local controller           | local game lifecycle, AI delay, replay, challenge, progression coordination               | visual tokens or component anatomy                            |
| online controller          | room lifecycle, socket/auth/reconnect, pending command, terminal verification             | optimistic gameplay transitions or visual styling             |
| presentation adapters      | map controller/domain state into the versioned UI View Model and Presentation Effects     | game rules, hidden information, network authority             |
| visual layer               | DOM, CSS, tokens, layout, accessibility presentation, component-local ephemeral animation | scoring, legal-move inference, protocol handling, persistence |

Worker, Durable Object, and protocol code cannot set class names, colors, layout modes, animation durations, or component variants. Backend text is mapped from stable error/status codes to frontend-owned copy.

## Planned placement

- `apps/web/src/application/presentation/`: local/online adapters, View Model validation, Presentation Effect mapping.
- `apps/web/src/ui/`: shared presentational components and screens.
- `apps/web/src/ui/theme/`: tokens and global Lunar Console styling.
- `apps/web/src/ui/fixtures/`: deterministic fixture builders that validate against the same View Model contract.

The project remains JavaScript; this plan does not authorize a TypeScript migration or a new runtime dependency. Use exported frozen enums, JSDoc, runtime validation at adapter/fixture boundaries, and focused tests.

## UI View Model v1

The adapter returns a serializable object shaped by this logical contract:

```text
GameUiViewModel {
  schemaVersion: 1
  session: {
    kind: local | online | replay
    lifecycle: setup | active | waiting | paused | reconnecting | terminal | error
    authority: local-engine | server
    lockReason: null | ai-turn | opponent-turn | command-pending | replay |
                paused | reconnecting | terminal | error
  }
  brand: { title, subtitle }
  scores: [ScoreViewModel, ScoreViewModel]
  mines: { remaining: integer | null, state: ready | syncing | unknown }
  turn: { state, message, announcement: polite | assertive | off }
  matchConfig: { mode, difficulty, style, state: editable | review | locked | invalid }
  board: BoardViewModel
  greed: GreedViewModel | null
  utilities: UtilityViewModel
  connection: ConnectionViewModel | null
  terminal: TerminalViewModel | null
  capabilities: CapabilityViewModel
}
```

### ScoreViewModel

```text
{
  side: player | opponent
  identity: player | ai
  label: string
  value: integer | null
  activity: active | inactive | winner | loser | draw | unknown
  settlement: idle | pending | confirmed
}
```

`identity` chooses semantic visual tokens; it does not determine turn or winner. Online creator/invitee labels must map deliberately rather than assuming creator equals human forever.

### BoardViewModel

```text
{
  rows: 16
  columns: 16
  state: ready | locked | pending | paused | reconnecting | replay | empty | error | terminal
  lockReason: GameUiViewModel.session.lockReason
  cells: CellViewModel[256]
  focusedCellId: string | null
}
```

Each CellViewModel contains only public presentation data:

```text
{
  id: "r{row}-c{column}"
  row: integer
  column: integer
  state: hidden | revealed-empty | revealed-number | flagged-player |
         flagged-opponent | wrong-flag | exploded
  neighborMines: integer | null
  accessibleLabel: string
  canReveal: boolean
  canFlag: boolean
}
```

The online adapter maps only the Public Board Projection. Hidden mine locations or values never appear in the View Model or fixtures that represent online play.

### GreedViewModel

```text
{
  streak: integer
  multiplier: 0 | 1 | 2 | 3
  bonusPot: non-negative integer
  columns: [{ multiplier: 1 | 2 | 3, state: off | complete | active }]
  bank: {
    availability: disabled | enabled | pending
    primaryLabel: string
    secondaryLabel: string
    lockReason: string | null
  }
}
```

The adapter obtains streak, Bonus Pot, Bank legality, and accepted settlement from domain/controller results. The visual layer never derives the multiplier, recomputes score, or decides whether Bank is legal.

### ConnectionViewModel

It maps controller states to this stable vocabulary:

```text
unavailable | idle | creating | waiting | inspecting | review | joining | ready |
authenticating | connected | command-pending | reconnecting | paused | replaced |
abandoned | verification-failed | verified | error
```

It may include display-safe room code, ruleset label, seat label, recoverability, and frontend-owned message key. It never contains a Seat Token, token digest, hidden seed/salt, raw WebSocket object, Durable Object identity, or unrestricted server payload.

## Presentation Effects

Controller state is authoritative; effects exist only to stage confirmed visual feedback. Each effect is serializable and deduplicated by the adapter:

```text
PresentationEffect {
  id: string
  kind: bank-confirmed | bonus-pot-lost | turn-changed | terminal-confirmed
  sourceRevision: integer
  side: player | opponent | null
  points: integer | null
}
```

- `id` is a presentation identifier, not a Seat Token or raw Command ID.
- Replaying an already consumed `id` is forbidden.
- Missing an effect may skip animation but must not produce incorrect state; the View Model always renders the authoritative final value.
- Visual components acknowledge effect consumption locally. They do not send a gameplay command in response.

## Intent events

The visual layer emits intents rather than domain commands:

```text
onCellIntent({ kind: reveal | flag, row, column })
onBankIntent()
onRestartIntent()
onMatchConfigIntent({ field, value })
onChallengeIntent({ kind, value? })
onReplayIntent({ kind: start | play | pause | step | reset | exit })
onRoomIntent({ kind: create | inspect | join | connect | retry, value? })
onUtilityIntent({ tab })
onDismissStatusIntent({ id })
```

Adapters/controllers validate every intent. Disabled capabilities suppress dispatch, but UI suppression is not a security or rules boundary.

## Local adapter rules

- Map the current local controller state, selectors, and transition results into View Model v1.
- Local game-core results may update View Model state immediately because the local engine is authoritative for that session.
- Emit `bank-confirmed` only from an applied Bank result/event, never by observing a click or guessing from `bonusPot === 0`.
- Correct-flag settlement and Bank settlement remain distinct Presentation Effects even if both change score and POT.
- Replay maps the replay projection and locks gameplay; it does not invoke live AI selection.
- Storage failure maps to a recoverable utility/status state and never enters GameBoard state.

## Online adapter rules

1. A cell or Bank intent asks the online controller to submit one command.
2. The View Model moves to `command-pending`; it preserves the last authoritative board, scores, streak, and POT.
3. No visual component, adapter, or controller applies a speculative gameplay transition.
4. A command acceptance is presentationally complete only after the adapter can associate it with an advanced authoritative snapshot/sequence.
5. The adapter then emits the new View Model and, when applicable, one deduplicated `bank-confirmed` Presentation Effect.
6. Rejection clears pending, preserves/reconciles to authoritative state, and exposes a mapped error; it emits no settlement effect.
7. Reconnect retains the last snapshot, reuses controller idempotency behavior, and cannot replay an already consumed visual effect.
8. Paused, replaced, abandoned, and verification-failed states lock gameplay and retain their distinct terminal semantics.

If an acceptance message and snapshot disagree, the adapter enters an integration error and requests reconciliation. It must not merge fields or choose whichever value matches the Visual Master.

## Extending backend or online functionality

A backend/domain change reaches the UI in this order:

1. extend and validate the owning game-core/protocol/Worker contract;
2. extend the relevant local or online controller without visual concerns;
3. deliberately add or map one View Model field/state, updating its runtime validator;
4. add deterministic fixtures for normal, pending, error, reconnect, and terminal consequences;
5. update shared component anatomy only when the new state cannot be expressed by the existing contract;
6. request a Visual Exception if token/layout/baseline behavior must change;
7. update approved baselines only after architecture and visual review.

Backend integration may not “temporarily” add inline style, raw color, component copy, duplicate components, or protocol branching inside the UI. A new server status that maps to an existing presentation state should not change CSS at all.

## Required contract tests

- Local and online fixture builders pass the same View Model v1 validator.
- Every connection/controller status maps to one documented View Model state.
- Online pending and rejection fixtures prove board, score, POT, and active side do not change optimistically.
- Confirmed Bank produces exactly one effect at a given source revision, including reconnect/retry.
- Online fixtures contain no hidden mine data or credentials.
- Visual component tests import only presentation contracts/fixtures, not game-core or protocol modules.
- Architecture checks reject imports from visual components into application, core, protocol, or Worker layers.

## Known migration gaps

- `GameScreen.jsx` currently imports game-core config/selectors and computes presentation state. The reconstruction must move that mapping into the local presentation adapter.
- `OnlineRoomPanel.jsx` currently renders a separate `OnlineBoard`. The reconstruction must remove that duplicate and feed the shared GameBoard through the online adapter.
- `GameBoard.jsx` currently injects grid columns with inline style. The fixed supported board contract must move into reviewed stylesheet classes/tokens.

These are implementation inputs, not authorization to change code during planning.
