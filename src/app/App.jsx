import { useGameController } from '../application/useGameController';
import { createBrowserHistoryStorage } from '../application/storage/history-storage';
import { GameScreen } from '../ui/screens/GameScreen';

export function App() {
  const controller = useGameController({ historyStorage: createBrowserHistoryStorage() });

  return (
    <GameScreen
      gameState={controller.gameState}
      isAiThinking={controller.isAiThinking}
      onReveal={controller.reveal}
      onFlag={controller.flag}
      onBank={controller.bank}
      onRestart={controller.restart}
      onStartChallenge={controller.startChallenge}
      onStartDailyChallenge={controller.startDailyChallenge}
      challengeError={controller.challengeError}
      challengeDescriptor={controller.challengeDescriptor}
      actionLog={controller.actionLog}
      historyEntries={controller.historyEntries}
      aiPolicy={controller.aiPolicy}
      isAiPolicyLocked={controller.isAiPolicyLocked}
      onAiPolicyChange={controller.setAiPolicy}
      mode={controller.mode}
      isModeLocked={controller.isModeLocked}
      onModeChange={controller.setMode}
      replay={controller.replay}
    />
  );
}
