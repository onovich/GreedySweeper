# Use a shared turn-based Online Match

An Online Match will use one Shared Board with exactly one Active Player at a time, replacing the local AI participant with the second Guest Player while preserving the existing command, scoring, Greed, Bank, and replay semantics. Independent seeded races and simultaneous shared-board actions were rejected because they would create a second ruleset and introduce timing or latency as a competitive mechanic.
