// Brief 03 — Pet state derivation engine + health meter
import {
  getPetProfile,
  updatePetProfile,
  addPetStateHistory,
  getPetStateHistory as dbGetStateHistory,
  getBudgetCategories,
  getRecentTransactions,
  updatePetHealth,
  getPetHealth,
  type PetStateHistory,
} from './database';
import { calculateCarePoints } from './engagement';

export type PetMood = 'thriving' | 'happy' | 'neutral' | 'worried' | 'critical';

/** Ordered from worst to best — used for clamping transitions */
const MOOD_ORDER: PetMood[] = ['critical', 'worried', 'neutral', 'happy', 'thriving'];

/**
 * Calculate budget health as a 0–100 score.
 */
export async function calculateBudgetHealthScore(): Promise<number> {
  const categories = await getBudgetCategories();
  if (categories.length === 0) return 50;

  let score = 50;

  for (const cat of categories) {
    const limit = cat.weekly_limit;
    if (limit <= 0) continue;

    const percentage = (cat.spent / limit) * 100;

    if (percentage <= 40) {
      score += 10;
    } else if (percentage <= 60) {
      score += 5;
    } else if (percentage <= 80) {
      // no change
    } else if (percentage <= 100) {
      score -= 5;
    } else {
      const overBy = percentage - 100;
      score -= Math.min(20, 5 + Math.floor(overBy / 10) * 3);
    }
  }

  const recentTransactions = await getRecentTransactions(20);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const hasLoggedToday = recentTransactions.some(t => t.timestamp >= todayStart);
  if (hasLoggedToday) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate health meter delta based on trigger and current state.
 * Decay: inactivity and over-budget categories reduce health.
 * Recovery: transactions, quests, and good budgeting increase health.
 */
export async function calculateHealthDelta(trigger: string): Promise<number> {
  const daysSince = await getDaysSinceLastLog();
  const categories = await getBudgetCategories();

  let delta = 0;

  if (trigger === 'app_open' || trigger === 'daily_check') {
    // Decay from inactivity
    if (daysSince >= 3) delta -= 30;
    else if (daysSince >= 2) delta -= 20;
    else if (daysSince >= 1) delta -= 10;

    // Decay from over-budget categories
    for (const cat of categories) {
      if (cat.weekly_limit > 0 && cat.spent > cat.weekly_limit) {
        delta -= 5;
      }
    }
  }

  if (trigger === 'transaction') {
    delta += 5;
  }

  if (trigger === 'challenge_complete') {
    delta += 10;
  }

  // Recovery: all categories under budget
  if (categories.length > 0) {
    const allUnder = categories.every(c => c.spent <= c.weekly_limit);
    if (allUnder && daysSince === 0) {
      delta += 5;
    }
  }

  return delta;
}

/** Pure function: derive pet mood from combined score */
export function derivePetMood(combinedScore: number, daysSinceLastLog: number): PetMood {
  if (daysSinceLastLog >= 3) return 'critical';

  if (combinedScore >= 80) return 'thriving';
  if (combinedScore >= 60) return 'happy';
  if (combinedScore >= 40) return 'neutral';
  if (combinedScore >= 20) return 'worried';
  return 'critical';
}

/** Clamp a mood transition to +/- 1 level from previous */
function clampTransition(previous: PetMood, target: PetMood, daysSinceLastLog: number): PetMood {
  if (daysSinceLastLog >= 3 && target === 'critical') return 'critical';

  const prevIndex = MOOD_ORDER.indexOf(previous);
  const targetIndex = MOOD_ORDER.indexOf(target);

  if (targetIndex > prevIndex + 1) return MOOD_ORDER[prevIndex + 1];
  if (targetIndex < prevIndex - 1) return MOOD_ORDER[prevIndex - 1];
  return target;
}

/** Calculate days since last transaction */
async function getDaysSinceLastLog(): Promise<number> {
  const transactions = await getRecentTransactions(1);
  if (transactions.length === 0) return 999;

  const lastTimestamp = new Date(transactions[0].timestamp);
  const now = new Date();
  return Math.floor((now.getTime() - lastTimestamp.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Main entry point: recalculate pet state + health from current data.
 */
export async function recalculatePetState(trigger: string): Promise<{
  newState: PetMood;
  previousState: PetMood;
  stateChanged: boolean;
  budgetScore: number;
  carePoints: number;
  combinedScore: number;
  healthDelta: number;
  newHealth: number;
}> {
  const profile = await getPetProfile();
  const previousState = (profile?.current_state as PetMood) ?? 'neutral';

  const budgetScore = await calculateBudgetHealthScore();
  const carePoints = await calculateCarePoints();
  const combinedScore = Math.min(100, budgetScore + carePoints);

  const daysSinceLastLog = await getDaysSinceLastLog();
  const rawMood = derivePetMood(combinedScore, daysSinceLastLog);
  const newState = clampTransition(previousState, rawMood, daysSinceLastLog);

  // Calculate and apply health delta
  const healthDelta = await calculateHealthDelta(trigger);
  const newHealth = await updatePetHealth(healthDelta);

  // Persist state change
  if (profile) {
    await updatePetProfile({ current_state: newState });
  }

  // Record history entry
  await addPetStateHistory({
    state: newState,
    budget_score: budgetScore,
    engagement_bonus: carePoints,
    combined_score: combinedScore,
    trigger,
  });

  return {
    newState,
    previousState,
    stateChanged: newState !== previousState,
    budgetScore,
    carePoints,
    combinedScore,
    healthDelta,
    newHealth,
  };
}

/** Get current pet state from DB (no recalculation) */
export async function getCurrentPetState(): Promise<PetMood> {
  const profile = await getPetProfile();
  return (profile?.current_state as PetMood) ?? 'neutral';
}

/** Get state history for mood timeline */
export async function getStateHistory(days: number): Promise<PetStateHistory[]> {
  return dbGetStateHistory(days);
}
