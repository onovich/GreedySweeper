import { useMemo, useState } from 'react';
import { useGameController } from '../application/useGameController';
import { createBrowserHistoryStorage } from '../application/storage/history-storage';
import { createBrowserProgressionStorage } from '../application/storage/progression-storage';
import { useOnlineRoomController } from '../application/online/useOnlineRoomController';
import {
  createLocalGameUiViewModel,
  createLocalIntentBridge,
} from '../application/presentation/local-game-ui-adapter';
import {
  createOnlineGameUiViewModel,
  createOnlineIntentBridge,
} from '../application/presentation/online-game-ui-adapter';
import { LunarComposition } from './LunarComposition';

export function App() {
  const controller = useGameController({
    historyStorage: createBrowserHistoryStorage(),
    progressionStorage: createBrowserProgressionStorage(),
  });
  const online = useOnlineRoomController({
    onVerifiedResult: controller.registerVerifiedOnlineFact,
  });
  const [activeTab, setActiveTab] = useState('challenge');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const localViewModel = createLocalGameUiViewModel(controller);
  const onlineViewModel = createOnlineGameUiViewModel(online);
  const onlineSessionActive = Boolean(
    online.room || online.snapshot || !['idle', 'unavailable', 'error'].includes(online.status),
  );
  const baseViewModel = onlineSessionActive ? onlineViewModel : localViewModel;
  const forcedDrawer = baseViewModel.utilities.drawerOpen;
  const viewModel = {
    ...baseViewModel,
    utilities: {
      ...baseViewModel.utilities,
      activeTab: forcedDrawer ? baseViewModel.utilities.activeTab : activeTab,
      drawerOpen: drawerOpen || forcedDrawer,
    },
    connection: onlineViewModel.connection,
  };
  const bridge = useMemo(() => {
    const localBridge = createLocalIntentBridge(controller);
    const onlineBridge = createOnlineIntentBridge(online);
    return {
      onCellIntent: onlineSessionActive ? onlineBridge.onCellIntent : localBridge.onCellIntent,
      onBankIntent: onlineSessionActive ? onlineBridge.onBankIntent : localBridge.onBankIntent,
      onIntent(intent) {
        if (intent.kind === 'utility') {
          setActiveTab(intent.tab);
          setDrawerOpen((open) => (activeTab === intent.tab ? !open : true));
          return;
        }
        if (intent.kind === 'room') {
          setActiveTab('room');
          setDrawerOpen(true);
          onlineBridge.onIntent(intent);
          return;
        }
        if (!onlineSessionActive) localBridge.onIntent(intent);
      },
    };
  }, [activeTab, controller, online, onlineSessionActive]);

  return <LunarComposition viewModel={viewModel} bridge={bridge} />;
}
