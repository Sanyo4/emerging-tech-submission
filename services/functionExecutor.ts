import {
  addTransaction,
  updateCategorySpent,
  getBudgetCategory,
  getBudgetCategories,
  getCategorySpendingTotal,
  getTransactionsByCategory,
  getRecentTransactions,
  createChallenge,
  getCompletedLessons,
  getCompletedChallenges,
  markLessonCompleted,
  updateUserXP,
  getActiveChallenges,
  updateChallengeProgress,
  completeChallenge,
  isGameCompleted,
  updateCategoryLimit,
  getUserProfile,
  getPetProfile,
  getPetHealth,
  getPetStateHistory,
} from './database';
import { getLessonByTrigger, getLessonById, getPersonalityResponse, type MicroLesson } from '../data/lessons';
import { XP_AWARDS } from '../utils/gamification';
import { getCoachingReaction } from './petReactions';
import { resolveDialogue } from './petDialogue';

export interface ParsedFunctionCall {
  name: string;
  arguments: Record<string, unknown>;
}

export type ContentType =
  | 'idle'
  | 'budget_overview'
  | 'category_detail'
  | 'quest_log'
  | 'quest_progress'
  | 'pet_status'
  | 'mood_history'
  | 'transactions'
  | 'help'
  | 'confirmation'
  | 'game_needs_vs_wants'
  | 'game_bnpl'
  | 'savings_projection';

export interface FunctionCallResult {
  functionName: string;
  success: boolean;
  params: Record<string, unknown>;
  data?: unknown;
  responseText?: string;
  contentType?: ContentType;
  xpEarned: number;
  lesson?: MicroLesson | null;
  petCoachingDialogue?: string;
  game?: string | null;
}

export async function executeFunctionCall(
  call: ParsedFunctionCall
): Promise<FunctionCallResult> {
  const { name, arguments: params } = call;

  switch (name) {
    case 'log_transaction':
      return handleLogTransaction(params);
    case 'check_budget_status':
      return handleCheckBudgetStatus(params);
    case 'get_spending_summary':
      return handleGetSpendingSummary(params);
    case 'detect_spending_pattern':
      return handleDetectSpendingPattern(params);
    case 'get_micro_lesson':
      return handleGetMicroLesson(params);
    case 'create_challenge':
      return handleCreateChallenge(params);
    case 'calculate_savings_impact':
      return handleCalculateSavingsImpact(params);
    case 'check_time_triggers':
      return handleCheckTimeTriggers(params);
    case 'get_budget_overview':
      return handleGetBudgetOverview(params);
    case 'get_category_detail':
      return handleGetCategoryDetail(params);
    case 'adjust_budget_limit':
      return handleAdjustBudgetLimit(params);
    case 'get_recent_transactions':
      return handleGetRecentTransactions(params);
    case 'get_quest_log':
      return handleGetQuestLog(params);
    case 'accept_challenge':
      return handleAcceptChallenge(params);
    case 'check_pet_status':
      return handleCheckPetStatus(params);
    case 'get_mood_history':
      return handleGetMoodHistory(params);
    case 'get_savings_projection':
      return handleGetSavingsProjection(params);
    case 'get_help':
      return handleGetHelp(params);
    case 'open_settings':
      return handleOpenSettings(params);
    default: {
      // Map common LLM hallucinations to the right handler
      const aliasMap: Record<string, string> = {
        'get_quest_progress': 'get_quest_log',
        'show_budget': 'get_budget_overview',
        'show_quests': 'get_quest_log',
        'create_challenge': 'accept_challenge',
        'start_challenge': 'accept_challenge',
        'view_budget': 'get_budget_overview',
        'navigate_to_screen': 'get_help',
      };
      const resolved = aliasMap[name];
      if (resolved) {
        return executeFunctionCall({ name: resolved, arguments: params });
      }
      return {
        functionName: name,
        success: false,
        params,
        responseText: `I didn't understand that. Try saying "help" to see what I can do.`,
        xpEarned: 0,
      };
    }
  }
}

function withLessonSource(lesson: MicroLesson | null, sourceCategory?: string): MicroLesson | null {
  if (!lesson) return null;

  return {
    ...lesson,
    sourceCategory: sourceCategory ?? lesson.sourceCategory ?? lesson.category,
  };
}

