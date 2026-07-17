# Phase 6B Boundary Contract

`apps/room-worker` owns versioned HTTP/WebSocket routing, Durable Object storage, and the transaction-before-broadcast authority adapter. It invokes only public `game-core` exports and protocol validators.

`packages/online-protocol` owns the JSON contracts for room create/inspect/join, WebSocket authentication, commands, public snapshots, and terminal verification. It has no Worker, storage, React, or rules-transition imports.

`apps/web/src/application/online/` will own the client-only room state machine and session-scoped seat-token adapter. It must not import `useGameController`, persist seat tokens, or apply optimistic game transitions. The local controller and local progression stay unchanged.

Before terminal completion, public payloads must not contain seat tokens, token digests, seed, salt, mines, or hidden cell values. A Durable Object transaction commits the accepted command, log, snapshot, and sequence before any acceptance broadcast.
