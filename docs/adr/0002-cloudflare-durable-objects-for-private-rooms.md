# Use Cloudflare Durable Objects for Private Rooms

Each Private Room will be coordinated by one Cloudflare Durable Object, with a Worker routing room creation, joining, and WebSocket upgrades. Durable Objects were selected because they provide a single stateful coordination point, hibernating WebSockets, and managed SQLite-backed persistence with low operational overhead; Supabase Realtime and a portable standalone Node service would require an additional authoritative execution layer or more operations work.
