import * as SQLite from 'expo-sqlite';
import { CategoryIcons } from '../constants/theme';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('microlessons.db');
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      streak_days INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS budget_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      weekly_limit REAL NOT NULL,
      spent REAL DEFAULT 0,
      icon TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      category_id TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES budget_categories(id)
    );

    CREATE TABLE IF NOT EXISTS completed_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id TEXT NOT NULL,
      completed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      xp_reward INTEGER NOT NULL,
      progress INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      completed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      pin_hash TEXT,
      onboarding_completed INTEGER DEFAULT 0,
      input_preference TEXT DEFAULT 'voice',
      financial_persona TEXT DEFAULT 'beginner',
      selected_plan_id TEXT,
      biometric_enabled INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fixed_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT DEFAULT 'monthly'
    );

    CREATE TABLE IF NOT EXISTS motivation_focuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      focus_key TEXT NOT NULL UNIQUE,
      selected INTEGER DEFAULT 0
    );
  `);

  // Migrate user_profile: add columns if missing
  try {
    await database.execAsync('ALTER TABLE user_profile ADD COLUMN monthly_income REAL DEFAULT 0');
  } catch (_) { /* column already exists */ }
  try {
    await database.execAsync('ALTER TABLE user_profile ADD COLUMN flexible_budget REAL DEFAULT 0');
  } catch (_) { /* column already exists */ }
  try {
    await database.execAsync('ALTER TABLE app_settings ADD COLUMN biometric_enabled INTEGER DEFAULT 0');
  } catch (_) { /* column already exists */ }

  // Migrate pet_profile: add health_points
  try {
    await database.execAsync('ALTER TABLE pet_profile ADD COLUMN health_points INTEGER DEFAULT 100');
  } catch (_) { /* column already exists */ }

  // Completed coaching games tracking
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS completed_games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_key TEXT NOT NULL UNIQUE,
      completed_at TEXT NOT NULL
    );
  `);

  // === Pet & Accessibility tables (Brief 03) ===
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS pet_profile (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      name TEXT NOT NULL DEFAULT 'Buddy',
      current_state TEXT NOT NULL DEFAULT 'neutral'
        CHECK(current_state IN ('thriving','happy','neutral','worried','critical')),
      evolution_tier TEXT NOT NULL DEFAULT 'egg'
        CHECK(evolution_tier IN ('egg','baby','child','teen','adult','elder')),
      evolution_path TEXT NOT NULL DEFAULT 'standard'
        CHECK(evolution_path IN ('flourishing','standard','struggling')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pet_state_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state TEXT NOT NULL CHECK(state IN ('thriving','happy','neutral','worried','critical')),
      budget_score REAL NOT NULL,
      engagement_bonus REAL NOT NULL DEFAULT 0,
      combined_score REAL NOT NULL,
      trigger TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_care (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      transactions_logged INTEGER NOT NULL DEFAULT 0,
      lessons_completed INTEGER NOT NULL DEFAULT 0,
      challenges_completed INTEGER NOT NULL DEFAULT 0,
      pet_state_end_of_day TEXT,
      care_quality TEXT CHECK(care_quality IN ('good','normal','poor')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS engagement_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      timestamp TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accessibility_prefs (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      haptic_intensity TEXT DEFAULT 'medium'
        CHECK(haptic_intensity IN ('off','light','medium','strong')),
      tonal_volume TEXT DEFAULT 'normal'
        CHECK(tonal_volume IN ('off','quiet','normal','loud')),
      bloop_sound INTEGER DEFAULT 1,
      tts_speed TEXT DEFAULT 'normal'
        CHECK(tts_speed IN ('slow','normal','fast')),
      text_size TEXT DEFAULT 'medium'
        CHECK(text_size IN ('small','medium','large','extra_large')),
      high_contrast INTEGER DEFAULT 0,
      reduced_motion INTEGER DEFAULT 0,
      simplified_language INTEGER DEFAULT 0,
      verbose_screenreader INTEGER DEFAULT 0
    );
  `);

  await normalizeBudgetCategoryIcons(database);
}

async function normalizeBudgetCategoryIcons(database: SQLite.SQLiteDatabase): Promise<void> {
  for (const [categoryId, iconLabel] of Object.entries(CategoryIcons)) {
    await database.runAsync(
      'UPDATE budget_categories SET icon = ? WHERE id = ? AND icon <> ?',
      [iconLabel, categoryId, iconLabel]
    );
  }
}

// ========== App Settings ==========

export async function getAppSettings(): Promise<AppSettings | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<AppSettings>('SELECT * FROM app_settings WHERE id = 1');
  return result ?? null;
}

export async function createAppSettings(pinHash: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO app_settings (id, pin_hash, onboarding_completed, input_preference, financial_persona, selected_plan_id, created_at) VALUES (1, ?, 0, ?, ?, ?, ?)',
    [pinHash, 'voice', 'beginner', null, new Date().toISOString()]
  );
}

export async function updateAppSettings(partial: Partial<Omit<AppSettings, 'id' | 'created_at'>>): Promise<void> {
  const database = await getDatabase();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (partial.pin_hash !== undefined) { sets.push('pin_hash = ?'); values.push(partial.pin_hash ?? null); }
  if (partial.onboarding_completed !== undefined) { sets.push('onboarding_completed = ?'); values.push(partial.onboarding_completed); }
  if (partial.input_preference !== undefined) { sets.push('input_preference = ?'); values.push(partial.input_preference); }
  if (partial.financial_persona !== undefined) { sets.push('financial_persona = ?'); values.push(partial.financial_persona); }
  if (partial.selected_plan_id !== undefined) { sets.push('selected_plan_id = ?'); values.push(partial.selected_plan_id ?? null); }
  if (partial.biometric_enabled !== undefined) { sets.push('biometric_enabled = ?'); values.push(partial.biometric_enabled); }
  if (sets.length === 0) return;
  await database.runAsync(`UPDATE app_settings SET ${sets.join(', ')} WHERE id = 1`, values);
}

export async function verifyPin(inputHash: string): Promise<boolean> {
  const settings = await getAppSettings();
  if (!settings?.pin_hash) return false;
  return settings.pin_hash === inputHash;
}

export async function isOnboardingCompleted(): Promise<boolean> {
  const settings = await getAppSettings();
  return settings?.onboarding_completed === 1;
}

// ========== Fixed Expenses ==========

export async function getFixedExpenses(): Promise<FixedExpense[]> {
  const database = await getDatabase();
  return database.getAllAsync<FixedExpense>('SELECT * FROM fixed_expenses ORDER BY id');
}

export async function addFixedExpense(name: string, amount: number, frequency: string = 'monthly'): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO fixed_expenses (name, amount, frequency) VALUES (?, ?, ?)',
    [name, amount, frequency]
  );
}

export async function clearFixedExpenses(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM fixed_expenses');
}

// ========== Motivation Focuses ==========

export async function getMotivationFocuses(): Promise<{ focus_key: string; selected: number }[]> {
  const database = await getDatabase();
  return database.getAllAsync<{ focus_key: string; selected: number }>('SELECT focus_key, selected FROM motivation_focuses');
}

export async function setMotivationFocuses(keys: string[]): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM motivation_focuses');
  for (const key of keys) {
    await database.runAsync(
      'INSERT INTO motivation_focuses (focus_key, selected) VALUES (?, 1)',
      [key]
    );
  }
}

// ========== User Profile ==========

export async function getUserProfile(): Promise<UserProfile | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<UserProfile>('SELECT * FROM user_profile LIMIT 1');
  return result ?? null;
}

export async function updateUserXP(xpToAdd: number): Promise<UserProfile> {
  const database = await getDatabase();
  await database.runAsync('UPDATE user_profile SET xp = xp + ? WHERE id = 1', [xpToAdd]);
  const profile = await getUserProfile();
  return profile!;
}

export async function updateUserLevel(level: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE user_profile SET level = ? WHERE id = 1', [level]);
}

export async function updateUserProfile(partial: Partial<Omit<UserProfile, 'id'>>): Promise<void> {
  const database = await getDatabase();
  const sets: string[] = [];
  const values: (string | number)[] = [];
  if (partial.name !== undefined) { sets.push('name = ?'); values.push(partial.name); }
  if (partial.xp !== undefined) { sets.push('xp = ?'); values.push(partial.xp); }
  if (partial.level !== undefined) { sets.push('level = ?'); values.push(partial.level); }
  if (partial.streak_days !== undefined) { sets.push('streak_days = ?'); values.push(partial.streak_days); }
  if (partial.monthly_income !== undefined) { sets.push('monthly_income = ?'); values.push(partial.monthly_income); }
  if (partial.flexible_budget !== undefined) { sets.push('flexible_budget = ?'); values.push(partial.flexible_budget); }
  if (sets.length === 0) return;
  await database.runAsync(`UPDATE user_profile SET ${sets.join(', ')} WHERE id = 1`, values);
}

// ========== Budget Categories ==========

export async function getBudgetCategories(): Promise<BudgetCategory[]> {
  const database = await getDatabase();
  return database.getAllAsync<BudgetCategory>('SELECT * FROM budget_categories ORDER BY name');
}

export async function getBudgetCategory(categoryId: string): Promise<BudgetCategory | null> {
  const database = await getDatabase();
  return database.getFirstAsync<BudgetCategory>(
    'SELECT * FROM budget_categories WHERE id = ?',
    [categoryId]
  );
}

export async function updateCategorySpent(categoryId: string, amount: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE budget_categories SET spent = spent + ? WHERE id = ?',
    [amount, categoryId]
  );
}

// ========== Transactions ==========

export async function addTransaction(
  amount: number,
  categoryId: string,
  description: string
): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO transactions (amount, category_id, description, timestamp) VALUES (?, ?, ?, ?)',
    [amount, categoryId, description, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export async function getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
  const database = await getDatabase();
  return database.getAllAsync<Transaction>(
    'SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?',
    [limit]
  );
}

export async function getTransactionsByCategory(
  categoryId: string,
  period?: 'daily' | 'weekly' | 'monthly'
): Promise<Transaction[]> {
  const database = await getDatabase();
  let dateFilter = '';
  if (period === 'daily') {
    dateFilter = "AND timestamp >= datetime('now', '-1 day')";
  } else if (period === 'weekly') {
    dateFilter = "AND timestamp >= datetime('now', '-7 days')";
  } else if (period === 'monthly') {
    dateFilter = "AND timestamp >= datetime('now', '-30 days')";
  }

  return database.getAllAsync<Transaction>(
    `SELECT * FROM transactions WHERE category_id = ? ${dateFilter} ORDER BY timestamp DESC`,
    [categoryId]
  );
}

export async function getCategorySpendingTotal(
  categoryId: string,
  period: 'daily' | 'weekly' | 'monthly'
): Promise<number> {
  const database = await getDatabase();
  let dateFilter = '';
  if (period === 'daily') {
    dateFilter = "AND timestamp >= datetime('now', '-1 day')";
  } else if (period === 'weekly') {
    dateFilter = "AND timestamp >= datetime('now', '-7 days')";
  } else if (period === 'monthly') {
    dateFilter = "AND timestamp >= datetime('now', '-30 days')";
  }

  const result = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE category_id = ? ${dateFilter}`,
    [categoryId]
  );
  return result?.total ?? 0;
}

// ========== Lessons ==========

export async function markLessonCompleted(lessonId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO completed_lessons (lesson_id, completed_at) VALUES (?, ?)',
    [lessonId, new Date().toISOString()]
  );
}

export async function getCompletedLessons(): Promise<CompletedLesson[]> {
  const database = await getDatabase();
  return database.getAllAsync<CompletedLesson>(
    'SELECT * FROM completed_lessons ORDER BY completed_at DESC'
  );
}

export async function isLessonCompleted(lessonId: string): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM completed_lessons WHERE lesson_id = ?',
    [lessonId]
  );
  return (result?.count ?? 0) > 0;
}