async function handleLogTransaction(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const category = params.category as string;
  const amount = params.amount as number;
  const description = params.description as string;

  try {
    // Step 1: Log the transaction
    await addTransaction(amount, category, description);
    await updateCategorySpent(category, amount);
    await updateUserXP(XP_AWARDS.LOG_TRANSACTION);

    const budgetCat = await getBudgetCategory(category);
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    let totalXP = XP_AWARDS.LOG_TRANSACTION;
    let lesson: MicroLesson | null = null;

    // Step 2: Check budget status
    const spent = budgetCat?.spent ?? 0;
    const limit = budgetCat?.weekly_limit ?? 1;
    const percentage = (spent / limit) * 100;
    const remaining = limit - spent;

    // Step 3: Trigger coaching (priority-ordered, at most ONE)
    const completedLessonRecords = await getCompletedLessons();
    const completedIds = completedLessonRecords.map((l) => l.lesson_id);

    if (percentage > 100) {
      // Priority 1: Budget exceeded
      lesson = getLessonByTrigger('budget_exceeded', category, completedIds);
    } else if (percentage > 80) {
      // Priority 2: Near limit
      lesson = getLessonByTrigger('near_limit', category, completedIds);
    }

    // Priority 3: Spending velocity (only if no lesson triggered yet)
    if (!lesson) {
      try {
        const weeklyTransactions = await getTransactionsByCategory(category, 'weekly');
        if (weeklyTransactions.length > 0) {
          const earliest = new Date(weeklyTransactions[weeklyTransactions.length - 1].timestamp);
          const now = new Date();
          const daysSinceEarliest = (now.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceEarliest <= 2 && percentage > 50) {
            lesson = getLessonByTrigger('near_limit', category, completedIds);
          }
        }
      } catch {}
    }

    // Priority 4: Unusual amount (only if no lesson triggered yet)
    if (!lesson) {
      try {
        const monthlyTransactions = await getTransactionsByCategory(category, 'monthly');
        const amounts = monthlyTransactions.map((t) => t.amount);
        const average = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
        if (average > 0 && amount > average * 1.5) {
          lesson = getLessonByTrigger('unusual_pattern', category, completedIds);
        }
      } catch {}
    }

    // Mark lesson as completed and award XP if one was triggered
    if (lesson) {
      await markLessonCompleted(lesson.id);
      await updateUserXP(XP_AWARDS.VIEW_LESSON);
      totalXP += XP_AWARDS.VIEW_LESSON;
    }

    // Step 3b: Generate pet coaching dialogue when a lesson is triggered
    let petCoachingDialogue: string | undefined;
    if (lesson) {
      try {
        const coaching = getCoachingReaction(lesson.triggerType, category);
        petCoachingDialogue = await resolveDialogue(coaching.templateKey, coaching.slotValues);
      } catch {}
    }

    // Step 4: Update challenge progress
    let challengeCompletionText = '';
    try {
      const activeChallenges = await getActiveChallenges();
      for (const challenge of activeChallenges) {
        if (challenge.category === category || challenge.type === 'track_purchases') {
          const newProgress = challenge.progress + 1;
          await updateChallengeProgress(challenge.id, newProgress);
          if (newProgress >= challenge.duration_days) {
            await completeChallenge(challenge.id);
            await updateUserXP(challenge.xp_reward);
            totalXP += challenge.xp_reward;
            challengeCompletionText = ` Challenge "${challenge.title}" complete! +${challenge.xp_reward} XP!`;
          }
        }
      }
    } catch {}

    // Step 5: Build contextual response
    let responseText: string;
    if (percentage > 100) {
      responseText = `Got it — £${amount.toFixed(2)} ${description} logged to ${categoryName} (£${spent.toFixed(2)}/£${limit.toFixed(2)}). You're £${Math.abs(remaining).toFixed(2)} over budget — let's learn something.`;
    } else if (percentage > 80) {
      responseText = `Got it — £${amount.toFixed(2)} ${description} logged to ${categoryName} (£${spent.toFixed(2)}/£${limit.toFixed(2)}). Heads up — only £${remaining.toFixed(2)} left for ${category} this week.`;
    } else if (percentage > 50) {
      responseText = `Got it — £${amount.toFixed(2)} ${description} logged to ${categoryName} (£${spent.toFixed(2)}/£${limit.toFixed(2)}). Getting there — £${remaining.toFixed(2)} left this week.`;
    } else {
      responseText = `Got it — £${amount.toFixed(2)} ${description} logged to ${categoryName} (£${spent.toFixed(2)}/£${limit.toFixed(2)}). Cruising nicely.`;
    }

    if (challengeCompletionText) {
      responseText += challengeCompletionText;
    }

    // Check if coaching games should trigger
    let game: string | null = null;
    try {
      const recentTxns = await getRecentTransactions(10);
      const discretionaryIds = ['dining', 'fun', 'entertainment', 'shopping', 'coffee', 'impulse', 'social', 'personal', 'wants', 'discretionary'];
      const discretionaryCount = recentTxns.filter(t => discretionaryIds.includes(t.category_id)).length;
      if (discretionaryCount >= 3 && !(await isGameCompleted('needs_vs_wants'))) {
        game = 'needs_vs_wants';
      }
      const installmentKeywords = ['installment', 'klarna', 'clearpay', 'afterpay', 'bnpl', 'pay later'];
      const installmentCount = recentTxns.filter(t => installmentKeywords.some(kw => t.description.toLowerCase().includes(kw))).length;
      if (installmentCount >= 3 && !(await isGameCompleted('bnpl'))) {
        game = 'bnpl';
      }
    } catch { /* game triggers are non-critical */ }

    const resolvedLesson = withLessonSource(lesson, category);

    return {
      functionName: 'log_transaction',
      success: true,
      params,
      data: { transactionId: Date.now(), budgetStatus: budgetCat, percentage },
      responseText,
      xpEarned: totalXP,
      lesson: resolvedLesson,
      petCoachingDialogue,
      game,
    };
  } catch (error) {
    return {
      functionName: 'log_transaction',
      success: false,
      params,
      responseText: 'Failed to log transaction.',
      xpEarned: 0,
    };
  }
}

