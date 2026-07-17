import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { selectAiAction } from '@greedy-sweeper/game-core/ai/select-action';
import {
  AI_POLICY_ERROR_CODES,
  DEFAULT_AI_POLICY,
  createAiPolicy,
  validateAiPolicy,
} from '@greedy-sweeper/game-core/ai/policy-config';
import { createChallengeBoard } from '@greedy-sweeper/game-core/challenge/board';
import { decodeChallengeCode } from '@greedy-sweeper/game-core/challenge/code';
import { createDailyChallenge } from '@greedy-sweeper/game-core/challenge/daily';
import { createChallengeDescriptor } from '@greedy-sweeper/game-core/challenge/contracts';
import {
  BOARD_CONFIG,
  SCORE_CONFIG,
  TIMING_CONFIG,
} from '@greedy-sweeper/game-core/config/game-config';
import {
  DEFAULT_NEW_GAME_MODE,
  GREED_CHALLENGE_MODE,
} from '@greedy-sweeper/game-core/config/protocol-config';
import { applyAction } from '@greedy-sweeper/game-core/engine/transition';
import {
  PLAYERS,
  RESULT_TYPES,
  createBankAction,
  createFlagAction,
  createRevealAction,
} from '@greedy-sweeper/game-core/model/contracts';
import {
  createGreedInitialState,
  createInitialState,
} from '@greedy-sweeper/game-core/model/factories';
import { appendActionRecord } from '@greedy-sweeper/game-core/replay/action-log';
import { createReplaySummary } from '@greedy-sweeper/game-core/replay/integrity';
import { replayGameAt } from '@greedy-sweeper/game-core/replay/replay-engine';
import { createHistoryEntry } from './storage/history-storage';
import { deriveCompletedGameFacts } from '../progression/derive-game-facts';
import { appendCompletedFacts, createProfile, getProfileStats } from '../progression/profile';

function createRandomSession(
  config,
  random,
  aiPolicy = DEFAULT_AI_POLICY,
  mode = DEFAULT_NEW_GAME_MODE,
) {
  const descriptor = createChallengeDescriptor({
    seed: Math.floor(random() * 4294967295),
    board: config,
    mode: mode === GREED_CHALLENGE_MODE ? 'greed' : 'standard',
    rulesVersion: mode === GREED_CHALLENGE_MODE ? '2' : '1',
  });
  return { ...createChallengeSession(descriptor, aiPolicy).value, sessionSource: 'random' };
}

function createChallengeSession(descriptor, aiPolicy = DEFAULT_AI_POLICY) {
  const boardResult = createChallengeBoard(descriptor);
  if (!boardResult.ok) return boardResult;

  return {
    ok: true,
    value: {
      gameState:
        descriptor.rulesVersion === '2'
          ? createGreedInitialState(boardResult.value.board)
          : createInitialState(boardResult.value.board),
      descriptor: boardResult.value.descriptor,
      actions: [],
      aiPolicy,
      sessionSource: 'challenge',
    },
  };
}

