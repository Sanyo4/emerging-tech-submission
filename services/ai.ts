// On-device AI via Cactus (FunctionGemma) — no cloud dependency
import {
  CactusLM,
  type CactusLMMessage,
  type CactusLMTool,
} from 'cactus-react-native';

import { getUserFacingFunctions } from '../data/functionDefs';
import type { MicroLesson } from '../data/lessons';
import { executeFunctionCall, type FunctionCallResult, type ContentType } from './functionExecutor';
import { getBudgetCategories, getBudgetCategory, getAppSettings, type BudgetCategory } from './database';
import { getPlanById } from '../data/plans';
import { conversationContext, type ContextResult } from './conversationContext';

export interface PendingTransaction {
  amount: number;
  category: string;
  categoryName: string;
  description: string;
  budgetSpent: number;
  budgetLimit: number;
}

export interface AIResult {
  responseText: string;
  executedFunctions: FunctionCallResult[];
  lesson?: MicroLesson | null;
  xpEarned: number;
  contentType?: ContentType;
  pendingTransaction?: PendingTransaction | null;
  game?: string | null;
  lessonAction?: 'accept' | 'dismiss';
}

const PERSONA_PROMPTS: Record<string, string> = {
  beginner: 'Communication style: Keep it simple. No financial jargon. Use plain everyday language.',
  learner: 'Communication style: Explain the why behind financial concepts. Use some terminology but always explain it.',
  pro: 'Communication style: Use precise financial terminology. Reference ISA rates, APR, compound interest when relevant.',
};

class GemmaAIService {
  private model: CactusLM | null = null;
  private isInitialized = false;
  private isInitializing = false;
  // Tracks the last category referenced — for follow-up commands like "increase by 5"
  private lastCategoryId: string | null = null;