async function handleCheckBudgetStatus(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const category = params.category as string;

  try {
    const budgetCat = await getBudgetCategory(category);
    if (!budgetCat) {
      return {
        functionName: 'check_budget_status',
        success: false,
        params,
        responseText: `Category "${category}" not found.`,
        xpEarned: 0,
      };
    }

    const remaining = budgetCat.weekly_limit - budgetCat.spent;
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    const exceeded = remaining < 0;

    return {
      functionName: 'check_budget_status',
      success: true,
      params,
      data: {
        category: budgetCat,
        remaining,
        exceeded,
        percentage: (budgetCat.spent / budgetCat.weekly_limit) * 100,
      },
      responseText: exceeded
        ? `${categoryName} budget exceeded by £${Math.abs(remaining).toFixed(2)} (£${budgetCat.spent.toFixed(2)} / £${budgetCat.weekly_limit.toFixed(2)})`
        : `${categoryName}: £${remaining.toFixed(2)} remaining (£${budgetCat.spent.toFixed(2)} / £${budgetCat.weekly_limit.toFixed(2)})`,
      xpEarned: 0,
    };
  } catch (error) {
    return {
      functionName: 'check_budget_status',
      success: false,
      params,
      responseText: 'Failed to check budget status.',
      xpEarned: 0,
    };
  }
}

async function handleGetSpendingSummary(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const category = params.category as string;
  const period = params.period as 'daily' | 'weekly' | 'monthly';

  try {
    const total = await getCategorySpendingTotal(category, period);
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

    return {
      functionName: 'get_spending_summary',
      success: true,
      params,
      data: { total, category, period },
      responseText: `${categoryName} spending (${period}): £${total.toFixed(2)}`,
      xpEarned: 0,
    };
  } catch (error) {
    return {
      functionName: 'get_spending_summary',
      success: false,
      params,
      responseText: 'Failed to get spending summary.',
      xpEarned: 0,
    };
  }
}

async function handleDetectSpendingPattern(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const category = params.category as string;
  const transactionAmount = params.transaction_amount as number;

  try {
    const transactions = await getTransactionsByCategory(category, 'monthly');
    const amounts = transactions.map((t) => t.amount);
    const average = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
    const isUnusual = transactionAmount > average * 1.5;

    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

    return {
      functionName: 'detect_spending_pattern',
      success: true,
      params,
      data: { average, isUnusual, transactionAmount },
      responseText: isUnusual
        ? `This £${transactionAmount.toFixed(2)} ${categoryName} purchase is unusual — your average is £${average.toFixed(2)}`
        : `This £${transactionAmount.toFixed(2)} ${categoryName} purchase is within your normal range (avg: £${average.toFixed(2)})`,
      xpEarned: 0,
    };
  } catch (error) {
    return {
      functionName: 'detect_spending_pattern',
      success: false,
      params,
      responseText: 'Failed to detect spending pattern.',
      xpEarned: 0,
    };
  }
}

