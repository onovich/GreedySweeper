import { ACHIEVEMENTS } from './config.js';
export function evaluateAchievements(stats, completedAt) {
  return ACHIEVEMENTS.filter((item) => item.when(stats)).map((item) => ({
    id: item.id,
    title: item.title,
    unlockedAt: completedAt,
  }));
}
