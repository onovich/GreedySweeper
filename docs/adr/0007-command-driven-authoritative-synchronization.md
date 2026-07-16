# Use command-driven authoritative synchronization

Clients will send idempotent versioned Player Commands with an expected sequence, and the Match Authority will validate and execute them through the shared game engine before broadcasting accepted events, sequence numbers, and state hashes. Join and reconnect use a Match Snapshot plus subsequent commands; client-authored state and optimistic gameplay updates were rejected because this turn-based game benefits more from deterministic authority and simple recovery than speculative latency hiding.
