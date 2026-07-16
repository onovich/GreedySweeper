# Use distinct random room, seat, and command identifiers

Room Codes use eight Crockford Base32 characters with collision retry, Seat Tokens use 256 bits of browser-generated randomness and are stored server-side only as SHA-256 digests, and Command IDs use UUID v4. Reusing one identifier across discovery, identity, and idempotency was rejected; Seat Tokens remain room-scoped, never enter URLs or logs, and are cleared when the local room record is no longer needed.
