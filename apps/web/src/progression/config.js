export const PROGRESSION_VERSION = '1';
export const FACTS_VERSION = '1';
export const ACHIEVEMENT_VERSION = '1';
export const MAX_RETAINED_FACTS = 1000;

export const ACHIEVEMENTS = Object.freeze(
  [
    ['first_game', 'First game', (s) => s.completedGames >= 1],
    ['first_win', 'First win', (s) => s.wins >= 1],
    ['clean_win', 'Clean win', (s) => s.cleanWins >= 1],
    ['banker_10', 'Banker 10', (s) => s.maxBankedPot >= 10],
    ['banker_25', 'Banker 25', (s) => s.maxBankedPot >= 25],
    ['burned_by_greed', 'Burned by greed', (s) => s.maxLostPot >= 20],
    ['daily_challenger', 'Daily challenger', (s) => s.dailyGames >= 1],
    [
      'versatile_miner',
      'Versatile miner',
      (s) => ['easy', 'normal', 'hard'].every((x) => s.difficulties[x]?.games > 0),
    ],
    [
      'style_master',
      'Style master',
      (s) => ['balanced', 'conservative', 'greedy'].every((x) => s.styles[x]?.games > 0),
    ],
    ['veteran_25', 'Veteran 25', (s) => s.completedGames >= 25],
  ].map(([id, title, when]) =>
    Object.freeze({ id, title, when, achievementVersion: ACHIEVEMENT_VERSION }),
  ),
);
