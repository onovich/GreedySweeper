export function createEmptyStats() {
  return {
    completedGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    humanScore: 0,
    maxHumanScore: 0,
    maxWinMargin: 0,
    correctFlags: 0,
    wrongFlags: 0,
    explosions: 0,
    banks: 0,
    maxStreak: 0,
    maxBankedPot: 0,
    maxLostPot: 0,
    cleanWins: 0,
    dailyGames: 0,
    modes: {},
    difficulties: {},
    styles: {},
  };
}

export function reduceStats(base = createEmptyStats(), facts = []) {
  return facts.reduce(
    (stats, fact) => {
      const next = {
        ...stats,
        modes: { ...stats.modes },
        difficulties: { ...stats.difficulties },
        styles: { ...stats.styles },
      };
      next.completedGames += 1;
      next.wins += fact.winner === 'human' ? 1 : 0;
      next.losses += fact.winner === 'ai' ? 1 : 0;
      next.draws += fact.winner === 'draw' ? 1 : 0;
      next.humanScore += fact.humanScore;
      next.maxHumanScore = Math.max(next.maxHumanScore, fact.humanScore);
      next.maxWinMargin = Math.max(next.maxWinMargin, fact.humanScore - fact.aiScore);
      for (const key of ['correctFlags', 'wrongFlags', 'explosions', 'banks'])
        next[key] += fact[key];
      for (const key of ['maxStreak', 'maxBankedPot', 'maxLostPot'])
        next[key] = Math.max(next[key], fact[key]);
      if (fact.winner === 'human' && !fact.wrongFlags && !fact.explosions) next.cleanWins += 1;
      if (fact.sessionSource === 'daily') next.dailyGames += 1;
      next.modes[fact.mode] = (next.modes[fact.mode] ?? 0) + 1;
      next.difficulties[fact.aiDifficulty] = (next.difficulties[fact.aiDifficulty] ?? 0) + 1;
      next.styles[fact.aiStyle] = (next.styles[fact.aiStyle] ?? 0) + 1;
      return next;
    },
    {
      ...base,
      modes: { ...base.modes },
      difficulties: { ...base.difficulties },
      styles: { ...base.styles },
    },
  );
}

export function selectStats(stats) {
  return {
    ...stats,
    winRate: stats.completedGames ? stats.wins / stats.completedGames : 0,
    averageHumanScore: stats.completedGames ? stats.humanScore / stats.completedGames : 0,
  };
}
