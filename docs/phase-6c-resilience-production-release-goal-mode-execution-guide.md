# Phase 6C - Resilience and Production Release

Date: 2026-07-18
Status: Goal-mode execution guide for the implementation executor
Project: Greedy Sweeper
Round budget: 16 rounds; rounds 1-12 main delivery, rounds 13-15 repair buffers, round 16 final validation

## 0. Direct Goal Prompt

Turn the accepted Phase 6B private-room slice into a resilient, abuse-aware, observable, cost-bounded production online mode. Preserve server authority, hidden-information safety, command ordering, deterministic replay, and local gameplay. Add reconnect and seat replacement, WebSocket hibernation recovery, alarm-driven lifecycle and deletion, bounded abuse controls, privacy-safe operations, verified online progression, chaos/security/load gates, and a reversible production release. Work in small independently validated commits, prepare nonconflicting lanes early, but cross production gates strictly in order. Never perform billing, DNS, custom-domain, or destructive deployment actions without the documented gate and current user authorization.

## 1. Required Context

Read before changing code:

- `ROADMAP.md`, `CONTEXT.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, and `Role.md`
- `docs/phase-6-online-architecture-decision-brief.md`
- `docs/adr/0001-*.md` through `docs/adr/0029-*.md`
- `docs/phase-6a-validation-report.md` and `docs/phase-6b-validation-report.md`
- Phase 6A and Phase 6B execution guides
- `apps/room-worker/**`, `apps/web/src/application/online/**`, `packages/game-core/**`, and `packages/online-protocol/**`
- existing Workers-runtime, local two-client, and public Preview smoke tests
- current official Cloudflare Durable Objects WebSocket hibernation, alarms, SQLite, limits, Turnstile Siteverify, logs, versions, rollback, and custom-domain documentation
- the domain-migration task's accepted readiness output only; never edit its files
- `$donextgoal` and `$project-git-workflow`

Phase 6B at commit `994745f` is the accepted baseline. Preview Worker version `9ec485d4-1acf-4a05-aadc-a6e6ff15da1f` and external smoke run `29618575541` are the deployment baseline.

## 2. Phase Goal

- A disconnected seat pauses immediately and can reclaim its seat within 120 seconds.
- A newly authenticated connection replaces the older Active Seat Connection deterministically.
- Durable Object eviction or hibernation never loses authority, socket identity, deadlines, or accepted commands.
- Setup rooms with no invitee expire after 10 minutes.
- Joined matches with no accepted command for 10 minutes become Abandoned Matches with no winner or progression result.
- Reconnect timeout abandons the match; completed and abandoned data is hard-deleted after one hour.
- Rate limits, message limits, optional Turnstile, privacy-safe logs, `ONLINE_ENABLED`, and cost controls fail closed without corrupting existing rooms.
- Only a locally Verified Match Result enters local progression with `sessionSource: online`.
- Security, chaos, hibernation, lifecycle, load, rollback, Preview, and Production smoke gates are repeatable.
- Production uses Workers Paid, the approved custom domain, Worker-first compatibility, and rollback only after explicit authorization.

## 3. Fixed Architecture and Product Decisions

### 3.1 Reconnect and hibernation

- Seat Token remains the room-scoped credential; only its digest is stored.
- Authentication remains the first WebSocket message within five seconds.
- One seat has one Active Seat Connection. New authentication registers first, then closes the prior connection with `seat_replaced`.
- Disconnect persists a 120-second reconnect deadline and pauses the match immediately.
- Reconnect returns a complete Public Board Projection and canonical sequence; clients never merge gameplay patches.
- Pending-command retry keeps its original Command ID and expected sequence.
- Socket attachments contain public session metadata only, never credentials, hidden state, or authority state.
- On wake, rebuild from metadata and Accepted Command Log; validate or rebuild snapshots and fail closed on irreconcilable conflicts.
- Memory is never authoritative for active seat, sequence, lifecycle, pause state, or deadlines.

### 3.2 Alarm lifecycle

- One persisted next-deadline model owns setup expiry, inactivity abandonment, reconnect expiry, and terminal deletion.
- Durable Object alarms enforce deadlines; browser timers are presentation only.
- Alarm handlers transactionally re-read state, are idempotent, ignore superseded deadlines, and schedule the next earliest deadline.
- Terminal deletion removes metadata, seat digests, commands, snapshots, proofs, and operational room records after one hour.
- Abandoned Matches have no winner and cannot create progression facts.

### 3.3 Abuse, privacy, and cost

- Create room: 5 attempts per source per minute.
- Join/lookup: 20 attempts per source per minute.
- Invalid Room Code: 10 attempts per source per minute.
- Commands: 30 per seat per 10 seconds.
- WebSocket messages remain limited to 8 KB.
- Turnstile is disabled by default, feature-flagged, and verified only through Worker-side Siteverify.
- Logs contain minimal event names and coarse outcomes only.
- Never log Room Code, Seat Token/digest, seed/salt, hidden board, coordinates, IP, User-Agent, fingerprint, or progression data.
- `ONLINE_ENABLED=false` blocks new rooms before affecting existing rooms.
- Production requires the accepted Paid-plan authorization, alerts, overload thresholds, and rollback controls.

### 3.4 Online progression

- The existing replay-derived local reducer remains the sole progression authority.
- Build an online fact only after commitment, command order, deterministic replay, and terminal hash verify locally.
- Use `sessionSource: online` and a stable idempotent identity without storing credentials or hidden data.
- Abandoned, incomplete, incompatible, duplicate, or verification-failed matches are no-ops.
- No account, cloud sync, ranking, or server-side progression.

### 3.5 Compatibility and release

- Support the current and immediately previous Online Protocol Versions during rollout.
- SQLite migrations are forward-only, additive, repeatable, and deployed before dependent code.
- Production order is compatible Worker first, old/new client smoke, then Pages client.
- Record Worker version, web commit, protocol versions, migration tag, Preview evidence, and rollback target.
- DNS migration remains owned by the dedicated task; Phase 6C consumes only its signed-off readiness result.

## 4. Explicit Non-Scope

- No accounts, matchmaking, rankings, friends, names, avatars, chat, reactions, spectators, rematch, or cloud profile.
- No new gameplay, balance, AI, challenge, replay, achievement, or unrelated visual redesign.
- No formal SLA or mainland-China latency promise.
- No external telemetry vendor or request-level personal-data store.
- No destructive schema migration in the same release as its replacement.
- Do not edit or stage `docs/domain-migration/**` or unrelated concurrent files.
- Do not modify `origin/`.

## 5. Acceleration and Dependency Model

Prepare these lanes independently after round 1 freezes their contracts:

| Lane               | Parallel-ready work                        | Deliverable                                               |
| ------------------ | ------------------------------------------ | --------------------------------------------------------- |
| Recovery           | alongside lifecycle, abuse, progression    | hibernation/reconnect/seat fixtures and implementation    |
| Lifecycle          | alongside recovery, abuse, progression     | deadline model, alarms, retention tests                   |
| Abuse/ops          | alongside recovery, lifecycle, progression | limits, Turnstile flag, log guard, kill switch            |
| Client/progression | alongside server lanes                     | reconnect state machine, verified fact adapter, UI states |
| Validation         | as fixtures stabilize                      | chaos, security, load, external smoke commands            |
| Release docs       | alongside local lanes                      | deployment, rollback, cost, and DNS-readiness runbook     |

The executor may reorder nonconflicting substeps in rounds 2-7 to avoid waiting, but every focused change still receives its own validation, commit, and push.

Strictly serial production gates:

1. Protocol, schema, threat model, and migrations pass locally.
2. Recovery, lifecycle, abuse, and progression focused suites pass.
3. Integrated Workers-runtime chaos, security, and load matrix passes.
4. Isolated Preview deploy plus external HTTPS/WSS/reconnect/lifecycle smoke passes.
5. Production readiness confirms Paid authorization, cost controls, rollback, migration tag, and domain-task readiness.
6. Backward-compatible Worker and migration deploy first.
7. Old/new protocol smoke passes before Pages release.
8. Production custom-domain HTTPS/WSS two-client smoke passes before acceptance.

## 6. Per-Round Fixed Workflow

Every round response must contain:

- round goal and smallest player/operator value
- lane and dependency status
- completed files and boundary changes
- Debug self-check
- architecture/security self-check
- validation commands and exact results
- commit hash, branch, and push result
- next-round and parallel-ready work
- whether a buffer round was consumed

Rules:

- Validation, commit, or push failure blocks dependent progress.
- Production side effects require the serial gate and current explicit user authorization.
- Stage phase-relevant files only. Never stage concurrently modified `Role.md` or `docs/domain-migration/**`.
- Use Conventional Commits and repository wrappers; no `--no-verify`, force push, or destructive Git.

## 7. Debug Self-Check

- Can the change be proven by the smallest disconnect, replacement, eviction, alarm, abuse, verification, or release fixture?
- Can failure be localized to protocol, socket registry, storage, alarm scheduler, limiter, Siteverify adapter, log policy, client state machine, progression reducer, load harness, or deployment config?
- Are success, duplicate, stale, out-of-order, disconnected, replaced, expired, evicted, incompatible, overloaded, and corrupted states covered?
- Does rejection or retry preserve sequence, log, snapshot, active seat, and deadlines?
- Does wake/reconnect derive state from storage rather than prior memory?
- Are clocks and source identity injected in tests?
- If UI changed, is each state repeatable in browser smoke?
- If deployed, are version, migration, smoke, rollback, and remote state recorded?

## 8. Architecture and Security Self-Check

- Is `game-core` still the sole gameplay truth and the Worker the sole Match Authority?
- Are socket state and broadcasts downstream of committed storage?
- Are snapshots public projections without hidden state?
- Are credentials, seed/salt, coordinates, IP/User-Agent, and progression absent from logs/errors?
- Are protocol, rules, replay, snapshot, facts, and storage versions distinct?
- Are alarm/reconnect transitions idempotent and transactional?
- Does online progression consume only locally verified immutable facts?
- Does overload block new rooms before existing rooms?
- Is current/previous protocol compatibility preserved?
- Are domain-task and unrelated files untouched?

## 9. Required Aggregate Gates

```text
npm run format:check
npm run lint
npm run test:run
npm run ai:evaluate
npm run greed:evaluate
npm run progression:evaluate
npm run protocol:evaluate
npm run online:evaluate
npm run worker:test
npm run worker:dry-run
npm run online:e2e
npm run online:resilience
npm run online:security
npm run online:load
npm run online:preview-smoke
npm run workspace:check
npm run arch:check
npm run build
git diff --check
```

- `online:resilience`: reconnect, replacement, eviction/hibernation, alarms, abandonment, deletion, retry, and corruption.
- `online:security`: auth, cross-room, oversize, rates, Turnstile, secret/log scans, incompatibility, and hidden state.
- `online:load`: reproducible 100-room target and 200-room stress with integrity and latency summaries.
- `online:preview-smoke`: external Classic/Greed plus reconnect and lifecycle checks.

Each gate becomes mandatory in CI and later rounds once introduced.

## 10. Round Plan

1. **Contracts, threat model, and red gates**: freeze reconnect/session/deadline/error/version contracts, additive migration plan, privacy matrix, load metrics, and production checklist; add failing guards first.
2. **Hibernation-safe socket authority**: add public socket attachments and persisted session epochs; reconstruct authority/snapshots after eviction without trusting memory.
3. **Reconnect and seat replacement**: implement pause, 120-second reclaim, pending-command retry, complete snapshot recovery, `seat_replaced`, and client states.
4. **Alarm lifecycle and retention**: implement next deadline, setup expiry, inactivity/reconnect abandonment, one-hour deletion, superseded-alarm no-op, and migration tests.
5. **Rate limits and overload**: implement fixed limits, 8 KB enforcement, structured errors, deterministic clock/source adapters, `ONLINE_ENABLED`, and existing-room protection.
6. **Turnstile, logs, and privacy**: add disabled-by-default Siteverify adapter, minimal event vocabulary, forbidden-field scans, retention policy, and safe diagnostics.
7. **Verified progression and UX**: add immutable verified online facts, idempotency, no-op exclusions, reconnect/pause/abandoned/incompatible/verification states, and local tests.
8. **Integrated resilience/security harness**: expose `online:resilience` and `online:security`; cover delayed/lost/out-of-order messages, attacks, eviction, corruption, alarm races, secret scans, and both rulesets.
9. **Load, cost, and capacity**: expose `online:load`; validate 100 rooms/200 players and 200-room stress without corruption; record p95, costs, alert plan, and overload thresholds.
10. **Preview resilience release**: deploy additive migration and compatible Worker to isolated Preview; run external Classic/Greed, reconnect/replacement, lifecycle, security, rollback, and Pages regression smoke.
11. **Production readiness package**: finalize deploy/rollback/migration/log/cost/incident runbooks, prove protocol compatibility, consume domain readiness, and request explicit Paid/production/custom-domain authorization. If unavailable, return `BLOCKED` with local/Preview work committed.
12. **Controlled production release**: after authorization, deploy compatible Worker/migration first, smoke old/new clients, release Pages second, activate approved custom domain, run production two-client/reconnect smoke, and verify costs/logs/kill switch. Roll back on any consistency, security, ordering, isolation, recovery, or hidden-state failure.
13. **Buffer 1**: repair only rounds 1-12 issues; if unused, no commit.
14. **Buffer 2**: repair only rounds 1-12 issues; if unused, no commit.
15. **Buffer 3**: repair only rounds 1-12 issues; if unused, no commit.
16. **Final validation**: run local, Workers-runtime, Preview, security, chaos, load, compatibility, migration, rollback, Pages, and Production matrices; audit remote versions/routes/cost/log policy and write `docs/phase-6c-validation-report.md`.

## 11. Hard Release Gates

| Gate         | PASS evidence                                                                          | Failure action                                      |
| ------------ | -------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Consistency  | transaction/log/snapshot/sequence invariants under retry, eviction, alarm races        | block release                                       |
| Hidden state | payload, log, error, storage-export, and client scans reveal no forbidden data         | block release                                       |
| Recovery     | reconnect/replacement/hibernation returns canonical snapshot and preserves idempotency | block release                                       |
| Lifecycle    | exact deadlines, Abandoned semantics, and one-hour deletion                            | block release                                       |
| Security     | auth, cross-room, oversize, rates, Turnstile, incompatibility fail closed              | block release                                       |
| Load         | 100-room target and 200-room stress without corruption                                 | latency miss needs accepted risk; corruption blocks |
| Cost         | Paid authorization, alerts, kill switch, overload behavior                             | block production                                    |
| Preview      | external resilience/security smoke and rollback drill                                  | block production                                    |
| Domain       | dedicated task declares custom-domain readiness                                        | block custom domain only                            |
| Production   | Worker-first compatibility, Pages second, final HTTPS/WSS smoke                        | roll back and block acceptance                      |

## 12. PASS Criteria

- Reconnect, replacement, hibernation, alarms, abandonment, and retention match accepted decisions.
- Authority, transaction-first broadcast, ordering/idempotency, hidden-state safety, and verification survive chaos and eviction.
- Abuse, Turnstile, logs, kill switch, overload, cost, and privacy controls are tested without forbidden data.
- Only locally verified online results enter local progression idempotently.
- 100-room target and 200-room stress preserve state integrity; latency evidence is honest.
- Preview resilience/security smoke and rollback pass.
- Production uses approved Paid/custom-domain operations only after authorization and domain readiness.
- Compatibility, migrations, Worker-first/Pages-second release, production smoke, and rollback are proven.
- All gates pass, every round is pushed, concurrent files remain untouched, and the report contains no secrets.

## 13. Final Report Template

```text
Phase: Phase 6C - Resilience and Production Release
Status: PASS | BLOCKED
Rounds used: <main>/<buffer>/<final>
Recovery: <disconnect/reconnect/replacement/hibernation evidence>
Lifecycle: <setup/inactivity/reconnect/terminal deadlines and deletion>
Authority: <transaction/log/snapshot/idempotency evidence>
Security/privacy: <auth/rate/Turnstile/hidden/log scans>
Online progression: <verified fact/idempotency/exclusions>
Load/cost: <100/200-room results, p95, Paid/alerts/kill switch>
Compatibility/migrations: <protocol window and migration tag>
Preview: <Worker version, external smoke, rollback>
Production: <custom domain, Worker version, web commit, smoke>
Validation: <commands and exact results>
Commits: <round -> hash>
Remote: origin/main <push result>
Concurrent exclusions: <Role.md/domain-migration evidence>
Scope deviations: <none or explicit list>
Residual risks: <explicit accepted risks only>
Return to planner: 019f6768-2328-76f2-a6e4-da752c6eb85c
```
