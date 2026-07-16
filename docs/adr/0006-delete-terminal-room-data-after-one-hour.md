# Delete terminal room data after one hour

Server-side data for both completed and Abandoned Matches will be hard-deleted one hour after the match reaches its terminal room state. Longer retention was rejected because completed replays can be saved locally, while delayed sharing, accounts, and cross-device recovery are outside the MVP; a single short retention window also simplifies privacy guarantees and cleanup behavior.
