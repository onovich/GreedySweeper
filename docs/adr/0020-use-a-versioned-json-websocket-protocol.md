# Use a versioned JSON WebSocket protocol

Online messages use a strict shared JSON envelope and schemas, with an Online Protocol Version negotiated during an authentication message sent within five seconds of connection; Seat Tokens never appear in URLs. Binary encodings and optimistic client state were rejected for v1 because small turn-based messages benefit more from readable diagnostics, explicit rejection contracts, and independent protocol/rules versioning than serialization efficiency.
