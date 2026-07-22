import { BOARD_CONFIG } from '@greedy-sweeper/game-core/config/game-config';
import { GREED_CONFIG } from '@greedy-sweeper/game-core/config/greed-config';
import { getRemainingMines, getWinner } from '@greedy-sweeper/game-core/selectors/game-selectors';
import { assertGameUiViewModel, GAME_UI_SCHEMA_VERSION } from './game-ui-view-model';

export function createLocalGameUiViewModel(controller, { config = BOARD_CONFIG } = {}) {
  const state = controller.gameState;
  const activeConfig = controller.challengeDescriptor?.board ?? config;
  const replay = controller.replay ?? {};
  const terminal = Boolean(state.gameOver);
  const aiTurn = Boolean(controller.isAiThinking);
  const replaying = Boolean(replay.isReplaying);
  const setup = (controller.actionLog?.length ?? 0) === 0 && !terminal;
  const lockReason = terminal ? 'terminal' : replaying ? 'replay' : aiTurn ? 'ai-turn' : null;
  const winner = terminal ? getWinner(state) : null;
  const presentation = controller.presentation;
  const effects = mapLocalPresentationEffects(presentation);

  return assertGameUiViewModel({
    schemaVersion: GAME_UI_SCHEMA_VERSION,
    session: {
      kind: replaying ? 'replay' : 'local',
      lifecycle: terminal
        ? 'terminal'
        : replaying
          ? 'paused'
          : aiTurn
            ? 'waiting'
            : setup
              ? 'setup'
              : 'active',
      authority: 'local-engine',
      lockReason,
    },
    brand: { title: 'GREEDY SWEEPER', subtitle: '月面扫雷终端' },
    scores: [
      createScore(
        'player',
        'player',
        '玩家',
        state.humanScore,
        state.currentPlayer === 'human',
        winner,
        presentation,
      ),
      createScore(
        'opponent',
        'ai',
        'AI',
        state.aiScore,
        state.currentPlayer === 'ai',
        winner,
        presentation,
      ),
    ],
    mines: {
      remaining: getRemainingMines(state, activeConfig),
      state: 'ready',
    },
    turn: createTurn(state, { aiTurn, replaying, replay }),
    matchConfig: {
      mode: controller.mode ?? state.mode ?? 'standard',
      difficulty: controller.aiPolicy?.difficulty ?? 'normal',
      style: controller.aiPolicy?.style ?? 'balanced',
      state: controller.isModeLocked || controller.isAiPolicyLocked ? 'locked' : 'editable',
    },
    board: {
      rows: state.board.length || activeConfig.rows,
      columns: state.board[0]?.length ?? activeConfig.columns,
      state: terminal
        ? 'terminal'
        : replaying
          ? 'replay'
          : aiTurn
            ? 'locked'
            : state.board.length
              ? 'ready'
              : 'empty',
      lockReason,
      cells: state.board.flatMap((row, rowIndex) =>
        row.map((cell, columnIndex) => mapLocalCell(cell, rowIndex, columnIndex, !lockReason)),
      ),
      focusedCellId: null,
    },
    greed: state.greed ? mapLocalGreed(state, controller, lockReason) : null,
    utilities: {
      activeTab: replaying ? 'replay' : 'challenge',
      tabs: ['challenge', 'replay', 'record', 'room'],
      recordCount: controller.historyEntries?.length ?? 0,
      state: 'ready',
      drawerOpen: replaying,
      replay: {
        available: Boolean(replay.isAvailable),
        playing: Boolean(replay.isPlaying),
        position: replay.position ?? 0,
        total: replay.total ?? 0,
      },
      progression: controller.progression ?? null,
    },
    connection: null,
    terminal: terminal
      ? {
          state: winner === 'human' ? 'local-win' : winner === 'ai' ? 'local-loss' : 'local-draw',
          title: winner === 'human' ? '玩家胜利' : winner === 'ai' ? 'AI 胜利' : '平局',
          verified: true,
        }
      : null,
    capabilities: {
      reveal: !lockReason,
      flag: !lockReason,
      bank: Boolean(
        state.greed &&
        !lockReason &&
        state.currentPlayer === 'human' &&
        state.greed.streak >= GREED_CONFIG.minimumBankStreak,
      ),
      restart: true,
      roomRetry: false,
    },
    effects,
  });
}

export function createLocalIntentBridge(controller) {
  return {
    onCellIntent(intent) {
      if (intent.kind === 'reveal') controller.reveal(intent.row, intent.column);
      if (intent.kind === 'flag') controller.flag(intent.row, intent.column);
    },
    onBankIntent() {
      controller.bank();
    },
    onIntent(intent) {
      if (intent.kind === 'replay') {
        if (intent.action === 'toggle') controller.replay?.togglePlay?.();
        if (intent.action === 'step') controller.replay?.step?.();
      }
      if (intent.kind === 'challenge' && intent.action === 'daily')
        controller.startDailyChallenge?.();
      if (intent.kind === 'restart') controller.restart?.();
    },
  };
}

