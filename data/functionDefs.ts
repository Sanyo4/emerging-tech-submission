export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

// Dynamic user-facing functions: category enums come from DB
export function getUserFacingFunctions(categoryIds: string[]): FunctionDefinition[] {
  return [
    {
      name: 'log_transaction',
      description: 'Log a new spending transaction from the user\'s natural language input',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Budget category',
            enum: categoryIds,
          },
          amount: {
            type: 'number',
            description: 'Amount spent in GBP',
          },
          description: {
            type: 'string',
            description: 'Brief description of the purchase',
          },
        },
        required: ['category', 'amount', 'description'],
      },
    },
    {
      name: 'check_budget_status',
      description: 'Check current budget status for a category, returns remaining or exceeded amount',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Budget category to check',
            enum: categoryIds,
          },
        },
        required: ['category'],
      },
    },
    {
      name: 'get_spending_summary',
      description: 'Get total spending in a category for a given time period',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Budget category',
            enum: categoryIds,
          },
          period: {
            type: 'string',
            description: 'Time period for the summary',
            enum: ['daily', 'weekly', 'monthly'],
          },
        },
        required: ['category', 'period'],
      },
    },
    {
      name: 'get_budget_overview',
      description: 'Get a full overview of all budget categories with spent, remaining, and percentage used. Use when the user asks about their overall budget.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'get_category_detail',
      description: 'Get detailed info for a single budget category including recent transactions. Use when the user asks about a specific category.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Budget category to get details for',
            enum: categoryIds,
          },
        },
        required: ['category'],
      },
    },
    {
      name: 'adjust_budget_limit',
      description: 'Increase, decrease, or set the weekly budget limit for a category. Use when the user wants to change, adjust, raise, lower, increase, decrease, or set their budget limit.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Budget category to adjust',
            enum: categoryIds,
          },
          direction: {
            type: 'string',
            description: 'Whether to increase or decrease the limit. If the user just says "adjust" without specifying, omit this.',
            enum: ['increase', 'decrease'],
          },
          amount: {
            type: 'number',
            description: 'Amount to adjust by in GBP (defaults to 5 if not specified)',
          },
          target_amount: {
            type: 'number',
            description: 'Exact weekly budget limit to set in GBP when the user says things like "set food to 40"',
          },
        },
        required: ['category'],
      },
    },
    {
      name: 'get_recent_transactions',
      description: 'Get the most recent transactions across all categories. Use when the user asks what they spent recently.',
      parameters: {
        type: 'object',
        properties: {
          count: {
            type: 'number',
            description: 'Number of transactions to return (default 5)',
          },
        },
        required: [],
      },
    },
    {
      name: 'get_quest_log',
      description: 'Show all active and completed quests/challenges with progress. Use when the user asks about quests, challenges, or their progress.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'accept_challenge',
      description: 'Accept or start a new challenge/quest. Use when the user wants to start a challenge or accept a quest.',
      parameters: {
        type: 'object',
        properties: {
          challenge_type: {
            type: 'string',
            description: 'Type of challenge to start',
            enum: ['track_purchases', 'reduce_spending', 'plan_budget'],
          },
        },
        required: [],
      },
    },
    {
      name: 'check_pet_status',
      description: 'Check the pet\'s current mood, health, and streak. Use when the user asks how the pet is doing.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'get_mood_history',
      description: 'Get the pet\'s mood history over recent days. Use when the user asks how the pet has been or about mood trends.',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to look back (default 7)',
          },
        },
        required: [],
      },
    },
    {
      name: 'get_savings_projection',
      description: 'Calculate projected savings if the user saves a certain amount per day. Use when the user asks about saving potential.',
      parameters: {
        type: 'object',
        properties: {
          daily_amount: {
            type: 'number',
            description: 'Amount to save per day in GBP',
          },
          period: {
            type: 'string',
            description: 'Period to project over',
            enum: ['weekly', 'monthly', 'yearly'],
          },
        },
        required: ['daily_amount', 'period'],
      },
    },
    {
      name: 'get_help',
      description: 'Show what the user can do and say. Use when the user asks for help, what they can do, or seems confused.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'open_settings',
      description: 'Open the settings or profile screen. Use when the user asks to open settings, edit their name, or change preferences.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  ];
}

