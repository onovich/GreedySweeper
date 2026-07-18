# Phase 6C Contracts, Threat Model, and Release Gates

Status: implementation contract for Phase 6C

This document freezes the resilience and release boundaries before changing Worker authority behavior. It does not authorize a production deployment, Workers Paid activation, DNS change, or custom-domain route.

## Recovery contract

The first authenticated WebSocket message remains versioned and must arrive within five seconds. A seat token is still verified only by its stored digest. A socket attachment may contain only `{ seat, sessionEpoch, protocolVersion }`; it never contains a token, digest, board state, seed, salt, command payload, IP, or browser identity.

One seat owns one active connection. Authentication transactionally persists a monotonically increasing `sessionEpoch`, registers the new connection, and then closes the replaced connection with `seat_replaced`. A close event is ignored unless its persisted epoch is still current.

Any current-seat disconnect pauses the match immediately and persists a reconnect deadline of `now + 120 seconds`. A reclaiming seat receives a complete public snapshot and canonical sequence, clears that seat's reconnect deadline, and resumes only when both seats are connected. Pending retries retain their original command ID and expected sequence. Session memory is an optimization only: wake, eviction, and hibernation rebuild session and authority state from SQLite metadata plus the accepted command log.

## Lifecycle contract and additive migration plan

The existing `room_metadata`, `room_match`, and `room_authority` tables remain readable. Phase 6C migrations are forward-only, additive, and repeatable:

| Migration | Additive data                                                                                                          | Purpose                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `v2`      | `room_lifecycle` row with `state`, `next_deadline_at`, `setup_expires_at`, `inactive_expires_at`, `terminal_delete_at` | one canonical persisted deadline schedule              |
| `v3`      | `room_seats` rows with `seat`, `session_epoch`, `connected_at`, `reconnect_expires_at`                                 | replacement and reconnect identity without secrets     |
| `v4`      | `room_operations` row with versioned snapshot hash and coarse lifecycle counters                                       | recovery validation and privacy-safe operational state |

The earliest persisted deadline is the only alarm target. Alarm handling re-reads the row inside a transaction, ignores stale/superseded alarm values, applies at most one transition, persists the next deadline, and schedules that earliest value. Setup with no invitee expires after 10 minutes. An active room with no accepted command for 10 minutes, or with an expired reconnect deadline, becomes `abandoned` with no winner and no progression result. Completed and abandoned rooms hard-delete all room rows and proof data one hour after terminal state.

## Protocol compatibility

Phase 6C introduces versioned recovery and lifecycle fields through an explicit protocol window: the Worker accepts the current protocol and the immediately previous supported protocol until the documented rollout deadline. Rules version, replay version, snapshot version, storage migration tag, and progression-fact version remain distinct. Unknown fields, unsupported versions, cross-room tokens, stale sequences, duplicate IDs, and messages over 8 KB fail closed without mutating sequence, command log, snapshot, sessions, or deadlines.

## Privacy and abuse matrix

| Surface           | Allowed                                                                                         | Forbidden                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Public snapshot   | ruleset, lifecycle, sequence, scores, current seat, public board projection                     | mine truth, hidden values, seed, salt, token, digest                              |
| Socket attachment | seat, session epoch, protocol version                                                           | token, digest, board, command, IP, User-Agent                                     |
| Native Worker log | event name, coarse outcome, protocol/storage version, lifecycle state, sequence, latency bucket | room code, token/digest, seed/salt, coordinates, IP, User-Agent, progression data |
| Progression fact  | stable verified result identity, ruleset, result, verified replay evidence                      | credentials, hidden state, incomplete/abandoned result                            |

Rate controls are deterministic and injected in tests: create 5/source/minute; lookup or join 20/source/minute; invalid-code 10/source/minute; commands 30/seat/10 seconds; WebSocket message maximum 8 KB. `ONLINE_ENABLED=false` rejects new room creation before any room allocation and leaves existing rooms able to finish, reconnect, abandon, or delete. Turnstile is disabled by default and, when enabled, is verified only by a Worker-side Siteverify adapter; an absent configuration fails closed only for the protected new-room path.

## Load and production gates

The reproducible target is 100 concurrent rooms/200 connected players; the stress target is 200 rooms. The harness records room count, accepted/rejected command counts, integrity failures, and p95 create/join, command confirmation, and reconnect-snapshot latency. State corruption, ordering loss, cross-room leakage, secret leakage, or failed recovery blocks release. A latency miss requires an explicit accepted risk; it never changes authority semantics.

Production readiness is a separate serial gate. It requires all local and Preview gates, paid-plan authorization, alert and cost thresholds, `ONLINE_ENABLED` rollback proof, the accepted domain-task readiness result, Worker-first protocol-compatible deployment, old/new client smoke, then Pages release and custom-domain smoke. No Phase 6C code path may bypass that gate.
