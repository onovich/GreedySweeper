# Phase 6B Validation Report

Phase: Phase 6B - Playable Private-Room Vertical Slice

Status: PASS with an explicit Preview browser-smoke limitation recorded below

Rounds used: 12 main, 0 buffer, 1 final

## Delivered room flow

The isolated Room Durable Object supports fixed `classic-v1` and `greed-v2` rooms. A creator receives an eight-character Crockford room code and a 256-bit Base64URL seat token; an invitee can inspect the immutable rules and explicitly accept them once. The authority creates the seed, salt, commitment, and random opening seat only after acceptance. Each WebSocket requires a version-1 authentication message before it receives an authenticated public snapshot.

`npm run online:e2e` exercises two independent WebSocket clients for both rulesets against the official Workers runtime. Each fixture authenticates creator and invitee, submits and broadcasts a command, rejects stale-sequence and wrong-seat commands, finishes through the shared command path, and receives a matching terminal proof. The test-only fixture reads mine locations from the authority store solely to drive deterministic completion; clients still receive public projections only.

## Authority, persistence, and hidden data

`apps/room-worker` adapts public `@greedy-sweeper/game-core` exports; it does not duplicate board, score, Greed, Bank, or terminal rules. One Durable Object SQLite transaction loads canonical authority state, deduplicates command IDs, validates expected sequence and active seat, applies the shared-core action, appends the accepted command, and persists state before WebSocket broadcast. Official runtime tests cover eviction/reload, idempotency, stale rejection, Classic completion, and Greed completion.

Seat tokens are only persisted as SHA-256 digests, and are absent from URLs, logs, public inspection, snapshots, replay/history, and progression storage. Pre-terminal snapshots contain only cell coordinates, visible state, and revealed neighbor counts. Seed and salt are revealed only after normal completion. The version-1 protocol canonicalizes the commitment payload; the browser-side online controller verifies commitment, replay, command order, and terminal hash without recording online progression.

## Web boundary and compatibility

The online controller is separate from the local controller, stores only its seat token in session-scoped storage, replaces the online projection with accepted server snapshots, and blocks a second pending command. The explicit `VITE_ONLINE_ENDPOINT` build value is optional; without it, the existing Pages build remains local-only and shows online unavailable safely. No local gameplay, AI, replay, history, progression, or visual behavior was changed.

`npm run arch:check` and `npm run workspace:check` confirm package direction, public exports, shared-code purity, game-core ownership, and the local/online controller separation. `docs/domain-migration/**` is an existing concurrent untracked directory; it was neither modified nor staged.

## Validation

All local commands passed on 2026-07-18:

```text
npm run format:check
npm run lint
npm run test:run                 # 28 files, 77 tests
npm run ai:evaluate
npm run greed:evaluate
npm run progression:evaluate
npm run protocol:evaluate
npm run online:evaluate
npm run worker:test              # 2 files, 8 official Workers-runtime tests
npm run worker:dry-run           # bundles the isolated Room Durable Object binding
npm run online:e2e               # 2 Classic/Greed two-client WebSocket tests
npm run workspace:check
npm run arch:check
npm run build                    # Pages artifact remains apps/web/dist
git diff --check
```

`online:evaluate` covers room setup, acceptance, authentication, command contract, public projection, and terminal-proof validators. The reusable `online:e2e` command is included in the Pages CI validation workflow.

## Commits and remote

Implementation trail: `774aac7` boundary contract; `f07119a` protocol; `9beb5ab` room schema; `1e6d4ac` setup metadata; `e74f719` seat authentication; `fc12db1` authority initialization; `44782da` ordered commands; `c1a60c2` idempotency tests; `b80624c` room setup UI; `9ad42b2` synchronization; `13d53d4` online board; `a703dbe` authenticated projection repair; `cee4a7b` broadcasts; `5237fc9` terminal proof; `2655b26` Classic/Greed completion; `ce71b7a` architecture repair; `036d1cb` Preview prerequisite; and the final closure commit below.

Remote: final closure pushed to `origin/main`.

## Isolated Preview deployment

The only deployment is the isolated Preview Worker at `https://greedy-sweeper-room-preview.onovich1110.workers.dev`. Cloudflare Wrangler deployment inspection reports Worker version `9ec485d4-1acf-4a05-aadc-a6e6ff15da1f`, created 2026-07-17 22:01:49 UTC. The Worker name is deliberately `greedy-sweeper-room-preview`; no production route, custom domain, DNS change, Paid-plan activation, or production secret was created.

The deployment record plus the local two-client Workers-runtime WebSocket suite verify the published Worker configuration and authority path. Direct HTTPS/WSS smoke from this executor remains an explicit environmental limitation: `curl` timed out connecting to port 443 and both the in-app browser and Chrome returned `net::ERR_BLOCKED_BY_CLIENT` for the `workers.dev` URL. These failures occur before the Worker returns a response, so no seat token, room code, seed, or salt was created or exposed by the attempted remote probes. The next maintainer can remove the isolated Preview with `npx wrangler delete greedy-sweeper-room-preview`; that is rollback/removal only and was not run here.

## Scope and residual risks

Production deployment/DNS: none (required).

Scope deviations: none. Phase 6C work was not started.

Residual risks: an unblocked external browser/network must run the final remote HTTPS/WSS two-client smoke before production consideration. Phase 6C still owns reconnect/seat replacement, WebSocket hibernation hardening, alarms, retention/deletion, rate limiting, Turnstile, logs policy, load targets, cost controls, online progression, Paid-plan activation, production deployment, and custom-domain/DNS release.

Return to planner: 019f6768-2328-76f2-a6e4-da752c6eb85c
