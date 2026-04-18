export interface MicroLesson {
  id: string;
  title: string;
  body: string;
  insight: string;
  triggerType: 'budget_exceeded' | 'unusual_pattern' | 'time_based' | 'near_limit';
  category?: string;
  sourceCategory?: string;
  xpReward: number;
  challengeTemplate: {
    title: string;
    description: string;
    type: string;
    duration_days: number;
    xp_reward: number;
  };
}

export const MICRO_LESSONS: MicroLesson[] = [
  {
    id: 'latte-factor',
    title: 'The Latte Factor',
    body: 'Small daily purchases feel harmless, but they compound dramatically. Financial author David Bach coined "The Latte Factor" to show how cutting one daily coffee can fund your future. It\'s not about giving up coffee forever — it\'s about being intentional about which ones matter.',
    insight: '£3/day = £1,095/year',
    triggerType: 'budget_exceeded',
    category: 'coffee',
    xpReward: 10,
    challengeTemplate: {
      title: 'No coffee shops for 3 days',
      description: 'Make your coffee at home for the next 3 days. You\'ll save around £9-15!',
      type: 'reduce_spending',
      duration_days: 3,
      xp_reward: 50,
    },
  },
  {
    id: 'small-leaks',
    title: 'Small Leaks, Big Ships',
    body: 'Benjamin Franklin said "Beware of little expenses; a small leak will sink a great ship." Research shows the average person makes 5+ small purchases per day without thinking. Each one feels like nothing, but together they can equal a significant monthly cost.',
    insight: '5 small daily purchases = 1 big monthly loss',
    triggerType: 'budget_exceeded',
    xpReward: 10,
    challengeTemplate: {
      title: 'Track every purchase under £5',
      description: 'For the next 7 days, log every purchase under £5. You\'ll be surprised what adds up.',
      type: 'track_purchases',
      duration_days: 7,
      xp_reward: 30,
    },
  },
  {
    id: '50-30-20',
    title: 'The 50/30/20 Rule',
    body: 'Senator Elizabeth Warren popularised this simple budgeting framework: 50% of income goes to needs (rent, bills, food), 30% to wants (entertainment, dining out), and 20% to savings. It\'s not perfect for everyone, but it\'s a powerful starting point.',
    insight: 'Needs 50% / Wants 30% / Savings 20%',
    triggerType: 'budget_exceeded',
    xpReward: 10,
    challengeTemplate: {
      title: 'Categorise your spending this week',
      description: 'Sort every purchase into needs, wants, or savings for 7 days. See where your money really goes.',
      type: 'track_purchases',
      duration_days: 7,
      xp_reward: 40,
    },
  },
  {
    id: 'emotional-spending',
    title: 'Emotional Spending',
    body: 'Studies show we spend up to 60% more when stressed, tired, or emotional. "Retail therapy" gives a dopamine hit, but the relief is temporary and the spending is permanent. Recognising your emotional state before spending is a financial superpower.',
    insight: 'We spend 60% more when stressed',
    triggerType: 'unusual_pattern',
    xpReward: 10,
    challengeTemplate: {
      title: 'Log your mood with purchases',
      description: 'For the next 5 purchases, note how you\'re feeling. Are you spending because you need it or because you feel it?',
      type: 'track_purchases',
      duration_days: 5,
      xp_reward: 30,
    },
  },
  {
    id: '24-hour-rule',
    title: 'The 24-Hour Rule',
    body: 'Before making any non-essential purchase, wait 24 hours. Research from the Journal of Consumer Psychology shows that 70% of impulse purchase urges pass within a day. If you still want it after 24 hours, it\'s probably worth it.',
    insight: '70% of impulse urges pass in 24hrs',
    triggerType: 'unusual_pattern',
    xpReward: 10,
    challengeTemplate: {
      title: 'Apply the 24-hour rule',
      description: 'Wait 24 hours before your next non-essential purchase over £10. See if you still want it tomorrow.',
      type: 'reduce_spending',
      duration_days: 3,
      xp_reward: 50,
    },
  },
  {
    id: 'needs-vs-wants',
    title: 'Needs vs Wants',
    body: 'Before any purchase, ask three questions: 1) Do I need this to survive or function? 2) Will I use this next week? 3) Can I afford this without guilt? If you answer "no" to any of these, it\'s a want, not a need. Wants aren\'t bad — but knowing the difference is power.',
    insight: '3 questions before any purchase',
    triggerType: 'unusual_pattern',
    xpReward: 10,
    challengeTemplate: {
      title: 'Use the need/want check',
      description: 'Ask the 3 questions before every purchase for 3 days. Track how many times you change your mind.',
      type: 'track_purchases',
      duration_days: 3,
      xp_reward: 30,
    },
  },
  {
    id: 'payday-planning',
    title: 'Payday Planning',
    body: 'People who set a budget before payday save 23% more than those who don\'t. The moment money hits your account, it feels abundant — that\'s when overspending happens. Planning ahead means your money has a job before it even arrives.',
    insight: 'Pre-payday budgeters save 23% more',
    triggerType: 'time_based',
    xpReward: 10,
    challengeTemplate: {
      title: 'Set your budget before payday',
      description: 'Before your next payday, plan exactly how you\'ll split your money across categories.',
      type: 'plan_budget',
      duration_days: 2,
      xp_reward: 40,
    },
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    body: 'The average person spends 40% more on weekends than weekdays. Socialising, dining out, and leisure activities cluster into Saturday and Sunday. Setting a weekend-specific budget helps you enjoy yourself without the Monday morning regret.',
    insight: 'Weekend spending is 40% higher',
    triggerType: 'time_based',
    xpReward: 10,
    challengeTemplate: {
      title: 'Set a weekend spending cap',
      description: 'Decide on a weekend spending limit and stick to it. Track everything from Friday evening to Sunday night.',
      type: 'plan_budget',
      duration_days: 3,
      xp_reward: 30,
    },
  },
  {
    id: 'month-end-review',
    title: 'Month-End Review',
    body: 'Research from the National Bureau of Economic Research shows that people who regularly review their spending patterns reduce overspending by 20%. A quick monthly review of your top categories helps you spot trends before they become problems.',
    insight: 'Tracking reduces overspending by 20%',
    triggerType: 'time_based',
    xpReward: 10,
    challengeTemplate: {
      title: 'Review your top 3 categories',
      description: 'Look at your 3 highest-spending categories this month. Were they what you expected?',
      type: 'track_purchases',
      duration_days: 1,
      xp_reward: 40,
    },
  },
  {
    id: 'approaching-limit',
    title: 'The Yellow Light',
    body: 'Think of your budget like a traffic light. When you\'ve spent 80% of your budget, the light turns yellow — not red, but a clear signal to slow down. Research from behavioural economics shows that people who receive early warnings about their spending are 35% more likely to finish the month within budget.',
    insight: '80% spent = time to slow down',
    triggerType: 'near_limit',
    xpReward: 10,
    challengeTemplate: {
      title: 'Pause before your next purchase for 2 days',
      description: 'Before buying anything non-essential over the next 2 days, pause and check your remaining budget first.',
      type: 'reduce_spending',
      duration_days: 2,
      xp_reward: 40,
    },
  },
  {
    id: 'fast-burn',
    title: 'The Fast Burn',
    body: 'Spending half your budget in just two days is like sprinting the first mile of a marathon — you\'ll run out of energy before the finish line. Studies show that front-loaded spending is one of the top predictors of going over budget. Spreading your spending evenly across the week keeps you in control without feeling deprived.',
    insight: 'Half your budget in 2 days = trouble by Friday',
    triggerType: 'near_limit',
    xpReward: 10,
    challengeTemplate: {
      title: 'Spread spending evenly across the week',
      description: 'Divide your remaining budget by the days left this week and try to stick to a daily allowance.',
      type: 'plan_budget',
      duration_days: 5,
      xp_reward: 50,
    },
  },
  {
    id: 'pay-yourself-first',
    title: 'Pay Yourself First',
    body: 'The "Pay Yourself First" principle, popularised by personal finance author Robert Kiyosaki, flips the usual approach: instead of saving what\'s left after spending, you save first and spend what\'s left. People who automate savings before paying bills save on average 47% more annually than those who save last.',
    insight: 'Savers pay themselves before bills',
    triggerType: 'time_based',
    xpReward: 10,
    challengeTemplate: {
      title: 'Set aside savings before spending for 3 days',
      description: 'For the next 3 days, move a small amount into savings first thing in the morning before spending anything.',
      type: 'plan_budget',
      duration_days: 3,
      xp_reward: 40,
    },
  },
  {
    id: 'subscription-audit',
    title: 'The Subscription Trap',
    body: 'The average UK household spends over £600 a year on subscriptions, and research by Barclays found that consumers waste roughly £50 per month on services they\'ve forgotten about or rarely use. Subscription services rely on inertia — the fact that cancelling feels like effort. A quick audit can put that money back in your pocket.',
    insight: 'Average person wastes £50/month on forgotten subscriptions',
    triggerType: 'unusual_pattern',
    xpReward: 10,
    challengeTemplate: {
      title: 'Audit recurring payments this week',
      description: 'Go through your bank statements and list every recurring subscription. Cancel or pause any you haven\'t used in 30 days.',
      type: 'track_purchases',
      duration_days: 7,
      xp_reward: 50,
    },
  },
  {
    id: 'spending-triggers',
    title: 'Know Your Triggers',
    body: 'Behavioural psychologists have found that most impulse purchases are driven by specific emotional or environmental triggers — boredom, social media, or even walking past a favourite shop. A study in the Journal of Consumer Research showed that people who identify their spending triggers reduce impulse buying by up to 40%.',
    insight: 'Identifying triggers cuts impulse spending by 40%',
    triggerType: 'unusual_pattern',
    xpReward: 10,
    challengeTemplate: {
      title: 'Note what prompted each purchase for 3 days',
      description: 'For every purchase over the next 3 days, jot down what triggered it — were you bored, stressed, hungry, or influenced by an ad?',
      type: 'track_purchases',
      duration_days: 3,
      xp_reward: 30,
    },
  },
  {
    id: 'weekly-review',
    title: 'The Weekly Check-In',
    body: 'Financial planners recommend a weekly 5-minute spending review as the single most impactful money habit you can build. A study by the Financial Health Network found that people who review their finances weekly are twice as likely to feel in control of their money. Five minutes now saves hours of regret later.',
    insight: '5 minutes of review saves hours of regret',
    triggerType: 'time_based',
    xpReward: 10,
    challengeTemplate: {
      title: 'Do a 5-minute spending review',
      description: 'Set a timer for 5 minutes and review what you\'ve spent this week. Note any surprises and one thing you\'d do differently.',
      type: 'track_purchases',
      duration_days: 1,
      xp_reward: 40,
    },
  },
];

export function getLessonByTrigger(
  triggerType: string,
  category?: string,
  completedLessonIds: string[] = []
): MicroLesson | null {
  const candidates = MICRO_LESSONS.filter((lesson) => {
    if (lesson.triggerType !== triggerType) return false;
    if (completedLessonIds.includes(lesson.id)) return false;
    if (category && lesson.category && lesson.category !== category) return false;
    return true;
  });

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function getLessonById(id: string): MicroLesson | null {
  return MICRO_LESSONS.find((lesson) => lesson.id === id) ?? null;
}

export function getPersonalityResponse(triggerType: string, context: string): string {
  switch (triggerType) {
    case 'budget_exceeded':
      return `${context} Here's something worth knowing...`;
    case 'unusual_pattern':
      return `That's a bigger purchase than usual — no judgment. ${context}`;
    case 'time_based':
      return context;
    case 'near_limit':
      return `You're getting close on ${context} — here's a heads-up before you go over...`;
    default:
      return context;
  }
}
