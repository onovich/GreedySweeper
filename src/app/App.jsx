import { useGameController } from '../application/useGameController';
import { GameScreen } from '../ui/screens/GameScreen';

export function App() {
  const controller = useGameController();

  return (
    <GameScreen
      gameState={controller.gameState}
      isAiThinking={controller.isAiThinking}
      onReveal={controller.reveal}
      onFlag={controller.flag}
      onRestart={controller.restart}
      onStartChallenge={controller.startChallenge}
      challengeError={controller.challengeError}
      replay={controller.replay}
    />
  );
}
