# Rate limit before requiring Turnstile

Room creation, lookup, invalid-code attempts, and Player Commands will use route- and seat-scoped Cloudflare Workers rate limits, with small payload and connection caps; rate-limit keys are not persisted with match data. Turnstile remains a feature-flagged escalation that requires Worker-side Siteverify validation, rather than a default challenge, because the MVP should resist inexpensive abuse without adding friction to every invited Guest Player.
