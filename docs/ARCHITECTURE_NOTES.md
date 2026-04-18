# Architecture Notes

Quick reference explanations of key app systems.

---

## Budget Plans — Hard-Coded Templates

**File:** `data/plans.ts`

There are 8 pre-defined financial plan templates:

| Plan | Description |
|------|-------------|
| The Paycheck Plan | Stretch every pound from payday to payday |
| The Safety Net | Build emergency fund while managing daily spend |
| The Money Mentor | Detailed tracking across 6 categories |
| The Milestone Plan | Save towards a specific goal |
| The Spend Audit | Track every penny to find money leaks |
| The Rainy Day Builder | Aggressive but sustainable saving |
| The Full Picture | Comprehensive view — nothing slips through |
| The Balanced Build | Equal focus on today and tomorrow |

Each plan has fixed categories with `weeklyLimitPercent` values (e.g. 30% groceries, 20% transport).

**Plan selection is algorithmic, not AI.** During onboarding, the user's motivation answers produce a set of `focusTags` (e.g. `budgeting`, `emergency_fund`, `goal_setting`). `scorePlans()` in `data/plans.ts` counts the overlap between those tags and each plan's `focusTags`, then surfaces the top 3 best-fit plans for the user to pick from.

---

## In-App Budget Suggestions — Rule-Based Logic

**File:** `services/budgetPlanner.ts`

After the user has transaction history, `generateBudgetPlan()` compares actual weekly spend against category limits using simple arithmetic:

| Condition | Suggestion |
|-----------|-----------|
| `avgSpend > weeklyLimit` | Raise limit by 10% — "be more realistic" |
| `avgSpend < weeklyLimit × 0.5` | Tighten to `avgSpend × 1.2` — "free up budget" |
| Otherwise | Keep current — "well within budget" |

No AI involved — the reasoning strings are pre-written templates.

---

## FunctionGemma — AI-Powered Function Calling

**Files:** `services/ai.ts`, `services/functionExecutor.ts`

### The Model

`google/functiongemma-270m-it` — a 270M parameter model from Google, fine-tuned specifically for tool/function calling. It runs via the **HuggingFace Inference API** in development. The original intent was to run it **on-device** via [Cactus React Native](https://github.com/cactus-compute/cactus-react-native) (that code is still present, commented out in `services/ai.ts`).

### The Flow

```
User types natural language
        ↓
Build system prompt (budget context + persona + tool definitions)
        ↓
Send to HuggingFace with tool_choice: "required"
        ↓
Model returns tool_calls[] (e.g. log_transaction {category, amount})
        ↓
functionExecutor.ts runs the function against local SQLite DB
        ↓
Response text + XP + optional micro-lesson returned to UI
```

### Available Functions

| Function | Purpose |
|----------|---------|
| `log_transaction` | Logs a spend to the DB and updates category totals |
| `check_budget_status` | Returns remaining budget for a category |
| `get_spending_summary` | Totals spending for a category over a period |
| `detect_spending_pattern` | Flags if a transaction is unusually large vs. average |
| `get_micro_lesson` | Fetches a relevant financial micro-lesson |
| `create_challenge` | Creates a new spending challenge |
| `calculate_savings_impact` | Projects daily savings over weekly/monthly/yearly |
| `navigate_to_screen` | Routes the user to a different screen in the app |

### Persona Adaptation

The system prompt is adjusted based on the user's `financial_persona` setting:

- **beginner** — plain everyday language, no jargon
- **learner** — explains the "why" behind concepts, some terminology
- **pro** — precise financial terminology (ISA rates, APR, compound interest)

### Fallback Parsing

If the model returns no function calls (or the API fails), `fallbackParse()` kicks in. It uses:
1. Keyword matching on navigation intent (`budget`, `lessons`, `challenges`)
2. Regex for amounts (`/(\d+(?:\.\d{1,2})?)/`)
3. Keyword lists (from the user's active plan + hardcoded fallbacks) to detect the spending category

This manually constructs a `log_transaction` call without needing the model.
