import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { selectAiAction } from '../game/ai/select-action';
import {
  AI_POLICY_ERROR_CODES,
  DEFAULT_AI_POLICY,
  createAiPolicy,
  validateAiPolicy,
} from '../game/ai/policy-config';
import { createChallengeBoard } from '../game/challenge/board';
import { decodeChallengeCode } from '../game/challenge/code';
import { createDailyChallenge } from '../game/challenge/daily';
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
import { createReplaySummary } from '../game/replay/integrity';
import { replayGameAt } from '../game/replay/replay-engine';
import { createHistoryEntry } from './storage/history-storage';

function createRandomSession(config, random, aiPolicy = DEFAULT_AI_POLICY) {
  return {
    gameState: createInitialState(createBoard(config, random)),
    descriptor: null,
    actions: [],
    aiPolicy,
  };
}

function createChallengeSession(descriptor, aiPolicy = DEFAULT_AI_POLICY) {
  const boardResult = createChallengeBoard(descriptor);
  if (!boardResult.ok) return boardResult;

  return {
    ok: true,
    value: {
      gameState: createInitialState(boardResult.value.board),
      descriptor: boardResult.value.descriptor,
      actions: [],
      aiPolicy,
    },
  };
}

export function useGameController({
  config = BOARD_CONFIG,
  scoreConfig = SCORE_CONFIG,
  timing = TIMING_CONFIG,
  random = Math.random,
  historyStorage = null,
  now = () => new Date(),
} = {}) {
  const [session, setSession] = useState(() => createRandomSession(config, random));
  const [pendingAiPolicy, setPendingAiPolicy] = useState(DEFAULT_AI_POLICY);
  const [challengeError, setChallengeError] = useState(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const [replayPosition, setReplayPosition] = useState(0);
  const [historyEntries] = useState(() => {
    const result = historyStorage?.load?.();
    return result?.ok ? result.value : [];
  });
  const stateRef = useRef(session);
  const savedHistoryRef = useRef(null);

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
      if (current.descriptor)
        return createChallengeSession(current.descriptor, pendingAiPolicy).value;
      return createRandomSession(config, random, pendingAiPolicy);
    });
  }, [config, pendingAiPolicy, random]);

  const startChallenge = useCallback(
    (code) => {
      const decoded = decodeChallengeCode(code);
      if (!decoded.ok) {
        setChallengeError(decoded.error);
        return decoded;
      }

      const nextSession = createChallengeSession(decoded.value, pendingAiPolicy);
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
    },
    [pendingAiPolicy],
  );

  const startDailyChallenge = useCallback(() => {
    const descriptor = createDailyChallenge(now());
    const nextSession = descriptor && createChallengeSession(descriptor, DEFAULT_AI_POLICY);
    if (!nextSession?.ok) return nextSession;

    setSession(nextSession.value);
    setChallengeError(null);
    setIsReplaying(false);
    setIsReplayPlaying(false);
    setReplayPosition(0);
    return { ok: true, value: nextSession.value.descriptor };
  }, [now]);

  const setAiPolicy = useCallback(
    (policy) => {
      const validation = validateAiPolicy(createAiPolicy(policy));
      if (!validation.ok) return validation;
      if (session.actions.length > 0)
        return { ok: false, error: { code: AI_POLICY_ERROR_CODES.locked } };
      setPendingAiPolicy(validation.value);
      setSession((current) => ({ ...current, aiPolicy: validation.value }));
      return validation;
    },
    [session.actions.length],
  );

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
        const action = selectAiAction(current.gameState, activeConfig, random, current.aiPolicy);
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

  useEffect(() => {
    if (
      !historyStorage ||
      !session.descriptor ||
      !session.gameState.gameOver ||
      !session.actions.length
    ) {
      return;
    }

    const summary = createReplaySummary({
      descriptor: session.descriptor,
      state: session.gameState,
      actionCount: session.actions.length,
    });
    if (savedHistoryRef.current === summary.hash) return;

    const saved = historyStorage.save(
      createHistoryEntry({
        id: summary.hash,
        replay: {
          descriptor: session.descriptor,
          actions: session.actions,
          expectedSummary: summary,
        },
        savedAt: now().toISOString(),
      }),
    );
    if (saved.ok) {
      savedHistoryRef.current = summary.hash;
    }
  }, [historyStorage, now, session]);

  return {
    gameState,
    isAiThinking:
      !isReplaying && !session.gameState.gameOver && session.gameState.currentPlayer === PLAYERS.ai,
    reveal,
    flag,
    restart,
    startChallenge,
    startDailyChallenge,
    challengeError,
    challengeDescriptor: session.descriptor,
    actionLog: session.actions,
    aiPolicy: session.aiPolicy,
    isAiPolicyLocked: session.actions.length > 0,
    setAiPolicy,
    historyEntries,
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
