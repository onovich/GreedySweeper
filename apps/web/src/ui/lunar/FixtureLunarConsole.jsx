import { AppShell } from './AppShell';
import { GameBoard } from './GameBoard';
import { GreedPanel } from './GreedPanel';
import { UtilityDrawer } from './UtilityDrawer';

export function FixtureLunarConsole({ viewModel }) {
  return (
    <AppShell
      viewModel={viewModel}
      board={<GameBoard board={viewModel.board} />}
      greed={
        <GreedPanel
          greed={viewModel.greed}
          effects={viewModel.effects}
          effectProgress={viewModel.fixture.effectProgress}
        />
      }
      utilityDrawer={
        viewModel.utilities.drawerOpen ? <UtilityDrawer viewModel={viewModel} /> : null
      }
    />
  );
}
