import { CategoryIcons } from '../constants/theme';

export interface PlanCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  weeklyLimitPercent: number;
  keywords: string[];
}

export interface FinancialPlan {
  id: string;
  title: string;
  description: string;
  focusTags: string[];
  categories: PlanCategory[];
}

export const FINANCIAL_PLANS: FinancialPlan[] = [
  {
    id: 'paycheck-plan',
    title: 'The Paycheck Plan',
    description: 'Stretch every pound from payday to payday with clear category limits.',
    focusTags: ['budgeting', 'expense_tracking'],
    categories: [
      { id: 'groceries', name: 'Groceries', icon: CategoryIcons.groceries, color: '#1E8449', bgColor: '#D5F5E3', weeklyLimitPercent: 30, keywords: ['groceries', 'supermarket', 'food', 'meal', 'tesco', 'aldi', 'lidl', 'sainsburys'] },
      { id: 'transport', name: 'Transport', icon: CategoryIcons.transport, color: '#3730A3', bgColor: '#E0E7FF', weeklyLimitPercent: 20, keywords: ['bus', 'train', 'uber', 'taxi', 'tube', 'metro', 'fare', 'transport', 'petrol', 'fuel'] },
      { id: 'dining', name: 'Dining Out', icon: CategoryIcons.dining, color: '#9D174D', bgColor: '#FCE7F3', weeklyLimitPercent: 15, keywords: ['restaurant', 'cafe', 'coffee', 'latte', 'lunch', 'dinner', 'takeaway', 'pret', 'nandos'] },
      { id: 'personal', name: 'Personal', icon: CategoryIcons.personal, color: '#92400E', bgColor: '#FEF3C7', weeklyLimitPercent: 20, keywords: ['clothes', 'shoes', 'haircut', 'toiletries', 'personal', 'shopping'] },
      { id: 'fun', name: 'Fun Money', icon: CategoryIcons.fun, color: '#7C3AED', bgColor: '#EDE9FE', weeklyLimitPercent: 15, keywords: ['cinema', 'movie', 'game', 'concert', 'pub', 'bar', 'drinks', 'entertainment', 'netflix', 'spotify'] },
    ],
  },
  {
    id: 'safety-net',
    title: 'The Safety Net',
    description: 'Build your emergency fund while keeping daily spending in check.',
    focusTags: ['emergency_fund', 'budgeting'],
    categories: [
      { id: 'essentials', name: 'Essentials', icon: CategoryIcons.essentials, color: '#1E40AF', bgColor: '#DBEAFE', weeklyLimitPercent: 35, keywords: ['groceries', 'food', 'meal', 'tesco', 'supermarket', 'pharmacy', 'toiletries'] },
      { id: 'transport', name: 'Transport', icon: CategoryIcons.transport, color: '#3730A3', bgColor: '#E0E7FF', weeklyLimitPercent: 20, keywords: ['bus', 'train', 'uber', 'taxi', 'tube', 'transport', 'petrol'] },
      { id: 'savings', name: 'Emergency Fund', icon: CategoryIcons.savings, color: '#0A7A70', bgColor: '#CCFBF1', weeklyLimitPercent: 25, keywords: ['savings', 'emergency', 'save', 'transfer'] },
      { id: 'discretionary', name: 'Discretionary', icon: CategoryIcons.discretionary, color: '#9D174D', bgColor: '#FCE7F3', weeklyLimitPercent: 20, keywords: ['coffee', 'dining', 'entertainment', 'shopping', 'fun', 'drinks', 'cinema'] },
    ],
  },
  {
    id: 'money-mentor',
    title: 'The Money Mentor',
    description: 'Learn where your money goes with detailed tracking across 6 categories.',
    focusTags: ['literacy', 'expense_tracking'],
    categories: [
      { id: 'food', name: 'Food & Drink', icon: CategoryIcons.food, color: '#1E40AF', bgColor: '#DBEAFE', weeklyLimitPercent: 25, keywords: ['food', 'groceries', 'lunch', 'dinner', 'breakfast', 'coffee', 'latte', 'meal', 'eat', 'pret'] },
      { id: 'transport', name: 'Getting Around', icon: CategoryIcons.transport, color: '#3730A3', bgColor: '#E0E7FF', weeklyLimitPercent: 15, keywords: ['bus', 'train', 'uber', 'taxi', 'tube', 'metro', 'transport', 'petrol'] },
      { id: 'social', name: 'Social', icon: CategoryIcons.social, color: '#7C3AED', bgColor: '#EDE9FE', weeklyLimitPercent: 15, keywords: ['pub', 'bar', 'drinks', 'cinema', 'concert', 'party', 'restaurant', 'nandos'] },
      { id: 'shopping', name: 'Shopping', icon: CategoryIcons.shopping, color: '#92400E', bgColor: '#FEF3C7', weeklyLimitPercent: 15, keywords: ['clothes', 'shoes', 'amazon', 'shopping', 'online', 'gadget'] },
      { id: 'health', name: 'Health & Wellness', icon: CategoryIcons.health, color: '#1E8449', bgColor: '#D5F5E3', weeklyLimitPercent: 15, keywords: ['gym', 'pharmacy', 'medicine', 'doctor', 'health', 'vitamins'] },
      { id: 'subscriptions', name: 'Subscriptions', icon: CategoryIcons.subscriptions, color: '#9D174D', bgColor: '#FCE7F3', weeklyLimitPercent: 15, keywords: ['netflix', 'spotify', 'subscription', 'membership', 'app'] },
    ],
  },
  {
    id: 'milestone-plan',
    title: 'The Milestone Plan',
    description: 'Save towards a specific goal while managing day-to-day spending.',
    focusTags: ['goal_setting', 'budgeting'],
    categories: [
      { id: 'goal-fund', name: 'Goal Fund', icon: CategoryIcons['goal-fund'], color: '#D4A017', bgColor: '#FDF2D0', weeklyLimitPercent: 30, keywords: ['savings', 'goal', 'save', 'fund'] },
      { id: 'needs', name: 'Daily Needs', icon: CategoryIcons.needs, color: '#1E8449', bgColor: '#D5F5E3', weeklyLimitPercent: 35, keywords: ['groceries', 'food', 'transport', 'bus', 'lunch', 'meal', 'essentials'] },
      { id: 'wants', name: 'Wants', icon: CategoryIcons.wants, color: '#7C3AED', bgColor: '#EDE9FE', weeklyLimitPercent: 20, keywords: ['coffee', 'dining', 'cinema', 'shopping', 'entertainment', 'drinks', 'fun'] },
      { id: 'buffer', name: 'Buffer', icon: CategoryIcons.buffer, color: '#1E40AF', bgColor: '#DBEAFE', weeklyLimitPercent: 15, keywords: ['unexpected', 'emergency', 'repair', 'replacement'] },
    ],
  },
  {
    id: 'spend-audit',
    title: 'The Spend Audit',
    description: 'Track every penny across detailed categories to find where money leaks.',
    focusTags: ['expense_tracking', 'literacy'],
    categories: [
      { id: 'coffee', name: 'Coffee & Snacks', icon: CategoryIcons.coffee, color: '#92400E', bgColor: '#FEF3C7', weeklyLimitPercent: 10, keywords: ['coffee', 'latte', 'cappuccino', 'snack', 'pastry', 'cake', 'costa', 'starbucks'] },
      { id: 'food', name: 'Meals', icon: CategoryIcons.food, color: '#1E40AF', bgColor: '#DBEAFE', weeklyLimitPercent: 25, keywords: ['food', 'lunch', 'dinner', 'breakfast', 'groceries', 'meal', 'eat', 'takeaway'] },
      { id: 'transport', name: 'Transport', icon: CategoryIcons.transport, color: '#3730A3', bgColor: '#E0E7FF', weeklyLimitPercent: 20, keywords: ['bus', 'train', 'uber', 'taxi', 'tube', 'transport', 'petrol'] },
      { id: 'entertainment', name: 'Entertainment', icon: CategoryIcons.entertainment, color: '#9D174D', bgColor: '#FCE7F3', weeklyLimitPercent: 15, keywords: ['cinema', 'movie', 'game', 'concert', 'netflix', 'spotify', 'pub', 'bar'] },
      { id: 'impulse', name: 'Impulse Buys', icon: CategoryIcons.impulse, color: '#C0392B', bgColor: '#FADBD8', weeklyLimitPercent: 15, keywords: ['amazon', 'online', 'shopping', 'clothes', 'gadget', 'impulse'] },
      { id: 'other', name: 'Other', icon: CategoryIcons.other, color: '#6B6B6B', bgColor: '#F3F4F6', weeklyLimitPercent: 15, keywords: ['other', 'misc', 'miscellaneous'] },
    ],
  },
  {
    id: 'rainy-day',
    title: 'The Rainy Day Builder',
    description: 'Prioritise building a safety buffer with aggressive but sustainable saving.',
    focusTags: ['emergency_fund', 'goal_setting'],
    categories: [
      { id: 'rainy-day', name: 'Rainy Day Fund', icon: CategoryIcons['rainy-day'], color: '#0A7A70', bgColor: '#CCFBF1', weeklyLimitPercent: 30, keywords: ['savings', 'save', 'emergency', 'fund'] },
      { id: 'essentials', name: 'Essentials', icon: CategoryIcons.essentials, color: '#1E40AF', bgColor: '#DBEAFE', weeklyLimitPercent: 40, keywords: ['groceries', 'food', 'transport', 'bus', 'train', 'lunch', 'essentials'] },
      { id: 'social', name: 'Social & Fun', icon: CategoryIcons.social, color: '#7C3AED', bgColor: '#EDE9FE', weeklyLimitPercent: 15, keywords: ['pub', 'drinks', 'cinema', 'restaurant', 'coffee', 'dining', 'fun'] },
      { id: 'personal', name: 'Personal Care', icon: CategoryIcons.personal, color: '#92400E', bgColor: '#FEF3C7', weeklyLimitPercent: 15, keywords: ['clothes', 'haircut', 'toiletries', 'pharmacy', 'health'] },
    ],
  },
  {
    id: 'full-picture',
    title: 'The Full Picture',
    description: 'Comprehensive view of all spending — nothing slips through the cracks.',
    focusTags: ['literacy', 'budgeting', 'expense_tracking'],
    categories: [
      { id: 'food', name: 'Food', icon: CategoryIcons.food, color: '#1E40AF', bgColor: '#DBEAFE', weeklyLimitPercent: 20, keywords: ['food', 'groceries', 'lunch', 'dinner', 'breakfast', 'meal', 'eat', 'pret', 'takeaway'] },
      { id: 'transport', name: 'Transport', icon: CategoryIcons.transport, color: '#3730A3', bgColor: '#E0E7FF', weeklyLimitPercent: 15, keywords: ['bus', 'train', 'uber', 'taxi', 'tube', 'transport', 'petrol'] },
      { id: 'social', name: 'Social', icon: CategoryIcons.social, color: '#7C3AED', bgColor: '#EDE9FE', weeklyLimitPercent: 15, keywords: ['pub', 'bar', 'drinks', 'restaurant', 'coffee', 'cafe', 'latte', 'dining'] },
      { id: 'shopping', name: 'Shopping', icon: CategoryIcons.shopping, color: '#92400E', bgColor: '#FEF3C7', weeklyLimitPercent: 15, keywords: ['clothes', 'shoes', 'amazon', 'shopping', 'online'] },
      { id: 'entertainment', name: 'Entertainment', icon: CategoryIcons.entertainment, color: '#9D174D', bgColor: '#FCE7F3', weeklyLimitPercent: 15, keywords: ['cinema', 'movie', 'game', 'concert', 'netflix', 'spotify'] },
      { id: 'wellbeing', name: 'Wellbeing', icon: CategoryIcons.wellbeing, color: '#1E8449', bgColor: '#D5F5E3', weeklyLimitPercent: 20, keywords: ['gym', 'pharmacy', 'health', 'vitamins', 'haircut', 'wellness'] },
    ],
  },
  {
    id: 'balanced-build',
    title: 'The Balanced Build',
    description: 'Equal focus on enjoying today and preparing for tomorrow.',
    focusTags: ['budgeting', 'goal_setting', 'emergency_fund'],
    categories: [
      { id: 'needs', name: 'Daily Needs', icon: CategoryIcons.needs, color: '#1E8449', bgColor: '#D5F5E3', weeklyLimitPercent: 30, keywords: ['groceries', 'food', 'transport', 'bus', 'lunch', 'essentials', 'meal'] },
      { id: 'wants', name: 'Fun & Social', icon: CategoryIcons.wants, color: '#7C3AED', bgColor: '#EDE9FE', weeklyLimitPercent: 25, keywords: ['coffee', 'dining', 'cinema', 'pub', 'drinks', 'entertainment', 'shopping'] },
      { id: 'growth', name: 'Future You', icon: CategoryIcons.growth, color: '#0A7A70', bgColor: '#CCFBF1', weeklyLimitPercent: 25, keywords: ['savings', 'save', 'goal', 'emergency', 'fund', 'invest'] },
      { id: 'flex', name: 'Flex Spending', icon: CategoryIcons.flex, color: '#D4A017', bgColor: '#FDF2D0', weeklyLimitPercent: 20, keywords: ['other', 'unexpected', 'misc', 'amazon', 'online', 'clothes'] },
    ],
  },
];

