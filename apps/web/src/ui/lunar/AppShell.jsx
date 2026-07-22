import '../theme/tokens.css';
import './app-shell.css';
import { LunarButton, LunarPanel, StatusText } from './primitives';

export function AppShell({ viewModel, board, greed, utilityDrawer = null, onIntent = () => {} }) {
  return (
    <main className="gs-canvas" data-lifecycle={viewModel.session.lifecycle}>
      <section
        className={`gs-shell${viewModel.greed ? '' : ' gs-shell--classic'}`}
        aria-label="贪婪扫雷月面终端"
      >
        <ConsoleHeader scores={viewModel.scores} mines={viewModel.mines} />
        <TurnMessage turn={viewModel.turn} />
        <MatchConfigPanel config={viewModel.matchConfig} onIntent={onIntent} />
        <section className="gs-board-stage" aria-label="棋盘主区域">
          {board ?? <BoardStagePlaceholder board={viewModel.board} />}
        </section>
        {viewModel.greed && (
          <aside className="gs-greed-stage" aria-label="贪婪奖励">
            {greed ?? <GreedStagePlaceholder greed={viewModel.greed} />}
          </aside>
        )}
        <UtilityDock utilities={viewModel.utilities} onIntent={onIntent} />
        {utilityDrawer}
      </section>
    </main>
  );
}

export function BrandHeader() {
  return (
    <header className="gs-brand">
      <p className="gs-brand__eyebrow">GREEDY SWEEPER · LUNAR SYSTEM 1986</p>
      <h1>贪婪扫雷</h1>
    </header>
  );
}

export function ConsoleHeader({ scores, mines }) {
  return (
    <header className="gs-console-header" aria-label="对局比分">
      <ScoreCapsule score={scores[0]} />
      <div className="gs-console-header__center">
        <BrandHeader />
        <MineCounter mines={mines} />
      </div>
      <ScoreCapsule score={scores[1]} />
    </header>
  );
}

export function ScoreCapsule({ score }) {
  const stateLabel = {
    active: '当前回合',
    inactive: '等待中',
    winner: '胜利',
    loser: '对局结束',
    draw: '平局',
    unknown: '同步中',
  }[score.activity];
  return (
    <article
      className={`gs-score gs-score--${score.identity} gs-score--${score.activity}${score.settlement === 'confirmed' ? ' gs-score--settled' : ''}`}
      aria-label={`${score.label}比分`}
    >
      <span className="gs-score__identity" aria-hidden="true" />
      <div>
        <p className="gs-score__label">{score.label}</p>
        <p className="gs-score__state">{stateLabel}</p>
      </div>
      <strong className="gs-score__value">{score.value ?? '—'}</strong>
    </article>
  );
}

export function MineCounter({ mines }) {
  const unknown = mines.state !== 'ready';
  return (
    <article className="gs-mine-counter" aria-label={unknown ? '剩余地雷同步中' : '剩余地雷'}>
      <span>MINES</span>
      <strong>{unknown ? '—' : mines.remaining}</strong>
      <small>{unknown ? '同步中' : '剩余地雷'}</small>
    </article>
  );
}

export function TurnMessage({ turn }) {
  return (
    <StatusText className="gs-turn-message" aria-live={turn.announcement}>
      {turn.message}
    </StatusText>
  );
}

export function MatchConfigPanel({ config, onIntent }) {
  const locked = config.state === 'locked';
  return (
    <LunarPanel className="gs-config" aria-labelledby="gs-config-title">
      <div className="gs-panel-heading">
        <div>
          <p className="gs-panel-kicker">MATCH CONFIG</p>
          <h2 id="gs-config-title">对局配置</h2>
        </div>
        <span className="gs-lock-state" data-locked={locked}>
          {locked ? 'LOCKED' : config.state.toUpperCase()}
        </span>
      </div>
      <dl className="gs-config__list">
        <ConfigValue label="模式" value={config.mode === 'greed' ? '贪婪模式' : '经典模式'} />
        <ConfigValue label="难度" value={config.difficulty} />
        <ConfigValue label="AI 风格" value={config.style} />
      </dl>
      {!locked && (
        <LunarButton onClick={() => onIntent({ kind: 'match-config-open' })}>调整配置</LunarButton>
      )}
    </LunarPanel>
  );
}

function ConfigValue({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function BoardStagePlaceholder({ board }) {
  return (
    <LunarPanel className="gs-board-placeholder" tone="recessed">
      <p>
        GAME BOARD · {board.rows} × {board.columns}
      </p>
      <strong>READY</strong>
    </LunarPanel>
  );
}

function GreedStagePlaceholder({ greed }) {
  if (!greed) {
    return (
      <LunarPanel className="gs-greed-placeholder" tone="recessed">
        <p>CLASSIC MODE</p>
        <strong>未入账奖励 0</strong>
      </LunarPanel>
    );
  }
  return (
    <LunarPanel className="gs-greed-placeholder">
      <p className="gs-panel-kicker">GREED CIRCUIT</p>
      <h2>贪婪奖励</h2>
      <div className="gs-greed-placeholder__values">
        <span>×{greed.multiplier}</span>
        <strong>POT {greed.bonusPot}</strong>
      </div>
      <StatusText tone="reward">{greed.bank.secondaryLabel}</StatusText>
    </LunarPanel>
  );
}

export function UtilityDock({ utilities, onIntent }) {
  const labels = { challenge: '挑战', replay: '回放', record: '记录', room: '房间' };
  return (
    <nav className="gs-utility-dock" aria-label="工具栏">
      {utilities.tabs.map((tab) => (
        <LunarButton
          key={tab}
          variant={utilities.activeTab === tab ? 'primary' : 'quiet'}
          aria-current={utilities.activeTab === tab ? 'page' : undefined}
          onClick={() => onIntent({ kind: 'utility', tab })}
        >
          <span aria-hidden="true">{String(utilities.tabs.indexOf(tab) + 1).padStart(2, '0')}</span>
          {labels[tab]}
        </LunarButton>
      ))}
    </nav>
  );
}
