# Phase 6B - Playable Private-Room Vertical Slice

Date: 2026-07-17
Status: Goal-mode execution guide for the implementation executor
Project: Greedy Sweeper
Round budget: 16 rounds; rounds 1-12 main delivery, rounds 13-15 repair buffers, round 16 final validation

## 0. Direct Goal Prompt

Build the first playable two-player private-room vertical slice on the accepted Phase 6A workspace and protocol foundation. A creator must be able to create a fixed Classic or Greed room, share an invite, let exactly one invitee inspect and accept the rules, authenticate both seats over WebSocket, and finish a server-authoritative match driven by the shared game core. Deliver public snapshots, ordered idempotent commands, random opening-player selection, seed commitment, and client-side terminal verification. Deploy only an isolated Cloudflare `workers.dev` Preview after every local gate passes. Do not implement Phase 6C resilience, production release, DNS, or online progression.

## 1. Required Context

Read before changing code:

- `ROADMAP.md`, `CONTEXT.md`, `ARCHITECTURE.md`, and `CONTRIBUTING.md`
- `docs/phase-6-online-architecture-decision-brief.md`
- `docs/adr/0001-*.md` through `docs/adr/0029-*.md`
- `docs/phase-6a-validation-report.md`
- `docs/phase-6a-shared-core-online-protocol-foundation-goal-mode-execution-guide.md`
- workspace package manifests, public package exports, architecture/workspace guards, CI, and deployment workflows
- `packages/game-core/**`, `packages/online-protocol/**`, `apps/room-worker/**`, and the existing local controller/UI boundaries in `apps/web/**`
- official Cloudflare Durable Objects SQLite transaction and WebSocket guidance applicable to the installed Wrangler version
- `$donextgoal` and `$project-git-workflow`

Phase 6A at commit `1ea80ff` is the accepted structural and behavioral baseline. The decision brief and ADRs are binding.

## 2. Phase Goal

Deliver one narrow end-to-end online path:

- Exactly two anonymous Guest Players enter one invitation-only Private Room.
- The creator chooses immutable fixed-config Classic v1 or Greed v2 rules before room creation.
- The invitee inspects and explicitly accepts the rules before the match starts.
- The Match Authority generates the board seed, salt, and random Opening Player.
- Seat Tokens are unguessable room-scoped credentials, stored only as SHA-256 digests and never placed in URLs or logs.
- Both clients authenticate with the first WebSocket message and receive the canonical Public Board Projection.
- Only the Active Player can submit a versioned Player Command with Command ID and expected sequence.
- One SQLite transaction deduplicates, validates, executes `game-core`, appends the command, and updates canonical state before broadcast.
- Clients do not optimistically apply gameplay; accepted server state replaces the online projection.
- Normal completion reveals seed and salt so both clients can verify commitment, accepted commands, deterministic replay, and terminal hash.
- The existing local game and local progression behavior remain unchanged.
- The slice is validated locally, then deployed only to an isolated `workers.dev` Preview.

## 3. Fixed Technical Choices

### 3.1 HTTP and WebSocket surface

Keep a small versioned surface owned by `apps/room-worker`:

- `POST /v1/rooms` creates a room and returns Room Code plus creator Seat Token.
- `GET /v1/rooms/:roomCode` returns non-secret setup/rules information only.
- `POST /v1/rooms/:roomCode/join` accepts the immutable rules and returns the invitee Seat Token.
- `GET /v1/rooms/:roomCode/socket` upgrades to WebSocket; authentication data is sent in the first protocol message, never in the URL.
- Existing health behavior remains available.

Exact response envelopes and error codes must live in `packages/online-protocol`; route handlers must not invent parallel contracts.

### 3.2 Room and seat identity

- Room Code is eight Crockford Base32 characters with cryptographic generation and collision retry.
- Seat Token is 256 random bits encoded as Base64URL. Persist only its SHA-256 digest.
- Command ID is UUID v4 generated with browser cryptographic randomness.
- A room has creator and invitee seats only. Public lookup never authenticates a seat.
- The invite URL carries only `?room=XXXXXXXX`.
- Phase 6B may reject an already-active duplicate seat connection deterministically; automatic seat replacement belongs to Phase 6C.

### 3.3 Authority and persistence

