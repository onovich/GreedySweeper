import { useState } from 'react';
import { Cpu, Info, RotateCcw, Trophy } from 'lucide-react';
import { BOARD_CONFIG, SCORE_CONFIG } from '@greedy-sweeper/game-core/config/game-config';
import { encodeChallengeCode } from '@greedy-sweeper/game-core/challenge/code';
import { getRemainingMines, getWinner } from '@greedy-sweeper/game-core/selectors/game-selectors';
import { ScorePanel } from '../components/ScorePanel';
import { GameBoard } from '../components/GameBoard';
import { ReplayControls } from '../components/ReplayControls';

export function GameScreen({
  gameState,
  isAiThinking,
  onReveal,
  onFlag,
  onBank,
  onRestart,
  onStartChallenge,
  onStartDailyChallenge,
  challengeError,
  challengeDescriptor,
  actionLog = [],
  historyEntries = [],
  aiPolicy,
  isAiPolicyLocked,
  onAiPolicyChange,
  mode,
  isModeLocked,
  onModeChange,
  replay = {},
  progression,
}) {
  const isHumanTurn =
    !replay.isReplaying && !gameState.gameOver && gameState.currentPlayer === 'human';
  const remainingMines = getRemainingMines(gameState, BOARD_CONFIG);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-3 py-4 font-sans text-gray-100 sm:px-6 sm:py-8">
      <section className="w-full max-w-3xl rounded-3xl border border-gray-800 bg-gray-900 p-4 shadow-2xl sm:p-6">
        <header className="mb-4 text-center">
          <h1 className="bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-xl font-black tracking-wider text-transparent sm:text-2xl">
            贪婪扫雷：高风险高回报
          </h1>
          <p className="mt-2 h-6 text-xs font-medium text-yellow-400 sm:text-sm" aria-live="polite">
            {gameState.actionMessage}
          </p>
        </header>

        <section className="relative mb-6 flex items-stretch justify-between overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 p-2 shadow-inner">
          <ScorePanel
            player="human"
            label="玩家"
            score={gameState.humanScore}
            isActive={isHumanTurn}
          />
          <div className="z-10 flex flex-col items-center justify-center px-2 sm:px-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-600 sm:text-xs">
              剩余地雷
            </p>
            <p className="rounded-xl border-2 border-gray-800 bg-gray-900 px-3 py-1 text-lg font-black text-gray-300 shadow-inner sm:px-5 sm:py-2 sm:text-2xl">
              {remainingMines}
            </p>
          </div>
          <ScorePanel player="ai" label="AI" score={gameState.aiScore} isActive={isAiThinking} />
        </section>

        <AiPolicyPanel policy={aiPolicy} isLocked={isAiPolicyLocked} onChange={onAiPolicyChange} />
        <ModePanel mode={mode} isLocked={isModeLocked} onChange={onModeChange} />

        {isAiThinking && (
          <p
            className="mb-3 flex items-center justify-center gap-1 text-xs font-bold text-red-400"
            aria-live="polite"
          >
            <Cpu aria-hidden="true" className="h-4 w-4 animate-pulse" /> AI 思考中
          </p>
        )}

        <GameBoard
          board={gameState.board}
          isHumanTurn={isHumanTurn}
          onReveal={onReveal}
          onFlag={onFlag}
        />

        {gameState.greed && (
          <section
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-900/60 bg-amber-950/30 p-3"
            aria-label="Greed reward status"
          >
            <p className="text-sm text-amber-100">
              Greed: streak {gameState.greed.streak}, unbanked pot {gameState.greed.bonusPot}
            </p>
            <button
              type="button"
              onClick={onBank}
              disabled={!isHumanTurn || gameState.greed.streak < 1}
              className="rounded-lg border border-amber-500/60 px-3 py-2 text-sm font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-amber-900/40"
            >
              Bank rewards and end turn
            </button>
          </section>
        )}

        {gameState.gameOver && <GameOverBanner gameState={gameState} />}

        <section className="mb-4 flex flex-col gap-3 rounded-2xl border border-gray-800 bg-gray-950 p-3 sm:flex-row sm:items-center sm:justify-between">
          <ChallengeCodeForm
            onStartChallenge={onStartChallenge}
            onStartDailyChallenge={onStartDailyChallenge}
            error={challengeError}
          />
          <ReplayControls replay={replay} />
        </section>

        <SharePanel
          descriptor={challengeDescriptor}
          gameState={gameState}
          actionCount={actionLog.length}
        />
        <ProgressionPanel progression={progression} />
        {historyEntries.length > 0 && (
          <p className="mb-4 text-xs text-gray-500">Saved replays: {historyEntries.length}</p>
        )}

        <footer className="flex flex-col gap-4 rounded-2xl border border-gray-800 bg-gray-950 p-4 sm:flex-row sm:items-stretch sm:justify-between sm:p-5">
          <button
            type="button"
            onClick={onRestart}
            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-6 py-3 font-bold text-gray-200 transition-all hover:border-gray-500 hover:bg-gray-700 active:bg-gray-900 sm:w-auto sm:px-8 sm:py-4"
          >
            <RotateCcw
              aria-hidden="true"
              className="h-4 w-4 text-teal-400 transition-transform duration-500 group-hover:-rotate-180 sm:h-5 sm:w-5"
            />
            重新开始
          </button>
          <Instructions />
        </footer>
      </section>
    </main>
  );
}

