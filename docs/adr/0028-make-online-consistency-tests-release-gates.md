# Make online consistency tests release gates

Phase 6 CI and release acceptance require shared game fixtures, strict protocol contracts, Durable Object transaction and alarm tests, forced hibernation recovery, lifecycle model tests, real two-client Classic and Greed browser flows, chaos/security cases, load targets, and Preview/Production HTTPS-WSS smoke checks. Mocks alone were rejected for platform behavior; consistency, security, ordering, and recovery failures block release, while latency-only misses may ship only with an explicit recorded risk.
