// Classification rules for Needs vs Wants coaching game

export const NEEDS_CATEGORIES = new Set([
  'groceries', 'essentials', 'transport', 'health', 'needs', 'food',
]);

export const WANTS_CATEGORIES = new Set([
  'dining', 'entertainment', 'shopping', 'coffee', 'impulse', 'social',
  'fun', 'personal', 'wants', 'discretionary', 'subscriptions',
]);

export function classifyCategory(categoryId: string): 'need' | 'want' | 'unknown' {
  if (NEEDS_CATEGORIES.has(categoryId)) return 'need';
  if (WANTS_CATEGORIES.has(categoryId)) return 'want';
  return 'unknown';
}
