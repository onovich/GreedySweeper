import { useCallback, useState } from 'react';

const endpoint = import.meta.env.VITE_ONLINE_ENDPOINT?.replace(/\/$/, '') ?? '';
const tokenKey = (roomCode) => `greedy-sweeper:online-seat:${roomCode}`;

export function useOnlineRoomController() {
  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState(endpoint ? 'idle' : 'unavailable');
  const [error, setError] = useState(null);

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
      setRoom({ roomCode: value.roomCode, ruleset: value.ruleset, seat: 'creator' });
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
      setStatus('connected');
    } catch (cause) {
      setError(cause.message);
      setStatus('error');
    }
  }, [room]);

  return { available: Boolean(endpoint), room, status, error, create, inspect, join };
}
