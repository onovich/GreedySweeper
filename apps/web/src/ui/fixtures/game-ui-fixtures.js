import {
  assertGameUiViewModel,
  GAME_UI_SCHEMA_VERSION,
} from '../../application/presentation/game-ui-view-model';

export const GAME_UI_FIXTURE_IDS = Object.freeze([
  'local-setup-greed',
  'local-greed-player-x3-pot18',
  'local-greed-bank-pending',
  'local-greed-bank-confirmed-start',
  'local-greed-bank-confirmed-mid',
  'local-greed-bank-confirmed-end',
  'local-greed-pot-lost',
  'local-classic-active',
  'local-ai-turn',
  'replay-midpoint',
  'local-terminal-win',
  'utility-empty-record',
  'room-review',
  'online-command-pending',
  'online-reconnecting',
  'online-paused',
  'online-command-rejected',
  'online-replaced',
  'online-abandoned',
  'online-verification-failed',
  'online-verified-terminal',
  'long-copy-stress',
]);

const connectionByFixture = Object.freeze({
  'room-review': 'review',
  'online-command-pending': 'command-pending',
  'online-reconnecting': 'reconnecting',
  'online-paused': 'paused',
  'online-command-rejected': 'error',
  'online-replaced': 'replaced',
  'online-abandoned': 'abandoned',
  'online-verification-failed': 'verification-failed',
  'online-verified-terminal': 'verified',
});

function makeCells() {
  return Array.from({ length: 256 }, (_, index) => {
    const row = Math.floor(index / 16);
    const column = index % 16;
    const revealed = index < 18;
    const neighborMines = revealed && index % 4 !== 0 ? (index % 3) + 1 : null;
    return {
      id: `r${row}-c${column}`,
      row,
      column,
      state: revealed ? (neighborMines === null ? 'revealed-empty' : 'revealed-number') : 'hidden',
      neighborMines,
      accessibleLabel: `第 ${row + 1} 行，第 ${column + 1} 列：${revealed ? '已翻开' : '未翻开'}`,
      canReveal: !revealed,
      canFlag: !revealed,
    };
  });
}