- Immutable match metadata and the Accepted Command Log are authoritative.
- Match Snapshot is a hash-checked materialized cache and must be rebuildable from metadata plus commands.
- Every accepted command commits in one SQLite transaction before any WebSocket acceptance/broadcast.
- Expected sequence and Command ID provide ordering and idempotency. Duplicate retries return the prior accepted outcome; stale or conflicting commands are rejected without state change.
- `game-core` remains the only rules implementation. Worker adapters translate protocol commands to public core commands and never copy scoring, board, Greed, Bank, replay, or terminal semantics.
- Phase 6B stores lifecycle deadlines in canonical state but does not enforce them with Durable Object alarms; alarm-driven abandonment and deletion belong to Phase 6C.

### 3.4 Hidden information and verification

- Generate seed and salt inside the Match Authority.
- Publish `SHA-256(canonical commitment payload)` at match start; define the canonical payload in the protocol package and fixture it byte-for-byte.
- Public snapshots and broadcasts must never contain hidden mine locations, hidden cell values, seed, or salt before normal completion.
- On normal completion, reveal seed and salt and provide enough accepted-command and terminal-integrity data for deterministic local verification.
- Verification failure is a visible terminal error and must not mutate local progression.
- Phase 6B records no online result in progression, even when verified; online progression is Phase 6C scope.

### 3.5 Client architecture

- Preserve the local controller unchanged and local-only.
- Add a separate online controller/state machine that owns create, inspect, join, authenticate, synchronize, command pending/accepted/rejected, opponent turn, terminal verification, and errors.
- Share pure board, score, Greed, Bank, and result presentation where practical, but do not make shared UI depend on transport state.
- No optimistic gameplay transition. Disable additional command submission while one command is pending.
- Store each Seat Token only in browser session-scoped storage with safe failure behavior; never place it in persistent replay/progression storage.

### 3.6 Preview environment

- Use an isolated `workers.dev` Preview Worker, Durable Object namespace, bindings, and non-production configuration.
- Configure the web client endpoint through an explicit build-time environment value with a safe “online unavailable” state when absent.
- Preview deployment must not add a production route, custom domain, DNS record, production secret, or Workers Paid dependency.
- Record the Preview URL and Worker version in the final report, but never record Seat Tokens, seed/salt, room identifiers used in testing, or credentials.

## 4. Explicit Non-Scope

- No accounts, matchmaking, rankings, friends, names, avatars, chat, reactions, spectators, rematch, or cloud profile.
- No automatic reconnect recovery, seat replacement, hibernation hardening, alarm-driven timeout/retention, rate limiting, Turnstile, production logs policy, load target certification, cost alerts, or kill switch.
- No online progression submission or cross-device persistence.
- No production Worker deployment, production Durable Object namespace, Paid-plan activation, custom domain, Cargo, DNS, nameserver, certificate, or Cloudflare zone migration.
- Do not touch `docs/domain-migration/**`; it belongs to the dedicated domain-migration task.
- No local gameplay, AI, balance, challenge, replay, history, achievement, or visual redesign unrelated to the online path.
- Do not modify `origin/` or unrelated user files.

## 5. Per-Round Fixed Workflow

Every round response must contain:

- round goal and smallest player/maintainer value
- completed files and boundary changes
- Debug self-check
- architecture self-check
- validation commands and exact results
- commit hash, branch, and push result
- next-round goal
- whether a buffer round was consumed

Progression rules:

- Validation failure: do not commit, push, deploy, or enter the next round.
- Commit failure: do not enter the next round.
- Push failure: do not enter the next round.
- Preview deployment is forbidden before its dedicated round and all preceding gates pass.
- Push success: record the hash and `origin/main`, then continue.
- Stage only phase-relevant files. Never stage `docs/domain-migration/**` or unrelated concurrent changes.
- Use Conventional Commits and the repository wrapper. Never use `--no-verify`, force push, or destructive Git commands.

## 6. Debug Self-Check

Each round must answer:

- Can the behavior be explained with the smallest room, two-seat, command, snapshot, or verification fixture?
- Can failures be localized to HTTP routing, Room Code lookup, seat authentication, WebSocket transport, protocol validation, SQLite transaction, game-core transition, public projection, online controller, UI, or Preview configuration?
- Are success, malformed, empty, duplicate, stale, wrong-seat, wrong-turn, incompatible-version, oversize, hidden-state, and storage-reconstruction states covered where relevant?
- Does a rejected command leave sequence, snapshot, accepted log, and active player unchanged?
- Does a duplicate accepted Command ID return the original result without executing twice?
- Can canonical state rebuild after object eviction without trusting in-memory state?
- Can both Classic and Greed complete through the same authority path?
- Does terminal verification independently detect altered commitment, command order, replay result, or terminal hash?
- If UI changed, is there a repeatable two-client browser or equivalent end-to-end smoke path?

