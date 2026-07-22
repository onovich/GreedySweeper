---
status: accepted
---

# Integrate visual components through View Model adapters

Local and online controllers will remain separate and will map their state and confirmed outcomes into one versioned UI View Model plus Presentation Effects before rendering shared visual components. Direct Worker, Durable Object, protocol, selector, or rule-engine dependencies inside visual components—and separate local and online copies of the board—are rejected because they would let transport or domain changes seize style ownership and make required states impossible to reproduce with deterministic fixtures.
