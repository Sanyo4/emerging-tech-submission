// Conversation context manager for multi-step voice flows.
// Sits between speech input and Gemma — intercepts utterances during
// active flows (confirmation, games) via keyword matching. No LLM needed.

import { getBudgetCategories, getBudgetCategory } from './database';
import type { ContentType } from './functionExecutor';
import type { PendingTransaction } from './ai';

export type FlowType = 'none' | 'confirmation' | 'lesson_offer' | 'game_needs_vs_wants' | 'game_bnpl';

export interface GameState {
  type: 'needs_vs_wants' | 'bnpl';
  phase: 'intro' | 'playing' | 'reveal' | 'done';
  // needs_vs_wants
  currentIndex?: number;
  totalItems?: number;
  score?: number;
  items?: Array<{ amount: number; description: string; isNeed: boolean }>;
  // bnpl
  choice?: 'buy' | 'bnpl' | null;
}

export interface ContextResult {
  handled: boolean;
  responseText?: string;
  contentType?: ContentType;
  data?: unknown;
  xpEarned?: number;
  // Signals to the UI
  flowEnded?: boolean;
  executeTransaction?: PendingTransaction;
  gameState?: GameState;
  lessonAction?: 'accept' | 'dismiss';
}

interface ConversationState {
  activeFlow: FlowType;
  pendingTransaction: PendingTransaction | null;
  gameState: GameState | null;
  lessonOfferActive: boolean;
}

const ACCEPT_KEYWORDS = ['accept', 'yes', 'sure', 'ok', 'okay', 'yep', 'yeah', 'do it', 'take it'];
const DISMISS_KEYWORDS = ['dismiss', 'skip', 'no', 'nope', 'nah', 'maybe later', 'later', 'not now', 'pass'];

const CONFIRM_KEYWORDS = ['yes', 'confirm', 'do it', 'log it', 'go ahead', 'sure', 'yep', 'yeah', 'ok', 'okay'];
const CANCEL_KEYWORDS = ['no', 'cancel', 'never mind', 'nope', 'nah', 'stop', 'forget it', 'skip'];
const AMOUNT_PATTERN = /(?:change|set|make)\s*(?:it|the|amount)?\s*(?:to)?\s*(\d+(?:\.\d{1,2})?)/i;
const CATEGORY_PATTERN = /(?:change|set|switch)\s*(?:the)?\s*category\s*(?:to)?\s*([\w\s]+)/i;

class ConversationContext {
  private state: ConversationState = {
    activeFlow: 'none',
    pendingTransaction: null,
    gameState: null,
    lessonOfferActive: false,
  };

  getActiveFlow(): FlowType {
    return this.state.activeFlow;
  }

  getPendingTransaction(): PendingTransaction | null {
    return this.state.pendingTransaction;
  }

  getGameState(): GameState | null {
    return this.state.gameState;
  }

  // Start a confirmation flow for a pending transaction
  startConfirmation(pending: PendingTransaction): void {
    this.state.activeFlow = 'confirmation';
    this.state.pendingTransaction = pending;
  }

  // Start a lesson/quest offer flow
  startLessonOffer(): void {
    this.state.activeFlow = 'lesson_offer';
    this.state.lessonOfferActive = true;
  }

  // Start a game flow
  startGame(type: 'needs_vs_wants' | 'bnpl', items?: GameState['items']): void {
    this.state.activeFlow = type === 'needs_vs_wants' ? 'game_needs_vs_wants' : 'game_bnpl';
    this.state.gameState = {
      type,
      phase: 'intro',
      currentIndex: 0,
      totalItems: items?.length ?? 0,
      score: 0,
      items,
      choice: null,
    };
  }

  // Reset to idle
  reset(): void {
    this.state = {
      activeFlow: 'none',
      pendingTransaction: null,
      gameState: null,
      lessonOfferActive: false,
    };
  }

  // Main intercept: returns handled=true if we consumed the utterance
  async intercept(text: string): Promise<ContextResult> {
    const lower = text.toLowerCase().trim();

    switch (this.state.activeFlow) {
      case 'confirmation':
        return this.handleConfirmationInput(lower, text);
      case 'lesson_offer':
        return this.handleLessonOfferInput(lower);
      case 'game_needs_vs_wants':
        return this.handleNeedsVsWantsInput(lower);
      case 'game_bnpl':
        return this.handleBnplInput(lower);
      default:
        return { handled: false };
    }
  }