// ========== Challenges ==========

export async function createChallenge(challenge: Omit<Challenge, 'id' | 'progress' | 'active' | 'completed' | 'created_at'>): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO challenges (title, description, type, category, duration_days, xp_reward, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [challenge.title, challenge.description, challenge.type, challenge.category, challenge.duration_days, challenge.xp_reward, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export async function getActiveChallenges(): Promise<Challenge[]> {
  const database = await getDatabase();
  return database.getAllAsync<Challenge>(
    'SELECT * FROM challenges WHERE active = 1 AND completed = 0 ORDER BY created_at DESC'
  );
}

export async function getCompletedChallenges(): Promise<Challenge[]> {
  const database = await getDatabase();
  return database.getAllAsync<Challenge>(
    'SELECT * FROM challenges WHERE completed = 1 ORDER BY created_at DESC'
  );
}

export async function updateChallengeProgress(challengeId: number, progress: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE challenges SET progress = ? WHERE id = ?',
    [progress, challengeId]
  );
}

export async function completeChallenge(challengeId: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE challenges SET completed = 1, active = 0 WHERE id = ?',
    [challengeId]
  );
}

export async function updateCategoryLimit(categoryId: string, newLimit: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE budget_categories SET weekly_limit = ? WHERE id = ?', [newLimit, categoryId]);
}

