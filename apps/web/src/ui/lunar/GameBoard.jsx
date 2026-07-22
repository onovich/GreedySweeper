import './game-board.css';
import { useState } from 'react';
import { useLunarCellPointerIntent } from './useLunarCellPointerIntent';

export function GameBoard({ board, onCellIntent = () => {} }) {
  const locked = board.state !== 'ready';
  const pointerIntent = useLunarCellPointerIntent({ onIntent: onCellIntent, locked });
  const [focusOverrideId, setFocusOverrideId] = useState(
    board.focusedCellId ?? board.cells[0]?.id ?? null,
  );
  const activeCellId = board.cells.some((cell) => cell.id === focusOverrideId)
    ? focusOverrideId
    : board.cells.some((cell) => cell.id === board.focusedCellId)
      ? board.focusedCellId
      : (board.cells[0]?.id ?? null);

  if (board.state === 'empty' || board.cells.length === 0) {
    return (
      <section className="gs-board-empty" aria-label="扫雷棋盘">
        <strong>暂无棋盘</strong>
        <p>完成配置后开始对局</p>
      </section>
    );
  }

  return (
    <section className="gs-board-frame" data-state={board.state}>
      <div className="gs-board-heading">
        <div>
          <p>GAME BOARD</p>
          <h2>月面探测区</h2>
        </div>
        <span>{locked ? lockLabel(board.lockReason) : 'ACTIVE'}</span>
      </div>
      <p className="gs-visually-hidden" id="gs-board-instructions">
        使用方向键移动棋盘焦点，Enter 翻开，F 标记；触控长按可标记。
      </p>
      <div className="gs-board-scroll" aria-label="可滚动棋盘视口">
        <div
          className="gs-game-board"
          role="grid"
          aria-label={`${board.rows} 行 ${board.columns} 列扫雷棋盘`}
          aria-describedby="gs-board-instructions"
          aria-disabled={locked}
          aria-rowcount={board.rows}
          aria-colcount={board.columns}
        >
          {board.cells.map((cell) => (
            <GameCell
              key={cell.id}
              cell={cell}
              locked={locked}
              focused={cell.id === activeCellId}
              tabIndex={cell.id === activeCellId ? 0 : -1}
              onNavigate={(event) => navigateGridCell(event, cell, board, setFocusOverrideId)}
              onIntent={onCellIntent}
              pointerIntent={pointerIntent}
            />
          ))}
        </div>
      </div>
      {locked && <p className="gs-board-lock-message">{lockMessage(board.lockReason)}</p>}
    </section>
  );
}

export function GameCell({
  cell,
  locked,
  focused = false,
  tabIndex = -1,
  onNavigate = () => {},
  onIntent,
  pointerIntent = null,
}) {
  const canInteract = !locked && (cell.canReveal || cell.canFlag);
  const emit = (kind) => {
    if (!canInteract) return;
    if (kind === 'reveal' && !cell.canReveal) return;
    if (kind === 'flag' && !cell.canFlag) return;
    onIntent({ kind, row: cell.row, column: cell.column });
  };

  return (
    <button
      type="button"
      role="gridcell"
      className={`gs-cell gs-cell--${cell.state}${focused ? ' gs-cell--focused' : ''}`}
      aria-label={cell.accessibleLabel}
      aria-rowindex={cell.row + 1}
      aria-colindex={cell.column + 1}
      aria-disabled={!canInteract}
      data-cell-id={cell.id}
      data-row={cell.row}
      data-column={cell.column}
      tabIndex={tabIndex}
      onPointerDown={(event) => pointerIntent?.onPointerDown(event, cell)}
      onPointerMove={pointerIntent?.onPointerMove}
      onPointerUp={pointerIntent?.onPointerUp}
      onPointerCancel={pointerIntent?.onPointerCancel}
      onClick={() => (pointerIntent ? pointerIntent.onClick(cell) : emit('reveal'))}
      onContextMenu={(event) => {
        if (pointerIntent) pointerIntent.onContextMenu(event, cell);
        else {
          event.preventDefault();
          emit('flag');
        }
      }}
      onKeyDown={(event) => {
        if (
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
        ) {
          onNavigate(event);
          return;
        }
        if (event.key.toLowerCase() === 'f') {
          event.preventDefault();
          emit('flag');
        }
      }}
    >
      <CellContent cell={cell} />
    </button>
  );
}

function navigateGridCell(event, cell, board, setActiveCellId) {
  let row = cell.row;
  let column = cell.column;
  if (event.key === 'ArrowUp') row -= 1;
  if (event.key === 'ArrowDown') row += 1;
  if (event.key === 'ArrowLeft') column -= 1;
  if (event.key === 'ArrowRight') column += 1;
  if (event.key === 'Home') {
    row = event.ctrlKey ? 0 : cell.row;
    column = 0;
  }
  if (event.key === 'End') {
    row = event.ctrlKey ? board.rows - 1 : cell.row;
    column = board.columns - 1;
  }
  row = Math.max(0, Math.min(board.rows - 1, row));
  column = Math.max(0, Math.min(board.columns - 1, column));
  const target = board.cells.find(
    (candidate) => candidate.row === row && candidate.column === column,
  );
  if (!target) return;
  event.preventDefault();
  setActiveCellId(target.id);
  event.currentTarget
    .closest('[role="grid"]')
    ?.querySelector(`[data-cell-id="${target.id}"]`)
    ?.focus();
}

function CellContent({ cell }) {
  if (cell.state === 'revealed-number') {
    return <span className="gs-cell__number">{cell.neighborMines}</span>;
  }
  if (
    cell.state === 'flagged-player' ||
    cell.state === 'flagged-opponent' ||
    cell.state === 'flagged-neutral'
  ) {
    return (
      <svg className="gs-cell__mark" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 21V3m1 2h10l-3 4 3 4H7" />
      </svg>
    );
  }
  if (cell.state === 'wrong-flag') {
    return (
      <svg className="gs-cell__mark" viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  }
  if (cell.state === 'exploded') {
    return (
      <svg className="gs-cell__mark" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="13" r="6" />
        <path d="m12 3 1 4m7 0-4 3M4 7l4 3m-6 5 4-1m12 0 4 1" />
      </svg>
    );
  }
  return null;
}

function lockLabel(reason) {
  return (
    {
      'ai-turn': 'AI TURN',
      'opponent-turn': 'OPPONENT TURN',
      'command-pending': 'PENDING',
      replay: 'REPLAY',
      paused: 'PAUSED',
      reconnecting: 'RECONNECTING',
      terminal: 'TERMINAL',
      error: 'ERROR',
    }[reason] ?? 'LOCKED'
  );
}

function lockMessage(reason) {
  return (
    {
      'ai-turn': 'AI 回合 · 棋盘已锁定',
      'opponent-turn': '对手回合 · 等待权威状态',
      'command-pending': '命令已发送 · 等待服务器确认',
      replay: '回放中 · 对局操作已锁定',
      paused: '对局暂停 · 等待席位重连',
      reconnecting: '连接中断 · 正在取回席位',
      terminal: '对局结束 · 棋盘可检查',
      error: '状态异常 · 棋盘已锁定',
    }[reason] ?? '棋盘已锁定'
  );
}
