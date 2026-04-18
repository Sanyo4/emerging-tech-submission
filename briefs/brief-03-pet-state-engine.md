# Brief 03 — Pet State Engine

## Context for Claude Code

This brief defines the pet state engine — the system that derives the pet's mood from the user's financial behaviour. Before implementing, read `usik/tamagotchi` on GitHub (https://github.com/usik/tamagotchi), specifically `src/tamagotchi/core/` for how they model stats, calculate mood, handle evolution across care paths, and persist state. Adapt those patterns to TypeScript for React Native + SQLite, using the financial-behaviour mappings below instead of feeding/cleaning/playing mechanics.

The existing MVP already has `utils/budgetState.ts` which calculates a budget health status. This engine wraps and extends that, adding the pet mood derivation, engagement tracking, evolution, and persistence layers.

---

## Pet State Derivation

The pet's mood is a function of TWO inputs: **budget health** (how well the user is managing money) and **engagement** (how actively the user interacts with the app). Neither alone determines the state — a user who is over budget but actively completing lessons and logging transactions gets a gentler mood than someone who's over budget AND has gone silent.

### Budget Health Score (0–100)

Derived from the existing `budgetState.ts` calculation. This is the raw financial health number:

```typescript
// Factors that increase the score:
// - Under budget in most categories → +points per category under
// - Savings contributions this period → +points
// - Consistent logging (no gaps > 1 day) → +points
// - Trend improving vs last week → +bonus

// Factors that decrease the score:
// - Over budget in any category → -points per category over, weighted by severity
// - No transactions logged today → -small penalty
// - Trend worsening vs last week → -penalty
// - Multiple category limits breached → -multiplied penalty
```

The exact formula should mirror what `budgetState.ts` already does, extended to produce a 0-100 number.

### Engagement Score (0–30 bonus points)

Tracks how actively the user is interacting with the app, regardless of their actual financial health:

```typescript
// Engagement bonus points:
// - Active logging streak (3+ days) → +5
// - Completed a lesson this week → +5
// - Completed a challenge this week → +5
// - Logged at least one transaction today → +5
// - Interacted with pet dialogue (tapped speech bubble, asked "how is my pet") → +5
// - Used voice input at least once this session → +5
// Cap at 30 bonus points
```

### Combined Score → Pet State

```typescript
const combinedScore = Math.min(100, budgetHealth + engagementBonus);

function derivePetState(combinedScore: number, daysSinceLastLog: number): PetState {
  // Override: if user hasn't logged anything for 3+ days, pet is critical regardless
  if (daysSinceLastLog >= 3) return 'critical';

  if (combinedScore >= 80) return 'thriving';
  if (combinedScore >= 60) return 'happy';
  if (combinedScore >= 40) return 'neutral';
  if (combinedScore >= 20) return 'worried';
  return 'critical';
}
```

### State Transition Rules

- State can only change by ONE level per calculation cycle (no jumping from thriving to critical in one step, unless the 3-day-no-log override triggers). This prevents jarring mood swings.
- State is recalculated every time a transaction is logged, a lesson/challenge is completed, or the app is opened (daily check-in).
- On state transition, fire all four sensory channels: ASCII art change, haptic pattern, tonal audio cue, TTS announcement (see Brief 02).

---

## Evolution System

Adapted from `usik/tamagotchi`'s care-driven evolution. Over time, the pet's appearance can evolve based on sustained care quality. This is NOT a visual overhaul of the ASCII art — it's subtle additions (accessories, background elements, status indicators) that accumulate.

### Evolution Tiers

```typescript
enum EvolutionTier {
  EGG = 'egg',           // First day only (during/just after onboarding)
  BABY = 'baby',         // Days 1-3
  CHILD = 'child',       // Days 4-7
  TEEN = 'teen',          // Days 8-14
  ADULT = 'adult',        // Days 15-30
  ELDER = 'elder',        // Days 30+
}
```

### Care Quality Tracking

Each day the app is used, a care quality score is recorded:

```typescript
interface DailyCareRecord {
  date: string;           // ISO date
  transactions_logged: number;
  lessons_completed: number;
  challenges_completed: number;
  pet_state_at_end_of_day: PetState;
  care_quality: 'good' | 'normal' | 'poor';
}

// Care quality for the day:
// 'good': logged at least 1 transaction AND pet ended day as thriving/happy
// 'normal': logged at least 1 transaction OR interacted with the app
// 'poor': no interaction at all
```

### Evolution Path

Over the course of each tier, the ratio of good/normal/poor days determines which ASCII art variant the pet uses at the next tier. Three paths:

- **Flourishing path** (>60% good days): pet gains positive decorative elements (tiny crown, sparkles, flowers around it)
- **Standard path** (mixed): pet stays at base appearance for each tier
- **Struggling path** (>60% poor days): pet gains sympathetic elements (bandage, tiny umbrella, "..." thought bubble)

The struggling path is NOT punitive — it's sympathetic. The pet looks like it needs care, not like the user failed. This is important for the wellbeing angle.

### Evolution Persistence

Store the current tier and care history in SQLite. When the tier advances, record the path taken and the new ASCII art variant to display.

---

## SQLite Schema

Extend the existing `services/database.ts` with these tables:

```sql
-- Pet identity and current state
CREATE TABLE IF NOT EXISTS pet_profile (
  id INTEGER PRIMARY KEY CHECK(id = 1),  -- singleton row
  name TEXT NOT NULL DEFAULT 'Buddy',
  current_state TEXT NOT NULL DEFAULT 'neutral'
    CHECK(current_state IN ('thriving','happy','neutral','worried','critical')),
  evolution_tier TEXT NOT NULL DEFAULT 'egg'
    CHECK(evolution_tier IN ('egg','baby','child','teen','adult','elder')),
  evolution_path TEXT NOT NULL DEFAULT 'standard'
    CHECK(evolution_path IN ('flourishing','standard','struggling')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pet state history (for mood timeline feature)
CREATE TABLE IF NOT EXISTS pet_state_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state TEXT NOT NULL CHECK(state IN ('thriving','happy','neutral','worried','critical')),
  budget_score REAL NOT NULL,
  engagement_bonus REAL NOT NULL DEFAULT 0,
  combined_score REAL NOT NULL,
  trigger TEXT,  -- what caused the recalculation: 'transaction', 'lesson', 'challenge', 'daily_checkin', 'app_open'
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily care quality records (for evolution calculation)
CREATE TABLE IF NOT EXISTS daily_care (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,  -- ISO date string YYYY-MM-DD
  transactions_logged INTEGER NOT NULL DEFAULT 0,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  challenges_completed INTEGER NOT NULL DEFAULT 0,
  pet_state_end_of_day TEXT,
  care_quality TEXT CHECK(care_quality IN ('good','normal','poor')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Engagement tracking (for engagement score calculation)
CREATE TABLE IF NOT EXISTS engagement_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,  -- 'transaction_log', 'lesson_complete', 'challenge_complete', 'dialogue_interact', 'voice_input'
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Accessibility preferences (from Brief 01)
CREATE TABLE IF NOT EXISTS accessibility_prefs (
  id INTEGER PRIMARY KEY CHECK(id = 1),  -- singleton row
  haptic_intensity TEXT DEFAULT 'medium'
    CHECK(haptic_intensity IN ('off','light','medium','strong')),
  tonal_volume TEXT DEFAULT 'normal'
    CHECK(tonal_volume IN ('off','quiet','normal','loud')),
  bloop_sound INTEGER DEFAULT 1,  -- speech bubble typewriter sound
  tts_speed TEXT DEFAULT 'normal'
    CHECK(tts_speed IN ('slow','normal','fast')),
  text_size TEXT DEFAULT 'medium'
    CHECK(text_size IN ('small','medium','large','extra_large')),
  high_contrast INTEGER DEFAULT 0,
  reduced_motion INTEGER DEFAULT 0,
  simplified_language INTEGER DEFAULT 0,
  verbose_screenreader INTEGER DEFAULT 0
);
```

---

## Service File Structure

```
services/
├── petState.ts          # PetState enum, derivePetState(), score calculation
├── petEvolution.ts      # Evolution tier advancement, care quality tracking, path determination
├── petReactions.ts      # Transaction reaction logic (what reaction type for a given transaction)
├── petDialogue.ts       # Dialogue template selection, FunctionGemma prompt construction
└── engagement.ts        # Engagement event tracking, bonus score calculation
```

### Key Functions in `petState.ts`

```typescript
// Recalculate pet state from current data
async function recalculatePetState(trigger: string): Promise<{
  newState: PetState;
  previousState: PetState;
  stateChanged: boolean;
  budgetScore: number;
  engagementBonus: number;
  combinedScore: number;
}>

// Get current state (from SQLite, no recalculation)
async function getCurrentPetState(): Promise<PetState>

// Get state history for mood timeline (last N days)
async function getStateHistory(days: number): Promise<PetStateHistoryEntry[]>

// Check if evolution tier should advance
async function checkEvolution(): Promise<{
  advanced: boolean;
  newTier?: EvolutionTier;
  newPath?: EvolutionPath;
}>
```

---

## Integration Points

- **Transaction logged** (from existing AI pipeline in `ai.ts` + `functionExecutor.ts`): call `recalculatePetState('transaction')`, then fire pet reaction (Brief 02), then update ASCII art if state changed.
- **Lesson completed** (from existing lesson system): call `recalculatePetState('lesson')`, record engagement event.
- **Challenge completed** (from existing challenge system): call `recalculatePetState('challenge')`, record engagement event.
- **App opened** (in root `_layout.tsx`): call `recalculatePetState('app_open')`, check if day has changed since last open → if so, finalise yesterday's care quality and check evolution.
- **Daily check-in**: the pet's daily greeting dialogue (Brief 02) triggers after the app-open recalculation.
