# Commit to the hidden seed and reveal it on completion

At match start the Match Authority publishes a Seed Commitment while retaining the random seed and salt, and sends clients only the Public Board Projection during play. A normally completed match reveals the seed and salt so both clients can verify the commitment and deterministically replay the command chain; revealing the seed at start and permanently opaque server results were rejected as cheating-prone and unverifiable respectively.
