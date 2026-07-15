import React, { useState, useEffect, useRef } from 'react';
import { Flag, Bomb, RotateCcw, Info, Trophy, User, Cpu, X } from 'lucide-react';

const ROWS = 16;
const COLS = 16;
const TOTAL_MINES = 40;
const AI_DELAY = 800;
const LONG_PRESS_DURATION = 400;

// 分数配置 (游戏平衡核心)
const SCORE_FLAG_CORRECT = 5;
const SCORE_FLAG_WRONG = -5;
const SCORE_MINE_EXPLODED = -5;

const getNeighborsCoords = (r, c) => {
  const coords = [];
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const nr = r + i, nc = c + j;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        coords.push({ r: nr, c: nc });
      }
    }
  }
  return coords;
};

const getNumberColor = (num) => {
  const colors = [
    '', 'text-blue-400', 'text-green-400', 'text-red-400', 
    'text-purple-400', 'text-amber-500', 'text-teal-400', 
    'text-gray-900', 'text-gray-600'
  ];
  return colors[num] || '';
};

export default function App() {
  const [gameState, setGameState] = useState({
    board: [],
    humanScore: 0,
    aiScore: 0,
    gameOver: false,
    minesFound: 0,
    currentPlayer: 'human',
    actionMessage: '游戏开始，玩家先手！'
  });

  const pressTimer = useRef(null);
  const isLongPressTriggered = useRef(false);

  const initGame = () => {
    let newBoard = Array(ROWS).fill(null).map(() =>
      Array(COLS).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        isWrongFlag: false, // 新增：记录是否是错误标记
        flagger: null,
        neighborMines: 0,
        isExploded: false
      }))
    );

    let minesPlaced = 0;
    while (minesPlaced < TOTAL_MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if (!newBoard[r][c].isMine) {
        newBoard[r][c].isMine = true;
        minesPlaced++;
      }
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!newBoard[r][c].isMine) {
          let count = 0;
          const neighbors = getNeighborsCoords(r, c);
          for (const n of neighbors) {
            if (newBoard[n.r][n.c].isMine) count++;
          }
          newBoard[r][c].neighborMines = count;
        }
      }
    }

    setGameState({
      board: newBoard,
      humanScore: 0,
      aiScore: 0,
      gameOver: false,
      minesFound: 0,
      currentPlayer: 'human',
      actionMessage: '游戏开始，请玩家操作。'
    });
  };

  useEffect(() => {
    initGame();
  }, []);

  // 泛洪算法，返回因此波及翻开的数字总和
  const floodFill = (startR, startC, board) => {
    const stack = [{ r: startR, c: startC }];
    let scoreGained = 0;

    while (stack.length > 0) {
      const { r, c } = stack.pop();
      const cell = board[r][c];

      if (cell.isRevealed || cell.isFlagged || cell.isMine) continue;

      cell.isRevealed = true;
      
      // 累加波及到的数字得分 (起点除外，起点在 processMove 单独算)
      if ((r !== startR || c !== startC) && cell.neighborMines > 0) {
          scoreGained += cell.neighborMines;
      }

      if (cell.neighborMines === 0) {
        const neighbors = getNeighborsCoords(r, c);
        for (const n of neighbors) {
          if (!board[n.r][n.c].isRevealed) {
            stack.push({ r: n.r, c: n.c });
          }
        }
      }
    }
    return scoreGained;
  };

  const processMove = (state, r, c, isRightClick, player) => {
    const newBoard = state.board.map(row => row.map(cell => ({ ...cell })));
    const cell = newBoard[r][c];

    if (cell.isRevealed || cell.isFlagged) return state;

    let newHumanScore = state.humanScore;
    let newAiScore = state.aiScore;
    let newMinesFound = state.minesFound;
    let nextPlayer = player;
    let msg = '';

    const updateScore = (points) => {
        if (player === 'human') newHumanScore += points;
        else newAiScore += points;
    };

    if (isRightClick) {
      if (cell.isMine) {
        // 1. 标记正确
        cell.isFlagged = true;
        cell.flagger = player;
        cell.isRevealed = true;
        newMinesFound++;
        updateScore(SCORE_FLAG_CORRECT);
        nextPlayer = player === 'human' ? 'ai' : 'human';
        msg = `${player === 'human' ? '玩家' : 'AI'} 标记正确！加 ${SCORE_FLAG_CORRECT} 分，回合结束。`;
      } else {
        // 2. 标记错误 (UI/UX 核心惩罚)
        cell.isWrongFlag = true; 
        cell.isRevealed = true; // 强制翻开揭示真相
        updateScore(SCORE_FLAG_WRONG);
        // 如果点到0，顺便执行泛洪，但作为惩罚，这波泛洪【不给任何分数】
        if (cell.neighborMines === 0) {
            floodFill(r, c, newBoard); 
        }
        nextPlayer = player === 'human' ? 'ai' : 'human';
        msg = `糟糕！${player === 'human' ? '玩家' : 'AI'} 标记失误，扣 ${Math.abs(SCORE_FLAG_WRONG)} 分，回合结束。`;
      }
    } else {
      if (cell.isMine) {
        // 3. 踩到地雷
        cell.isExploded = true;
        cell.isRevealed = true;
        newMinesFound++;
        updateScore(SCORE_MINE_EXPLODED);
        nextPlayer = player === 'human' ? 'ai' : 'human';
        msg = `${player === 'human' ? '玩家' : 'AI'} 踩雷了！扣 ${Math.abs(SCORE_MINE_EXPLODED)} 分，回合结束。`;
      } else {
        // 4. 安全翻开
        let pointsGained = cell.neighborMines; // 翻开几就得几分
        
        const floodPoints = floodFill(r, c, newBoard);
        pointsGained += floodPoints;

        if (pointsGained > 0) {
            updateScore(pointsGained);
        }

        msg = `${player === 'human' ? '玩家' : 'AI'} 翻开安全区，爆赚 ${pointsGained} 分！继续行动！`;
      }
    }

    const isGameOver = newMinesFound === TOTAL_MINES;
    if (isGameOver) msg = "游戏结束！结算中...";

    return {
      ...state,
      board: newBoard,
      humanScore: newHumanScore,
      aiScore: newAiScore,
      gameOver: isGameOver,
      minesFound: newMinesFound,
      currentPlayer: nextPlayer,
      actionMessage: msg
    };
  };

  const handleAction = (r, c, isFlagAction) => {
    if (gameState.gameOver || gameState.currentPlayer !== 'human') return;
    
    setGameState(prev => {
      if (prev.board[r][c].isRevealed || prev.board[r][c].isFlagged) return prev;
      return processMove(prev, r, c, isFlagAction, 'human');
    });
  };

  const handlePointerDown = (e, r, c) => {
    if (e.button === 2) return;
    isLongPressTriggered.current = false;
    
    pressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      handleAction(r, c, true);
      pressTimer.current = null;
    }, LONG_PRESS_DURATION);
  };

  const handlePointerUp = (e, r, c) => {
    if (e.button === 2) return;
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
      if (!isLongPressTriggered.current) {
        handleAction(r, c, false);
      }
    }
  };

  const handlePointerLeave = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  // AI Logic
  useEffect(() => {
    if (gameState.gameOver || gameState.currentPlayer !== 'ai' || gameState.board.length === 0) return;

    const aiTimeout = setTimeout(() => {
      setGameState(prev => {
        if (prev.gameOver || prev.currentPlayer !== 'ai') return prev;

        let moveR = -1;
        let moveC = -1;
        let isRightClick = false;
        let foundLogicalMove = false;

        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const cell = prev.board[r][c];
            if (cell.isRevealed && !cell.isMine && cell.neighborMines > 0) {
              const neighbors = getNeighborsCoords(r, c);
              const hidden = [];
              const flagged = [];

              for (const n of neighbors) {
                const nCell = prev.board[n.r][n.c];
                // 确保不把 isWrongFlag 的块当作未揭开的
                if (!nCell.isRevealed && !nCell.isFlagged) hidden.push(n);
                if (nCell.isFlagged) flagged.push(n);
              }

              if (hidden.length > 0) {
                if (hidden.length + flagged.length === cell.neighborMines) {
                  moveR = hidden[0].r;
                  moveC = hidden[0].c;
                  isRightClick = true;
                  foundLogicalMove = true;
                  break;
                } 
                else if (flagged.length === cell.neighborMines) {
                  moveR = hidden[0].r;
                  moveC = hidden[0].c;
                  isRightClick = false;
                  foundLogicalMove = true;
                  break;
                }
              }
            }
          }
          if (foundLogicalMove) break;
        }

        if (!foundLogicalMove) {
          const hidden = [];
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              if (!prev.board[r][c].isRevealed && !prev.board[r][c].isFlagged) {
                hidden.push({ r, c });
              }
            }
          }
          if (hidden.length > 0) {
            const rand = hidden[Math.floor(Math.random() * hidden.length)];
            moveR = rand.r;
            moveC = rand.c;
            isRightClick = false;
          } else {
             return prev;
          }
        }

        return processMove(prev, moveR, moveC, isRightClick, 'ai');
      });
    }, AI_DELAY);

    return () => clearTimeout(aiTimeout);
  }, [gameState]);

  useEffect(() => {
    const preventDefault = (e) => {
        if (e.cancelable) e.preventDefault();
    };
    document.addEventListener('contextmenu', preventDefault, { passive: false });
    return () => document.removeEventListener('contextmenu', preventDefault);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center py-4 sm:py-8 font-sans text-gray-100 select-none touch-none">
      <div className="max-w-3xl w-full bg-gray-900 rounded-3xl shadow-2xl p-4 sm:p-6 border border-gray-800">
        
        {/* Top Info Bar */}
        <div className="text-center mb-4">
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 text-transparent bg-clip-text tracking-wider">
              心跳扫雷：高风险高回报
            </h1>
            <div className="h-6 mt-2 text-xs sm:text-sm text-yellow-400 font-medium animate-pulse">
                {gameState.actionMessage}
            </div>
        </div>

        {/* Score Board */}
        <div className="flex justify-between items-stretch mb-6 bg-gray-950 rounded-2xl p-2 border border-gray-800 relative overflow-hidden shadow-inner">
          
          <div className={`flex-1 flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-1 sm:space-y-0 sm:space-x-4 p-2 sm:p-4 rounded-xl transition-all duration-300 ${gameState.currentPlayer === 'human' && !gameState.gameOver ? 'bg-blue-900/40 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)] border border-blue-500/30' : 'opacity-60 grayscale-[30%]'}`}>
            <div className={`p-2 sm:p-3 rounded-xl transition-colors ${gameState.currentPlayer === 'human' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-gray-800 text-blue-500'}`}>
              <User className="w-5 h-5 sm:w-8 sm:h-8" />
            </div>
            <div className="text-center sm:text-left">
              <div className="text-[10px] sm:text-sm font-bold text-gray-500 uppercase tracking-wider">玩家</div>
              <div className="text-2xl sm:text-4xl font-black text-blue-400 leading-none">{gameState.humanScore}</div>
            </div>
            {gameState.currentPlayer === 'human' && !gameState.gameOver && (
                <div className="hidden sm:block ml-auto animate-bounce bg-blue-600 text-[10px] sm:text-xs px-2 py-1 rounded-md text-white font-bold shadow-lg uppercase tracking-wider">你的回合</div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center px-2 sm:px-6 z-10">
            <div className="text-gray-600 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">剩余地雷</div>
            <div className="bg-gray-900 px-3 py-1 sm:px-5 sm:py-2 rounded-xl border-2 border-gray-800 text-lg sm:text-2xl font-black font-mono text-gray-300 shadow-inner">
              {TOTAL_MINES - gameState.minesFound}
            </div>
          </div>

          <div className={`flex-1 flex flex-col-reverse sm:flex-row items-center justify-center sm:justify-end space-y-1 space-y-reverse sm:space-y-0 sm:space-x-4 p-2 sm:p-4 rounded-xl transition-all duration-300 ${gameState.currentPlayer === 'ai' && !gameState.gameOver ? 'bg-red-900/40 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)] border border-red-500/30' : 'opacity-60 grayscale-[30%]'}`}>
            {gameState.currentPlayer === 'ai' && !gameState.gameOver && (
                <div className="hidden sm:flex mr-auto animate-pulse bg-red-600 text-[10px] sm:text-xs px-2 py-1 rounded-md text-white font-bold items-center gap-1 shadow-lg uppercase tracking-wider">
                   <Cpu className="w-3 h-3"/> 思考中
                </div>
            )}
            <div className="text-center sm:text-right">
              <div className="text-[10px] sm:text-sm font-bold text-gray-500 uppercase tracking-wider">AI</div>
              <div className="text-2xl sm:text-4xl font-black text-red-400 leading-none">{gameState.aiScore}</div>
            </div>
            <div className={`p-2 sm:p-3 rounded-xl sm:ml-4 transition-colors ${gameState.currentPlayer === 'ai' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-gray-800 text-red-500'}`}>
              <Cpu className="w-5 h-5 sm:w-8 sm:h-8" />
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="flex justify-center mb-6">
          <div 
            className={`grid gap-[1px] sm:gap-[2px] bg-gray-800 border-[3px] sm:border-4 rounded-xl overflow-hidden transition-all duration-300 ${gameState.currentPlayer === 'human' && !gameState.gameOver ? 'border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'border-gray-700'}`}
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          >
            {gameState.board.map((row, r) => 
              row.map((cell, c) => {
                let cellContent = null;
                let cellClass = "w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-[17px] font-black transition-all duration-150 relative ";

                if (!cell.isRevealed) {
                  cellClass += "bg-gray-600 border border-t-gray-400 border-l-gray-400 border-b-gray-800 border-r-gray-800 ";
                  if (gameState.currentPlayer === 'human' && !gameState.gameOver) {
                      cellClass += "hover:bg-gray-500 active:bg-gray-700 cursor-pointer";
                  } else {
                      cellClass += "cursor-not-allowed";
                  }
                } else {
                  // 已揭开区域基础边框
                  cellClass += "border border-gray-800 ";

                  if (cell.isWrongFlag) {
                    // UX: 错误标记惩罚视觉
                    cellClass += "bg-red-900/80 animate-pulse ";
                    cellContent = (
                        <>
                           {cell.neighborMines > 0 && <span className="opacity-40">{cell.neighborMines}</span>}
                           <X className="absolute inset-0 w-full h-full text-red-400 drop-shadow-md p-0.5 sm:p-1" />
                        </>
                    );
                  } else if (cell.isFlagged) {
                    cellClass += cell.flagger === 'human' ? "bg-blue-900/60 " : "bg-red-900/60 ";
                    cellContent = <Flag className={`w-3 h-3 sm:w-4 sm:h-4 ${cell.flagger === 'human' ? 'text-blue-400 fill-blue-500' : 'text-red-400 fill-red-500'} drop-shadow-md`} />;
                  } else if (cell.isExploded) {
                    cellClass += "bg-red-600 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] ";
                    cellContent = <Bomb className="w-3 h-3 sm:w-5 sm:h-5 text-gray-950" />;
                  } else {
                    cellClass += "bg-gray-900 ";
                    if (cell.neighborMines > 0) {
                      cellContent = <span className={`${getNumberColor(cell.neighborMines)} drop-shadow-sm`}>{cell.neighborMines}</span>;
                    }
                  }
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    className={cellClass}
                    onPointerDown={(e) => handlePointerDown(e, r, c)}
                    onPointerUp={(e) => handlePointerUp(e, r, c)}
                    onPointerLeave={handlePointerLeave}
                    onContextMenu={(e) => {
                      if (e.pointerType !== 'touch') {
                          handleAction(r, c, true);
                      }
                    }}
                  >
                    {cellContent}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Game Over Banner */}
        {gameState.gameOver && (
          <div className="mb-6 p-4 sm:p-6 rounded-2xl text-center shadow-2xl flex flex-col items-center justify-center space-y-2 sm:space-y-3 bg-gray-900 border border-gray-700 animate-in fade-in slide-in-from-bottom-4">
            <Trophy className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-500 mb-1 sm:mb-2 drop-shadow-lg" />
            <h2 className="text-xl sm:text-3xl font-black tracking-wide">
                {gameState.humanScore > gameState.aiScore && <span className="text-blue-400 drop-shadow-md">玩家大获全胜！</span>}
                {gameState.aiScore > gameState.humanScore && <span className="text-red-400 drop-shadow-md">AI 取得胜利！</span>}
                {gameState.aiScore === gameState.humanScore && <span className="text-gray-400 drop-shadow-md">势均力敌的平局！</span>}
            </h2>
            <p className="text-sm sm:text-base text-gray-500 font-bold bg-gray-950 px-4 py-2 rounded-lg mt-2 border border-gray-800">
                最终比分 — 玩家: <span className="text-blue-400">{gameState.humanScore}</span> | AI: <span className="text-red-400">{gameState.aiScore}</span>
            </p>
          </div>
        )}

        {/* Controls & Instructions */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch bg-gray-950 p-4 sm:p-5 rounded-2xl border border-gray-800 gap-4 sm:gap-6">
          <button
            onClick={initGame}
            className="group flex items-center space-x-2 sm:space-x-3 px-6 sm:px-8 py-3 sm:py-4 bg-gray-800 hover:bg-gray-700 active:bg-gray-900 text-gray-200 rounded-xl font-bold transition-all border border-gray-700 hover:border-gray-500 w-full lg:w-auto justify-center whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-rotate-180 transition-transform duration-500 text-teal-400" />
            <span className="text-base sm:text-lg">重新开始</span>
          </button>

          <div className="text-[11px] sm:text-xs text-gray-400 flex flex-col gap-1 sm:gap-2 w-full bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-800">
            <div className="flex items-center space-x-2 text-yellow-500 font-bold mb-1 border-b border-gray-800 pb-2 uppercase tracking-widest">
              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>刺激计分版规则</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                <div className="flex items-start space-x-2">
                    <span className="bg-gray-800 text-green-400 px-1.5 py-0.5 rounded text-[10px] font-bold">高收益</span>
                    <span>翻开安全区，<strong className="text-gray-200">数字是几就得几分</strong>并连击！</span>
                </div>
                <div className="flex items-start space-x-2">
                    <span className="bg-gray-800 text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-bold">高回报</span>
                    <span>准确标记红旗，<strong className="text-gray-200">一口气得 {SCORE_FLAG_CORRECT} 分</strong>，回合结束。</span>
                </div>
                <div className="flex items-start space-x-2">
                    <span className="bg-gray-800 text-red-500 px-1.5 py-0.5 rounded text-[10px] font-bold">高风险</span>
                    <span>标错红旗，格子会被盖上红叉并<strong className="text-red-400">狂扣 {Math.abs(SCORE_FLAG_WRONG)} 分</strong>，回合结束！</span>
                </div>
                <div className="flex items-start space-x-2">
                    <span className="bg-gray-800 text-red-500 px-1.5 py-0.5 rounded text-[10px] font-bold">踩雷罚</span>
                    <span>不小心踩到地雷，<strong className="text-red-400">扣 {Math.abs(SCORE_MINE_EXPLODED)} 分</strong>，回合结束！</span>
                </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}