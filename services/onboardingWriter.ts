import { getDatabase, updateAppSettings, addFixedExpense, clearFixedExpenses, setMotivationFocuses, createPetProfile, upsertAccessibilityPrefs } from './database';
import { getPlanById, getDefaultPlan } from '../data/plans';
import type { OnboardingData } from './onboardingContext';

export async function writeOnboardingData(data: OnboardingData): Promise<void> {
  const database = await getDatabase();
  const plan = getPlanById(data.selectedPlanId) || getDefaultPlan();

  // 1. Insert user profile (use petName as fallback if userName not set)
  const displayName = data.userName || data.petName || 'Buddy';
  await database.runAsync(
    'INSERT OR REPLACE INTO user_profile (id, name, xp, level, streak_days, monthly_income, flexible_budget) VALUES (1, ?, 0, 1, 0, ?, ?)',
    [displayName, data.monthlyIncome || 0, data.flexibleSpending || 0]
  );

  // 2. Insert budget categories from plan
  const weeklyFlexible = (data.flexibleSpending || 0) / 4.3;
  for (const cat of plan.categories) {
    const weeklyLimit = Math.max(1, Math.round((weeklyFlexible * cat.weeklyLimitPercent) / 100 * 100) / 100);
    await database.runAsync(
      'INSERT OR REPLACE INTO budget_categories (id, name, weekly_limit, spent, icon, color) VALUES (?, ?, ?, 0, ?, ?)',
      [cat.id, cat.name, weeklyLimit, cat.icon, cat.color]
    );
  }

  // 3. Insert fixed expenses
  await clearFixedExpenses();
  for (const expense of data.fixedExpenses) {
    await addFixedExpense(expense.name, expense.amount);
  }

  // 4. Set motivation focuses
  await setMotivationFocuses(data.motivationFocuses);

  // 5. Update app settings (row created by pin-setup screen)
  // If app_settings row doesn't exist yet, create it first
  const existingSettings = await database.getFirstAsync('SELECT id FROM app_settings WHERE id = 1');
  if (!existingSettings) {
    await database.runAsync(
      'INSERT INTO app_settings (id, pin_hash, onboarding_completed, input_preference, financial_persona, selected_plan_id, created_at) VALUES (1, NULL, 0, ?, ?, ?, ?)',
      [data.inputPreference || 'voice', data.financialPersona || 'beginner', data.selectedPlanId || plan.id, new Date().toISOString()]
    );
  }
  await updateAppSettings({
    onboarding_completed: 1,
    financial_persona: data.financialPersona || 'beginner',
    selected_plan_id: data.selectedPlanId || plan.id,
    input_preference: data.inputPreference || 'voice',
  });

  // 6. Create pet profile
  await createPetProfile(data.petName || 'Buddy');

  // 7. Create default accessibility preferences
  await upsertAccessibilityPrefs({
    haptic_intensity: 'medium',
    tonal_volume: 'normal',
    bloop_sound: 1,
    tts_speed: 'normal',
    text_size: 'medium',
    high_contrast: 0,
    reduced_motion: 0,
    simplified_language: 0,
    verbose_screenreader: 0,
  });
}
