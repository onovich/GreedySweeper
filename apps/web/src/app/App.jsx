import { useGameController } from '../application/useGameController';
import { createBrowserHistoryStorage } from '../application/storage/history-storage';
import { createBrowserProgressionStorage } from '../application/storage/progression-storage';
import { GameScreen } from '../ui/screens/GameScreen';
import { useOnlineRoomController } from '../application/online/useOnlineRoomController';
import { OnlineRoomPanel } from '../ui/components/OnlineRoomPanel';

export function App() {
  const controller = useGameController({
    historyStorage: createBrowserHistoryStorage(),
    progressionStorage: createBrowserProgressionStorage(),
  });
  const online = useOnlineRoomController();

  return (
    <>
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
        progression={controller.progression}
      />
      <OnlineRoomPanel online={online} />
    </>
  );
}
