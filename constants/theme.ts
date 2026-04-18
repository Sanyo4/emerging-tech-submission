export const Colors = {
  // High-contrast palette (WCAG AA)
  background: '#FFFFFF',
  surface: 'rgba(255, 255, 255, 0.85)',
  surfaceSolid: '#FFFFFF',
  frosted: 'rgba(255, 255, 255, 0.6)',
  frostedBorder: 'rgba(255, 255, 255, 0.3)',
  primary: '#0A7A70',
  primaryLight: '#14B8A6',
  primaryDark: '#0F766E',
  danger: '#C0392B',
  dangerLight: '#FADBD8',
  warning: '#D4A017',
  warningLight: '#FDF2D0',
  success: '#1E8449',
  successLight: '#D5F5E3',
  aiBubble: '#EAE2D9',
  aiBubbleBorder: '#D7CCC8',
  text: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textMuted: '#6B6B6B',
  border: '#999999',
  shadow: '#1A1A1A',
  xpGold: '#D4A017',
  levelPurple: '#8B5CF6',
  menuBg: 'rgba(240, 240, 240, 0.9)',
  menuBorder: '#AAAAAA',
  voicePulse: 'rgba(10, 122, 112, 0.2)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontSize = {
  xs: 14,
  sm: 16,
  body: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Fallback category colors — primary source is DB budget_categories table
export const CategoryColors: Record<string, { bg: string; icon: string }> = {
  coffee: { bg: '#FEF3C7', icon: '#92400E' },
  food: { bg: '#DBEAFE', icon: '#1E40AF' },
  transport: { bg: '#E0E7FF', icon: '#3730A3' },
  entertainment: { bg: '#FCE7F3', icon: '#9D174D' },
  groceries: { bg: '#D5F5E3', icon: '#1E8449' },
  dining: { bg: '#FCE7F3', icon: '#9D174D' },
  personal: { bg: '#FEF3C7', icon: '#92400E' },
  fun: { bg: '#EDE9FE', icon: '#7C3AED' },
  savings: { bg: '#CCFBF1', icon: '#0A7A70' },
  social: { bg: '#EDE9FE', icon: '#7C3AED' },
  shopping: { bg: '#FEF3C7', icon: '#92400E' },
  health: { bg: '#D5F5E3', icon: '#1E8449' },
  subscriptions: { bg: '#FCE7F3', icon: '#9D174D' },
  essentials: { bg: '#DBEAFE', icon: '#1E40AF' },
  discretionary: { bg: '#FCE7F3', icon: '#9D174D' },
  needs: { bg: '#D5F5E3', icon: '#1E8449' },
  wants: { bg: '#EDE9FE', icon: '#7C3AED' },
  other: { bg: '#F3F4F6', icon: '#6B6B6B' },
};

// Fallback category icons — primary source is DB budget_categories table
export const CategoryIcons: Record<string, string> = {
  coffee: 'CAFE',
  food: 'FOOD',
  transport: 'RIDE',
  entertainment: 'PLAY',
  groceries: 'CART',
  dining: 'MEAL',
  personal: 'CARE',
  fun: 'FUN',
  savings: 'SAVE',
  social: 'SOC',
  shopping: 'SHOP',
  health: 'WELL',
  subscriptions: 'SUBS',
  essentials: 'HOME',
  discretionary: 'FLEX',
  needs: 'NEED',
  wants: 'WANT',
  other: 'MISC',
  'goal-fund': 'GOAL',
  buffer: 'BUFF',
  impulse: 'FAST',
  'rainy-day': 'RAIN',
  wellbeing: 'CALM',
  growth: 'GROW',
  flex: 'FLEX',
};

export function getCategoryColor(id: string, dbColor?: string): { bg: string; icon: string } {
  if (dbColor) {
    const fallback = CategoryColors[id];
    return { bg: fallback?.bg || '#F3F4F6', icon: dbColor };
  }
  return CategoryColors[id] || { bg: '#F3F4F6', icon: '#6B6B6B' };
}

export function getCategoryIcon(id: string, dbIcon?: string): string {
  return dbIcon || CategoryIcons[id] || 'MISC';
}