function createScore(side, identity, label, value, active, winner, presentation) {
  const settled = presentation?.events?.some(
    (event) => event.type === 'banked' && event.player === (side === 'player' ? 'human' : 'ai'),
  );
  return {
    side,
    identity,
    label,
    value,
    activity: winner
      ? winner === 'draw'
        ? 'draw'
        : winner === (side === 'player' ? 'human' : 'ai')
          ? 'winner'
          : 'loser'
      : active
        ? 'active'
        : 'inactive',
    settlement: settled ? 'confirmed' : 'idle',
  };
}

function createTurn(state, { aiTurn, replaying, replay }) {
  if (state.gameOver) return { state: 'terminal', message: '对局结束', announcement: 'assertive' };
  if (replaying) {
    return {
      state: 'replay',
      message: `回放 · 第 ${replay.position ?? 0}/${replay.total ?? 0} 步`,
      announcement: 'polite',
    };
  }
  if (aiTurn) return { state: 'ai-turn', message: 'AI 回合 · 棋盘已锁定', announcement: 'polite' };
  return { state: 'player-turn', message: '你的回合 · 继续探测或收手', announcement: 'polite' };
}

function mapLocalCell(cell, row, column, interactive) {
  let state = 'hidden';
  if (cell.isExploded) state = 'exploded';
  else if (cell.isWrongFlag) state = 'wrong-flag';
  else if (cell.isFlagged) state = cell.flagger === 'ai' ? 'flagged-opponent' : 'flagged-player';
  else if (cell.isRevealed) state = cell.neighborMines > 0 ? 'revealed-number' : 'revealed-empty';
  const revealed = state === 'revealed-empty' || state === 'revealed-number';
  return {
    id: `r${row}-c${column}`,
    row,
    column,
    state,
    neighborMines: state === 'revealed-number' ? cell.neighborMines : null,
    accessibleLabel: `第 ${row + 1} 行，第 ${column + 1} 列：${cellLabel(state, cell.neighborMines)}`,
    canReveal: interactive && state === 'hidden',
    canFlag: interactive && !revealed && state !== 'exploded' && state !== 'wrong-flag',
  };
}

function mapLocalGreed(state, controller, lockReason) {
  const streak = state.greed.streak;
  const multiplier = Math.min(Math.max(streak - 1, 0), GREED_CONFIG.maxStreakMultiplier);
  const enabled =
    !lockReason && state.currentPlayer === 'human' && streak >= GREED_CONFIG.minimumBankStreak;
  return {
    streak,
    multiplier,
    bonusPot: state.greed.bonusPot,
    columns: [1, 2, 3].map((value) => ({
      multiplier: value,
      state: value < multiplier ? 'complete' : value === multiplier ? 'active' : 'off',
    })),
    bank: {
      availability: enabled ? 'enabled' : 'disabled',
      primaryLabel: '收手',
      secondaryLabel:
        state.greed.bonusPot > 0
          ? `入账 +${state.greed.bonusPot} · 结束回合`
          : '结束回合 · 当前奖励 0',
      lockReason:
        lockReason ?? (enabled ? null : controller.isAiThinking ? 'ai-turn' : 'unavailable'),
    },
  };
}

function mapLocalPresentationEffects(presentation) {
  if (!presentation) return [];
  return presentation.events.flatMap((event, index) => {
    const common = {
      id: `local-${presentation.revision}-${index}-${event.type}`,
      sourceRevision: presentation.revision,
      side: event.player === 'human' ? 'player' : event.player === 'ai' ? 'opponent' : null,
      points: Number.isInteger(event.points) ? event.points : null,
    };
    if (event.type === 'banked') return [{ ...common, kind: 'bank-confirmed' }];
    if (event.type === 'greed_pot_lost') return [{ ...common, kind: 'bonus-pot-lost' }];
    if (event.type === 'game_over') return [{ ...common, kind: 'terminal-confirmed' }];
    return [];
  });
}

function cellLabel(state, neighborMines) {
  return {
    hidden: '未翻开',
    'revealed-empty': '已翻开，周围无地雷',
    'revealed-number': `已翻开，周围 ${neighborMines} 颗地雷`,
    'flagged-player': '玩家旗帜',
    'flagged-opponent': 'AI 旗帜',
    'wrong-flag': '错误旗帜',
    exploded: '已爆炸',
  }[state];
}
