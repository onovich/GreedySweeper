import { assertGameUiViewModel, GAME_UI_SCHEMA_VERSION } from './game-ui-view-model';

const TERMINAL_STATES = new Set(['replaced', 'abandoned', 'verification_failed', 'verified']);

export function createOnlineGameUiViewModel(online) {
  const snapshot = online.snapshot;
  const connectionState = normalizeConnectionState(online);
  const terminal = TERMINAL_STATES.has(online.status) || Boolean(snapshot?.gameOver);
  const localSeat = online.room?.seat ?? null;
  const yourTurn = Boolean(snapshot && localSeat && snapshot.currentSeat === localSeat);
  const lockReason = terminal
    ? 'terminal'
    : connectionState === 'reconnecting'
      ? 'reconnecting'
      : connectionState === 'paused'
        ? 'paused'
        : online.pending
          ? 'command-pending'
          : snapshot && !yourTurn
            ? 'opponent-turn'
            : connectionState === 'error'
              ? 'error'
              : null;
  const boardDimensions = getBoardDimensions(snapshot?.board);
  const scores = mapSeatScores(snapshot, localSeat, terminal);

  return assertGameUiViewModel({
    schemaVersion: GAME_UI_SCHEMA_VERSION,
    session: {
      kind: 'online',
      lifecycle: terminal
        ? 'terminal'
        : connectionState === 'reconnecting'
          ? 'reconnecting'
          : connectionState === 'paused'
            ? 'paused'
            : connectionState === 'error'
              ? 'error'
              : snapshot
                ? 'active'
                : 'waiting',
      authority: 'server',
      lockReason,
    },
    brand: { title: 'GREEDY SWEEPER', subtitle: '月面扫雷终端' },
    scores,
    mines: { remaining: null, state: snapshot ? 'unknown' : 'syncing' },
    turn: mapOnlineTurn({ online, snapshot, yourTurn, connectionState, terminal }),
    matchConfig: {
      mode: online.room?.ruleset === 'greed-v2' ? 'greed' : 'standard',
      difficulty: 'online',
      style: 'authority',
      state: online.status === 'review' ? 'review' : online.room ? 'locked' : 'editable',
    },
    board: {
      rows: boardDimensions.rows,
      columns: boardDimensions.columns,
      state: !snapshot
        ? 'empty'
        : terminal
          ? 'terminal'
          : connectionState === 'reconnecting'
            ? 'reconnecting'
            : connectionState === 'paused'
              ? 'paused'
              : online.pending
                ? 'pending'
                : connectionState === 'error'
                  ? 'error'
                  : yourTurn
                    ? 'ready'
                    : 'locked',
      lockReason,
      cells: snapshot?.board.map((cell) => mapPublicCell(cell, !lockReason)) ?? [],
      focusedCellId: null,
    },
    // Public snapshot v1 has no authoritative streak/POT projection. Omitting the panel is safer
    // than inventing online Greed values; the room summary still names the immutable ruleset.
    greed: null,
    utilities: {
      activeTab: 'room',
      tabs: ['challenge', 'replay', 'record', 'room'],
      recordCount: 0,
      state: online.error ? 'error' : 'ready',
      drawerOpen: connectionState !== 'connected' || terminal,
    },
    connection: {
      state: connectionState,
      roomCode: online.room?.roomCode ?? '—',
      rulesetLabel: online.room?.ruleset ?? '未选择规则',
      seatLabel:
        localSeat === 'creator'
          ? '创建者席位'
          : localSeat === 'invitee'
            ? '受邀者席位'
            : '未分配席位',
      recoverable: !['replaced', 'abandoned', 'verification-failed', 'verified'].includes(
        connectionState,
      ),
      messageKey: online.error ?? null,
    },
    terminal: terminal
      ? {
          state: connectionState,
          title: terminalTitle(connectionState, snapshot),
          verified: connectionState === 'verified',
        }
      : null,
    capabilities: {
      reveal: Boolean(snapshot && yourTurn && !lockReason),
      flag: Boolean(snapshot && yourTurn && !lockReason),
      bank: false,
      restart: false,
      roomRetry: ['reconnecting', 'error'].includes(connectionState),
    },
    effects: mapOnlineConfirmation(online.confirmation, localSeat),
  });
}

export function createOnlineIntentBridge(online) {
  const player = online.room?.seat === 'creator' ? 'human' : 'ai';
  return {
    onCellIntent(intent) {
      if (intent.kind === 'reveal' || intent.kind === 'flag') {
        online.command({
          type: intent.kind,
          row: intent.row,
          column: intent.column,
          player,
        });
      }
    },
    onBankIntent() {
      online.command({ type: 'bank', player });
    },
    onIntent(intent) {
      if (intent.kind !== 'room') return;
      if (intent.action === 'create') online.create?.(intent.ruleset ?? 'greed-v2');
      if (intent.action === 'inspect') online.inspect?.(intent.roomCode);
      if (intent.action === 'join') online.join?.();
      if (intent.action === 'connect') online.connect?.(online.room);
      if (intent.action === 'retry' && online.room) online.connect?.(online.room, true);
    },
  };
}

