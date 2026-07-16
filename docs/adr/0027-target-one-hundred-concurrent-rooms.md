# Target one hundred concurrent rooms for the MVP

The public MVP targets 100 concurrent rooms and 200 connected players, with stress validation at 200 rooms, synthetic p95 targets of one second for create/join, 500 ms for command confirmation, and three seconds for reconnect snapshot recovery. These latency targets are release guidance rather than an SLA, while duplicate acceptance, ordering errors, or cross-room leakage are hard blockers; overload rejects new rooms before disrupting existing matches.
