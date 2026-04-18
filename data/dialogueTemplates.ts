// Brief 02 — Pet dialogue message templates (enumerated, not freeform)

export interface SlotValues {
  amount?: string;
  category?: string;
  vendor?: string;
  budget_remaining?: string;
  streak_count?: string;
  level?: string;
  percentage?: string;
  pet_name?: string;
}

type TemplateFn = (s: SlotValues) => string;

/** Standard dialogue templates */
export const templates: Record<string, TemplateFn> = {
  // === Transaction Reactions ===
  GENERAL_UNDER_BUDGET: (s) =>
    `Nice! £${s.amount} on ${s.category} and we've still got £${s.budget_remaining} left this week.`,
  GENERAL_OVER_BUDGET: (s) =>
    `Hmm, that puts us £${s.amount} over the ${s.category} budget. Let's figure out a plan!`,
  GENERAL_NEAR_LIMIT: (s) =>
    `Heads up — only £${s.budget_remaining} left for ${s.category} this week. We've used ${s.percentage}%.`,
  GENERAL_MODERATE: (s) =>
    `Got it — £${s.amount} on ${s.category}. We're getting there, £${s.budget_remaining} left.`,
  GENERAL_CRUISING: (s) =>
    `£${s.amount} on ${s.category} logged. Cruising nicely!`,

  FOOD_UNDER_BUDGET: (s) =>
    `Nice! £${s.amount} on food and we've still got £${s.budget_remaining} left this week.`,
  FOOD_OVER_BUDGET: (s) =>
    `Oops — food budget's over by £${s.amount}. Happens to the best of us!`,
  FOOD_REPEAT_VENDOR: (s) =>
    `${s.vendor} again? That's ${s.streak_count} times this week! Maybe we should talk about the latte effect...`,
  ENTERTAINMENT_APPROACHING_LIMIT: (s) =>
    `Fun stuff! But we've used ${s.percentage}% of the entertainment budget. Only £${s.budget_remaining} left.`,

  // === Daily Check-ins ===
  DAILY_GOOD: () =>
    `Morning! Yesterday was a good day — we stayed on track.`,
  DAILY_BAD: () =>
    `Hey... yesterday was a bit rough. But today's a fresh start!`,
  DAILY_NEUTRAL: () =>
    `Good morning! Ready for a new day? Let's keep things going.`,
  DAILY_FIRST_OPEN: () =>
    `Welcome back! I missed you. Let's check in on how we're doing.`,

  // === Streaks & Milestones ===
  STREAK_3_DAY: (s) =>
    `Three days in a row! We're building a great habit, ${s.pet_name}!`,
  STREAK_7_DAY: (s) =>
    `SEVEN DAYS! That's a whole week of logging. I'm so proud of us!`,
  STREAK_30_DAY: () =>
    `Thirty days! A whole month of tracking. We're unstoppable!`,
  LEVEL_UP: (s) =>
    `We just hit Level ${s.level}! I feel like I'm evolving...`,
  CHALLENGE_COMPLETE: (s) =>
    `We did it! The "${s.category}" challenge is done! +${s.amount} care points!`,

  // === Coaching Triggers ===
  LESSON_SUGGEST_LATTE_EFFECT: () =>
    `Hey, I've been thinking about all those small purchases this week... want to learn about the latte effect?`,
  LESSON_SUGGEST_SAVINGS: () =>
    `We've been doing well — want to learn how to make our savings grow even more?`,
  LESSON_SUGGEST_IMPULSE: () =>
    `I noticed a few big purchases recently. Want to learn about the 24-hour rule?`,
  LESSON_SUGGEST_GENERAL: (s) =>
    `I found a lesson about ${s.category} that might help. Want to check it out?`,

  // === Pet State Transitions ===
  STATE_THRIVING: (s) =>
    `${s.pet_name} is now thriving! Our budget is looking great.`,
  STATE_HAPPY: (s) =>
    `${s.pet_name} is happy. We're doing well!`,
  STATE_NEUTRAL: (s) =>
    `${s.pet_name} is feeling okay. Keep going!`,
  STATE_WORRIED: (s) =>
    `${s.pet_name} is worried. Some of our spending categories are getting tight.`,
  STATE_CRITICAL: (s) =>
    `${s.pet_name} is not doing well. Our budget needs attention.`,
};

/** Simplified language variants (Brief 02 — simpler vocabulary, shorter sentences) */
export const simplifiedTemplates: Record<string, TemplateFn> = {
  GENERAL_UNDER_BUDGET: (s) =>
    `Good job! £${s.amount} on ${s.category}. You have £${s.budget_remaining} left.`,
  GENERAL_OVER_BUDGET: (s) =>
    `You spent too much on ${s.category}. Let's fix it!`,
  GENERAL_NEAR_LIMIT: (s) =>
    `Only £${s.budget_remaining} left for ${s.category}. Be careful!`,
  GENERAL_MODERATE: (s) =>
    `£${s.amount} on ${s.category}. £${s.budget_remaining} left.`,
  GENERAL_CRUISING: (s) =>
    `£${s.amount} on ${s.category}. All good!`,

  FOOD_UNDER_BUDGET: (s) =>
    `Good job! You spent £${s.amount} on food. You have £${s.budget_remaining} left.`,
  FOOD_OVER_BUDGET: (s) =>
    `Food budget is over. That's okay, we can fix it!`,
  FOOD_REPEAT_VENDOR: (s) =>
    `You went to ${s.vendor} a lot this week. Want to learn about saving?`,
  ENTERTAINMENT_APPROACHING_LIMIT: (s) =>
    `Fun is almost used up. Only £${s.budget_remaining} left.`,

  DAILY_GOOD: () => `Good morning! Yesterday was good.`,
  DAILY_BAD: () => `Hey! Yesterday was hard. Today is new!`,
  DAILY_NEUTRAL: () => `Good morning! Let's have a good day.`,
  DAILY_FIRST_OPEN: () => `Welcome back! Let's see how we're doing.`,

  STREAK_3_DAY: () => `Three days! Great job!`,
  STREAK_7_DAY: () => `One whole week! Amazing!`,
  STREAK_30_DAY: () => `One month! You're a star!`,
  LEVEL_UP: (s) => `Level ${s.level}! We're getting stronger!`,
  CHALLENGE_COMPLETE: () => `Challenge done! Well done!`,

  LESSON_SUGGEST_LATTE_EFFECT: () => `Want to learn about small spending?`,
  LESSON_SUGGEST_SAVINGS: () => `Want to learn about savings?`,
  LESSON_SUGGEST_IMPULSE: () => `Want to learn about waiting before buying?`,
  LESSON_SUGGEST_GENERAL: () => `I found a lesson for you. Want to see?`,

  STATE_THRIVING: (s) => `${s.pet_name} is very happy!`,
  STATE_HAPPY: (s) => `${s.pet_name} is happy.`,
  STATE_NEUTRAL: (s) => `${s.pet_name} is okay.`,
  STATE_WORRIED: (s) => `${s.pet_name} is worried.`,
  STATE_CRITICAL: (s) => `${s.pet_name} needs help.`,
};

/** Resolve a template key + slots to final dialogue text */
export function resolveTemplate(
  key: string,
  slots: SlotValues,
  simplified: boolean = false,
): string {
  const source = simplified ? simplifiedTemplates : templates;
  const fn = source[key] ?? templates[key];
  if (!fn) return `(Unknown message: ${key})`;
  return fn(slots);
}
