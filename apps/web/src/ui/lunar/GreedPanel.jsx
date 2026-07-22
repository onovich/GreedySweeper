import './greed-panel.css';
import { LunarButton, LunarPanel, StatusText } from './primitives';

const SEGMENTS = 7;

export function GreedPanel({
  greed,
  effects = [],
  effectProgress = null,
  onBankIntent = () => {},
}) {
  if (!greed) return null;
  const bankEffect = effects.find((effect) => effect.kind === 'bank-confirmed');
  const confirmed = Boolean(bankEffect);
  const effectPhase =
    effectProgress === null
      ? 'running'
      : effectProgress === 0
        ? 'start'
        : effectProgress === 1
          ? 'end'
          : 'mid';

  return (
    <LunarPanel
      className={`gs-greed-panel${confirmed ? ' gs-greed-panel--confirmed' : ''}`}
      data-effect-phase={confirmed ? effectPhase : undefined}
      aria-labelledby="gs-greed-title"
    >
      <div className="gs-greed-heading">
        <div>
          <p>GREED CIRCUIT</p>
          <h2 id="gs-greed-title">贪婪奖励</h2>
        </div>
        <span>{greed.bank.availability === 'pending' ? 'PENDING' : 'ARMED'}</span>
      </div>
      <div className="gs-multipliers" aria-label={`当前倍率 ${greed.multiplier}`}>
        {greed.columns.map((column) => (
          <MultiplierColumn key={column.multiplier} column={column} />
        ))}
      </div>
      <BonusPot value={greed.bonusPot} />
      <RewardCircuit
        state={
          confirmed ? 'bank-confirmed' : greed.bank.availability === 'disabled' ? 'off' : 'rest'
        }
      />
      <LunarButton
        className="gs-bank-button"
        variant="reward"
        disabled={greed.bank.availability !== 'enabled'}
        onClick={onBankIntent}
      >
        <strong>
          {greed.bank.availability === 'pending' ? '等待确认' : greed.bank.primaryLabel}
        </strong>
        <span>
          {greed.bank.availability === 'pending' ? '服务器正在处理' : greed.bank.secondaryLabel}
        </span>
      </LunarButton>
      <StatusText className="gs-bank-announcement" tone="reward" aria-live="polite">
        {confirmed ? `已入账 ${bankEffect.points} 分 · 回合结束` : ''}
      </StatusText>
    </LunarPanel>
  );
}

export function MultiplierColumn({ column }) {
  return (
    <div className={`gs-multiplier gs-multiplier--${column.state}`}>
      <strong>×{column.multiplier}</strong>
      <div className="gs-multiplier__segments" aria-hidden="true">
        {Array.from({ length: SEGMENTS }, (_, index) => (
          <span key={index} />
        ))}
      </div>
      <small>{column.state.toUpperCase()}</small>
    </div>
  );
}

export function BonusPot({ value }) {
  return (
    <section className="gs-bonus-pot" aria-label={`未入账奖励 ${value}`}>
      <span>BONUS POT</span>
      <strong>{value}</strong>
      <small>未入账奖励</small>
    </section>
  );
}

export function RewardCircuit({ state }) {
  return (
    <svg
      className={`gs-reward-circuit gs-reward-circuit--${state}`}
      viewBox="0 0 240 48"
      role="img"
      aria-label={state === 'bank-confirmed' ? '奖励正在入账' : '奖励回路待机'}
    >
      <path d="M8 24h52l16-16h72l16 16h68" />
      <circle cx="76" cy="8" r="4" />
      <circle cx="164" cy="24" r="4" />
    </svg>
  );
}
