import { useCellPointerIntent } from '../../application/useCellPointerIntent';
import { GameCell } from './GameCell';

export function GameBoard({ board, isHumanTurn, onReveal, onFlag }) {
  const pointerIntent = useCellPointerIntent({ onReveal, onFlag });
  const columns = board[0]?.length ?? 0;

  return (
    <section className="mb-6 flex justify-center" aria-label="Minesweeper board">
      <div
        className={`grid gap-px overflow-hidden rounded-xl border-[3px] bg-gray-800 transition-all duration-300 sm:gap-0.5 sm:border-4 ${
          isHumanTurn
            ? 'border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
            : 'border-gray-700'
        }`}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, columnIndex) => (
            <GameCell
              key={`${rowIndex}-${columnIndex}`}
              cell={cell}
              row={rowIndex}
              column={columnIndex}
              isHumanTurn={isHumanTurn}
              pointerIntent={pointerIntent}
              onReveal={onReveal}
              onFlag={onFlag}
            />
          )),
        )}
      </div>
    </section>
  );
}
