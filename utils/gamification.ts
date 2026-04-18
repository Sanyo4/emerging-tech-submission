export const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0, title: 'Budget Beginner' },
  { level: 2, xpRequired: 100, title: 'Spending Spotter' },
  { level: 3, xpRequired: 300, title: 'Savvy Saver' },
  { level: 4, xpRequired: 600, title: 'Finance Pro' },
  { level: 5, xpRequired: 1000, title: 'Money Master' },
];

export const XP_AWARDS = {
  LOG_TRANSACTION: 5,
  VIEW_LESSON: 10,
  ACCEPT_CHALLENGE: 5,
  COMPLETE_CHALLENGE_SMALL: 30,
  COMPLETE_CHALLENGE_MEDIUM: 40,
  COMPLETE_CHALLENGE_LARGE: 50,
} as const;

export function calculateLevel(xp: number): number {
  let level = 1;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.xpRequired) {
      level = threshold.level;
    } else {
      break;
    }
  }
  return level;
}

export function getLevelTitle(level: number): string {
  const threshold = LEVEL_THRESHOLDS.find((t) => t.level === level);
  return threshold?.title ?? 'Budget Beginner';
}

export function getXPForNextLevel(xp: number): { current: number; needed: number; progress: number } {
  const currentLevel = calculateLevel(xp);
  const currentThreshold = LEVEL_THRESHOLDS.find((t) => t.level === currentLevel);
  const nextThreshold = LEVEL_THRESHOLDS.find((t) => t.level === currentLevel + 1);

  if (!nextThreshold) {
    return { current: xp, needed: xp, progress: 1 };
  }

  const currentBase = currentThreshold?.xpRequired ?? 0;
  const xpInLevel = xp - currentBase;
  const xpNeeded = nextThreshold.xpRequired - currentBase;
  const progress = xpInLevel / xpNeeded;

  return { current: xpInLevel, needed: xpNeeded, progress };
}

export function checkLevelUp(oldXP: number, newXP: number): { leveledUp: boolean; newLevel: number } {
  const oldLevel = calculateLevel(oldXP);
  const newLevel = calculateLevel(newXP);
  return {
    leveledUp: newLevel > oldLevel,
    newLevel,
  };
}
