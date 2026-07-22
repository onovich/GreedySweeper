import {
  createLocalGameUiViewModel,
  createLocalIntentBridge,
} from '../application/presentation/local-game-ui-adapter';
import { AppShell } from '../ui/lunar/AppShell';
import { GameBoard } from '../ui/lunar/GameBoard';
import { GreedPanel } from '../ui/lunar/GreedPanel';
import { UtilityDrawer } from '../ui/lunar/UtilityDrawer';

export function LocalLunarComposition({ controller, config }) {
  const viewModel = createLocalGameUiViewModel(controller, { config });
  const bridge = createLocalIntentBridge(controller);
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
