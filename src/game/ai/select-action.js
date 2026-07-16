import { BOARD_CONFIG } from '../config/game-config';
import { PLAYERS, createRevealAction } from '../model/contracts';
import { getHiddenCandidates, selectCertainAction } from './candidates';
import { createAiPublicView } from './public-view';

export function selectAiAction(state, config = BOARD_CONFIG, random = Math.random) {
  const publicView = createAiPublicView(state, config);
  const certainAction = selectCertainAction(publicView);
  if (certainAction) return certainAction;

  const hidden = getHiddenCandidates(publicView);

  if (hidden.length === 0) return null;
  const choice = hidden[Math.floor(random() * hidden.length)];
  return createRevealAction(choice.row, choice.column, PLAYERS.ai);
}