async function handleGetMicroLesson(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const triggerType = params.trigger_type as string;
  const category = params.category as string | undefined;
  const severity = params.severity as string;

  try {
    const completedLessonRecords = await getCompletedLessons();
    const completedIds = completedLessonRecords.map((l) => l.lesson_id);

    const lesson = getLessonByTrigger(triggerType, category, completedIds);

    if (!lesson) {
      return {
        functionName: 'get_micro_lesson',
        success: false,
        params,
        responseText: 'No suitable lesson found.',
        xpEarned: 0,
      };
    }

    // Mark lesson as completed and award XP
    await markLessonCompleted(lesson.id);
    await updateUserXP(XP_AWARDS.VIEW_LESSON);

    const categoryName = category
      ? category.charAt(0).toUpperCase() + category.slice(1)
      : '';
    const context = category
      ? `${categoryName} budget's looking tight.`
      : 'Your spending patterns are worth a look.';
    const personalityText = getPersonalityResponse(triggerType, context);

    const resolvedLesson = withLessonSource(lesson, category);

    return {
      functionName: 'get_micro_lesson',
      success: true,
      params,
      data: resolvedLesson,
      responseText: personalityText,
      xpEarned: XP_AWARDS.VIEW_LESSON,
      lesson: resolvedLesson,
    };
  } catch (error) {
    return {
      functionName: 'get_micro_lesson',
      success: false,
      params,
      responseText: 'Failed to get micro lesson.',
      xpEarned: 0,
    };
  }
}

async function handleCreateChallenge(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const challengeType = params.challenge_type as string;
  const category = params.category as string;
  const durationDays = params.duration_days as number;
  const xpReward = params.xp_reward as number;

  try {
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    let title = '';
    let description = '';

    switch (challengeType) {
      case 'reduce_spending':
        title = `Reduce ${categoryName} spending`;
        description = `Cut back on ${category} for ${durationDays} days`;
        break;
      case 'track_purchases':
        title = `Track all ${categoryName} purchases`;
        description = `Log every ${category} purchase for ${durationDays} days`;
        break;
      case 'plan_budget':
        title = `Plan your ${categoryName} budget`;
        description = `Create a spending plan for ${category}`;
        break;
    }

    const challengeId = await createChallenge({
      title,
      description,
      type: challengeType,
      category,
      duration_days: durationDays,
      xp_reward: xpReward,
    });

    await updateUserXP(XP_AWARDS.ACCEPT_CHALLENGE);

    return {
      functionName: 'create_challenge',
      success: true,
      params,
      data: { challengeId, title, xpReward },
      responseText: `Challenge created: "${title}" — ${durationDays} days for +${xpReward} XP!`,
      xpEarned: XP_AWARDS.ACCEPT_CHALLENGE,
    };
  } catch (error) {
    return {
      functionName: 'create_challenge',
      success: false,
      params,
      responseText: 'Failed to create challenge.',
      xpEarned: 0,
    };
  }
}

async function handleCalculateSavingsImpact(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const dailyAmount = params.daily_amount as number;
  const period = params.period as string;

  let multiplier = 1;
  switch (period) {
    case 'weekly':
      multiplier = 7;
      break;
    case 'monthly':
      multiplier = 30;
      break;
    case 'yearly':
      multiplier = 365;
      break;
  }

  const savings = dailyAmount * multiplier;

  return {
    functionName: 'calculate_savings_impact',
    success: true,
    params,
    data: { dailyAmount, period, savings },
    responseText: `£${dailyAmount.toFixed(2)}/day = £${savings.toFixed(2)}/${period}`,
    xpEarned: 0,
  };
}