  private handleLessonOfferInput(lower: string): ContextResult {
    if (ACCEPT_KEYWORDS.some((kw) => lower === kw || lower.startsWith(kw + ' '))) {
      this.reset();
      return {
        handled: true,
        responseText: 'Quest accepted!',
        lessonAction: 'accept',
        flowEnded: true,
      };
    }

    if (DISMISS_KEYWORDS.some((kw) => lower === kw || lower.startsWith(kw + ' '))) {
      this.reset();
      return {
        handled: true,
        responseText: 'No worries, maybe next time!',
        lessonAction: 'dismiss',
        flowEnded: true,
      };
    }

    return {
      handled: true,
      responseText: 'Say "accept" to take on this quest, or "skip" to pass.',
    };
  }

  private async handleConfirmationInput(lower: string, original: string): Promise<ContextResult> {
    const pending = this.state.pendingTransaction;
    if (!pending) {
      this.reset();
      return { handled: false };
    }

    // Confirm
    if (CONFIRM_KEYWORDS.some((kw) => lower === kw || lower.startsWith(kw + ' '))) {
      const txn = { ...pending };
      this.reset();
      return {
        handled: true,
        responseText: 'Logging it now...',
        executeTransaction: txn,
        flowEnded: true,
      };
    }

    // Cancel
    if (CANCEL_KEYWORDS.some((kw) => lower === kw || lower.startsWith(kw + ' '))) {
      this.reset();
      return {
        handled: true,
        responseText: 'No worries, transaction cancelled!',
        contentType: 'idle',
        flowEnded: true,
      };
    }

    // Edit amount
    const amountMatch = original.match(AMOUNT_PATTERN);
    if (amountMatch) {
      const newAmount = parseFloat(amountMatch[1]);
      this.state.pendingTransaction = { ...pending, amount: newAmount };
      return {
        handled: true,
        responseText: `Changed to \u00A3${newAmount.toFixed(2)}. Confirm?`,
        contentType: 'confirmation',
        data: this.state.pendingTransaction,
      };
    }

    // Edit category
    const catMatch = original.match(CATEGORY_PATTERN);
    if (catMatch) {
      const requestedCategory = catMatch[1].trim().toLowerCase();
      const categories = await getBudgetCategories();
      const matchedCategory = categories.find(
        (category) =>
          category.id.toLowerCase() === requestedCategory ||
          category.name.toLowerCase() === requestedCategory
      );

      if (!matchedCategory) {
        return {
          handled: true,
          responseText: `I couldn't find a ${requestedCategory} budget. Say a category like food, transport, or coffee.`,
          contentType: 'confirmation',
          data: pending,
        };
      }

      const refreshedCategory = await getBudgetCategory(matchedCategory.id);
      this.state.pendingTransaction = {
        ...pending,
        category: matchedCategory.id,
        categoryName: refreshedCategory?.name ?? matchedCategory.name,
        budgetSpent: refreshedCategory?.spent ?? pending.budgetSpent,
        budgetLimit: refreshedCategory?.weekly_limit ?? pending.budgetLimit,
      };
      return {
        handled: true,
        responseText: `Changed category to ${this.state.pendingTransaction.categoryName}. Confirm?`,
        contentType: 'confirmation',
        data: this.state.pendingTransaction,
      };
    }

    // Didn't understand — prompt
    return {
      handled: true,
      responseText: `\u00A3${pending.amount.toFixed(2)} on ${pending.categoryName}. Say yes to confirm, no to cancel, or change the amount.`,
      contentType: 'confirmation',
      data: pending,
    };
  }

