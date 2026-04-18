// Brief 02 — Pet reaction system: determines dialogue template for context
import type { SlotValues } from '../data/dialogueTemplates';
import type { PetMood } from './petState';

export interface PetReaction {
  templateKey: string;
  slotValues: SlotValues;
}

/** Determine pet reaction for a logged transaction */
export function getTransactionReaction(
  category: string,
  amount: number,
  budgetRemaining: number,
  percentage: number,
): PetReaction {
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
  const slots: SlotValues = {
    amount: amount.toFixed(2),
    category: categoryName,
    budget_remaining: Math.abs(budgetRemaining).toFixed(2),
    percentage: Math.round(percentage).toString(),
  };

  // Over budget
  if (percentage > 100) {
    if (category === 'food' || category === 'dining' || category === 'groceries') {
      return { templateKey: 'FOOD_OVER_BUDGET', slotValues: slots };
    }
    return { templateKey: 'GENERAL_OVER_BUDGET', slotValues: slots };
  }

  // Near limit (80-100%)
  if (percentage > 80) {
    if (category === 'entertainment' || category === 'fun' || category === 'social') {
      return { templateKey: 'ENTERTAINMENT_APPROACHING_LIMIT', slotValues: slots };
    }
    return { templateKey: 'GENERAL_NEAR_LIMIT', slotValues: slots };
  }

  // Moderate (50-80%)
  if (percentage > 50) {
    return { templateKey: 'GENERAL_MODERATE', slotValues: slots };
  }

  // Under budget (< 50%)
  if (category === 'food' || category === 'dining' || category === 'groceries') {
    return { templateKey: 'FOOD_UNDER_BUDGET', slotValues: slots };
  }
  return { templateKey: 'GENERAL_CRUISING', slotValues: slots };
}

/** Determine pet reaction for daily check-in */
export function getDailyCheckInReaction(
  yesterdayState: PetMood | null,
): PetReaction {
  if (!yesterdayState) {
    return { templateKey: 'DAILY_FIRST_OPEN', slotValues: {} };
  }

  switch (yesterdayState) {
    case 'thriving':
    case 'happy':
      return { templateKey: 'DAILY_GOOD', slotValues: {} };
    case 'worried':
    case 'critical':
      return { templateKey: 'DAILY_BAD', slotValues: {} };
    default:
      return { templateKey: 'DAILY_NEUTRAL', slotValues: {} };
  }
}

/** Determine pet reaction for coaching triggers (lesson suggestion) */
export function getCoachingReaction(
  triggerType: string,
  category?: string,
): PetReaction {
  const slots: SlotValues = { category: category ?? 'money' };

  switch (triggerType) {
    case 'budget_exceeded':
    case 'unusual_pattern':
      return { templateKey: 'LESSON_SUGGEST_LATTE_EFFECT', slotValues: slots };
    case 'near_limit':
      return { templateKey: 'LESSON_SUGGEST_IMPULSE', slotValues: slots };
    case 'time_based':
      return { templateKey: 'LESSON_SUGGEST_SAVINGS', slotValues: slots };
    default:
      return { templateKey: 'LESSON_SUGGEST_GENERAL', slotValues: slots };
  }
}

