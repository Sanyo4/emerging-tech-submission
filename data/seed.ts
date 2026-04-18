import * as SQLite from 'expo-sqlite';
import { CategoryIcons } from '../constants/theme';

export async function seedDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  // Check if onboarding is completed — if so, no seeding needed
  try {
    const settings = await database.getFirstAsync<{ onboarding_completed: number }>(
      'SELECT onboarding_completed FROM app_settings WHERE id = 1'
    );
    if (settings?.onboarding_completed === 1) return;
  } catch (_) {
    // app_settings table may not exist yet on first run — that's fine
  }

  // Check if user_profile exists — if not, this is a new install (onboarding handles it)
  const existing = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM user_profile'
  );
  if (!existing || existing.count === 0) return;

  // Legacy path: user_profile exists but no app_settings — backward compat only
  const hasBudget = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM budget_categories'
  );
  if (hasBudget && hasBudget.count > 0) return;

  // Seed legacy data if somehow we have a user but no categories
  await database.execAsync(`
    INSERT INTO budget_categories (id, name, weekly_limit, spent, icon, color)
    VALUES
      ('coffee', 'Coffee', 20.0, 17.0, '${CategoryIcons.coffee}', '#92400E'),
      ('food', 'Food', 80.0, 45.0, '${CategoryIcons.food}', '#1E40AF'),
      ('transport', 'Transport', 40.0, 22.0, '${CategoryIcons.transport}', '#3730A3'),
      ('entertainment', 'Entertainment', 30.0, 10.0, '${CategoryIcons.entertainment}', '#9D174D');

    INSERT INTO transactions (amount, category_id, description, timestamp)
    VALUES
      (4.50, 'coffee', 'Morning latte', datetime('now', '-6 days')),
      (3.80, 'coffee', 'Afternoon cappuccino', datetime('now', '-5 days')),
      (4.20, 'coffee', 'Flat white', datetime('now', '-3 days')),
      (4.50, 'coffee', 'Oat milk latte', datetime('now', '-1 day')),
      (12.00, 'food', 'Lunch at Pret', datetime('now', '-5 days')),
      (8.50, 'food', 'Groceries', datetime('now', '-4 days')),
      (15.00, 'food', 'Dinner takeaway', datetime('now', '-2 days')),
      (9.50, 'food', 'Meal deal + snacks', datetime('now', '-1 day')),
      (2.80, 'transport', 'Bus fare', datetime('now', '-6 days')),
      (12.50, 'transport', 'Uber to campus', datetime('now', '-3 days')),
      (6.70, 'transport', 'Train ticket', datetime('now', '-1 day')),
      (10.00, 'entertainment', 'Cinema ticket', datetime('now', '-4 days'));
  `);
}