function normalizeConnectionState(online) {
  if (online.pending) return 'command-pending';
  if (online.status === 'verification_failed') return 'verification-failed';
  return online.status ?? (online.available ? 'idle' : 'unavailable');
}

function getBoardDimensions(board) {
  if (!board?.length) return { rows: 16, columns: 16 };
  return {
    rows: Math.max(...board.map((cell) => cell.row)) + 1,
    columns: Math.max(...board.map((cell) => cell.column)) + 1,
  };
}

function mapSeatScores(snapshot, localSeat, terminal) {
  const localIsCreator = localSeat !== 'invitee';
  const local = localIsCreator ? snapshot?.humanScore : snapshot?.aiScore;
  const opponent = localIsCreator ? snapshot?.aiScore : snapshot?.humanScore;
  const values = [local ?? null, opponent ?? null];
  const winnerIndex =
    terminal && values.every(Number.isInteger)
      ? values[0] === values[1]
        ? -1
        : values[0] > values[1]
          ? 0
          : 1
      : null;
  return [
    {
      side: 'player',
      identity: 'player',
      label: '玩家',
      value: values[0],
      activity:
        winnerIndex === -1
          ? 'draw'
          : winnerIndex === 0
            ? 'winner'
            : winnerIndex === 1
              ? 'loser'
              : snapshot?.currentSeat === localSeat
                ? 'active'
                : snapshot
                  ? 'inactive'
                  : 'unknown',
      settlement: 'idle',
    },
    {
      side: 'opponent',
      identity: 'ai',
      label: '对手',
      value: values[1],
      activity:
        winnerIndex === -1
          ? 'draw'
          : winnerIndex === 1
            ? 'winner'
            : winnerIndex === 0
              ? 'loser'
              : snapshot?.currentSeat !== localSeat && snapshot
                ? 'active'
                : snapshot
                  ? 'inactive'
                  : 'unknown',
      settlement: 'idle',
    },
  ];
}

function mapPublicCell(cell, interactive) {
  const state =
    cell.state === 'revealed'
      ? cell.neighborMines > 0
        ? 'revealed-number'
        : 'revealed-empty'
      : cell.state === 'flagged'
        ? 'flagged-neutral'
        : 'hidden';
  return {
    id: `r${cell.row}-c${cell.column}`,
    row: cell.row,
    column: cell.column,
    state,
    neighborMines: state === 'revealed-number' ? cell.neighborMines : null,
    accessibleLabel: `第 ${cell.row + 1} 行，第 ${cell.column + 1} 列：${state === 'hidden' ? '未翻开' : state === 'flagged-neutral' ? '已标记，席位未知' : `已翻开，周围 ${cell.neighborMines} 颗地雷`}`,
    canReveal: interactive && state === 'hidden',
    canFlag: interactive && (state === 'hidden' || state === 'flagged-neutral'),
  };
}

function mapOnlineTurn({ online, snapshot, yourTurn, connectionState, terminal }) {
  if (terminal)
    return {
      state: 'terminal',
      message: terminalTitle(connectionState, snapshot),
      announcement: 'assertive',
    };
  if (connectionState === 'reconnecting')
    return { state: 'reconnecting', message: '连接中断 · 正在取回席位', announcement: 'polite' };
  if (connectionState === 'paused')
    return { state: 'paused', message: '对局暂停 · 等待席位重连', announcement: 'polite' };
  if (online.pending)
    return {
      state: 'command-pending',
      message: '命令已发送 · 等待服务器确认',
      announcement: 'polite',
    };
  if (!snapshot)
    return { state: connectionState, message: '联机房间 · 等待权威快照', announcement: 'polite' };
  return yourTurn
    ? { state: 'player-turn', message: '你的回合 · 继续探测或收手', announcement: 'polite' }
    : { state: 'opponent-turn', message: '对手回合 · 等待权威状态', announcement: 'polite' };
}

function mapOnlineConfirmation(confirmation, localSeat) {
  if (!confirmation || confirmation.action?.type !== 'bank') return [];
  const scoreKey = localSeat === 'invitee' ? 'aiScore' : 'humanScore';
  const points = Math.max(
    0,
    (confirmation.after?.[scoreKey] ?? 0) - (confirmation.before?.[scoreKey] ?? 0),
  );
  return [
    {
      id: `online-${confirmation.id}-${confirmation.sourceRevision}`,
      kind: 'bank-confirmed',
      sourceRevision: confirmation.sourceRevision,
      side: 'player',
      points,
    },
  ];
}

function terminalTitle(connectionState, snapshot) {
  if (connectionState === 'replaced') return '席位已替换';
  if (connectionState === 'abandoned') return '对局已中止';
  if (connectionState === 'verification-failed') return '结果验证失败';
  if (connectionState === 'verified') return '结果已验证';
  return snapshot?.gameOver ? '对局结束' : '联机终局';
}