async function handleCheckTimeTriggers(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const currentDay = params.current_day as string;
  const currentTime = params.current_time as string;
  const hour = parseInt(currentTime.split(':')[0], 10);
  const today = new Date();

  const activeChallenges = await getActiveChallenges();
  if (activeChallenges.length > 0) {
    return {
      functionName: 'check_time_triggers',
      success: true,
      params,
      data: { triggered: false, reason: 'active_challenge' },
      responseText: '',
      xpEarned: 0,
    };
  }

  const completedLessonRecords = await getCompletedLessons();
  const hasTimeLessonToday = completedLessonRecords.some((record) => {
    const lesson = getLessonById(record.lesson_id);
    return lesson?.triggerType === 'time_based' && new Date(record.completed_at).toDateString() === today.toDateString();
  });

  if (hasTimeLessonToday) {
    return {
      functionName: 'check_time_triggers',
      success: true,
      params,
      data: { triggered: false, reason: 'already_shown_today' },
      responseText: '',
      xpEarned: 0,
    };
  }

  let triggerType: string | null = null;
  let responseText = '';

  // Payday trigger: 25th-28th of month or last few days
  const dayOfMonth = today.getDate();
  if (dayOfMonth >= 25 && dayOfMonth <= 28) {
    triggerType = 'time_based';
    responseText = "Payday's coming up — let's plan your budget so your money has a job before it arrives.";
  }

  // Weekend trigger: Friday evening or Saturday/Sunday
  if (
    (currentDay === 'Friday' && hour >= 17) ||
    currentDay === 'Saturday' ||
    currentDay === 'Sunday'
  ) {
    triggerType = 'time_based';
    responseText = "It's the weekend! Remember, weekend spending tends to be 40% higher. Set a cap to enjoy yourself guilt-free.";
  }

  // Month-end trigger: last 2 days of month
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  if (dayOfMonth >= lastDay - 1) {
    triggerType = 'time_based';
    responseText = "Month's almost over — time for a quick spending review. Let's see how you did.";
  }

  if (!triggerType) {
    return {
      functionName: 'check_time_triggers',
      success: true,
      params,
      data: { triggered: false },
      responseText: '',
      xpEarned: 0,
    };
  }

  // Get a time-based lesson
  const completedIds = completedLessonRecords.map((l) => l.lesson_id);
  const lesson = getLessonByTrigger('time_based', undefined, completedIds);

  if (!lesson) {
    return {
      functionName: 'check_time_triggers',
      success: true,
      params,
      data: { triggered: false, reason: 'no_new_lessons' },
      responseText: '',
      xpEarned: 0,
    };
  }

  await markLessonCompleted(lesson.id);
  await updateUserXP(XP_AWARDS.VIEW_LESSON);

  const resolvedLesson = withLessonSource(lesson);

  return {
    functionName: 'check_time_triggers',
    success: true,
    params,
    data: { triggered: true, triggerType },
    responseText,
    xpEarned: resolvedLesson ? XP_AWARDS.VIEW_LESSON : 0,
    lesson: resolvedLesson,
  };
}

// ========== New Voice-First Handlers ==========

async function handleGetBudgetOverview(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  try {
    const categories = await getBudgetCategories();
    const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
    const totalLimit = categories.reduce((sum, c) => sum + c.weekly_limit, 0);
    const totalRemaining = totalLimit - totalSpent;
    const overallPercent = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
    const severityRank: Record<'ok' | 'tight' | 'over', number> = { ok: 0, tight: 1, over: 2 };

    const categoryLines = categories.map((c) => {
      const pct = c.weekly_limit > 0 ? Math.round((c.spent / c.weekly_limit) * 100) : 0;
      const remaining = c.weekly_limit - c.spent;
      const name = c.name.charAt(0).toUpperCase() + c.name.slice(1);
      const status: 'ok' | 'tight' | 'over' = remaining < 0 ? 'over' : pct > 80 ? 'tight' : 'ok';
      return { name, spent: c.spent, limit: c.weekly_limit, remaining, pct, status, id: c.id };
    }).sort((left, right) => {
      const severityDiff = severityRank[right.status] - severityRank[left.status];
      if (severityDiff !== 0) return severityDiff;
      if (left.status === 'over' && right.status === 'over') {
        return Math.abs(right.remaining) - Math.abs(left.remaining);
      }
      return right.pct - left.pct;
    });

    // Build TTS-friendly response
    const tightCategories = categoryLines.filter((c) => c.status === 'tight' || c.status === 'over');
    const spotlight = tightCategories[0] ?? categoryLines[0];
    let responseText = `Your budget is ${overallPercent}% used this week. `;
    if (totalRemaining > 0) {
      responseText += `\u00A3${totalRemaining.toFixed(2)} left overall. `;
    } else {
      responseText += `You're \u00A3${Math.abs(totalRemaining).toFixed(2)} over budget overall. `;
    }
    if (spotlight) {
      if (spotlight.status === 'over') {
        responseText += `${spotlight.name} is the most over budget at \u00A3${Math.abs(spotlight.remaining).toFixed(2)} over. `;
      } else if (spotlight.status === 'tight') {
        responseText += `${spotlight.name} is the tightest category at ${spotlight.pct}% used. `;
      } else {
        responseText += 'Everything looks on track. ';
      }

      if (spotlight.status === 'ok') {
        responseText += `Say "check ${spotlight.id} budget" if you want details.`;
      } else {
        responseText += `Say "check ${spotlight.id} budget" for details or "increase ${spotlight.id} by 5" to adjust it.`;
      }
    } else {
      responseText += 'Everything looks on track.';
    }

    return {
      functionName: 'get_budget_overview',
      success: true,
      params,
      data: { categories: categoryLines, totalSpent, totalLimit, totalRemaining, overallPercent },
      responseText,
      contentType: 'budget_overview',
      xpEarned: 0,
    };
  } catch {
    return { functionName: 'get_budget_overview', success: false, params, responseText: 'Failed to get budget overview.', xpEarned: 0 };
  }
}

