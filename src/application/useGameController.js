import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { selectAiAction } from '../game/ai/select-action';
import { createChallengeBoard } from '../game/challenge/board';
import { decodeChallengeCode } from '../game/challenge/code';
import { BOARD_CONFIG, SCORE_CONFIG, TIMING_CONFIG } from '../game/config/game-config';
import { createBoard } from '../game/engine/board';
import { applyAction } from '../game/engine/transition';
import {
  PLAYERS,
  RESULT_TYPES,
  createFlagAction,
  createRevealAction,
} from '../game/model/contracts';
import { createInitialState } from '../game/model/factories';
import { appendActionRecord } from '../game/replay/action-log';
import { replayGameAt } from '../game/replay/replay-engine';

function createRandomSession(config, random) {
  return {
    gameState: createInitialState(createBoard(config, random)),
    descriptor: null,
    actions: [],
  };
}

function createChallengeSession(descriptor) {
  const boardResult = createChallengeBoard(descriptor);
  if (!boardResult.ok) return boardResult;

  return {
    ok: true,
    value: {
      gameState: createInitialState(boardResult.value.board),
      descriptor: boardResult.value.descriptor,
      actions: [],
    },
  };
}

export function useGameController({
  config = BOARD_CONFIG,
  scoreConfig = SCORE_CONFIG,
  timing = TIMING_CONFIG,
  random = Math.random,
} = {}) {
  const [session, setSession] = useState(() => createRandomSession(config, random));
  const [challengeError, setChallengeError] = useState(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const [replayPosition, setReplayPosition] = useState(0);
  const stateRef = useRef(session);

  const replayResult = useMemo(() => {
    if (!isReplaying || !session.descriptor) return null;
    return replayGameAt(
      { descriptor: session.descriptor, actions: session.actions },
      replayPosition,
    );
  }, [isReplaying, replayPosition, session.actions, session.descriptor]);
  const gameState = replayResult?.ok ? replayResult.value.state : session.gameState;

  useEffect(() => {
    stateRef.current = session;
  }, [session]);

  const dispatch = useCallback(
    (action) => {
      if (isReplaying) return;

      setSession((current) => {
        const activeConfig = current.descriptor?.board ?? config;
        const transition = applyAction(current.gameState, action, activeConfig, scoreConfig);
        if (transition.result.type !== RESULT_TYPES.applied) return current;

        const appended = appendActionRecord(current.actions, action);
        return appended.ok
          ? { ...current, gameState: transition.state, actions: appended.value }
          : { ...current, gameState: transition.state };
      });
    },
    [config, isReplaying, scoreConfig],
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
    setIsReplaying(false);
    setIsReplayPlaying(false);
    setReplayPosition(0);
    setChallengeError(null);
    setSession((current) => {
      if (current.descriptor) return createChallengeSession(current.descriptor).value;
      return createRandomSession(config, random);
    });
  }, [config, random]);

  const startChallenge = useCallback((code) => {
    const decoded = decodeChallengeCode(code);
    if (!decoded.ok) {
      setChallengeError(decoded.error);
      return decoded;
    }

    const nextSession = createChallengeSession(decoded.value);
    if (!nextSession.ok) {
      setChallengeError(nextSession.error);
      return nextSession;
    }

    setSession(nextSession.value);
    setChallengeError(null);
    setIsReplaying(false);
    setIsReplayPlaying(false);
    setReplayPosition(0);
    return decoded;
  }, []);

  const startReplay = useCallback(() => {
    if (!session.descriptor || session.actions.length === 0) return;
    setReplayPosition(0);
    setIsReplayPlaying(false);
    setIsReplaying(true);
  }, [session.actions.length, session.descriptor]);

  const stepReplay = useCallback(() => {
    setIsReplayPlaying(false);
    setReplayPosition((position) => Math.min(position + 1, session.actions.length));
  }, [session.actions.length]);

  const resetReplay = useCallback(() => {
    setIsReplayPlaying(false);
    setReplayPosition(0);
  }, []);

  const exitReplay = useCallback(() => {
    setIsReplayPlaying(false);
    setIsReplaying(false);
    setReplayPosition(0);
  }, []);

  useEffect(() => {
    if (
      isReplaying ||
      session.gameState.gameOver ||
      session.gameState.currentPlayer !== PLAYERS.ai ||
      session.gameState.board.length === 0
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSession((current) => {
        if (
          current !== stateRef.current ||
          current.gameState.gameOver ||
          current.gameState.currentPlayer !== PLAYERS.ai
        ) {
          return current;
        }

        const activeConfig = current.descriptor?.board ?? config;
        const action = selectAiAction(current.gameState, activeConfig, random);
        if (!action) return current;

        const transition = applyAction(current.gameState, action, activeConfig, scoreConfig);
        if (transition.result.type !== RESULT_TYPES.applied) return current;
        const appended = appendActionRecord(current.actions, action);
        return appended.ok
          ? { ...current, gameState: transition.state, actions: appended.value }
          : { ...current, gameState: transition.state };
      });
    }, timing.aiDelayMs);

    return () => window.clearTimeout(timeoutId);
  }, [config, isReplaying, random, scoreConfig, session.gameState, timing.aiDelayMs]);

  useEffect(() => {
    if (!isReplaying || !isReplayPlaying || replayPosition >= session.actions.length) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setReplayPosition((position) => {
        const nextPosition = Math.min(position + 1, session.actions.length);
        if (nextPosition === session.actions.length) setIsReplayPlaying(false);
        return nextPosition;
      });
    }, timing.replayDelayMs ?? 600);

    return () => window.clearTimeout(timeoutId);
  }, [isReplaying, isReplayPlaying, replayPosition, session.actions.length, timing.replayDelayMs]);

  return {
    gameState,
    isAiThinking:
      !isReplaying && !session.gameState.gameOver && session.gameState.currentPlayer === PLAYERS.ai,
    reveal,
    flag,
    restart,
    startChallenge,
    challengeError,
    challengeDescriptor: session.descriptor,
    actionLog: session.actions,
    replay: {
      isAvailable: Boolean(session.descriptor && session.actions.length),
      isReplaying,
      isPlaying: isReplayPlaying,
      position: replayPosition,
      total: session.actions.length,
      start: startReplay,
      togglePlay: () => setIsReplayPlaying((playing) => !playing),
      step: stepReplay,
      reset: resetReplay,
      exit: exitReplay,
    },
  };
}
