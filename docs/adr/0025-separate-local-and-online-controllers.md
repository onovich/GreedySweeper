# Separate local and online application controllers

The existing local game controller remains responsible for AI, challenges, replay, and local progression, while a dedicated online controller owns room setup, authentication, connection, reconnect, snapshots, command confirmation, terminal verification, and its explicit UI state machine. Shared board and score components remain presentational; one branching controller was rejected because transport lifecycle must not contaminate local game orchestration or duplicate Match Authority behavior.
