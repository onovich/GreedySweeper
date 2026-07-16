# Use minimal native Workers Logs

Production observability will use only Cloudflare Workers Logs with the Paid plan's seven-day retention, recording a non-user-facing diagnostic room identifier, versions, lifecycle transitions, sequence, outcomes, latency, and structured failures. Tokens, room codes, seed material, hidden state, action payloads, IP/device data, and local progression are forbidden; third-party telemetry and log export were rejected for the MVP to preserve the local-first privacy boundary and operational simplicity.
