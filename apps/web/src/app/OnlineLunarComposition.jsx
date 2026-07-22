import {
  createOnlineGameUiViewModel,
  createOnlineIntentBridge,
} from '../application/presentation/online-game-ui-adapter';
import { AppShell } from '../ui/lunar/AppShell';
import { GameBoard } from '../ui/lunar/GameBoard';
import { GreedPanel } from '../ui/lunar/GreedPanel';
import { UtilityDrawer } from '../ui/lunar/UtilityDrawer';

export function OnlineLunarComposition({ online }) {
  const viewModel = createOnlineGameUiViewModel(online);
  const bridge = createOnlineIntentBridge(online);
  return (
    <AppShell
      viewModel={viewModel}
      onIntent={bridge.onIntent}
      board={<GameBoard board={viewModel.board} onCellIntent={bridge.onCellIntent} />}
      greed={
        <GreedPanel
          greed={viewModel.greed}
          effects={viewModel.effects}
          onBankIntent={bridge.onBankIntent}
        />
      }
      utilityDrawer={
        viewModel.utilities.drawerOpen ? (
          <UtilityDrawer viewModel={viewModel} onIntent={bridge.onIntent} />
        ) : null
      }
    />
  );
}