function ProgressionPanel({ progression }) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  if (!progression) return null;
  const { stats, unlocks } = progression;
  function reset() {
    if (!confirming) {
      setConfirming(true);
      setMessage('Confirm to clear local progression only. Saved replays stay intact.');
      return;
    }
    const result = progression.reset?.(true);
    setConfirming(false);
    setMessage(
      result?.ok
        ? 'Local progression cleared. Saved replays were not changed.'
        : `Could not clear progression: ${result?.error?.code ?? 'unavailable'}`,
    );
  }
  return (
    <section
      className="mb-4 rounded-2xl border border-gray-800 bg-gray-950 p-3"
      aria-label="Local progression"
    >
      <h2 className="text-sm font-bold text-gray-100">Local progression</h2>
      <p className="mt-1 text-xs text-gray-300">
        Games {stats.completedGames} · Wins {stats.wins} · Win rate{' '}
        {(stats.winRate * 100).toFixed(0)}%
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Achievements: {unlocks.length}/10. Stored only in this browser; no account or network sync.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-lg border border-gray-700 px-2 py-1 text-xs text-gray-200 hover:bg-gray-800"
      >
        {confirming ? 'Confirm clear local progression' : 'Clear local progression'}
      </button>
      {message && (
        <p role="status" className="mt-2 text-xs text-gray-400">
          {message}
        </p>
      )}
    </section>
  );
}

function ModePanel({ mode, isLocked, onChange }) {
  return (
    <section
      className="mb-4 rounded-2xl border border-gray-800 bg-gray-950 p-3"
      aria-label="Game mode selector"
    >
      <label htmlFor="game-mode" className="mr-2 text-xs text-gray-300">
        Game mode
      </label>
      <select
        id="game-mode"
        value={mode}
        disabled={isLocked}
        onChange={(event) => onChange?.(event.target.value)}
        className="rounded-lg border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-100 disabled:opacity-60"
      >
        <option value="greed">Greed v2 (default)</option>
        <option value="standard">Classic v1</option>
      </select>
      <span className="ml-2 text-xs text-gray-500">
        {isLocked ? 'Locked for this game.' : 'Choose before the first move.'}
      </span>
    </section>
  );
}

function AiPolicyPanel({ policy, isLocked, onChange }) {
  if (!policy) return null;
  return (
    <section
      className="mb-4 rounded-2xl border border-gray-800 bg-gray-950 p-3"
      aria-label="AI policy"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
        <label htmlFor="ai-difficulty">AI difficulty</label>
        <select
          id="ai-difficulty"
          value={policy.difficulty}
          disabled={isLocked}
          onChange={(event) => onChange?.({ ...policy, difficulty: event.target.value })}
          className="rounded-lg border border-gray-700 bg-gray-900 px-2 py-1 text-gray-100 disabled:opacity-60"
        >
          <option value="easy">Easy</option>
          <option value="normal">Normal</option>
          <option value="hard">Hard</option>
        </select>
        <label htmlFor="ai-style">AI style</label>
        <select
          id="ai-style"
          value={policy.style}
          disabled={isLocked}
          onChange={(event) => onChange?.({ ...policy, style: event.target.value })}
          className="rounded-lg border border-gray-700 bg-gray-900 px-2 py-1 text-gray-100 disabled:opacity-60"
        >
          <option value="balanced">Balanced</option>
          <option value="conservative">Conservative</option>
          <option value="greedy">Greedy</option>
        </select>
        <span>{isLocked ? 'Locked for this game.' : 'Choose before the first move.'}</span>
      </div>
    </section>
  );
}

