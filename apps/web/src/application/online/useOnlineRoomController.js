import { useCallback, useState } from 'react';

const endpoint = import.meta.env.VITE_ONLINE_ENDPOINT?.replace(/\/$/, '') ?? '';
const tokenKey = (roomCode) => `greedy-sweeper:online-seat:${roomCode}`;

export function useOnlineRoomController() {
  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState(endpoint ? 'idle' : 'unavailable');
  const [error, setError] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [pending, setPending] = useState(false);

  const create = useCallback(async (ruleset) => {
    if (!endpoint) return;
    setStatus('creating');
    setError(null);
    try {
      const response = await fetch(`${endpoint}/v1/rooms`, {
        method: 'POST',
        body: JSON.stringify({ ruleset }),
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error?.code ?? 'online_create_failed');
      sessionStorage.setItem(tokenKey(value.roomCode), value.seatToken);
      const next = { roomCode: value.roomCode, ruleset: value.ruleset, seat: 'creator' };
      sessionStorage.setItem(tokenKey(value.roomCode), value.seatToken);
      setRoom(next);
      setStatus('waiting');
    } catch (cause) {
      setError(cause.message);
      setStatus('error');
    }
  }, []);

  const inspect = useCallback(async (roomCode) => {
    if (!endpoint) return;
    setStatus('inspecting');
    setError(null);
    try {
      const response = await fetch(`${endpoint}/v1/rooms/${roomCode}`);
      const value = await response.json();
      if (!response.ok) throw new Error(value.error?.code ?? 'online_room_not_found');
      setRoom({ ...value, seat: 'invitee' });
      setStatus('review');
    } catch (cause) {
      setError(cause.message);
      setStatus('error');
    }
  }, []);

  const join = useCallback(async () => {
    if (!endpoint || !room?.roomCode) return;
    setStatus('joining');
    try {
      const response = await fetch(`${endpoint}/v1/rooms/${room.roomCode}/join`, {
        method: 'POST',
        body: JSON.stringify({ rulesetAccepted: true }),
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error?.code ?? 'online_join_failed');
      sessionStorage.setItem(tokenKey(room.roomCode), value.seatToken);
      setRoom((current) => ({ ...current, ...value }));
      setStatus('ready');
    } catch (cause) {
      setError(cause.message);
      setStatus('error');
    }
  }, [room]);

  function connect(nextRoom) {
    const token = sessionStorage.getItem(tokenKey(nextRoom.roomCode));
    if (!token) return setError('online_seat_token_missing');
    setStatus('authenticating');
    const socket = new WebSocket(
      `${endpoint.replace(/^http/, 'ws')}/v1/rooms/${nextRoom.roomCode}/socket`,
    );
    socket.addEventListener('open', () =>
      socket.send(
        JSON.stringify({ version: '1', type: 'authenticate', payload: { seatToken: token } }),
      ),
    );
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'snapshot') {
        setSnapshot(message.payload.snapshot);
        setPending(false);
        setStatus('connected');
      }
      if (message.type === 'command_rejected' || message.type === 'protocol_error') {
        setPending(false);
        setError(message.payload.error);
      }
    });
    socket.addEventListener('error', () => {
      setPending(false);
      setError('online_socket_error');
      setStatus('error');
    });
    setRoom((current) => ({ ...current, socket }));
  }

  const command = useCallback(
    (action) => {
      if (pending || !room?.socket || !snapshot) return;
      setPending(true);
      room.socket.send(
        JSON.stringify({
          version: '1',
          type: 'submit_command',
          payload: { commandId: crypto.randomUUID(), sequence: snapshot.sequence, action },
        }),
      );
    },
    [pending, room, snapshot],
  );

  return {
    available: Boolean(endpoint),
    room,
    status,
    error,
    snapshot,
    pending,
    create,
    inspect,
    join,
    connect,
    command,
  };
}
