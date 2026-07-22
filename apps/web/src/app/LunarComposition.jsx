import { AppShell } from '../ui/lunar/AppShell';
import { GameBoard } from '../ui/lunar/GameBoard';
import { GreedPanel } from '../ui/lunar/GreedPanel';
import { UtilityDrawer } from '../ui/lunar/UtilityDrawer';

export function LunarComposition({ viewModel, bridge }) {
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
