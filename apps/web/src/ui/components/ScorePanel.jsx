import { Cpu, User } from 'lucide-react';

export function ScorePanel({ player, score, isActive, label }) {
  const isHuman = player === 'human';
  const Icon = isHuman ? User : Cpu;
  const alignment = isHuman ? 'sm:justify-start sm:text-left' : 'sm:justify-end sm:text-right';
  const activeClass = isHuman
    ? 'border border-blue-500/30 bg-blue-900/40 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]'
    : 'border border-red-500/30 bg-red-900/40 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]';
  const scoreClass = isHuman ? 'text-blue-400' : 'text-red-400';

  return (
    <section
      aria-label={`${label} score`}
      className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl p-3 transition-all sm:flex-row sm:gap-4 ${alignment} ${
        isActive ? activeClass : 'opacity-60 grayscale-[30%]'
      }`}
    >
      {isHuman && <PanelIcon Icon={Icon} player={player} active={isActive} />}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 sm:text-sm">
          {label}
        </p>
        <p className={`text-3xl font-black leading-none sm:text-4xl ${scoreClass}`}>{score}</p>
      </div>
      {!isHuman && <PanelIcon Icon={Icon} player={player} active={isActive} />}
    </section>
  );
}

function PanelIcon({ Icon, player, active }) {
  const isHuman = player === 'human';
  const className = active
    ? isHuman
      ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]'
      : 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]'
    : isHuman
      ? 'bg-gray-800 text-blue-500'
      : 'bg-gray-800 text-red-500';

  return (
    <div className={`rounded-xl p-2 transition-colors sm:p-3 ${className}`}>
      <Icon aria-hidden="true" className="h-5 w-5 sm:h-8 sm:w-8" />
    </div>
  );
}