## 7. Architecture Self-Check

Each round must answer:

- Is `packages/game-core` still the sole source of gameplay truth?
- Does `online-protocol` define contracts without owning transport, storage, React, or rules execution?
- Is `apps/room-worker` a host/authority adapter rather than a copied game engine?
- Is the online controller separate from the local controller and free of canonical authority?
- Are Public Board Projections free of hidden mines and unrevealed values?
- Are seat secrets absent from URLs, logs, public snapshots, replay history, and progression storage?
- Are protocol, rules, replay, storage, and snapshot versions explicit and distinct?
- Are command commit and broadcast ordered transaction-first?
- Did the round avoid Phase 6C resilience, production, DNS, domain-migration, and unrelated feature scope?
- Are unrelated files and concurrent task output untouched?

## 8. Required Aggregate Gates

Preserve every Phase 6A gate and add focused commands as they become available:

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
npm run workspace:check
npm run arch:check
npm run build
git diff --check
```

`online:evaluate` must deterministically exercise lifecycle, identity, command ordering/idempotency, hidden-state, and terminal-verification fixtures. `online:e2e` must run a local two-client Classic and Greed happy path plus representative rejection paths against the Workers runtime. Once introduced, each command is mandatory in later rounds and must enter the reusable project workflow/CI configuration.

## 9. Round Plan

1. **Boundary contract and red fixtures**: document the HTTP/WebSocket/DO/controller ownership map; add failing fixtures and guards for forbidden local-controller coupling, copied rules, secret leakage, optimistic gameplay, and transaction-after-broadcast behavior.
2. **Protocol expansion**: add strict versioned room create/inspect/join, authentication, setup acceptance, command outcome, terminal proof, and public snapshot contracts with adversarial fixtures and size limits.
3. **Durable room schema and repositories**: add forward-only SQLite schema for metadata, seat digests, accepted commands, snapshots, lifecycle, versions, commitment, and deadlines; prove atomic initialization and reconstruction after eviction.
4. **Room creation and lookup**: implement cryptographic Room Code generation/collision retry, creator Seat Token issuance/digest storage, fixed Classic/Greed selection, non-secret inspection, structured errors, and no-secret logging tests.
5. **Invitee join and setup acceptance**: enforce exactly one invitee, immutable rules inspection/acceptance, idempotent join behavior where safe, random Opening Player, seed/salt generation, and canonical commitment creation without starting a public match early.
6. **WebSocket authentication and session transport**: implement upgrade plus first-message seat authentication, protocol/version/size checks, two-seat session registry, deterministic duplicate-connection handling, canonical authenticated snapshot, and close/error behavior; no reconnect feature.
7. **Authoritative command transaction**: validate seat, turn, rules, expected sequence, and Command ID; execute public `game-core`; append command and update hash/snapshot/lifecycle in one SQLite transaction before acceptance broadcast.
8. **Projection, broadcast, and terminal proof**: broadcast only canonical public state; support rejection without mutation; reveal proof only on normal completion; add snapshot rebuild and tamper-detection fixtures for Classic and Greed.
9. **Online web transport and controller**: add endpoint configuration, session token adapter, HTTP/WebSocket client, separate online state machine, pending-command lock, snapshot replacement, protocol errors, and terminal verification without touching local progression.
10. **Private-room UI flow**: add an intentional accessible responsive online entry, create/setup/wait/invite-review/join/auth/sync/turn/opponent-turn/error states, Room Code invite copy, and safe online-unavailable fallback while preserving local play.
11. **Playable two-client integration**: wire shared board/score/Greed/Bank presentation to the online controller; complete Classic and Greed in two clients; add local Workers-runtime E2E for happy paths, stale/duplicate/wrong-seat/wrong-turn/oversize/incompatible cases, and terminal verification.
12. **Preview deployment and maintainer docs**: update CI, commands, environment docs, architecture/roadmap/README, deploy only the isolated `workers.dev` Preview, run HTTPS/WSS two-client smoke, confirm Pages local mode remains intact, and record rollback/removal steps. If credentials are unavailable, finish all local work and return `BLOCKED` with the exact missing Cloudflare access rather than deploying elsewhere.
13. **Buffer 1**: repair only issues found in rounds 1-12. If unused, report unused and create no commit.
14. **Buffer 2**: repair only issues found in rounds 1-12. If unused, report unused and create no commit.
15. **Buffer 3**: repair only issues found in rounds 1-12. If unused, report unused and create no commit.
16. **Final validation**: run the complete matrix, package/boundary/secret scans, SQLite reconstruction and transaction tests, two-client Classic/Greed flows, Preview HTTPS/WSS smoke, Pages/local regression checks, commit/push/deployment audit, and final report. Commit only final repairs or report updates.

## 10. Validation Matrix

| Concern        | Required evidence                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Room setup     | cryptographic Room Code, one creator/invitee, immutable Classic/Greed rules, explicit acceptance, random opener       |
| Secrets        | token digest only at rest; no token in URL/log/snapshot/history/progression; seed/salt hidden until completion        |
| Protocol       | strict room/auth/command/snapshot/terminal envelopes, size/version/unknown-field/adversarial fixtures                 |
| Authority      | game-core execution only in Worker authority; no client optimistic transition; transaction before broadcast           |
| Ordering       | sequence and Command ID idempotency; duplicate retry stable; stale/conflicting command has no mutation                |
| Persistence    | metadata plus accepted log rebuilds state after forced eviction; snapshot hash mismatch fails closed/rebuilds         |
| Hidden state   | every pre-terminal response and broadcast passes Public Board Projection guards and secret scans                      |
| Terminal proof | commitment, seed/salt reveal, replay, ordered commands, and terminal hash verify independently                        |
| Web client     | separate online controller, session-scoped seat token, accessible two-player Classic/Greed flow, local mode unchanged |
| Preview        | isolated `workers.dev` only, HTTPS/WSS smoke, no production route/domain/DNS/Paid dependency                          |
| Compatibility  | all Phase 6A and prior Classic/Greed/AI/challenge/replay/progression gates remain green                               |
| Git/scope      | per-round push, clean tracked worktree, domain-migration and unrelated files excluded                                 |

## 11. PASS Criteria

- Two fresh browser clients can create, inspect, join, authenticate, and finish both fixed Classic and Greed matches through one isolated Preview authority.
- The Worker is the sole Match Authority and executes the shared `game-core`; clients never upload state or optimistically apply gameplay.
- Room, seat, command, sequence, immutable rules, seed commitment, public projection, accepted log, snapshot, and terminal-proof contracts are versioned and strictly validated.
- Seat Tokens and hidden game data do not leak through URLs, logs, public payloads, browser persistent storage, or local progression.
- SQLite transactions prove duplicate/stale/wrong-seat/wrong-turn rejection semantics and persistence/rebuild across forced eviction.
- Normal terminal state is independently verifiable from commitment, revealed seed/salt, ordered accepted commands, replay, and terminal hash.
- Local play, Pages build, all prior tests/evaluators, workspace boundaries, and architecture guards remain intact.
- The complete aggregate matrix passes, every implementation round is committed/pushed, and only the isolated `workers.dev` Preview is deployed.
- `docs/phase-6b-validation-report.md` records exact local and Preview evidence, Worker version/URL, commit trail, scope exclusions, and Phase 6C residual risks without secrets.

## 12. Final Report Template

```text
Phase: Phase 6B - Playable Private-Room Vertical Slice
Status: PASS | BLOCKED
Rounds used: <main>/<buffer>/<final>
Room flow: <create/inspect/join/accept/auth evidence>
Rulesets: <Classic and Greed two-client evidence>
Authority: <game-core adapter/transaction-before-broadcast evidence>
Identity and secrets: <Room Code/token digest/no-leak evidence>
Protocol: <versions/messages/adversarial fixtures>
Persistence: <SQLite transaction/log/snapshot/eviction/rebuild evidence>
Hidden state: <projection and secret-scan evidence>
Terminal verification: <commitment/reveal/replay/hash evidence>
Web architecture: <separate controller/session storage/local regression>
Validation: <commands and exact results>
Commits: <round -> hash>
Remote: origin/main <push result>
Preview deployment: <workers.dev URL, Worker version, HTTPS/WSS smoke; no secrets>
Production deployment/DNS: none (required)
Concurrent files excluded: docs/domain-migration/** <evidence>
Scope deviations: <none or explicit list>
Residual risks: <Phase 6C reconnect/seat replacement/hibernation/alarms/retention/rate limits/logs/progression/load/cost/production>
Return to planner: 019f6768-2328-76f2-a6e4-da752c6eb85c
```
