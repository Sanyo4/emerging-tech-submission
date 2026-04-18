import { getBudgetCategories, getTransactionsByCategory } from './database';

export interface BudgetSuggestion {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  currentLimit: number;
  suggestedLimit: number;
  averageSpend: number;
  reasoning: string;
  status: 'increase' | 'decrease' | 'keep';
}

export async function generateBudgetPlan(): Promise<BudgetSuggestion[]> {
  const categories = await getBudgetCategories();
  const suggestions: BudgetSuggestion[] = [];

  for (const cat of categories) {
    const transactions = await getTransactionsByCategory(cat.id, 'weekly');
    const weeklyAmounts = transactions.map((t) => t.amount);
    const avgWeeklySpend = weeklyAmounts.length > 0
      ? weeklyAmounts.reduce((a, b) => a + b, 0)
      : 0;

    const categoryName = cat.name;
    let suggestion: BudgetSuggestion;

    if (avgWeeklySpend > cat.weekly_limit) {
      // Consistently over: suggest 10% increase
      const suggestedLimit = Math.ceil(cat.weekly_limit * 1.1);
      suggestion = {
        categoryId: cat.id,
        categoryName,
        categoryIcon: cat.icon,
        currentLimit: cat.weekly_limit,
        suggestedLimit,
        averageSpend: avgWeeklySpend,
        reasoning: `You typically spend £${avgWeeklySpend.toFixed(0)}/week on ${categoryName.toLowerCase()}, which exceeds your £${cat.weekly_limit.toFixed(0)} limit. Consider raising it to be more realistic.`,
        status: 'increase',
      };
    } else if (avgWeeklySpend < cat.weekly_limit * 0.5) {
      // Consistently under 50%: suggest tighter limit
      const suggestedLimit = Math.max(Math.ceil(avgWeeklySpend * 1.2), 5);
      suggestion = {
        categoryId: cat.id,
        categoryName,
        categoryIcon: cat.icon,
        currentLimit: cat.weekly_limit,
        suggestedLimit,
        averageSpend: avgWeeklySpend,
        reasoning: `You only spend about £${avgWeeklySpend.toFixed(0)}/week on ${categoryName.toLowerCase()}. A tighter limit frees up budget for other categories.`,
        status: 'decrease',
      };
    } else {
      // Healthy range: keep current
      suggestion = {
        categoryId: cat.id,
        categoryName,
        categoryIcon: cat.icon,
        currentLimit: cat.weekly_limit,
        suggestedLimit: cat.weekly_limit,
        averageSpend: avgWeeklySpend,
        reasoning: `Your ${categoryName.toLowerCase()} spending is well within budget. Keep it up!`,
        status: 'keep',
      };
    }

    suggestions.push(suggestion);
  }

  return suggestions;
}
