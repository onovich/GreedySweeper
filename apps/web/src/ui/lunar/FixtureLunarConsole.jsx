import { useState } from 'react';
import { AppShell } from './AppShell';
import { GameBoard } from './GameBoard';
import { GreedPanel } from './GreedPanel';
import { UtilityDrawer } from './UtilityDrawer';

export function FixtureLunarConsole({ viewModel }) {
  const [lastIntent, setLastIntent] = useState('none');
  return (
    <>
      <output className="gs-visually-hidden" data-last-intent={lastIntent}>
        {lastIntent}
      </output>
      <AppShell
        viewModel={viewModel}
        board={
          <GameBoard
            board={viewModel.board}
            onCellIntent={(intent) => setLastIntent(intent.kind)}
          />
        }
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
    </>
  );
}
