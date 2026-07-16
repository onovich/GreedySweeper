# Make the Accepted Command Log the online source of truth

Immutable match metadata plus the Accepted Command Log are the recoverable source of truth, while a Match Snapshot is a hash-checked materialized cache. Each accepted command atomically deduplicates its Command ID, validates seat/turn/sequence, executes shared game rules, appends the command, updates snapshot/hash/deadlines, and commits before broadcast; hibernation recovery never trusts prior memory, and irreconcilable log/snapshot state fails closed.
