import { Bomb, Flag, X } from 'lucide-react';
import { getNumberColorClass } from '@greedy-sweeper/game-core/selectors/game-selectors';

export function GameCell({ cell, row, column, isHumanTurn, pointerIntent, onReveal, onFlag }) {
  const label = getCellLabel(cell, row, column);
  const content = getCellContent(cell);
  const className = getCellClassName(cell, isHumanTurn);

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      disabled={!isHumanTurn || cell.isRevealed || cell.isFlagged}
      onPointerDown={(event) => pointerIntent.onPointerDown(event, row, column)}
      onPointerUp={(event) => pointerIntent.onPointerUp(event, row, column)}
      onPointerLeave={pointerIntent.onPointerLeave}
      onContextMenu={(event) => pointerIntent.onContextMenu(event, row, column)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onReveal(row, column);
        if (event.key.toLowerCase() === 'f') {
          event.preventDefault();
          onFlag(row, column);
        }
      }}
    >
      {content}
    </button>
  );
}

function getCellClassName(cell, isHumanTurn) {
  const base =
    'relative flex h-5 w-5 items-center justify-center text-[10px] font-black transition-all duration-150 sm:h-8 sm:w-8 sm:text-[17px]';
  if (!cell.isRevealed) {
    return `${base} border border-b-gray-800 border-l-gray-400 border-r-gray-800 border-t-gray-400 bg-gray-600 ${
      isHumanTurn ? 'cursor-pointer hover:bg-gray-500 active:bg-gray-700' : 'cursor-not-allowed'
    }`;
  }
  if (cell.isWrongFlag) return `${base} animate-pulse border border-gray-800 bg-red-900/80`;
  if (cell.isFlagged) {
    return `${base} border border-gray-800 ${cell.flagger === 'human' ? 'bg-blue-900/60' : 'bg-red-900/60'}`;
  }
  if (cell.isExploded)
    return `${base} border border-gray-800 bg-red-600 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]`;
  return `${base} border border-gray-800 bg-gray-900`;
}

function getCellContent(cell) {
  if (cell.isWrongFlag) {
    return (
      <>
        {cell.neighborMines > 0 && <span className="opacity-40">{cell.neighborMines}</span>}
        <X
          aria-hidden="true"
          className="absolute inset-0 h-full w-full p-0.5 text-red-400 drop-shadow-md sm:p-1"
        />
      </>
    );
  }
  if (cell.isFlagged) {
    const colorClass =
      cell.flagger === 'human' ? 'fill-blue-500 text-blue-400' : 'fill-red-500 text-red-400';
    return (
      <Flag aria-hidden="true" className={`h-3 w-3 drop-shadow-md sm:h-4 sm:w-4 ${colorClass}`} />
    );
  }
  if (cell.isExploded)
    return <Bomb aria-hidden="true" className="h-3 w-3 text-gray-950 sm:h-5 sm:w-5" />;
  if (cell.isRevealed && cell.neighborMines > 0) {
    return <span className={getNumberColorClass(cell.neighborMines)}>{cell.neighborMines}</span>;
  }
  return null;
}

function getCellLabel(cell, row, column) {
  const position = `Row ${row + 1}, column ${column + 1}`;
  if (cell.isExploded) return `${position}: mine exploded`;
  if (cell.isWrongFlag) return `${position}: incorrect flag`;
  if (cell.isFlagged) return `${position}: flagged mine`;
  if (cell.isRevealed) return `${position}: ${cell.neighborMines} neighboring mines`;
  return `${position}: hidden`;
}
