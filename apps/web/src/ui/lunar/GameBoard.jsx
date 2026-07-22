import './game-board.css';

export function GameBoard({ board, onCellIntent = () => {} }) {
  if (board.state === 'empty' || board.cells.length === 0) {
    return (
      <section className="gs-board-empty" aria-label="扫雷棋盘">
        <strong>暂无棋盘</strong>
        <p>完成配置后开始对局</p>
      </section>
    );
  }

  const locked = board.state !== 'ready';
  return (
    <section className="gs-board-frame" data-state={board.state}>
      <div className="gs-board-heading">
        <div>
          <p>GAME BOARD</p>
          <h2>月面探测区</h2>
        </div>
        <span>{locked ? lockLabel(board.lockReason) : 'ACTIVE'}</span>
      </div>
      <div
        className="gs-game-board"
        role="grid"
        aria-label={`${board.rows} 行 ${board.columns} 列扫雷棋盘`}
        aria-disabled={locked}
        aria-rowcount={board.rows}
        aria-colcount={board.columns}
      >
        {board.cells.map((cell) => (
          <GameCell
            key={cell.id}
            cell={cell}
            locked={locked}
            focused={cell.id === board.focusedCellId}
            onIntent={onCellIntent}
          />
        ))}
      </div>
      {locked && <p className="gs-board-lock-message">{lockMessage(board.lockReason)}</p>}
    </section>
  );
}

export function GameCell({ cell, locked, focused = false, onIntent }) {
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
      onClick={() => emit('reveal')}
      onContextMenu={(event) => {
        event.preventDefault();
        emit('flag');
      }}
      onKeyDown={(event) => {
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

function CellContent({ cell }) {
  if (cell.state === 'revealed-number') {
    return <span className="gs-cell__number">{cell.neighborMines}</span>;
  }
  if (cell.state === 'flagged-player' || cell.state === 'flagged-opponent') {
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
