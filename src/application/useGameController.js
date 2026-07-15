import { useCallback, useEffect, useRef, useState } from 'react';
import { selectAiAction } from '../game/ai/select-action';
import { BOARD_CONFIG, SCORE_CONFIG, TIMING_CONFIG } from '../game/config/game-config';
import { createBoard } from '../game/engine/board';
import { applyAction } from '../game/engine/transition';
import { PLAYERS, createFlagAction, createRevealAction } from '../game/model/contracts';
import { createInitialState } from '../game/model/factories';

function createNewGame(config, random) {
  return createInitialState(createBoard(config, random));
}

export function useGameController({
  config = BOARD_CONFIG,
  scoreConfig = SCORE_CONFIG,
  timing = TIMING_CONFIG,
  random = Math.random,
} = {}) {
  const [gameState, setGameState] = useState(() => createNewGame(config, random));
  const stateRef = useRef(gameState);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  const dispatch = useCallback(
    (action) => {
      setGameState((current) => applyAction(current, action, config, scoreConfig).state);
    },
    [config, scoreConfig],
  );

  const reveal = useCallback(
    (row, column) => dispatch(createRevealAction(row, column, PLAYERS.human)),
    [dispatch],
  );

  const flag = useCallback(
    (row, column) => dispatch(createFlagAction(row, column, PLAYERS.human)),
    [dispatch],
  );

  const restart = useCallback(() => {
    setGameState(createNewGame(config, random));
  }, [config, random]);

  useEffect(() => {
    if (
      gameState.gameOver ||
      gameState.currentPlayer !== PLAYERS.ai ||
      gameState.board.length === 0
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setGameState((current) => {
        if (
          current !== stateRef.current ||
          current.gameOver ||
          current.currentPlayer !== PLAYERS.ai
        ) {
          return current;
        }

        const action = selectAiAction(current, config, random);
        return action ? applyAction(current, action, config, scoreConfig).state : current;
      });
    }, timing.aiDelayMs);

    return () => window.clearTimeout(timeoutId);
  }, [config, gameState, random, scoreConfig, timing.aiDelayMs]);

  return {
    gameState,
    isAiThinking: !gameState.gameOver && gameState.currentPlayer === PLAYERS.ai,
    reveal,
    flag,
    restart,
  };
}