async function handleGetCategoryDetail(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const category = params.category as string;
  try {
    const budgetCat = await getBudgetCategory(category);
    if (!budgetCat) {
      return { functionName: 'get_category_detail', success: false, params, responseText: `Category "${category}" not found.`, xpEarned: 0 };
    }
    const transactions = await getTransactionsByCategory(category, 'weekly');
    const recent = transactions.slice(0, 5);
    const remaining = budgetCat.weekly_limit - budgetCat.spent;
    const pct = budgetCat.weekly_limit > 0 ? Math.round((budgetCat.spent / budgetCat.weekly_limit) * 100) : 0;
    const categoryName = budgetCat.name.charAt(0).toUpperCase() + budgetCat.name.slice(1);

    let responseText = `${categoryName}: \u00A3${budgetCat.spent.toFixed(2)} of \u00A3${budgetCat.weekly_limit.toFixed(2)}, ${pct}% used. `;
    if (remaining > 0) {
      responseText += `\u00A3${remaining.toFixed(2)} left. `;
    } else {
      responseText += `\u00A3${Math.abs(remaining).toFixed(2)} over budget. `;
    }
    if (recent.length > 0) {
      responseText += 'Recent: ' + recent.map((t) => `\u00A3${t.amount.toFixed(2)} ${t.description}`).join(', ') + '.';
    } else {
      responseText += 'No transactions this week.';
    }
    responseText += ' Say "increase by 5" or "decrease by 5" to adjust this budget.';

    return {
      functionName: 'get_category_detail',
      success: true,
      params,
      data: { category: budgetCat, transactions: recent, remaining, pct },
      responseText,
      contentType: 'category_detail',
      xpEarned: 0,
    };
  } catch {
    return { functionName: 'get_category_detail', success: false, params, responseText: 'Failed to get category details.', xpEarned: 0 };
  }
}

async function handleAdjustBudgetLimit(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const category = params.category as string;
  const direction = params.direction as 'increase' | 'decrease' | undefined;
  const amount = (params.amount as number) || 5;
  const targetAmount = params.target_amount as number | undefined;

  try {
    const budgetCat = await getBudgetCategory(category);
    if (!budgetCat) {
      return { functionName: 'adjust_budget_limit', success: false, params, responseText: `Category "${category}" not found.`, xpEarned: 0 };
    }
    const categoryName = budgetCat.name.charAt(0).toUpperCase() + budgetCat.name.slice(1);

    // If no direction specified, show current limit and ask
    if (!direction && targetAmount === undefined) {
      const remaining = budgetCat.weekly_limit - budgetCat.spent;
      const transactions = await getTransactionsByCategory(category, 'weekly');
      const recent = transactions.slice(0, 5);
      return {
        functionName: 'adjust_budget_limit',
        success: true,
        params,
        data: { category: budgetCat, transactions: recent, remaining, pct: budgetCat.weekly_limit > 0 ? Math.round((budgetCat.spent / budgetCat.weekly_limit) * 100) : 0 },
        responseText: `${categoryName} limit is \u00A3${budgetCat.weekly_limit.toFixed(2)} per week. \u00A3${budgetCat.spent.toFixed(2)} spent so far. Say "increase by 5" or "decrease by 5" to adjust.`,
        contentType: 'category_detail',
        xpEarned: 0,
      };
    }

    const oldLimit = budgetCat.weekly_limit;
    const delta = direction === 'increase' ? amount : direction === 'decrease' ? -amount : 0;
    const newLimit = Math.max(0, targetAmount ?? (oldLimit + delta));

    await updateCategoryLimit(category, newLimit);
    const refreshedCategory = await getBudgetCategory(category);
    const transactions = await getTransactionsByCategory(category, 'weekly');
    const recent = transactions.slice(0, 5);
    const categoryData = refreshedCategory ?? { ...budgetCat, weekly_limit: newLimit };
    const remaining = categoryData.weekly_limit - categoryData.spent;
    const pct = categoryData.weekly_limit > 0
      ? Math.round((categoryData.spent / categoryData.weekly_limit) * 100)
      : 0;

    return {
      functionName: 'adjust_budget_limit',
      success: true,
      params,
      data: { category: categoryData, transactions: recent, remaining, pct },
      responseText: `${categoryName} limit changed from \u00A3${oldLimit.toFixed(2)} to \u00A3${newLimit.toFixed(2)} per week. Say "increase by 5" or "decrease by 5" to adjust again.`,
      contentType: 'category_detail',
      xpEarned: 0,
    };
  } catch {
    return { functionName: 'adjust_budget_limit', success: false, params, responseText: 'Failed to adjust budget limit.', xpEarned: 0 };
  }
}