function ChallengeCodeForm({ onStartChallenge, onStartDailyChallenge, error }) {
  const [code, setCode] = useState('');

  function submit(event) {
    event.preventDefault();
    onStartChallenge?.(code);
  }

  return (
    <form onSubmit={submit} className="w-full sm:max-w-md">
      <label htmlFor="challenge-code" className="mb-1 block text-xs font-bold text-gray-300">
        Challenge code
      </label>
      <div className="flex gap-2">
        <input
          id="challenge-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="GS1. …"
          className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:border-teal-400 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-bold text-white hover:bg-teal-600"
        >
          Start
        </button>
        <button
          type="button"
          onClick={onStartDailyChallenge}
          className="rounded-lg border border-gray-700 px-3 py-2 text-sm font-bold text-gray-200 hover:bg-gray-800"
        >
          Daily
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-300">
          Invalid challenge code: {error.code}
        </p>
      )}
    </form>
  );
}

function SharePanel({ descriptor, gameState, actionCount }) {
  const [status, setStatus] = useState('');
  if (!descriptor) return null;

  const encoded = encodeChallengeCode(descriptor);
  if (!encoded.ok) return null;
  const resultText = `Greedy Sweeper challenge ${encoded.value} | score ${gameState.humanScore}-${gameState.aiScore} | moves ${actionCount}`;

  async function copy(text, message) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(message);
    } catch {
      setStatus('Copy is unavailable in this browser.');
    }
  }

  return (
    <section
      className="mb-4 rounded-2xl border border-gray-800 bg-gray-950 p-3"
      aria-label="Challenge sharing"
    >
      <p className="break-all text-xs text-gray-400">{encoded.value}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy(encoded.value, 'Challenge code copied.')}
          className="replay-button"
        >
          Copy code
        </button>
        <button
          type="button"
          onClick={() => copy(resultText, 'Result text copied.')}
          className="replay-button"
        >
          Copy result
        </button>
      </div>
      {status && (
        <p role="status" className="mt-2 text-xs text-teal-200">
          {status}
        </p>
      )}
    </section>
  );
}

function GameOverBanner({ gameState }) {
  const winner = getWinner(gameState);
  const title =
    winner === 'draw' ? '势均力敌的平局' : winner === 'human' ? '玩家大获全胜' : 'AI 取得胜利';

  return (
    <section
      className="mb-6 flex flex-col items-center space-y-2 rounded-2xl border border-gray-700 bg-gray-900 p-4 text-center shadow-2xl sm:space-y-3 sm:p-6"
      aria-live="assertive"
    >
      <Trophy
        aria-hidden="true"
        className="h-8 w-8 text-yellow-500 drop-shadow-lg sm:h-12 sm:w-12"
      />
      <h2
        className={`text-xl font-black tracking-wide sm:text-3xl ${winner === 'human' ? 'text-blue-400' : winner === 'ai' ? 'text-red-400' : 'text-gray-400'}`}
      >
        {title}
      </h2>
      <p className="rounded-lg border border-gray-800 bg-gray-950 px-4 py-2 text-sm font-bold text-gray-500 sm:text-base">
        最终比分：玩家 <span className="text-blue-400">{gameState.humanScore}</span> | AI{' '}
        <span className="text-red-400">{gameState.aiScore}</span>
      </p>
    </section>
  );
}

function Instructions() {
  return (
    <aside className="w-full rounded-xl border border-gray-800 bg-gray-900 p-3 text-[11px] text-gray-400 sm:p-4 sm:text-xs">
      <h2 className="mb-2 flex items-center gap-2 border-b border-gray-800 pb-2 text-xs font-bold uppercase tracking-widest text-yellow-500 sm:text-sm">
        <Info aria-hidden="true" className="h-4 w-4" /> 刺激计分规则
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        <li>
          <span className="font-bold text-green-400">高收益：</span>
          翻开安全区，数字是几就得几分并连击。
        </li>
        <li>
          <span className="font-bold text-purple-400">高回报：</span>准确标记红旗，加{' '}
          {SCORE_CONFIG.correctFlag} 分并换手。
        </li>
        <li>
          <span className="font-bold text-red-400">高风险：</span>标错红旗，扣{' '}
          {Math.abs(SCORE_CONFIG.wrongFlag)} 分并换手。
        </li>
        <li>
          <span className="font-bold text-red-400">踩雷：</span>扣{' '}
          {Math.abs(SCORE_CONFIG.explodedMine)} 分并换手。
        </li>
      </ul>
      <p className="mt-3 text-gray-500">
        桌面端左键翻开、右键标记；移动端短按翻开、长按 400ms 标记。键盘可用 Enter 翻开、F 标记。
      </p>
    </aside>
  );
}