// Static fallback for backward compat
const DEFAULT_CATEGORIES = ['coffee', 'food', 'transport', 'entertainment'];
export const USER_FACING_FUNCTIONS: FunctionDefinition[] = getUserFacingFunctions(DEFAULT_CATEGORIES);

// Internal functions: called by orchestration code, never sent to the AI model
export function getInternalFunctions(categoryIds: string[]): FunctionDefinition[] {
  return [
    {
      name: 'detect_spending_pattern',
      description: 'Analyze if a transaction is unusual compared to the user\'s normal spending in that category',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Budget category',
            enum: categoryIds,
          },
          transaction_amount: {
            type: 'number',
            description: 'Amount of the transaction to analyze',
          },
        },
        required: ['category', 'transaction_amount'],
      },
    },
    {
      name: 'get_micro_lesson',
      description: 'Select an appropriate financial micro-lesson based on trigger type and spending context',
      parameters: {
        type: 'object',
        properties: {
          trigger_type: {
            type: 'string',
            description: 'What triggered the lesson',
            enum: ['budget_exceeded', 'unusual_pattern', 'time_based'],
          },
          category: {
            type: 'string',
            description: 'Related budget category',
            enum: categoryIds,
          },
          severity: {
            type: 'string',
            description: 'How severe the financial concern is',
            enum: ['mild', 'moderate', 'severe'],
          },
        },
        required: ['trigger_type', 'category', 'severity'],
      },
    },
    {
      name: 'create_challenge',
      description: 'Create a spending challenge for the user to help improve their financial habits',
      parameters: {
        type: 'object',
        properties: {
          challenge_type: {
            type: 'string',
            description: 'Type of challenge',
            enum: ['reduce_spending', 'track_purchases', 'plan_budget'],
          },
          category: {
            type: 'string',
            description: 'Budget category for the challenge',
            enum: categoryIds,
          },
          duration_days: {
            type: 'number',
            description: 'Duration of the challenge in days',
          },
          xp_reward: {
            type: 'number',
            description: 'XP reward for completing the challenge',
          },
        },
        required: ['challenge_type', 'category', 'duration_days', 'xp_reward'],
      },
    },
    {
      name: 'calculate_savings_impact',
      description: 'Calculate the long-term savings if the user reduces spending by a certain daily amount',
      parameters: {
        type: 'object',
        properties: {
          daily_amount: {
            type: 'number',
            description: 'Amount saved per day in GBP',
          },
          period: {
            type: 'string',
            description: 'Period to project savings over',
            enum: ['weekly', 'monthly', 'yearly'],
          },
        },
        required: ['daily_amount', 'period'],
      },
    },
    {
      name: 'check_time_triggers',
      description: 'Check if any time-based financial events should fire such as payday reminders, weekend alerts, or month-end reviews',
      parameters: {
        type: 'object',
        properties: {
          current_day: {
            type: 'string',
            description: 'Current day of the week (e.g. Monday, Friday)',
          },
          current_time: {
            type: 'string',
            description: 'Current time in HH:MM format',
          },
        },
        required: ['current_day', 'current_time'],
      },
    },
  ];
}

export const INTERNAL_FUNCTIONS: FunctionDefinition[] = getInternalFunctions(DEFAULT_CATEGORIES);

// Full array for backward compatibility
export const FUNCTION_DEFINITIONS: FunctionDefinition[] = [
  ...USER_FACING_FUNCTIONS,
  ...INTERNAL_FUNCTIONS,
];

export function formatFunctionDefsForPrompt(): string {
  return FUNCTION_DEFINITIONS.map((fn) => {
    const params = Object.entries(fn.parameters.properties)
      .map(([key, val]) => {
        let paramStr = `    ${key}: ${val.type} — ${val.description}`;
        if (val.enum) {
          paramStr += ` (one of: ${val.enum.join(', ')})`;
        }
        return paramStr;
      })
      .join('\n');

    return `Function: ${fn.name}\nDescription: ${fn.description}\nParameters:\n${params}\nRequired: ${fn.parameters.required.join(', ')}`;
  }).join('\n\n');
}