async function handleGetRecentTransactions(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const count = (params.count as number) || 5;
  try {
    const transactions = await getRecentTransactions(count);
    if (transactions.length === 0) {
      return {
        functionName: 'get_recent_transactions',
        success: true,
        params,
        data: { transactions: [] },
        responseText: "No transactions yet. Tell me what you've spent!",
        xpEarned: 0,
      };
    }

    const lines = transactions.map((t) => {
      const day = new Date(t.timestamp).toLocaleDateString('en-GB', { weekday: 'short' });
      return `\u00A3${t.amount.toFixed(2)} ${t.description} (${day})`;
    });
    const responseText = `Last ${transactions.length}: ${lines.join(', ')}.`;

    return {
      functionName: 'get_recent_transactions',
      success: true,
      params,
      data: { transactions },
      responseText,
      contentType: 'transactions',
      xpEarned: 0,
    };
  } catch {
    return { functionName: 'get_recent_transactions', success: false, params, responseText: 'Failed to get transactions.', xpEarned: 0 };
  }
}

async function handleGetQuestLog(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  try {
    const active = await getActiveChallenges();
    const completed = await getCompletedChallenges();
    const profile = await getUserProfile();

    let responseText = '';
    if (active.length > 0) {
      const questLines = active.map(
        (c) => `"${c.title}" \u2014 ${c.progress}/${c.duration_days} days`
      );
      responseText = `Active quests: ${questLines.join('. ')}. `;
    } else {
      responseText = 'No active quests. ';
    }
    responseText += `${completed.length} completed. `;
    if (profile) {
      responseText += `Level ${profile.level}, ${profile.xp} care points.`;
    }

    return {
      functionName: 'get_quest_log',
      success: true,
      params,
      data: { active, completed, level: profile?.level ?? 1, xp: profile?.xp ?? 0 },
      responseText,
      contentType: 'quest_log',
      xpEarned: 0,
    };
  } catch {
    return { functionName: 'get_quest_log', success: false, params, responseText: 'Failed to get quest log.', xpEarned: 0 };
  }
}

async function handleAcceptChallenge(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  try {
    // Check if there's already an active challenge
    const active = await getActiveChallenges();
    if (active.length > 0) {
      return {
        functionName: 'accept_challenge',
        success: false,
        params,
        responseText: `You already have an active quest: "${active[0].title}". Finish it first!`,
        xpEarned: 0,
      };
    }

    const challengeType = (params.challenge_type as string) || 'track_purchases';
    const titles: Record<string, { title: string; desc: string }> = {
      track_purchases: { title: 'Track every purchase', desc: 'Log every purchase for 3 days' },
      reduce_spending: { title: 'Spend less this week', desc: 'Try to reduce your spending for 3 days' },
      plan_budget: { title: 'Plan your budget', desc: 'Review and plan your budget for 3 days' },
    };
    const template = titles[challengeType] || titles.track_purchases;

    await createChallenge({
      title: template.title,
      description: template.desc,
      type: challengeType,
      category: 'general',
      duration_days: 3,
      xp_reward: 30,
    });
    await updateUserXP(XP_AWARDS.ACCEPT_CHALLENGE);

    return {
      functionName: 'accept_challenge',
      success: true,
      params,
      data: { title: template.title, duration: 3, xpReward: 30 },
      responseText: `Challenge accepted! "${template.title}" \u2014 3 days for 30 care points. Let's do this!`,
      contentType: 'quest_log',
      xpEarned: XP_AWARDS.ACCEPT_CHALLENGE,
    };
  } catch {
    return { functionName: 'accept_challenge', success: false, params, responseText: 'Failed to start challenge.', xpEarned: 0 };
  }
}

async function handleCheckPetStatus(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  try {
    const pet = await getPetProfile();
    const health = await getPetHealth();
    const profile = await getUserProfile();

    const petName = pet?.name ?? 'Buddy';
    const mood = pet?.current_state ?? 'neutral';
    const streak = profile?.streak_days ?? 0;

    const moodLabel = mood.charAt(0).toUpperCase() + mood.slice(1);

    return {
      functionName: 'check_pet_status',
      success: true,
      params,
      data: { petName, mood, health, streak },
      responseText: `${petName} is ${moodLabel} with ${health} health points. ${streak}-day streak.`,
      contentType: 'pet_status',
      xpEarned: 0,
    };
  } catch {
    return { functionName: 'check_pet_status', success: false, params, responseText: 'Failed to check pet status.', xpEarned: 0 };
  }
}

