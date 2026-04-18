import type { PendingTransaction } from '../services/ai';
import type { ContentType } from '../services/functionExecutor';

interface BudgetOverviewData {
  categories: Array<{
    id: string;
    name: string;
    spent: number;
    limit: number;
    remaining: number;
    pct: number;
    status: 'ok' | 'tight' | 'over';
  }>;
  totalRemaining: number;
  overallPercent: number;
}

interface CategoryDetailData {
  category: {
    id: string;
    name: string;
    spent: number;
    weekly_limit: number;
  };
  transactions: Array<{
    amount: number;
    description: string;
  }>;
  remaining: number;
  pct: number;
}

interface TransactionsData {
  transactions: Array<{
    amount: number;
    description: string;
  }>;
}

interface QuestLogData {
  active: Array<{
    title: string;
    progress: number;
    duration_days: number;
    created_at: string;
  }>;
  completed: Array<{ id: number }>;
  xp: number;
}

interface HelpData {
  commands: string[];
}

interface PetStatusData {
  petName: string;
  mood: string;
  health: number;
  streak: number;
  tier: string;
}

interface MoodHistoryData {
  petName: string;
  avgMood: string;
  history: Array<{ day: string; state: string }>;
}

export interface SpokenContentInput {
  type: ContentType;
  data: unknown;
  responseText: string;
}

function formatMoney(value: number): string {
  return `£${Math.abs(value).toFixed(2)}`;
}

function getDaysLeft(createdAt: string, durationDays: number): number {
  const deadline = new Date(new Date(createdAt).getTime() + durationDays * 86400000);
  return Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400000));
}

export function buildContentSpeech(input: SpokenContentInput): string | null {
  const { type, data, responseText } = input;

  switch (type) {
    case 'budget_overview': {
      const overview = data as BudgetOverviewData;
      if (!overview?.categories?.length) {
        return responseText || 'No budget is set up yet.';
      }

      const spotlight = overview.categories[0];
      let summary = `Overall budget ${overview.overallPercent}% used. `;
      summary += overview.totalRemaining >= 0
        ? `${formatMoney(overview.totalRemaining)} left overall. `
        : `${formatMoney(overview.totalRemaining)} over overall. `;

      if (spotlight.status === 'over') {
        summary += `${spotlight.name} is most over budget by ${formatMoney(spotlight.remaining)}. `;
        summary += `Say "check ${spotlight.id} budget" for details or "increase ${spotlight.id} by 5".`;
      } else if (spotlight.status === 'tight') {
        summary += `${spotlight.name} is the tightest category at ${spotlight.pct}% used. `;
        summary += `Say "check ${spotlight.id} budget" for details.`;
      } else {
        summary += 'Everything looks on track.';
      }

      return summary;
    }

    case 'category_detail': {
      const detail = data as CategoryDetailData;
      if (!detail?.category) {
        return responseText || null;
      }

      const { category, remaining, pct, transactions } = detail;
      let summary = `${category.name}: ${formatMoney(category.spent)} of ${formatMoney(category.weekly_limit)}, ${pct}% used. `;
      summary += remaining >= 0
        ? `${formatMoney(remaining)} left. `
        : `${formatMoney(remaining)} over budget. `;

      if (transactions?.length) {
        const recent = transactions
          .slice(0, 2)
          .map((txn) => `${formatMoney(txn.amount)} ${txn.description}`)
          .join(', ');
        summary += `Recent spending: ${recent}. `;
      }

      summary += 'Say "increase by 5" or "decrease by 5" to adjust this budget.';
      return summary;
    }

    case 'transactions': {
      const txns = data as TransactionsData;
      if (!txns?.transactions?.length) {
        return responseText || 'No transactions yet.';
      }

      const summary = txns.transactions
        .slice(0, 3)
        .map((txn) => `${formatMoney(txn.amount)} ${txn.description}`)
        .join(', ');
      return `Recent spending: ${summary}.`;
    }

    case 'quest_log':
    case 'quest_progress': {
      const quests = data as QuestLogData;
      const activeCount = quests?.active?.length ?? 0;
      const completedCount = quests?.completed?.length ?? 0;

      if (!activeCount && !completedCount) {
        return 'No quests yet. Keep logging spending to unlock one.';
      }

      if (!activeCount) {
        return `${completedCount} completed quests. No active quest right now.`;
      }

      const activeQuest = quests.active[0];
      const daysLeft = getDaysLeft(activeQuest.created_at, activeQuest.duration_days);
      return `${activeCount} active quest${activeCount === 1 ? '' : 's'}. Current quest: ${activeQuest.title}. Progress ${activeQuest.progress} of ${activeQuest.duration_days}. ${daysLeft} day${daysLeft === 1 ? '' : 's'} left. ${completedCount} completed.`;
    }

    case 'pet_status': {
      const pet = data as PetStatusData;
      if (!pet?.petName) {
        return responseText || null;
      }
      return `${pet.petName} is ${pet.mood} with ${pet.health} health, a ${pet.streak} day streak, and is at the ${pet.tier} stage.`;
    }

    case 'mood_history': {
      const mood = data as MoodHistoryData;
      if (!mood?.petName) {
        return responseText || null;
      }
      return mood.history.length > 0
        ? `${mood.petName}'s average mood this week is ${mood.avgMood}.`
        : `${mood.petName} does not have enough mood history yet.`;
    }

    case 'help': {
      const help = data as HelpData;
      const commands = help?.commands?.slice(0, 3) ?? [];
      if (!commands.length) {
        return responseText || 'Ask about your budget, quests, or recent spending.';
      }
      return `You can say: ${commands.map((command) => `"${command}"`).join(', ')}.`;
    }

    case 'confirmation': {
      const pending = data as PendingTransaction;
      if (!pending?.categoryName) {
        return responseText || null;
      }
      const pct = pending.budgetLimit > 0
        ? Math.round(((pending.budgetSpent + pending.amount) / pending.budgetLimit) * 100)
        : 0;
      return `${formatMoney(pending.amount)} on ${pending.categoryName} for ${pending.description}. That puts you at ${pct}% of this week's budget. Say yes to confirm or no to cancel.`;
    }

    case 'game_needs_vs_wants':
    case 'game_bnpl':
    case 'savings_projection':
      return responseText || null;

    default:
      return responseText || null;
  }
}
