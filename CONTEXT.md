# Greedy Sweeper Domain

This glossary defines the shared language for Greedy Sweeper's local and online play. It describes product concepts only and deliberately excludes implementation choices.

## Greed Play

**Bonus Pot**:
The unbanked extra reward accumulated during one Greed turn. It is not part of a player's score until a successful Bank or correct flag settles it, and it is lost after a wrong flag or exploded mine.
_Avoid_: Current score, multiplier, guaranteed reward

**Bank**:
A Greed action that settles the current Bonus Pot into the Active Player's score and ends that player's turn.
_Avoid_: Quit, surrender, pause

## Online Play

**Online Match**:
A synchronous game between exactly two Guest Players inside one Private Room.
_Avoid_: Lobby game, public match, ranked match

**Private Room**:
An invitation-only container for one Online Match. It is not publicly discoverable and does not perform matchmaking.
_Avoid_: Public lobby, matchmaking queue

**Guest Player**:
A participant identified only for the lifetime of a Private Room, without a registered account or durable social identity.
_Avoid_: User, account, member

**Room Code**:
A short value that lets a Guest Player locate and request entry to a Private Room.
_Avoid_: Matchmaking code, account token

**Seat Token**:
An unguessable, room-scoped credential that lets one Guest Player occupy and reclaim one player seat. It is not a durable account identity.
_Avoid_: Room Code, account token, user ID

**Active Seat Connection**:
The single WebSocket connection currently authorized to act for one seat; a newly authenticated connection replaces any older connection for the same Seat Token.
_Avoid_: Browser tab, user session, simultaneous seat connection

**Match Authority**:
The sole arbiter that accepts ordered player commands and determines the canonical state of an Online Match.
_Avoid_: Host player, peer authority, client authority

**Shared Board**:
The single canonical board observed and changed by both Guest Players during an Online Match.
_Avoid_: Player board, race board, local board

**Active Player**:
The Guest Player currently permitted to submit a gameplay command to the Match Authority.
_Avoid_: Host, controller, current client

**Abandoned Match**:
An Online Match that ended because its reconnect window expired, without producing a winner or a progression-eligible result.
_Avoid_: Loss, forfeit, completed match

**Player Command**:
A versioned request from the Active Player asking the Match Authority to apply one gameplay action at an expected match sequence.
_Avoid_: Client state, UI event, state patch

**Authoritative Confirmation**:
Evidence from the Match Authority that a Player Command was accepted and the canonical Online Match state advanced. A local click or pending request is not confirmation.
_Avoid_: Optimistic update, button press, request sent

**Command ID**:
A client-generated identifier that makes one Player Command idempotent across retries and reconnects.
_Avoid_: Sequence number, action index, request timestamp

**Online Protocol Version**:
The version of the serialized client-server message contract, negotiated independently from an Online Ruleset or replay version.
_Avoid_: Rules version, replay version, app version

**Match Snapshot**:
A serializable canonical view of an Online Match at a specific accepted sequence, used to join, recover, or verify synchronized state.
_Avoid_: Client cache, UI snapshot, board upload

**Accepted Command Log**:
The append-only ordered record of Player Commands committed by the Match Authority; together with immutable match metadata, it can rebuild canonical match state.
_Avoid_: WebSocket history, client log, audit text

**Online Ruleset**:
The immutable versioned rules selection for one Online Match. The MVP supports fixed-config Classic and Greed rulesets, without custom board or scoring parameters.
_Avoid_: Room settings, custom game, mutable rules

**Room Setup**:
The pre-match state in which the creator has locked an Online Ruleset and the invited Guest Player can inspect and accept it before the Online Match starts.
_Avoid_: Public lobby, matchmaking, mutable configuration

**Opening Player**:
The Guest Player selected by the Match Authority to be the first Active Player of an Online Match.
_Avoid_: Creator, host, Player One

**Public Board Projection**:
The canonical player-visible board state that excludes every mine location and hidden cell value not yet revealed by accepted gameplay.
_Avoid_: Full board, client board, redacted snapshot

**Seed Commitment**:
A start-of-match hash that binds the Match Authority to a hidden board seed and salt without revealing either until a completed match can be verified.
_Avoid_: Public seed, board hash, state hash

**Verified Match Result**:
A completed Online Match result whose revealed seed, Seed Commitment, ordered commands, and terminal hash have all been validated locally.
_Avoid_: Server response, room result, unverified win
