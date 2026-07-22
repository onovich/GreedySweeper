import {
  createLocalGameUiViewModel,
  createLocalIntentBridge,
} from '../application/presentation/local-game-ui-adapter';
import { LunarComposition } from './LunarComposition';

export function LocalLunarComposition({ controller, config }) {
  const viewModel = createLocalGameUiViewModel(controller, { config });
  const bridge = createLocalIntentBridge(controller);
  return <LunarComposition viewModel={viewModel} bridge={bridge} />;
}
