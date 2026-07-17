# Phase 6 Online Architecture Decision Brief

Date: 2026-07-17
Status: Shared understanding confirmed; Phase 6A accepted and Phase 6B planning active
Scope: Greedy Sweeper private-room online MVP

## 1. Product boundary

The online MVP is a synchronous match between exactly two Guest Players in an invitation-only Private Room. The creator selects an immutable fixed-config Classic or Greed Online Ruleset, the invited player reviews and accepts it, and the Match Authority randomly chooses the Opening Player.

The two players share one canonical board and alternate actions. Online play replaces the local AI participant; it does not create a race ruleset or simultaneous action model.

The MVP explicitly excludes accounts, public matchmaking, rankings, friends, free-form names, avatars, chat, reactions, spectators, rematches, cloud progression, and cross-device identity.

## 2. Platform and repository shape

- Runtime: Cloudflare Workers plus one Durable Object per Private Room.
- Development endpoint: isolated `workers.dev` Preview environments.
- Production endpoint: `https://greedysweeper-api.onovich.com` and the equivalent WSS origin.
- Web client: remains on GitHub Pages at `https://blog.onovich.com/GreedySweeper/`.
- Repository: npm workspaces with `apps/web`, `apps/room-worker`, `packages/game-core`, and `packages/online-protocol`.
- Dependency rule: both applications consume the same pure game core; neither duplicates game semantics.

## 3. Authority and synchronization

- Clients send strict versioned JSON Player Commands with Command ID and expected sequence.
- The Match Authority authenticates the seat, validates turn and sequence, executes `game-core`, commits storage, and only then broadcasts acceptance.
- Clients never upload canonical game state and do not apply optimistic gameplay transitions.
- Authentication happens in the first WebSocket message within five seconds; Seat Tokens never enter URLs.
- Online Protocol Version, Online Ruleset version, and replay version are separate contracts.
- Reconnect always returns a complete Public Board Projection and current public state; v1 does not merge incremental patches.
- One Seat Token has one Active Seat Connection. A newly authenticated connection replaces the old connection with `seat_replaced`.

## 4. Identity and invitation

- Room Code: eight Crockford Base32 characters with collision retry; shareable and non-authenticating.
- Seat Token: room-scoped 256-bit Base64URL secret; only its SHA-256 digest is stored server-side.
- Command ID: UUID v4 generated with browser cryptographic randomness.
- Invite URL: `https://blog.onovich.com/GreedySweeper/?room=XXXXXXXX`.
- Player labels: creator/invitee during setup and you/opponent during play.

## 5. Hidden information and verification

- The server generates the board seed, salt, and Opening Player.
- At match start it publishes a Seed Commitment but not the seed or hidden board.
- During play clients receive only Public Board Projections.
- Normal completion reveals seed and salt.
- Clients verify the commitment, ordered commands, deterministic replay, and terminal hash.
- Only a Verified Match Result can enter local progression with `sessionSource: online`.
- Abandoned, incomplete, incompatible, or verification-failed matches never enter progression.

## 6. Durable state and transactions

Immutable match metadata plus the append-only Accepted Command Log are the source of truth. Match Snapshot is a hash-checked materialized cache.

Every accepted command uses one SQLite transaction to:

1. Deduplicate Command ID.
2. Validate seat, Active Player, Online Ruleset, and expected sequence.
3. Execute the shared pure transition.
4. Append the accepted command and result hash.
5. Update snapshot, sequence, state hash, lifecycle, and deadlines.
6. Commit before WebSocket broadcast.

Hibernation recovery never trusts previous memory. A damaged snapshot is rebuilt from metadata and commands; an irreconcilable log/snapshot conflict fails closed.

## 7. Room lifecycle

- Room Setup without an invited join: delete after 10 minutes.
- Active match without an accepted command: become Abandoned Match after 10 minutes.
- Disconnected player: pause immediately and allow 120 seconds to reclaim the seat.
- Reconnect timeout: Abandoned Match with no winner or progression result.
- Completed or abandoned terminal data: hard-delete after one hour.
- Deadlines use Durable Object alarms, never browser timers.

## 8. Abuse, privacy, and observability

