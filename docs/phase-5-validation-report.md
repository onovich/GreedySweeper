# Phase 5 validation report: local progression, statistics, and achievements

Status: ready for planner acceptance

Player-visible delivery: a local progression panel shows completed games, wins, win
rate, and unlocked achievements. It explicitly states that data remains in this browser.

Schema versions: `PROGRESSION_VERSION=1`, `FACTS_VERSION=1`,
`ACHIEVEMENT_VERSION=1`.

Derivation evidence: `deriveCompletedGameFacts` accepts only completed integrity-verified
replays and derives scores, outcome, flags, explosions, Bank/pot/streak metrics, AI
policy, and random/imported-challenge/daily source metadata. `reduceStats` is the sole statistics reducer; the catalog
evaluates ten achievements from those stats.

Idempotency and rollup: profile IDs use replay version/action count/integrity hash;
duplicate submission is a no-op even after an item is evicted. The pure profile keeps at
most 1000 facts and folds the oldest fact through the same reducer into a baseline.

Migration/storage: a separate versioned local-storage envelope handles legacy shape migration,
empty, corrupt, incompatible, unavailable/quota, save, and reset paths without affecting replay
history or playability. The UI provides a two-step confirmed clear control with feedback.

Compatibility: Classic/Greed rules, GS1, replay, AI, daily challenges, and integrity
protocols are consumed but not modified. Progression is submitted only for a completed
verified random, imported-challenge, or daily replay.

Privacy: local browser storage only; no account, cloud sync, telemetry, networking,
currency, XP, or gameplay advantage.

Validation: `format:check`, `lint`, 28 files / 74 tests, `ai:evaluate`,
`greed:evaluate`, `progression:evaluate`, `arch:check`, `build`, and `git diff --check`
PASS.

Residual risks: random, imported challenge, and daily sessions now retain a deterministic
descriptor/replay and source classification. Browser automation/Pages verification retains
the previously documented timeout limitation and manual confirmation.
