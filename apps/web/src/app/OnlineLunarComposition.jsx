import {
  createOnlineGameUiViewModel,
  createOnlineIntentBridge,
} from '../application/presentation/online-game-ui-adapter';
import { LunarComposition } from './LunarComposition';

export function OnlineLunarComposition({ online }) {
  const viewModel = createOnlineGameUiViewModel(online);
  const bridge = createOnlineIntentBridge(online);
  return <LunarComposition viewModel={viewModel} bridge={bridge} />;
}
