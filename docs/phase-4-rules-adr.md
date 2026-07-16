# Phase 4 Rules ADR: versioned Greed mode

## Decision

Classic is permanently identified by `rulesVersion: "1"` and `mode: "standard"`.
Greed is identified by `rulesVersion: "2"` and `mode: "greed"`. A rules registry
dispatches every transition by this pair; no UI, controller, replay, or AI caller
selects scoring or settlement rules itself.

## Greed v2 rules

- Safe reveals award their existing base score immediately, increment `streak`, and
  add `max(0, revealPoints) * min(max(streak - 1, 0), 3)` to `bonusPot`.
- `bank` has no coordinates. It is legal only for the current player in a live v2
  game after at least one safe reveal in that turn. It awards the whole pot and ends
  the turn.
- A correct flag awards its existing +5, cashes the pot, and ends the turn. A wrong
  flag or mine explosion keeps the existing -5, loses the pot, and ends the turn.
- Any turn-ending settlement resets both `streak` and `bonusPot` for the next player.
  The final-mine winner is calculated after that action's settlement.

## Compatibility

Published GS1 descriptors, action records, replay summaries, history, and Classic
state keep their v1 shape and bytes. New Greed actions use v2 records/replays; readers
dispatch explicitly by record/replay version and never reinterpret a v1 log as v2.
New Daily challenges use a v2 namespace and Greed descriptor. Imported old daily
descriptors remain valid Classic challenges.

## AI and UI boundaries

The AI receives only its public projection plus the serializable Greed pot/policy;
it may propose `bank`, but the v2 engine decides legality and settlement. The
application locks the selected mode before the first action and records applied
commands. The UI only renders mode/pot/risk and emits mode or Bank intent.