- Create room: 5 attempts per source per minute.
- Join/lookup: 20 attempts per source per minute.
- Invalid Room Code: 10 attempts per source per minute.
- Commands: 30 per seat per 10 seconds.
- WebSocket message maximum: 8 KB.
- Turnstile: disabled by default and feature-flagged for abuse escalation, with mandatory Worker-side Siteverify.
- Logs: native Workers Logs only, seven-day Paid-plan retention, no external telemetry.
- Forbidden logs: Room Code, Seat Token/digest, seed/salt, hidden board, action payload/coordinates, IP, User-Agent, device fingerprint, and local progression.

## 9. Cost and overload

- Development and private validation use Workers Free.
- Public online play requires Workers Paid at the current minimum monthly plan.
- Production includes cost alerts and an `ONLINE_ENABLED` kill switch.
- Overload or budget protection blocks new rooms before disrupting existing rooms.

## 10. Release compatibility

- Preview uses independent Worker, Durable Object namespace, storage, secrets, and rate limits.
- Durable Object migrations are forward-only, additive, and repeatable.
- Production deploys a backward-compatible Worker before the GitHub Pages client.
- The Worker supports the current and previous Online Protocol Versions.
- Destructive schema changes are forbidden in the same release as their replacement.
- Production requires manual approval and records Worker version, web commit, protocol version, and migration tag.

## 11. UI architecture

The existing local controller remains local-only. A separate online controller owns room setup, authentication, connection, reconnect, snapshot replacement, command confirmation, pause, abandonment, terminal verification, and online errors. Pure board, score, Greed, and Bank presentation components may be shared.

Required online UI states include creating, waiting, invite review, authenticating, synchronizing, local turn, opponent turn, reconnecting, opponent disconnected, terminal verification, verified completion, abandonment, incompatibility, recoverable error, and fatal error.

## 12. Capacity and hard quality gates

- Target: 100 concurrent rooms / 200 connected players.
- Stress boundary: 200 concurrent rooms without state corruption.
- Synthetic p95 guidance: create/join under 1 second, command confirmation under 500 ms, reconnect snapshot under 3 seconds.
- No formal SLA and no mainland-China latency promise.
- Consistency, security, ordering, isolation, or recovery failure blocks release.
- Latency-only misses may ship only with an explicit accepted risk.

Required validation includes shared game fixtures, protocol schemas, Durable Object transactions and alarms, forced hibernation, lifecycle models, two-client Classic and Greed browser flows, duplicate/delayed/lost/out-of-order messages, disconnect and seat replacement, Room Code abuse, token failures, oversized messages, cross-room attempts, hidden-seed scans, 100/200-room load, and Preview/Production HTTPS-WSS smoke tests.

## 13. Delivery sequence

### Phase 6A - Shared core and protocol foundation

- Migrate to npm workspaces without gameplay changes.
- Extract pure shared game core.
- Define online protocol, validation schemas, architecture guards, and Worker/DO test scaffold.
- No player-visible online entry point.

### Phase 6B - Playable private-room vertical slice

- Create, invite, inspect, join, authenticate, and play Classic/Greed.
- Deliver authoritative commands, public snapshots, random opening player, seed commitment, and terminal verification.
- Deploy only to isolated `workers.dev` Preview.

### Phase 6C - Resilience and production release

- Complete reconnect, seat replacement, hibernation, alarms, retention, rate limits, logs, and online progression.
- Pass browser, chaos, security, load, cost, deployment, and rollback gates.
- Move to Workers Paid and activate the production custom domain after controlled DNS migration.

Each sub-phase requires a separate goal guide, per-round self-check/commit/push workflow, final validation report, and planner-side CheckAndGoal PASS before the next sub-phase.

## 14. Domain migration dependency

DNS migration does not block Phase 6A or 6B. A dedicated task owns Cargo communication, DNS inventory, Cloudflare Full Setup migration, DNSSEC safety, rollback, and customer-support templates. The production custom domain is a Phase 6C release gate only.

## 15. Decision record

The detailed rationale is recorded in `docs/adr/0001-*.md` through `docs/adr/0029-*.md`. Canonical product terminology is recorded in `CONTEXT.md`.