  private handleNeedsVsWantsInput(lower: string): ContextResult {
    const game = this.state.gameState;
    if (!game || game.type !== 'needs_vs_wants') {
      this.reset();
      return { handled: false };
    }

    // Intro phase: "start", "go", "let's play", "ready"
    if (game.phase === 'intro') {
      if (['start', 'go', 'play', 'ready', 'yes', 'ok', "let's go", "let's play"].some((k) => lower.includes(k))) {
        game.phase = 'playing';
        return {
          handled: true,
          responseText: this.getCurrentNeedsVsWantsPrompt(),
          contentType: 'game_needs_vs_wants',
          gameState: { ...game },
        };
      }
      if (CANCEL_KEYWORDS.some((kw) => lower === kw)) {
        this.reset();
        return { handled: true, responseText: 'No worries, maybe next time!', contentType: 'idle', flowEnded: true };
      }
      return {
        handled: true,
        responseText: "I'll show you some purchases and you tell me if they're a need or a want. Say start when you're ready!",
        contentType: 'game_needs_vs_wants',
        gameState: { ...game },
      };
    }

    // Playing phase: "need" or "want"
    if (game.phase === 'playing' && game.items && game.currentIndex !== undefined) {
      const isNeed = ['need', 'left', 'essential', 'necessary'].some((k) => lower.includes(k));
      const isWant = ['want', 'right', 'luxury', 'optional'].some((k) => lower.includes(k));

      if (!isNeed && !isWant) {
        return {
          handled: true,
          responseText: "Is this a need or a want? Say 'need' or 'want'.",
          contentType: 'game_needs_vs_wants',
          gameState: { ...game },
        };
      }

      const currentItem = game.items[game.currentIndex];
      const correct = (isNeed && currentItem.isNeed) || (isWant && !currentItem.isNeed);
      if (correct) game.score = (game.score ?? 0) + 1;

      game.currentIndex = (game.currentIndex ?? 0) + 1;

      // Check if game is done
      if (game.currentIndex >= (game.totalItems ?? 0)) {
        game.phase = 'done';
        const points = Math.max(10, (game.score ?? 0) * 5);
        return {
          handled: true,
          responseText: `Done! You got ${game.score} out of ${game.totalItems} right. ${points} care points earned!`,
          contentType: 'game_needs_vs_wants',
          gameState: { ...game },
          xpEarned: points,
          flowEnded: true,
        };
      }

      const feedback = correct ? 'Correct!' : `Not quite \u2014 that's a ${currentItem.isNeed ? 'need' : 'want'}.`;
      return {
        handled: true,
        responseText: `${feedback} ${this.getCurrentNeedsVsWantsPrompt()}`,
        contentType: 'game_needs_vs_wants',
        gameState: { ...game },
      };
    }

    // Done phase: "done", "finish", "close"
    if (game.phase === 'done') {
      this.reset();
      return { handled: true, responseText: 'Nice work!', contentType: 'idle', flowEnded: true };
    }

    return { handled: false };
  }

  private handleBnplInput(lower: string): ContextResult {
    const game = this.state.gameState;
    if (!game || game.type !== 'bnpl') {
      this.reset();
      return { handled: false };
    }

    // Intro
    if (game.phase === 'intro') {
      if (['start', 'go', 'show', 'ready', 'yes', 'ok'].some((k) => lower.includes(k))) {
        game.phase = 'playing';
        return {
          handled: true,
          responseText: "You have \u00A360 for the week. You want a gadget for \u00A330. Buy now for \u00A330, or BNPL in 3 installments of \u00A312? Say 'buy now' or 'pay later'.",
          contentType: 'game_bnpl',
          gameState: { ...game },
        };
      }
      if (CANCEL_KEYWORDS.some((kw) => lower === kw)) {
        this.reset();
        return { handled: true, responseText: 'No worries!', contentType: 'idle', flowEnded: true };
      }
      return {
        handled: true,
        responseText: "Let me show you how Buy Now Pay Later really works. Say 'start' when ready!",
        contentType: 'game_bnpl',
        gameState: { ...game },
      };
    }

    // Choice
    if (game.phase === 'playing') {
      const isBuy = ['buy now', 'buy', 'option a', 'pay now', 'full price'].some((k) => lower.includes(k));
      const isBnpl = ['pay later', 'bnpl', 'installment', 'option b', 'installments'].some((k) => lower.includes(k));

      if (!isBuy && !isBnpl) {
        return {
          handled: true,
          responseText: "Say 'buy now' to pay \u00A330 upfront, or 'pay later' for 3 installments of \u00A312.",
          contentType: 'game_bnpl',
          gameState: { ...game },
        };
      }

      game.choice = isBuy ? 'buy' : 'bnpl';
      game.phase = 'reveal';
      const reveal = isBuy
        ? "Smart choice! You pay \u00A330 and keep \u00A330 for the week. With BNPL you'd pay \u00A336 total \u2014 \u00A36 in hidden fees!"
        : "Careful! 3 x \u00A312 = \u00A336 total. That's \u00A36 more than buying outright. BNPL often has hidden costs.";

      return {
        handled: true,
        responseText: reveal,
        contentType: 'game_bnpl',
        gameState: { ...game },
      };
    }

    // Reveal → done
    if (game.phase === 'reveal') {
      game.phase = 'done';
      const points = game.choice === 'buy' ? 15 : 10;
      this.reset();
      return {
        handled: true,
        responseText: `Lesson complete! ${points} care points earned.`,
        contentType: 'game_bnpl',
        xpEarned: points,
        flowEnded: true,
      };
    }

    // Done
    if (game.phase === 'done') {
      this.reset();
      return { handled: true, responseText: 'Nice one!', contentType: 'idle', flowEnded: true };
    }

    return { handled: false };
  }

  private getCurrentNeedsVsWantsPrompt(): string {
    const game = this.state.gameState;
    if (!game?.items || game.currentIndex === undefined) return '';
    const item = game.items[game.currentIndex];
    if (!item) return '';
    return `\u00A3${item.amount.toFixed(2)} ${item.description} \u2014 need or want?`;
  }
}

// Singleton
export const conversationContext = new ConversationContext();
