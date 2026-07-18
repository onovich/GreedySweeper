# Phase 6C Validation Report

Phase: Phase 6C - Resilience and Production Release

Status: **LOCAL_AND_PREVIEW_PASS / PRODUCTION_PENDING_EXPLICIT_AUTHORIZATION**

## Recovery and lifecycle

- Durable Object WebSockets use persisted public attachments (`seat`, monotonic session epoch, protocol version) and `getWebSockets()` after hibernation.
- A newer authenticated seat replaces the prior connection; a stale close cannot pause the replacement session.
- A current-seat disconnect pauses the room and persists a 120-second reclaim deadline. Reclaim receives a complete public snapshot and resumes only when both current seat epochs are connected.
- SQLite lifecycle data owns the earliest alarm deadline. Setup/inactivity/reconnect expiry becomes `abandoned`; retained terminal/abandoned data is deleted after one hour.
- Official Workers runtime tests cover hibernation, replacement, pause/reclaim, early alarm no-op, abandonment, and deletion.

## Authority and privacy

- The Worker remains transaction-first authority over sequence, command idempotency, lifecycle, and public snapshot broadcast. Game rules remain in `@greedy-sweeper/game-core`.
- Client envelopes are strictly validated, capped at 8 KB, and malformed/unknown fields fail before a command transition.
- Create (5/min), join/lookup (20/min), invalid route (10/min), and seat command (30/10s) limits are enforced. `ONLINE_ENABLED=false` rejects only new rooms.
- Turnstile remains disabled without a configured secret; a configured create path verifies Siteverify server-side and fails closed on missing/invalid proof.
- No production logging or telemetry was enabled. The readiness package documents the forbidden credential, hidden-state, source-identifying, and progression fields.

## Online progression and UX

- Browser reconnect retains the original pending command id/sequence and resubmits only after a new authoritative active snapshot.
- Pause, reconnecting, replacement, abandonment, verification-failed, and verified states are visible to the player.
- A terminal commitment is the stable idempotency key for a local `sessionSource: online` fact. The fact is registered only after terminal-proof verification; incomplete/invalid/abandoned rooms never register one.

## Load and Preview

- `npm run online:load` creates and joins 100 isolated local Workers-runtime rooms without code collisions. This is local capacity evidence, not a production-cost approval or 200 connected-player proof.
- Isolated Preview Worker: `https://greedy-sweeper-room-preview.onovich1110.workers.dev`.
- Current Preview Worker version: `418372d6-b15a-44bc-b3cf-e3c8d697a593`.
- GitHub-hosted external smoke [29635014174](https://github.com/onovich/GreedySweeper/actions/runs/29635014174) passed on 2026-07-18. It used no Cloudflare credentials, deployed nothing, and verified HTTPS health, WSS seat reclaim, and two-client Classic/Greed completion. It retains room credentials only in process memory and reports only a fixed outcome.
- Local Preview smoke remains blocked by this executor's local network policy (`fetch failed` before a Worker response); the external successful run is the authoritative independent evidence.

## Validation

The following commands pass after the Phase 6C commits:

```text
npm run format:check
npm run lint
npm run test:run                 # 29 files / 79 tests
npm run ai:evaluate
npm run greed:evaluate
npm run progression:evaluate
npm run protocol:evaluate
npm run worker:test              # 2 files / 15 official Workers-runtime tests
npm run online:e2e               # two-client Classic/Greed/recovery fixtures
npm run online:resilience
npm run online:security
npm run online:load
npm run worker:dry-run
npm run workspace:check
npm run arch:check
npm run build
git diff --check
```

## Commit trail and remote

Phase 6C commits: `20ed052`, `2991b83`, `e54fd8b`, `514d81f`, `8c2faba`, `6c44ec4`, `202b93c`, `0c5d2b3`, `94eddd0`, `dfe21cf`, `ad6584a`, `b96ac53`, `a9419a9`, `6e2df8c`, `194b358`, and `2b9f701`.

All listed commits were pushed to `origin/main`. Concurrent `Role.md` and `docs/domain-migration/**` were neither staged nor modified.

## Production gate and residual risk

Production is intentionally not started. No Workers Paid activation, production Worker route, Pages production release, custom domain, DNS change, billing action, or domain migration occurred.

Before Round 12 can run, the user must provide fresh explicit authorization covering Workers Paid, approved cost/alert thresholds, production Worker deployment, Pages release, and custom-domain/DNS activation. The dedicated domain-migration task must also provide its signed-off readiness result. See [production readiness package](./phase-6c-production-readiness.md).

The local load test does not yet prove the guide's 200 connected-player stress target or production cost behavior; those remain production-readiness gates rather than claims made by this report.