  async init(onProgress?: (progress: number) => void): Promise<void> {
    if (this.isInitialized || this.isInitializing) return;
    this.isInitializing = true;

    try {
      this.model = new CactusLM({
        model: 'functiongemma-270m-it',
      });
      await this.model.download({
        onProgress: (progress) => {
          onProgress?.(progress);
        },
      });
      await this.model.init();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AI model:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  getInitStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * Phase 1: Parse user input — deterministic routing first, Gemma only for spending NLU.
   *
   * Architecture (in priority order):
   * 1. ConversationContext intercept (confirmation, games, lesson offers)
   * 2. Deterministic keyword router (instant, 100% reliable)
   * 3. Gemma LLM (only for log_transaction — the one task needing NLU)
   * 4. Fallback keyword parser (catches Gemma misses for spending)
   */
  async parseUserInput(userText: string): Promise<AIResult> {
    // 1. Conversation context intercept (multi-step flows)
    const contextResult = await conversationContext.intercept(userText);
    if (contextResult.handled) {
      return this.contextResultToAIResult(contextResult);
    }

    const lowerText = userText.toLowerCase().trim();

    // 2. Deterministic keyword router — handles ~80% of intents instantly
    const deterministicResult = await this.deterministicRoute(lowerText, userText);
    if (deterministicResult) return deterministicResult;

    // 3. Gemma LLM — only for spending/transaction parsing (NLU)
    // This is the one task where keyword matching isn't enough:
    // "spent 5 quid on a flat white" → {category: 'coffee', amount: 5, description: 'flat white'}
    const gemmaResult = await this.parseWithGemma(userText);
    if (gemmaResult) return gemmaResult;

    // 4. Fallback — keyword-based spending detection
    return this.fallbackSpendingParse(userText);
  }

  /**
   * Deterministic router — keyword matching for all non-spending intents.
   * Returns null if no match (passes through to Gemma).
   */
  private async deterministicRoute(lower: string, original: string): Promise<AIResult | null> {
    const categories = await getBudgetCategories();
    const matchedCategory = this.findMatchedCategory(lower, categories);
    const amountMatch = original.match(/(\d+(?:\.\d{1,2})?)/);
    const parsedAmount = amountMatch ? parseFloat(amountMatch[1]) : undefined;

    const hasBudgetAdjustIntent = [
      /\badjust\b/,
      /change limit/,
      /\bincrease\b/,
      /\bdecrease\b/,
      /\braise\b/,
      /\blower\b/,
      /\breduce\b/,
      /\bedit\b/,
      /\bset\b/,
      /\bmake\b/,
    ].some((pattern) => pattern.test(lower));
    if (hasBudgetAdjustIntent) {
      let targetCategory = matchedCategory;

      if (!targetCategory && this.lastCategoryId) {
        targetCategory = categories.find((category) => category.id === this.lastCategoryId) ?? undefined;
      }

      if (!targetCategory) {
        return {
          responseText: 'Which category? Say "increase food by 5" or "set coffee to 20".',
          executedFunctions: [],
          lesson: null,
          xpEarned: 0,
        };
      }

      const direction = lower.includes('increase') || lower.includes('raise') || lower.includes('more')
        ? 'increase'
        : lower.includes('decrease') || lower.includes('lower') || lower.includes('less') || lower.includes('reduce')
          ? 'decrease'
          : undefined;

      const args: Record<string, unknown> = { category: targetCategory.id };
      if ((lower.includes('set') || lower.includes('make')) && parsedAmount !== undefined) {
        args.target_amount = parsedAmount;
      } else {
        if (direction) args.direction = direction;
        if (parsedAmount !== undefined) args.amount = parsedAmount;
      }

      return this.executeDeterministic('adjust_budget_limit', args);
    }

    const categoryDetailKeywords = ['tell me about', 'details for', 'how much', 'about my', 'check', 'show', 'budget for'];
    const wantsCategoryBudget = Boolean(matchedCategory) && (
      categoryDetailKeywords.some((kw) => lower.includes(kw)) ||
      (lower.includes('budget') && !lower.includes("how's my budget") && !lower.includes('show my budget') && !lower.includes('overall'))
    );
    if (matchedCategory && wantsCategoryBudget) {
      return this.executeDeterministic('get_category_detail', { category: matchedCategory.id });
    }

    // Static intent routes — order: specific phrases before generic words
    const routes: Array<{ fn: string; args: Record<string, unknown>; keywords: string[] }> = [
      { fn: 'get_help', args: {}, keywords: ['help', 'what can i do', 'what can i say'] },
      { fn: 'open_settings', args: {}, keywords: ['settings', 'open settings', 'preferences', 'edit name', 'rename'] },
      { fn: 'accept_challenge', args: {}, keywords: ['start a challenge', 'accept challenge', 'new quest', 'start quest', 'start challenge'] },
      { fn: 'get_budget_overview', args: {}, keywords: ['budget', 'budgets', 'how much left', 'overview', "how's my budget"] },
      { fn: 'get_quest_log', args: {}, keywords: ['quest log', 'quests', 'quest progress', 'challenges', 'my challenges', 'show quests'] },
      { fn: 'check_pet_status', args: {}, keywords: ['how is buddy', "how's buddy", 'pet status', 'how are you'] },
      { fn: 'get_recent_transactions', args: {}, keywords: ['recent', 'last transactions', 'what did i spend', 'history', 'what have i spent'] },
      { fn: 'get_mood_history', args: {}, keywords: ['mood history', 'mood', 'how has buddy been'] },
      { fn: 'accept_challenge', args: {}, keywords: ['challenge'] }, // generic "challenge" as last resort
    ];

    for (const route of routes) {
      if (route.keywords.some((kw) => lower.includes(kw))) {
        return this.executeDeterministic(route.fn, route.args);
      }
    }

    // Savings projection — needs number extraction
    const saveMatch = lower.match(/(?:save|saving)\s*(?:\u00A3)?(\d+(?:\.\d{1,2})?)/);
    if (saveMatch) {
      const period = lower.includes('year') ? 'yearly' : lower.includes('week') ? 'weekly' : 'monthly';
      return this.executeDeterministic('get_savings_projection', { daily_amount: parseFloat(saveMatch[1]), period });
    }

    return null; // No deterministic match — pass to Gemma
  }

  /**
   * Execute a deterministically-routed function and return as AIResult.
   */
  private async executeDeterministic(fn: string, args: Record<string, unknown>): Promise<AIResult> {
    const fnResult = await executeFunctionCall({ name: fn, arguments: args });
    const categoryArg = typeof args.category === 'string' ? args.category : null;
    if (fnResult.success) {
      if (fn === 'get_budget_overview') {
        this.lastCategoryId = null;
      } else if (categoryArg && ['get_category_detail', 'adjust_budget_limit', 'check_budget_status'].includes(fn)) {
        this.lastCategoryId = categoryArg;
      }
    }
    return {
      responseText: fnResult.responseText || '',
      executedFunctions: [fnResult],
      lesson: null,
      xpEarned: fnResult.xpEarned,
      contentType: fnResult.contentType,
    };
  }

  /**
   * Gemma LLM — only called for spending/transaction parsing.
   * Stripped-down prompt: only log_transaction + check_budget_status + get_spending_summary.
   * Lower temperature (0.0), topK=1 for greedy deterministic decoding.
   */
  private async parseWithGemma(userText: string): Promise<AIResult | null> {
    if (!this.isInitialized || !this.model) return null;

    const budgetState = await getBudgetCategories();
    const categoryIds = budgetState.map((c) => c.id);
    const budgetContext = this.buildBudgetContext(budgetState);

    // Only send spending-related functions to Gemma — its strength
    const spendingFunctions = getUserFacingFunctions(categoryIds).filter(
      (fn) => ['log_transaction', 'check_budget_status', 'get_spending_summary', 'get_category_detail'].includes(fn.name)
    );

    const tools: CactusLMTool[] = spendingFunctions.map((fn) => ({
      name: fn.name,
      description: fn.description,
      parameters: {
        type: 'object' as const,
        properties: Object.fromEntries(
          Object.entries(fn.parameters.properties).map(([key, val]) => [
            key,
            { type: val.type, description: val.description + (val.enum ? ` (one of: ${val.enum.join(', ')})` : '') },
          ])
        ),
        required: fn.parameters.required,
      },
    }));

    const messages: CactusLMMessage[] = [
      {
        role: 'system',
        content: `Parse spending input. Extract the category, amount, and description.
Call log_transaction for spending. Call check_budget_status or get_spending_summary for queries.
Categories: ${categoryIds.join(', ')}
${budgetContext}`,
      },
      { role: 'user', content: userText },
    ];

    try {
      const result = await this.model.complete({
        messages,
        tools,
        options: {
          temperature: 0.0,    // Greedy — deterministic
          topK: 1,             // Always pick most probable token
          maxTokens: 128,      // Function calls are short
          forceTools: true,
        },
      });

      if (!result.functionCalls?.length) return null;

      let pendingTransaction: PendingTransaction | null = null;
      const executedFunctions: FunctionCallResult[] = [];
      let totalXP = 0;
      let responseText = '';
      let contentType: ContentType | undefined;
      let lessonResult: AIResult['lesson'] = null;

      for (const call of result.functionCalls) {
        if (call.name === 'log_transaction') {
          const args = call.arguments as Record<string, unknown>;
          const category = args.category as string;
          const amount = args.amount as number;
          const description = (args.description as string) || category;

          const budgetCat = await getBudgetCategory(category);
          const catName = budgetState.find((c) => c.id === category)?.name || category;

          pendingTransaction = {
            amount,
            category,
            categoryName: catName,
            description,
            budgetSpent: budgetCat?.spent ?? 0,
            budgetLimit: budgetCat?.weekly_limit ?? 0,
          };
        } else {
          const fnResult = await executeFunctionCall({
            name: call.name,
            arguments: call.arguments as Record<string, unknown>,
          });
          const categoryArg = (call.arguments as Record<string, unknown>).category;
          if (fnResult.success) {
            if (call.name === 'get_budget_overview') {
              this.lastCategoryId = null;
            } else if (
              typeof categoryArg === 'string' &&
              ['check_budget_status', 'get_category_detail', 'adjust_budget_limit'].includes(call.name)
            ) {
              this.lastCategoryId = categoryArg;
            }
          }
          executedFunctions.push(fnResult);
          totalXP += fnResult.xpEarned;
          if (fnResult.responseText) responseText = fnResult.responseText;
          if (fnResult.contentType) contentType = fnResult.contentType;
          if (fnResult.lesson) lessonResult = fnResult.lesson;
        }
      }

      if (pendingTransaction) {
        conversationContext.startConfirmation(pendingTransaction);
        contentType = 'confirmation';
      }

      if (!responseText && executedFunctions.length > 0) {
        responseText = this.buildResponseText(executedFunctions);
      }

      return {
        responseText: responseText || '',
        executedFunctions,
        lesson: lessonResult,
        xpEarned: totalXP,
        contentType,
        pendingTransaction,
      };
    } catch (error) {
      console.error('Gemma parsing error:', error);
      return null; // Fall through to keyword spending parser
    }
  }

  /**
   * Phase 2: Execute a confirmed transaction.
   * Called after user confirms in the ConfirmationSheet.
   */
  async executeConfirmedTransaction(pending: PendingTransaction): Promise<AIResult> {
    const fnResult = await executeFunctionCall({
      name: 'log_transaction',
      arguments: {
        category: pending.category,
        amount: pending.amount,
        description: pending.description,
      },
    });

    // Start game flow if triggered
    if (fnResult.game) {
      conversationContext.startGame(fnResult.game as 'needs_vs_wants' | 'bnpl');
    }

    return {
      responseText: fnResult.responseText || `Logged \u00A3${pending.amount.toFixed(2)} to ${pending.categoryName}`,
      executedFunctions: [fnResult],
      lesson: fnResult.lesson || null,
      xpEarned: fnResult.xpEarned,
      contentType: fnResult.game ? (fnResult.game === 'needs_vs_wants' ? 'game_needs_vs_wants' : 'game_bnpl') : undefined,
      game: fnResult.game || null,
    };
  }

  /**
   * Legacy method — calls parseUserInput for backward compatibility.
   * @deprecated Use parseUserInput + executeConfirmedTransaction instead.
   */
  async processUserInput(userText: string): Promise<AIResult> {
    return this.parseUserInput(userText);
  }

  async checkTimeTriggers(): Promise<AIResult | null> {
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const fnResult = await executeFunctionCall({
      name: 'check_time_triggers',
      arguments: { current_day: currentDay, current_time: currentTime },
    });

    if (fnResult.success && fnResult.lesson) {
      return {
        responseText: fnResult.responseText || '',
        executedFunctions: [fnResult],
        lesson: fnResult.lesson,
        xpEarned: fnResult.xpEarned,
      };
    }

    return null;
  }

  private contextResultToAIResult(ctx: ContextResult): AIResult {
    return {
      responseText: ctx.responseText || '',
      executedFunctions: [],
      lesson: null,
      xpEarned: ctx.xpEarned || 0,
      contentType: ctx.contentType,
      pendingTransaction: ctx.executeTransaction ?? (ctx.contentType === 'confirmation' ? (ctx.data as PendingTransaction) : null),
      game: ctx.gameState?.type || null,
      lessonAction: ctx.lessonAction,
    };
  }

  private findMatchedCategory(lowerText: string, categories: BudgetCategory[]): BudgetCategory | undefined {
    return categories.find(
      (category) =>
        lowerText.includes(category.name.toLowerCase()) ||
        lowerText.includes(category.id.toLowerCase())
    );
  }

  private buildBudgetContext(categories: BudgetCategory[]): string {
    return categories
      .map(
        (cat) =>
          `- ${cat.name} (${cat.icon}): \u00A3${cat.spent.toFixed(2)} / \u00A3${cat.weekly_limit.toFixed(2)} ${cat.spent > cat.weekly_limit ? '\u26A0\uFE0F EXCEEDED' : cat.spent > cat.weekly_limit * 0.8 ? '\u26A0\uFE0F Near limit' : '\u2705 OK'}`
      )
      .join('\n');
  }

  private buildResponseText(executedFunctions: FunctionCallResult[]): string {
    const logFn = executedFunctions.find((f) => f.functionName === 'log_transaction');
    if (logFn && logFn.success) {
      const params = logFn.params as Record<string, unknown>;
      return `Got it \u2014 \u00A3${params.amount} ${params.description} logged to ${(params.category as string).charAt(0).toUpperCase() + (params.category as string).slice(1)}`;
    }
    return '';
  }

  /**
   * Last-resort spending parser — keyword matching for transaction detection.
   * Called only after deterministic router AND Gemma both failed.
   */
  private async fallbackSpendingParse(userText: string): Promise<AIResult> {
    const lowerText = userText.toLowerCase();

    // Build keyword map from DB categories + plan categories
    const categories = await getBudgetCategories();
    const settings = await getAppSettings();
    const plan = settings?.selected_plan_id ? getPlanById(settings.selected_plan_id) : null;

    const categoryKeywords: Record<string, string[]> = {};
    for (const cat of categories) {
      categoryKeywords[cat.id] = [cat.name.toLowerCase()];
    }
    if (plan) {
      for (const planCat of plan.categories) {
        if (categoryKeywords[planCat.id]) {
          categoryKeywords[planCat.id] = [...new Set([...categoryKeywords[planCat.id], ...planCat.keywords])];
        }
      }
    }

    const fallbackKeywords: Record<string, string[]> = {
      coffee: ['coffee', 'latte', 'cappuccino', 'espresso', 'flat white', 'mocha', 'cafe', 'starbucks', 'costa'],
      food: ['food', 'lunch', 'dinner', 'breakfast', 'meal', 'pizza', 'burger', 'sushi', 'groceries', 'pret', 'eat', 'ate'],
      transport: ['uber', 'taxi', 'bus', 'train', 'transport', 'fare', 'tube', 'metro', 'ride', 'petrol'],
      entertainment: ['cinema', 'movie', 'game', 'concert', 'show', 'ticket', 'netflix', 'spotify', 'pub', 'bar', 'drinks'],
      groceries: ['groceries', 'supermarket', 'tesco', 'aldi', 'lidl', 'sainsburys'],
      dining: ['restaurant', 'dining', 'takeaway', 'nandos'],
      shopping: ['clothes', 'shoes', 'amazon', 'shopping', 'online'],
      social: ['pub', 'bar', 'drinks', 'party'],
    };
    for (const [id, kws] of Object.entries(fallbackKeywords)) {
      if (categoryKeywords[id]) {
        categoryKeywords[id] = [...new Set([...categoryKeywords[id], ...kws])];
      }
    }

    // Parse spending transactions
    const amountMatch = userText.match(/(\d+(?:\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

    let detectedCategory: string | null = null;
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((kw) => lowerText.includes(kw))) {
        detectedCategory = category;
        break;
      }
    }

    if (amount && detectedCategory) {
      // Defer for confirmation instead of executing immediately
      const budgetCat = await getBudgetCategory(detectedCategory);
      const catName = categories.find(c => c.id === detectedCategory)?.name || detectedCategory;
      const description = userText.replace(/[0-9.,£$]+/g, '').trim() || detectedCategory;

      const pending: PendingTransaction = {
        amount,
        category: detectedCategory,
        categoryName: catName,
        description,
        budgetSpent: budgetCat?.spent ?? 0,
        budgetLimit: budgetCat?.weekly_limit ?? 0,
      };
      conversationContext.startConfirmation(pending);

      return {
        responseText: '',
        executedFunctions: [],
        lesson: null,
        xpEarned: 0,
        contentType: 'confirmation',
        pendingTransaction: pending,
      };
    }

    return {
      responseText: "I couldn't quite understand that. Try saying \"spent 5 on coffee\", \"how's my budget\", or \"help\".",
      executedFunctions: [],
      lesson: null,
      xpEarned: 0,
    };
  }

  async destroy(): Promise<void> {
    if (this.model) {
      await this.model.destroy();
      this.model = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
export const aiService = new GemmaAIService();
