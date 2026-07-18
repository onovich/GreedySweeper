import { useCallback, useEffect, useRef, useState } from 'react';

const endpoint = import.meta.env.VITE_ONLINE_ENDPOINT?.replace(/\/$/, '') ?? '';
const tokenKey = (roomCode) => `greedy-sweeper:online-seat:${roomCode}`;
const RECONNECT_DELAY_MS = 1_000;

export function useOnlineRoomController() {
  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState(endpoint ? 'idle' : 'unavailable');
  const [error, setError] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [pending, setPending] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const connectRef = useRef(null);
  const pendingCommandRef = useRef(null);
  const disposedRef = useRef(false);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = null;
  }, []);

  const connect = useCallback(
    (nextRoom, reconnecting = false) => {
      const token = sessionStorage.getItem(tokenKey(nextRoom.roomCode));
      if (!token) {
        setError('online_seat_token_missing');
        setStatus('error');
        return;
      }
      clearReconnectTimer();
      setError(null);
      setStatus(reconnecting ? 'reconnecting' : 'authenticating');
      const socket = new WebSocket(
        `${endpoint.replace(/^http/, 'ws')}/v1/rooms/${nextRoom.roomCode}/socket`,
      );
      socketRef.current = socket;
      socket.addEventListener('open', () =>
        socket.send(
          JSON.stringify({ version: '1', type: 'authenticate', payload: { seatToken: token } }),
        ),
      );
      socket.addEventListener('message', (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          setError('online_malformed');
          return;
        }
        if (message.type === 'snapshot') {
          setSnapshot(message.payload.snapshot);
          setStatus(message.payload.snapshot.lifecycle === 'paused' ? 'paused' : 'connected');
          const pendingCommand = pendingCommandRef.current;
          if (pendingCommand) socket.send(JSON.stringify(pendingCommand));
        }
        if (message.type === 'command_accepted') {
          if (pendingCommandRef.current?.payload.commandId === message.payload.commandId) {
            pendingCommandRef.current = null;
            setPending(false);
          }
        }
        if (message.type === 'match_paused') {
          setPending(false);
          setStatus('paused');
        }
        if (message.type === 'match_resumed') setStatus('connected');
        if (message.type === 'terminal_proof')
          verifyTerminalProof(message.payload, nextRoom.ruleset).then((verified) =>
            setStatus(verified ? 'verified' : 'verification_failed'),
          );
        if (message.type === 'command_rejected' || message.type === 'protocol_error') {
          if (
            message.type === 'protocol_error' ||
            pendingCommandRef.current?.payload.commandId === message.payload.commandId
          )
            pendingCommandRef.current = null;
          setPending(false);
          setError(message.payload.error);
        }
      });
      socket.addEventListener('close', (event) => {
        if (socketRef.current !== socket || disposedRef.current) return;
        if (event.reason === 'seat_replaced') {
          pendingCommandRef.current = null;
          setPending(false);
          setStatus('replaced');
          return;
        }
        setStatus('reconnecting');
        reconnectTimerRef.current = setTimeout(
          () => connectRef.current?.(nextRoom, true),
          RECONNECT_DELAY_MS,
        );
      });
      socket.addEventListener('error', () => {
        if (socketRef.current === socket) setError('online_socket_error');
      });
    },
    [clearReconnectTimer],
  );

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(
    () => () => {
      disposedRef.current = true;
      clearReconnectTimer();
      socketRef.current?.close();
    },
    [clearReconnectTimer],
  );

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
      setStatus('ready');
    } catch (cause) {
      setError(cause.message);
      setStatus('error');
    }
  }, [room]);

  const command = useCallback(
    (action) => {
      if (pending || socketRef.current?.readyState !== WebSocket.OPEN || !snapshot) return;
      const message = {
        version: '1',
        type: 'submit_command',
        payload: { commandId: crypto.randomUUID(), sequence: snapshot.sequence, action },
      };
      pendingCommandRef.current = message;
      setPending(true);
      socketRef.current.send(JSON.stringify(message));
    },
    [pending, snapshot],
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

async function verifyTerminalProof(proof, ruleset) {
  const payload = JSON.stringify({
    openingPlayer: proof.openingPlayer,
    ruleset,
    salt: proof.salt,
    seed: Number(proof.seed),
  });
  const bytes = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload)),
  );
  const hash = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return hash === proof.commitment;
}
