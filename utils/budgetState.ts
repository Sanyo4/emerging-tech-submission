import type { BudgetCategory } from '../services/database';
import { Colors } from '../constants/theme';

export type BudgetState = 'excellent' | 'good' | 'warning' | 'critical' | 'overBudget';

export function getBudgetState(spent: number, limit: number): BudgetState {
  if (limit <= 0) return 'excellent';
  const percentage = (spent / limit) * 100;
  if (percentage > 100) return 'overBudget';
  if (percentage > 80) return 'critical';
  if (percentage > 60) return 'warning';
  if (percentage > 40) return 'good';
  return 'excellent';
}

export const BUDGET_STATE_CONFIG: Record<
  BudgetState,
  { emotion: string; ttsDescription: string; color: string }
> = {
  excellent: {
    emotion: 'Relaxed',
    ttsDescription: "You're doing great.",
    color: Colors.success,
  },
  good: {
    emotion: 'Confident',
    ttsDescription: 'On track.',
    color: Colors.primary,
  },
  warning: {
    emotion: 'Alert',
    ttsDescription: 'Heads up.',
    color: Colors.warning,
  },
  critical: {
    emotion: 'Urgent',
    ttsDescription: 'Careful.',
    color: Colors.danger,
  },
  overBudget: {
    emotion: 'Serious',
    ttsDescription: "You've gone over budget.",
    color: Colors.danger,
  },
};

export function getBudgetStateForTotal(categories: BudgetCategory[]): BudgetState {
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const totalLimit = categories.reduce((sum, c) => sum + c.weekly_limit, 0);
  return getBudgetState(totalSpent, totalLimit);
}