export function useGameController({
  config = BOARD_CONFIG,
  scoreConfig = SCORE_CONFIG,
  timing = TIMING_CONFIG,
  random = Math.random,
  historyStorage = null,
  progressionStorage = null,
  now = () => new Date(),
} = {}) {
  const [session, setSession] = useState(() => createRandomSession(config, random));
  const [pendingAiPolicy, setPendingAiPolicy] = useState(DEFAULT_AI_POLICY);
  const [pendingMode, setPendingMode] = useState(DEFAULT_NEW_GAME_MODE);
  const [challengeError, setChallengeError] = useState(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const [replayPosition, setReplayPosition] = useState(0);
  const [historyEntries] = useState(() => {
    const result = historyStorage?.load?.();
    return result?.ok ? result.value : [];
  });
  const [progressionProfile, setProgressionProfile] = useState(() => {
    const loaded = progressionStorage?.load?.();
    return loaded?.ok ? loaded.value : createProfile();
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
        const rules = current.descriptor ?? {
          rulesVersion: current.gameState.rulesVersion ?? '1',
          mode: current.gameState.mode ?? 'standard',
        };
        const transition = applyAction(current.gameState, action, activeConfig, scoreConfig, rules);
        if (transition.result.type !== RESULT_TYPES.applied) return current;

        const appended = appendActionRecord(current.actions, action, rules);
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

  const bank = useCallback(() => dispatch(createBankAction(PLAYERS.human)), [dispatch]);

  const restart = useCallback(() => {
    setIsReplaying(false);
    setIsReplayPlaying(false);
    setReplayPosition(0);
    setChallengeError(null);
    setSession((current) => {
      if (current.descriptor)
        return createChallengeSession(current.descriptor, pendingAiPolicy).value;
      return createRandomSession(config, random, pendingAiPolicy, pendingMode);
    });
  }, [config, pendingAiPolicy, pendingMode, random]);

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
    const descriptor = createDailyChallenge(now(), config);
    const nextSession = descriptor && createChallengeSession(descriptor, DEFAULT_AI_POLICY);
    if (!nextSession?.ok) return nextSession;

    setSession({ ...nextSession.value, sessionSource: 'daily' });
    setChallengeError(null);
    setIsReplaying(false);
    setIsReplayPlaying(false);
    setReplayPosition(0);
    return { ok: true, value: nextSession.value.descriptor };
  }, [config, now]);

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

  const setMode = useCallback(
    (mode) => {
      if (session.actions.length > 0 || !['standard', GREED_CHALLENGE_MODE].includes(mode)) {
        return { ok: false, error: { code: 'game_mode_locked' } };
      }
      setPendingMode(mode);
      setSession((current) => createRandomSession(config, random, current.aiPolicy, mode));
      return { ok: true, value: mode };
    },
    [config, random, session.actions.length],
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
  const resetProgression = useCallback(
    (confirmed) => {
      if (!confirmed)
        return { ok: false, error: { code: 'progression_reset_confirmation_required' } };
      const reset = progressionStorage?.reset?.();
      if (!reset?.ok)
        return reset ?? { ok: false, error: { code: 'progression_storage_unavailable' } };
      setProgressionProfile(reset.value);
      return reset;
    },
    [progressionStorage],
  );

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

        const rules = current.descriptor ?? {
          rulesVersion: current.gameState.rulesVersion ?? '1',
          mode: current.gameState.mode ?? 'standard',
        };
        const transition = applyAction(current.gameState, action, activeConfig, scoreConfig, rules);
        if (transition.result.type !== RESULT_TYPES.applied) return current;
        const appended = appendActionRecord(current.actions, action, rules);
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
          aiPolicy: session.aiPolicy,
        },
        savedAt: now().toISOString(),
      }),
    );
    if (saved.ok) {
      savedHistoryRef.current = summary.hash;
    }
  }, [historyStorage, now, session]);

  useEffect(() => {
    if (
      !progressionStorage ||
      !session.descriptor ||
      !session.gameState.gameOver ||
      !session.actions.length
    )
      return;
    const replay = {
      descriptor: session.descriptor,
      actions: session.actions,
      aiPolicy: session.aiPolicy,
    };
    const facts = deriveCompletedGameFacts(replay, {
      completedAt: now().toISOString(),
      sessionSource: session.sessionSource ?? 'unknown',
    });
    if (!facts.ok) return;
    // This is a one-time synchronization from a completed, verified replay into local storage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgressionProfile((current) => {
      const appended = appendCompletedFacts(current, facts.value);
      if (appended.added) progressionStorage.save(appended.profile);
      return appended.profile;
    });
  }, [now, progressionStorage, session]);

  return {
    gameState,
    isAiThinking:
      !isReplaying && !session.gameState.gameOver && session.gameState.currentPlayer === PLAYERS.ai,
    reveal,
    flag,
    bank,
    restart,
    startChallenge,
    startDailyChallenge,
    challengeError,
    challengeDescriptor: session.descriptor,
    actionLog: session.actions,
    aiPolicy: session.aiPolicy,
    isAiPolicyLocked: session.actions.length > 0,
    setAiPolicy,
    mode: session.gameState.mode ?? 'standard',
    isModeLocked: session.actions.length > 0,
    setMode,
    historyEntries,
    progression: {
      stats: getProfileStats(progressionProfile),
      unlocks: progressionProfile.unlocks,
      reset: resetProgression,
    },
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
      aiPolicy: session.aiPolicy,
    },
  };
}
