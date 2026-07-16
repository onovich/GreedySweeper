# Phase 2 Replay Protocol

## Versioned Contracts

The protocol is intentionally separate from the application version.

- `rulesVersion` selects game-rule semantics.
- `challengeVersion` selects Challenge Descriptor encoding/validation.
- `ActionRecord.version` selects action-log record semantics.
- `replay.version` selects replay container semantics.

Unsupported versions return structured errors; consumers do not guess compatibility.

## Challenge Descriptor

```json
{
  "rulesVersion": "1",
  "challengeVersion": "1",
  "board": { "rows": 16, "columns": 16, "totalMines": 40 },
  "seed": "unsigned seed value",
  "mode": "standard"
}
```

It never includes mine locations, a board snapshot, UI state, timers, or a solution.

## Action Record And Replay

An Action Record stores one ordered domain action: `{ version, sequence, action }`. A Replay stores the initial descriptor, ordered action records, and an optional expected final summary. Reproduction always folds the existing pure engine over those actions; it never re-runs AI policy or restores UI snapshots.
