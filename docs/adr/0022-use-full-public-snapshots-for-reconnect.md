# Use full public snapshots for reconnect

Online Protocol v1 sends a complete current Public Board Projection and public match state after every successful authentication or reconnect, and the client replaces its online state rather than merging deltas. Incremental catch-up was rejected because the small board makes full JSON snapshots inexpensive, while one recovery path greatly reduces sequence-gap and stale-state complexity; completed replay verification still uses the full Accepted Command Log.