async function handleGetMoodHistory(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const days = (params.days as number) || 7;
  try {
    const history = await getPetStateHistory(days);
    const pet = await getPetProfile();
    const petName = pet?.name ?? 'Buddy';

    if (history.length === 0) {
      return {
        functionName: 'get_mood_history',
        success: true,
        params,
        data: { history: [], petName },
        responseText: `${petName} doesn't have much history yet. Keep logging to build it up!`,
        xpEarned: 0,
      };
    }

    // Group by day, take last entry per day
    const byDay = new Map<string, { day: string; state: string }>();
    for (const entry of history) {
      const date = new Date(entry.timestamp);
      const dayKey = date.toLocaleDateString('en-GB', { weekday: 'short' });
      byDay.set(date.toDateString(), { day: dayKey, state: entry.state });
    }
    const dailyMoods = Array.from(byDay.values()).slice(0, 7);

    const moodLine = dailyMoods.map((d) => `${d.day} ${d.state}`).join(', ');
    const states = dailyMoods.map((d) => d.state);
    const moodOrder = ['critical', 'worried', 'neutral', 'happy', 'thriving'];
    const avgIndex = Math.round(states.reduce((sum, s) => sum + moodOrder.indexOf(s), 0) / states.length);
    const avgMood = moodOrder[Math.max(0, Math.min(avgIndex, 4))];

    return {
      functionName: 'get_mood_history',
      success: true,
      params,
      data: { history: dailyMoods, avgMood, petName },
      responseText: `${petName}'s week: ${moodLine}. Average: ${avgMood}.`,
      contentType: 'mood_history',
      xpEarned: 0,
    };
  } catch {
    return { functionName: 'get_mood_history', success: false, params, responseText: 'Failed to get mood history.', xpEarned: 0 };
  }
}

async function handleGetSavingsProjection(
  params: Record<string, unknown>
): Promise<FunctionCallResult> {
  const dailyAmount = params.daily_amount as number;
  const period = params.period as string;

  const multipliers: Record<string, number> = { weekly: 7, monthly: 30, yearly: 365 };
  const multiplier = multipliers[period] || 30;
  const savings = dailyAmount * multiplier;

  const weekly = dailyAmount * 7;
  const monthly = dailyAmount * 30;
  const yearly = dailyAmount * 365;

  return {
    functionName: 'get_savings_projection',
    success: true,
    params,
    data: { dailyAmount, weekly, monthly, yearly },
    responseText: `\u00A3${dailyAmount.toFixed(2)} a day adds up to \u00A3${weekly.toFixed(2)} a week, \u00A3${monthly.toFixed(2)} a month, and \u00A3${yearly.toFixed(2)} a year.`,
    contentType: 'savings_projection',
    xpEarned: 0,
  };
}

async function handleGetHelp(
  _params: Record<string, unknown>
): Promise<FunctionCallResult> {
  // Build contextual help
  let contextHint = '';
  try {
    const categories = await getBudgetCategories();
    const tight = categories.find((c) => c.spent / c.weekly_limit > 0.8);
    if (tight) {
      const name = tight.name.charAt(0).toUpperCase() + tight.name.slice(1);
      contextHint = ` Right now your ${name} budget is getting tight \u2014 try saying "check ${tight.id} budget".`;
    }
    const active = await getActiveChallenges();
    if (active.length > 0) {
      contextHint += ` You've got an active quest \u2014 try saying "quest progress".`;
    }
  } catch {}

  const commands = [
    '"spent 5 on coffee"',
    '"show my budget"',
    '"check food budget"',
    '"increase food by 5"',
    '"set food to 40"',
    '"show my quests"',
    '"start a challenge"',
    '"how\'s Buddy?"',
    '"what did I spend?"',
    '"if I save 3 a day"',
  ];

  return {
    functionName: 'get_help',
    success: true,
    params: _params,
    data: { commands },
    responseText: `You can tell me what you spent, ask about your budget, check on quests, or ask how I'm doing.${contextHint}`,
    contentType: 'help',
    xpEarned: 0,
  };
}

function handleOpenSettings(
  _params: Record<string, unknown>
): FunctionCallResult {
  return {
    functionName: 'open_settings',
    success: true,
    params: _params,
    responseText: 'Opening settings.',
    xpEarned: 0,
  };
}
