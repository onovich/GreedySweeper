import { describe, expect, it, vi } from 'vitest';
import {
  createOnlineGameUiViewModel,
  createOnlineIntentBridge,
} from '../src/application/presentation/online-game-ui-adapter';
import { validateGameUiViewModel } from '../src/application/presentation/game-ui-view-model';

function publicSnapshot(overrides = {}) {
  return {
    sequence: 4,
    humanScore: 12,
    aiScore: 7,
    gameOver: false,
    currentSeat: 'creator',
    board: Array.from({ length: 256 }, (_, index) => ({
      row: Math.floor(index / 16),
      column: index % 16,
      state: index === 0 ? 'revealed' : index === 1 ? 'flagged' : 'hidden',
      ...(index === 0 ? { neighborMines: 2 } : {}),
    })),
    ...overrides,
  };
}

function controller(overrides = {}) {
  return {
    available: true,
    status: 'connected',
    room: { roomCode: 'ABCDEFGH', ruleset: 'greed-v2', seat: 'creator' },
    snapshot: publicSnapshot(),
    pending: false,
    error: null,
    command: vi.fn(),
    create: vi.fn(),
    join: vi.fn(),
    connect: vi.fn(),
    ...overrides,
  };
}

describe('online Game UI presentation adapter', () => {
  it('maps only the public snapshot into the shared ViewModel', () => {
    const viewModel = createOnlineGameUiViewModel(controller());
    expect(validateGameUiViewModel(viewModel)).toEqual({ ok: true, errors: [] });
    expect(viewModel.board.cells).toHaveLength(256);
    expect(viewModel.board.cells[1].state).toBe('flagged-neutral');
    expect(JSON.stringify(viewModel)).not.toMatch(
      /seatToken|tokenDigest|isMine|hasMine|"seed"|"salt"/,
    );
    expect(viewModel.greed).toBeNull();
  });

  it('preserves the last authoritative projection while a command is pending or rejected', () => {
    const base = controller();
    const pending = createOnlineGameUiViewModel({ ...base, pending: true });
    const rejected = createOnlineGameUiViewModel({
      ...base,
      status: 'error',
      error: 'online_wrong_turn',
    });
    expect(pending.board.cells).toEqual(rejected.board.cells);
    expect(pending.scores.map(({ value }) => value)).toEqual(
      rejected.scores.map(({ value }) => value),
    );
    expect(pending.board.state).toBe('pending');
    expect(rejected.board.state).toBe('error');
    expect(pending.effects).toEqual([]);
  });

  it('emits a confirmed Bank effect only from an associated advanced snapshot', () => {
    const online = controller({
      snapshot: publicSnapshot({ sequence: 5, humanScore: 30, currentSeat: 'invitee' }),
      confirmation: {
        id: 'bank-1',
        baseSequence: 4,
        sourceRevision: 5,
        action: { type: 'bank', player: 'human' },
        before: publicSnapshot({ sequence: 4, humanScore: 12 }),
        after: publicSnapshot({ sequence: 5, humanScore: 30, currentSeat: 'invitee' }),
      },
    });
    expect(createOnlineGameUiViewModel(online).effects).toEqual([
      {
        id: 'online-bank-1-5',
        kind: 'bank-confirmed',
        sourceRevision: 5,
        side: 'player',
        points: 18,
      },
    ]);
  });

  it('bridges shared cell and room intents without applying gameplay locally', () => {
    const online = controller();
    const bridge = createOnlineIntentBridge(online);
    bridge.onCellIntent({ kind: 'reveal', row: 2, column: 3 });
    bridge.onCellIntent({ kind: 'flag', row: 4, column: 5 });
    bridge.onIntent({ kind: 'room', action: 'connect' });
    expect(online.command.mock.calls).toEqual([
      [{ type: 'reveal', row: 2, column: 3, player: 'human' }],
      [{ type: 'flag', row: 4, column: 5, player: 'human' }],
    ]);
    expect(online.connect).toHaveBeenCalledWith(online.room);
  });

  it.each(['reconnecting', 'paused', 'replaced', 'abandoned', 'verification_failed', 'verified'])(
    'keeps %s distinct and locks gameplay',
    (status) => {
      const viewModel = createOnlineGameUiViewModel(controller({ status }));
      expect(viewModel.capabilities.reveal).toBe(false);
      expect(viewModel.session.lockReason).not.toBeNull();
    },
  );
});
