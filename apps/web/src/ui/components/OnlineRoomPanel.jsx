import { useState } from 'react';

export function OnlineRoomPanel({ online }) {
  const [roomCode, setRoomCode] = useState(new URLSearchParams(location.search).get('room') ?? '');
  if (!online.available)
    return (
      <p className="mt-3 text-center text-xs text-gray-500">
        Online rooms are unavailable in this build.
      </p>
    );
  return (
    <section
      className="mx-auto mt-4 max-w-3xl rounded-2xl border border-cyan-900 bg-gray-900 p-4"
      aria-label="Private online room"
    >
      <h2 className="text-sm font-bold text-cyan-200">Private online room</h2>
      {!online.room && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="replay-button"
            onClick={() => online.create('classic-v1')}
          >
            Create Classic room
          </button>
          <button type="button" className="replay-button" onClick={() => online.create('greed-v2')}>
            Create Greed room
          </button>
          <input
            aria-label="Invite room code"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            className="rounded border border-gray-700 bg-gray-950 px-2 text-sm"
          />
          <button type="button" className="replay-button" onClick={() => online.inspect(roomCode)}>
            Review invite
          </button>
        </div>
      )}
      {online.room && (
        <p className="mt-2 text-sm text-gray-200">
          Room {online.room.roomCode} · {online.room.ruleset} · {online.status}
        </p>
      )}
      {online.status === 'review' && (
        <button type="button" className="replay-button mt-2" onClick={online.join}>
          Accept rules and join
        </button>
      )}
      {online.status === 'waiting' && (
        <p className="mt-2 text-xs text-gray-400">Share invite: ?room={online.room.roomCode}</p>
      )}
      {online.error && (
        <p role="alert" className="mt-2 text-xs text-red-300">
          Online error: {online.error}
        </p>
      )}
    </section>
  );
}