function createBaseFixture(id) {
  const online = id.startsWith('online-') || id === 'room-review';
  const replay = id === 'replay-midpoint';
  const terminal =
    id.includes('terminal') ||
    ['online-replaced', 'online-abandoned', 'online-verification-failed'].includes(id);
  const reconnecting = id === 'online-reconnecting';
  const paused = id === 'online-paused';
  const pending = id.includes('bank-pending') || id === 'online-command-pending';
  const aiTurn = id === 'local-ai-turn';
  const classic = id === 'local-classic-active';
  const setup = id === 'local-setup-greed';
  const error = id === 'online-command-rejected';
  const lockReason = terminal
    ? 'terminal'
    : reconnecting
      ? 'reconnecting'
      : paused
        ? 'paused'
        : pending
          ? 'command-pending'
          : replay
            ? 'replay'
            : aiTurn
              ? 'ai-turn'
              : error
                ? 'error'
                : null;
  const lifecycle = terminal
    ? 'terminal'
    : reconnecting
      ? 'reconnecting'
      : paused
        ? 'paused'
        : error
          ? 'error'
          : setup
            ? 'setup'
            : 'active';
  const bankProgress = id.endsWith('-start')
    ? 0
    : id.endsWith('-mid')
      ? 0.5
      : id.endsWith('-end')
        ? 1
        : null;

  return {
    schemaVersion: GAME_UI_SCHEMA_VERSION,
    fixture: { id, revision: 42, effectProgress: bankProgress },
    session: {
      kind: replay ? 'replay' : online ? 'online' : 'local',
      lifecycle,
      authority: online ? 'server' : 'local-engine',
      lockReason,
    },
    brand: { title: 'GREEDY SWEEPER', subtitle: '月面扫雷终端' },
    scores: [
      {
        side: 'player',
        identity: 'player',
        label: '玩家',
        value: id.endsWith('-end') ? 258 : 240,
        activity: aiTurn ? 'inactive' : terminal ? 'winner' : 'active',
        settlement: pending ? 'pending' : id.includes('confirmed') ? 'confirmed' : 'idle',
      },
      {
        side: 'opponent',
        identity: 'ai',
        label: online ? '对手' : 'AI',
        value: 180,
        activity: aiTurn ? 'active' : terminal ? 'loser' : 'inactive',
        settlement: 'idle',
      },
    ],
    mines: { remaining: 23, state: reconnecting ? 'syncing' : 'ready' },
    turn: {
      state: lockReason ?? 'player-turn',
      message: terminal ? '对局结束' : aiTurn ? 'AI 思考中' : '轮到你了',
      announcement: terminal ? 'assertive' : 'polite',
    },
    matchConfig: {
      mode: classic ? 'standard' : 'greed',
      difficulty: 'normal',
      style: 'balanced',
      state: setup ? 'editable' : id === 'room-review' ? 'review' : 'locked',
    },
    board: {
      rows: 16,
      columns: 16,
      state: terminal
        ? 'terminal'
        : reconnecting
          ? 'reconnecting'
          : paused
            ? 'paused'
            : replay
              ? 'replay'
              : pending
                ? 'pending'
                : error
                  ? 'error'
                  : 'ready',
      lockReason,
      cells: makeCells(),
      focusedCellId: null,
    },
    greed: classic
      ? null
      : {
          streak: id === 'local-greed-pot-lost' ? 0 : 3,
          multiplier: id === 'local-greed-pot-lost' ? 0 : 3,
          bonusPot: id.endsWith('-end') || id === 'local-greed-pot-lost' ? 0 : 18,
          columns: [1, 2, 3].map((multiplier) => ({
            multiplier,
            state: multiplier === 3 ? 'active' : 'complete',
          })),
          bank: {
            availability: pending
              ? 'pending'
              : terminal || aiTurn || reconnecting
                ? 'disabled'
                : 'enabled',
            primaryLabel: '收手',
            secondaryLabel: id.endsWith('-end') ? '结束回合 · 当前奖励 0' : '入账 +18 · 结束回合',
            lockReason,
          },
        },
    utilities: {
      activeTab: replay ? 'replay' : 'challenge',
      tabs: ['challenge', 'replay', 'record', 'room'],
      recordCount: id === 'utility-empty-record' ? 0 : 4,
      state: error ? 'error' : 'ready',
    },
    connection: online
      ? {
          state: connectionByFixture[id] ?? 'connected',
          roomCode: 'LUNA-42',
          rulesetLabel: 'Greed v2 · 16×16',
          seatLabel: id === 'room-review' ? '受邀方' : '玩家席位',
          recoverable: !terminal,
          messageKey: error ? 'online_command_rejected' : null,
        }
      : null,
    terminal: terminal
      ? {
          state: id,
          title: id === 'online-abandoned' ? '对局已中止' : '对局结束',
          verified: id === 'online-verified-terminal',
        }
      : null,
    capabilities: {
      reveal: !lockReason,
      flag: !lockReason,
      bank: !classic && !lockReason,
      restart: !online,
      roomRetry: online && (reconnecting || error),
    },
    effects: id.includes('bank-confirmed')
      ? [{ id: 'bank-42', kind: 'bank-confirmed', sourceRevision: 42, side: 'player', points: 18 }]
      : [],
  };
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

const catalog = Object.fromEntries(
  GAME_UI_FIXTURE_IDS.map((id) => [id, deepFreeze(assertGameUiViewModel(createBaseFixture(id)))]),
);

export const GAME_UI_FIXTURES = Object.freeze(catalog);

export function getGameUiFixture(id) {
  const fixture = GAME_UI_FIXTURES[id];
  if (!fixture) throw new RangeError(`Unknown Game UI fixture: ${id}`);
  return fixture;
}
