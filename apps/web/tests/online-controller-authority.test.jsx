import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class FakeWebSocket {
  static OPEN = 1;
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = FakeWebSocket.OPEN;
    this.listeners = new Map();
    this.sent = [];
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  send(value) {
    this.sent.push(JSON.parse(value));
  }

  close() {}

  emit(type, payload = null) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(type === 'message' ? { data: JSON.stringify(payload) } : (payload ?? {}));
    }
  }
}

function snapshot(sequence, humanScore = 0) {
  return {
    sequence,
    lifecycle: 'active',
    humanScore,
    aiScore: 0,
    gameOver: false,
    currentSeat: sequence === 0 ? 'creator' : 'invitee',
    board: [],
  };
}

describe('online controller authority confirmation seam', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket);
    vi.stubEnv('VITE_ONLINE_ENDPOINT', 'https://online.example.test');
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it.each(['acceptance-first', 'snapshot-first'])(
    'keeps pending until acceptance and an advanced snapshot are both present: %s',
    async (order) => {
      vi.resetModules();
      const { useOnlineRoomController } =
        await import('../src/application/online/useOnlineRoomController');
      const room = { roomCode: 'ABCDEFGH', ruleset: 'greed-v2', seat: 'creator' };
      sessionStorage.setItem(`greedy-sweeper:online-seat:${room.roomCode}`, 'seat-token-test');
      const { result } = renderHook(() => useOnlineRoomController());
      act(() => result.current.connect(room));
      const socket = FakeWebSocket.instances[0];
      act(() => socket.emit('open'));
      act(() =>
        socket.emit('message', {
          version: '1',
          type: 'snapshot',
          payload: { snapshot: snapshot(0) },
        }),
      );
      act(() => result.current.command({ type: 'bank', player: 'human' }));
      const command = socket.sent.find(({ type }) => type === 'submit_command');
      expect(result.current.pending).toBe(true);

      const accepted = {
        version: '1',
        type: 'command_accepted',
        payload: { commandId: command.payload.commandId, sequence: 1 },
      };
      const advanced = {
        version: '1',
        type: 'snapshot',
        payload: { snapshot: snapshot(1, 18) },
      };
      const first = order === 'acceptance-first' ? accepted : advanced;
      const second = order === 'acceptance-first' ? advanced : accepted;
      act(() => socket.emit('message', first));
      expect(result.current.pending).toBe(true);
      expect(result.current.confirmation).toBeNull();
      act(() => socket.emit('message', second));
      expect(result.current.pending).toBe(false);
      expect(result.current.confirmation).toMatchObject({
        id: command.payload.commandId,
        baseSequence: 0,
        sourceRevision: 1,
        action: { type: 'bank', player: 'human' },
      });
    },
  );
});
