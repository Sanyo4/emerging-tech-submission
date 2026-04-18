export interface ChipState {
  hasTransactionsToday: boolean;
  tightCategories: string[]; // category names where spending > 80%
  hasActiveQuest: boolean;
  questProgress?: string; // e.g. "2/3"
  petName: string;
}

const TARGET_COUNT = 3;

/**
 * Returns exactly 3 contextual suggestion chips based on current app state.
 * Priority order:
 *   1. "log spending" (if no transactions today)
 *   2. "check [category] budget" (if any category > 80%)
 *   3. "quest progress" (if active quest) / "start a challenge" (if none)
 *   4. Defaults to fill remaining slots
 */
export function getSuggestionChips(state: ChipState): string[] {
  const chips: string[] = [];

  // 1. No transactions today -> nudge to log
  if (!state.hasTransactionsToday) {
    chips.push('log spending');
  }

  // 2. Tight category -> nudge to check it
  if (state.tightCategories.length > 0) {
    chips.push(`check ${state.tightCategories[0]} budget`);
  }

  // 3. Quest state
  if (state.hasActiveQuest) {
    chips.push('quest progress');
  } else {
    chips.push('start a challenge');
  }

  // 4. Defaults pool (ordered by general usefulness)
  const defaults = [
    "how's my budget?",
    `how's ${state.petName}?`,
    'what can I do?',
  ];

  // Fill remaining slots from defaults, skipping duplicates
  for (const chip of defaults) {
    if (chips.length >= TARGET_COUNT) break;
    if (!chips.includes(chip)) {
      chips.push(chip);
    }
  }

  // If we somehow have more than 3 (all contextual conditions met), trim
  return chips.slice(0, TARGET_COUNT);
}