// ========== Reset ==========

export async function resetApp(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM transactions;
    DELETE FROM completed_lessons;
    DELETE FROM challenges;
    DELETE FROM budget_categories;
    DELETE FROM user_profile;
    DELETE FROM fixed_expenses;
    DELETE FROM motivation_focuses;
    DELETE FROM app_settings;
    DELETE FROM pet_profile;
    DELETE FROM pet_state_history;
    DELETE FROM daily_care;
    DELETE FROM engagement_events;
    DELETE FROM accessibility_prefs;
  `);
}

// ========== Types ==========

export interface UserProfile {
  id: number;
  name: string;
  xp: number;
  level: number;
  streak_days: number;
  monthly_income: number;
  flexible_budget: number;
}

export interface BudgetCategory {
  id: string;
  name: string;
  weekly_limit: number;
  spent: number;
  icon: string;
  color: string;
}

export interface Transaction {
  id: number;
  amount: number;
  category_id: string;
  description: string;
  timestamp: string;
}

export interface CompletedLesson {
  id: number;
  lesson_id: string;
  completed_at: string;
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  type: string;
  category: string;
  duration_days: number;
  xp_reward: number;
  progress: number;
  active: number;
  completed: number;
  created_at: string;
}

export interface AppSettings {
  id: number;
  pin_hash: string | null;
  onboarding_completed: number;
  input_preference: string;
  financial_persona: string;
  selected_plan_id: string | null;
  biometric_enabled: number;
  created_at: string;
}

export interface FixedExpense {
  id: number;
  name: string;
  amount: number;
  frequency: string;
}

export interface PetProfile {
  id: number;
  name: string;
  current_state: string;
  evolution_tier: string;
  evolution_path: string;
  created_at: string;
}

export interface PetStateHistory {
  id: number;
  state: string;
  budget_score: number;
  engagement_bonus: number;
  combined_score: number;
  trigger: string;
  timestamp: string;
}

export interface DailyCare {
  id: number;
  date: string;
  transactions_logged: number;
  lessons_completed: number;
  challenges_completed: number;
  pet_state_end_of_day: string | null;
  care_quality: string | null;
  created_at: string;
}

export interface EngagementEvent {
  id: number;
  event_type: string;
  timestamp: string;
}

export interface AccessibilityPrefs {
  id: number;
  haptic_intensity: string;
  tonal_volume: string;
  bloop_sound: number;
  tts_speed: string;
  text_size: string;
  high_contrast: number;
  reduced_motion: number;
  simplified_language: number;
  verbose_screenreader: number;
}

// ========== Pet Profile ==========

export async function getPetProfile(): Promise<PetProfile | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<PetProfile>('SELECT * FROM pet_profile WHERE id = 1');
  return result ?? null;
}

export async function createPetProfile(name: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO pet_profile (id, name, current_state, evolution_tier, evolution_path) VALUES (1, ?, ?, ?, ?)',
    [name, 'neutral', 'egg', 'standard']
  );
}

export async function updatePetProfile(partial: Partial<Omit<PetProfile, 'id' | 'created_at'>>): Promise<void> {
  const database = await getDatabase();
  const sets: string[] = [];
  const values: (string | number)[] = [];
  if (partial.name !== undefined) { sets.push('name = ?'); values.push(partial.name); }
  if (partial.current_state !== undefined) { sets.push('current_state = ?'); values.push(partial.current_state); }
  if (partial.evolution_tier !== undefined) { sets.push('evolution_tier = ?'); values.push(partial.evolution_tier); }
  if (partial.evolution_path !== undefined) { sets.push('evolution_path = ?'); values.push(partial.evolution_path); }
  if (sets.length === 0) return;
  await database.runAsync(`UPDATE pet_profile SET ${sets.join(', ')} WHERE id = 1`, values);
}

// ========== Pet State History ==========

export async function addPetStateHistory(entry: {
  state: string;
  budget_score: number;
  engagement_bonus: number;
  combined_score: number;
  trigger: string;
}): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO pet_state_history (state, budget_score, engagement_bonus, combined_score, trigger) VALUES (?, ?, ?, ?, ?)',
    [entry.state, entry.budget_score, entry.engagement_bonus, entry.combined_score, entry.trigger]
  );
}

export async function getPetStateHistory(days: number): Promise<PetStateHistory[]> {
  const database = await getDatabase();
  return database.getAllAsync<PetStateHistory>(
    `SELECT * FROM pet_state_history WHERE timestamp >= datetime('now', '-' || ? || ' days') ORDER BY timestamp DESC`,
    [days]
  );
}

// ========== Daily Care ==========

export async function getDailyCare(date: string): Promise<DailyCare | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<DailyCare>(
    'SELECT * FROM daily_care WHERE date = ?',
    [date]
  );
  return result ?? null;
}

export async function upsertDailyCare(record: {
  date: string;
  transactions_logged?: number;
  lessons_completed?: number;
  challenges_completed?: number;
  pet_state_end_of_day?: string;
  care_quality?: string;
}): Promise<void> {
  const database = await getDatabase();
  const existing = await getDailyCare(record.date);
  if (existing) {
    const sets: string[] = [];
    const values: (string | number)[] = [];
    if (record.transactions_logged !== undefined) { sets.push('transactions_logged = ?'); values.push(record.transactions_logged); }
    if (record.lessons_completed !== undefined) { sets.push('lessons_completed = ?'); values.push(record.lessons_completed); }
    if (record.challenges_completed !== undefined) { sets.push('challenges_completed = ?'); values.push(record.challenges_completed); }
    if (record.pet_state_end_of_day !== undefined) { sets.push('pet_state_end_of_day = ?'); values.push(record.pet_state_end_of_day); }
    if (record.care_quality !== undefined) { sets.push('care_quality = ?'); values.push(record.care_quality); }
    if (sets.length === 0) return;
    values.push(record.date);
    await database.runAsync(`UPDATE daily_care SET ${sets.join(', ')} WHERE date = ?`, values);
  } else {
    await database.runAsync(
      'INSERT INTO daily_care (date, transactions_logged, lessons_completed, challenges_completed, pet_state_end_of_day, care_quality) VALUES (?, ?, ?, ?, ?, ?)',
      [
        record.date,
        record.transactions_logged ?? 0,
        record.lessons_completed ?? 0,
        record.challenges_completed ?? 0,
        record.pet_state_end_of_day ?? null,
        record.care_quality ?? null,
      ]
    );
  }
}

export async function getDailyCareRange(startDate: string, endDate: string): Promise<DailyCare[]> {
  const database = await getDatabase();
  return database.getAllAsync<DailyCare>(
    'SELECT * FROM daily_care WHERE date >= ? AND date <= ? ORDER BY date ASC',
    [startDate, endDate]
  );
}

// ========== Engagement Events ==========

export async function addEngagementEvent(eventType: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO engagement_events (event_type) VALUES (?)',
    [eventType]
  );
}

export async function getEngagementEventsSince(timestamp: string): Promise<EngagementEvent[]> {
  const database = await getDatabase();
  return database.getAllAsync<EngagementEvent>(
    'SELECT * FROM engagement_events WHERE timestamp >= ? ORDER BY timestamp DESC',
    [timestamp]
  );
}

// ========== Accessibility Preferences ==========

export async function getAccessibilityPrefs(): Promise<AccessibilityPrefs | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<AccessibilityPrefs>('SELECT * FROM accessibility_prefs WHERE id = 1');
  return result ?? null;
}

export async function upsertAccessibilityPrefs(partial: Record<string, unknown>): Promise<void> {
  const database = await getDatabase();
  const existing = await getAccessibilityPrefs();
  if (existing) {
    const sets: string[] = [];
    const values: (string | number | null)[] = [];
    for (const [key, val] of Object.entries(partial)) {
      sets.push(`${key} = ?`);
      values.push(val as string | number | null);
    }
    if (sets.length === 0) return;
    await database.runAsync(`UPDATE accessibility_prefs SET ${sets.join(', ')} WHERE id = 1`, values);
  } else {
    const cols = ['id', ...Object.keys(partial)];
    const placeholders = cols.map(() => '?').join(', ');
    const values = [1, ...Object.values(partial)] as (string | number | null)[];
    await database.runAsync(
      `INSERT INTO accessibility_prefs (${cols.join(', ')}) VALUES (${placeholders})`,
      values
    );
  }
}

// ========== Pet Health ==========

export async function updatePetHealth(delta: number): Promise<number> {
  const database = await getDatabase();
  const pet = await getPetProfile();
  const current = (pet as PetProfile & { health_points?: number })?.health_points ?? 100;
  const newHealth = Math.max(0, Math.min(100, current + delta));
  await database.runAsync('UPDATE pet_profile SET health_points = ? WHERE id = 1', [newHealth]);
  return newHealth;
}

export async function getPetHealth(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ health_points: number }>('SELECT health_points FROM pet_profile WHERE id = 1');
  return result?.health_points ?? 100;
}

// ========== Completed Games ==========

export async function markGameCompleted(gameKey: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR IGNORE INTO completed_games (game_key, completed_at) VALUES (?, ?)',
    [gameKey, new Date().toISOString()]
  );
}

export async function isGameCompleted(gameKey: string): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM completed_games WHERE game_key = ?',
    [gameKey]
  );
  return (result?.count ?? 0) > 0;
}