export const FALLBACK_PLANS: FinancialPlan[] = [
  {
    id: 'foundation',
    title: 'The Foundation Plan',
    description: 'A simple starting point — 4 basic categories to get you going.',
    focusTags: ['budgeting'],
    categories: [
      { id: 'food', name: 'Food & Drink', icon: CategoryIcons.food, color: '#1E40AF', bgColor: '#DBEAFE', weeklyLimitPercent: 30, keywords: ['food', 'groceries', 'coffee', 'lunch', 'dinner', 'meal', 'eat', 'latte', 'takeaway'] },
      { id: 'transport', name: 'Transport', icon: CategoryIcons.transport, color: '#3730A3', bgColor: '#E0E7FF', weeklyLimitPercent: 25, keywords: ['bus', 'train', 'uber', 'taxi', 'tube', 'transport', 'petrol'] },
      { id: 'fun', name: 'Fun', icon: CategoryIcons.fun, color: '#7C3AED', bgColor: '#EDE9FE', weeklyLimitPercent: 25, keywords: ['cinema', 'pub', 'drinks', 'entertainment', 'netflix', 'spotify', 'shopping'] },
      { id: 'other', name: 'Other', icon: CategoryIcons.other, color: '#6B6B6B', bgColor: '#F3F4F6', weeklyLimitPercent: 20, keywords: ['other', 'misc'] },
    ],
  },
];

export function getDefaultPlan(): FinancialPlan {
  return FALLBACK_PLANS[0];
}

export function scorePlans(motivationFocuses: string[]): FinancialPlan[] {
  if (motivationFocuses.length === 0) return FINANCIAL_PLANS;

  const scored = FINANCIAL_PLANS.map((plan) => {
    const overlap = plan.focusTags.filter((tag) => motivationFocuses.includes(tag)).length;
    return { plan, score: overlap };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.plan);
}

export function getTopPlans(motivationFocuses: string[], count: number = 3): FinancialPlan[] {
  return scorePlans(motivationFocuses).slice(0, count);
}

export function getPlanById(id: string): FinancialPlan | undefined {
  return [...FINANCIAL_PLANS, ...FALLBACK_PLANS].find((p) => p.id === id);
}
