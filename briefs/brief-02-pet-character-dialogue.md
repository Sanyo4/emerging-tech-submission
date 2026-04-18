# Brief 02 — Pet Character & Dialogue System

## Context for Claude Code

This app is a Tamagotchi-style financial wellbeing companion. The pet character is the emotional centre of the entire app. It is rendered in **ASCII art inside a dark terminal panel**, surrounded by a pastel Animal Crossing-themed UI (see Brief 01 for the design system).

The pet is NOT a static image. It has five emotional states tied to the user's budget health, and it **talks back** to the user via a speech bubble dialogue system powered by the existing FunctionGemma AI pipeline. Every visual state has a corresponding haptic pattern, tonal audio cue, and TTS announcement for multi-sensory accessibility.

Read `usik/tamagotchi` on GitHub (https://github.com/usik/tamagotchi) — specifically `src/tamagotchi/core/` for the pet state engine patterns and `src/tamagotchi/sprites/` for how they structure ASCII art per character and mood. Study those patterns, then implement the equivalent in TypeScript for React Native using the specs below.

---

## Character Design

The pet is a **small round creature** — think a cross between a Kirby, a Molang, and an Animal Crossing gyroid. It should be simple enough that five emotional variants are clearly distinguishable in ~10-12 lines of ASCII art rendered in a monospace font at 18px. The character should feel kawaii/cute without being overly complex. It has a round body, small dot eyes, a simple mouth, and tiny stubby limbs.

The character is rendered in the warm parchment colour (#F5E6D3) on the dark terminal background (#2C2137). Do NOT use colour within the ASCII art itself — the expressiveness comes from the arrangement of characters, not from colour coding. This is an accessibility decision: the art must be distinguishable in pure monochrome.

### Pet Name

The user names their pet during onboarding. The name appears below the ASCII art in the terminal panel, formatted as a centered label: `── {name} is {state}! ──`

---

## Five Emotional States — ASCII Art Specifications

Each state below describes exactly what the ASCII art should look like. Generate all five from the same base character shape so they are obviously the same creature in different moods. The art should be horizontally centred within the terminal panel.

### State 1: Thriving

The pet is at its happiest. Eyes are wide and sparkly (use asterisks or carets), mouth is a big open smile, body is slightly bouncy (maybe a small motion line above), and there are decorative sparkles or hearts around it. Small limbs are raised up in celebration.

Approximate composition (this is a guide for shape/mood, not the literal final art — generate your own):
```
    ☆  ·  ☆
   ╭───────╮
   │ ⭑   ⭑ │
   │  ╰▽╯  │
   ╰───────╯
    ╱|   |╲
   ♡       ♡
```

Trigger: budget health score is excellent (>80%), AND engagement bonus is positive (streak active, lessons completed recently).

### State 2: Happy

The pet is content and doing well. Eyes are soft curves (like `◠` or `╹`), mouth is a gentle smile, body is relaxed. No extra decorative elements — just a calm, pleased creature.

Trigger: budget health score is good (60-80%), or moderate score with strong engagement bonus.

### State 3: Neutral

The pet is fine but not excited. Eyes are simple dots, mouth is a flat line or very slight curve. Body is still, no motion indicators. This is the "checking in" state — the pet isn't worried but isn't celebrating either.

Trigger: budget health score is moderate (40-60%), or the user hasn't logged anything today yet.

### State 4: Worried

The pet is concerned. Eyes are slightly wider (alert), maybe with a sweat drop character to the side. Mouth is a small wavy line or slight frown. Body might be slightly hunched. One limb might be raised to its face in a "thinking/concerned" gesture.

Trigger: budget health score is low (20-40%), or approaching category limits in multiple areas.

### State 5: Critical

The pet is distressed. Eyes are X shapes or spirals (classic cartoon "dizzy" indicator), mouth is clearly frowning or wobbling. Body is slumped. Maybe a small cloud or scribble above its head. This should look clearly different from all other states at a glance — even a low-vision user should be able to distinguish the overall shape from the other four.

Trigger: budget health score is very low (<20%), OR no transactions logged for 3+ days (pet is "lonely/neglected").

---

## ASCII Art Implementation

### File Structure

```
assets/
└── pet/
    ├── thriving.ts    // exports string[] — each string is one line of ASCII art
    ├── happy.ts
    ├── neutral.ts
    ├── worried.ts
    ├── critical.ts
    └── index.ts       // exports a map: PetState → string[]
```

Each file exports an array of strings where each string is one line of the ASCII art. This format makes it easy to render line-by-line in a monospace Text component and also makes it easy for Claude Code to generate and modify the art.

```typescript
// Example structure (NOT final art — Claude Code generates the actual art)
// assets/pet/happy.ts
export const happyArt: string[] = [
  '   ╭───────╮   ',
  '   │ ╹   ╹ │   ',
  '   │  ╰◡╯  │   ',
  '   ╰───────╯   ',
  '    /|   |\\   ',
];
```

### Rendering Component

Create `components/pet/PetTerminal.tsx` that:
1. Accepts the current `PetState` enum value as a prop
2. Looks up the corresponding ASCII art array from the assets map
3. Renders each line as a `<Text>` element inside a monospace-styled container
4. The container uses the terminal styling from Brief 01 (dark bg, parchment text, rounded corners)
5. Below the art, renders the pet name + state label: `── {name} is {state}! ──`
6. The outer card has a border/glow tinted with the current pet state's `light` colour
7. Transition between states uses a brief fade (opacity animation via react-native-reanimated), or instant swap if reduced motion is enabled

### Accessibility for ASCII Art

The terminal panel's `accessibilityRole` is `"image"` and its `accessibilityLabel` is a plain-language description that updates with state:
- Thriving: "{name} is thriving! They look very happy, bouncing with sparkles around them."
- Happy: "{name} is happy. They have a gentle smile and look content."
- Neutral: "{name} is feeling okay. They look calm but not excited."
- Worried: "{name} is worried. They look concerned, with a small frown."
- Critical: "{name} is not doing well. They look distressed and need your attention."

Screen readers announce this label, NOT the individual ASCII characters. The art is decorative from a screen reader perspective — the label carries the meaning.

---

## Dialogue System

The pet talks to the user through a speech bubble component. This is where the existing FunctionGemma AI pipeline gets extended.

### Dialogue Types

There are four categories of pet dialogue, each with different triggers:

**1. Transaction Reactions** — fired immediately when the user logs a spending transaction.
The AI generates a short, contextual comment about the transaction based on the category, amount, and how it relates to the user's budget. Examples:
- "Ooh, Greggs again? That's the third time this week!" (Food, frequent repeat)
- "Nice one! That's well under your food budget." (Food, under budget)
- "Hmm, that's a big one... you've used 80% of your entertainment budget." (Entertainment, approaching limit)

**2. Coaching Triggers** — fired when the pet state engine detects a pattern that maps to a lesson.
The AI frames the lesson recommendation as the pet's idea. Examples:
- "Hey, I've been thinking about all those small purchases this week... want to learn about the latte effect?"
- "You've been really consistent with logging! I found a lesson about building savings habits — check it out?"

**3. Daily Check-ins** — fired when the user opens the app for the first time each day.
A brief greeting that summarises yesterday and sets context for today. Examples:
- "Morning! Yesterday was a good day — you stayed under budget in every category."
- "Hey... yesterday was a bit rough. But today's a fresh start!"

**4. Milestone Celebrations** — fired on streak milestones, level-ups, challenge completions.
- "SEVEN DAYS! That's a whole week of logging. I'm so proud of us!"
- "You just hit Level 5! I feel like I'm evolving..."

### FunctionGemma Integration

Extend the existing `services/ai.ts` to support dialogue generation. This uses the SAME forced-function-call architecture already in place for transaction parsing — the AI generates a structured function call, not freeform text, which prevents hallucination.

Add a new function definition in `data/functionDefs.ts`:

```typescript
{
  name: "pet_dialogue",
  description: "Generate a short pet dialogue message based on context",
  parameters: {
    type: "object",
    properties: {
      message: {
        type: "string",
        enum: [
          // Pre-written message templates with slots
          "FOOD_UNDER_BUDGET",
          "FOOD_OVER_BUDGET",
          "FOOD_REPEAT_VENDOR",
          "ENTERTAINMENT_APPROACHING_LIMIT",
          "GENERAL_UNDER_BUDGET",
          "GENERAL_OVER_BUDGET",
          "STREAK_3_DAY",
          "STREAK_7_DAY",
          "STREAK_30_DAY",
          "DAILY_GOOD",
          "DAILY_BAD",
          "DAILY_NEUTRAL",
          "LESSON_SUGGEST_LATTE_EFFECT",
          "LESSON_SUGGEST_SAVINGS",
          "LESSON_SUGGEST_IMPULSE",
          "CHALLENGE_COMPLETE",
          "LEVEL_UP",
          // ... more as needed
        ]
      },
      slot_values: {
        type: "object",
        properties: {
          amount: { type: "string" },
          category: { type: "string" },
          vendor: { type: "string" },
          budget_remaining: { type: "string" },
          streak_count: { type: "string" },
          level: { type: "string" },
        }
      }
    },
    required: ["message"]
  }
}
```

The AI selects a message template enum and fills slot values. The app's business logic then maps the enum to the actual dialogue text. This means the AI CANNOT generate arbitrary text — it can only pick from pre-written, pre-reviewed messages. This is the same hallucination-prevention pattern already used for transaction categorisation.

The actual message templates live in `data/dialogueTemplates.ts`:

```typescript
const templates: Record<string, (slots: SlotValues) => string> = {
  FOOD_UNDER_BUDGET: (s) => `Nice! £${s.amount} on food and you've still got £${s.budget_remaining} left this week.`,
  FOOD_REPEAT_VENDOR: (s) => `${s.vendor} again? That's ${s.streak_count} times this week! Maybe we should talk about the latte effect...`,
  DAILY_GOOD: () => `Morning! Yesterday was a good day — you stayed on track.`,
  // ... etc
};
```

Each template also has a `simplified` variant for users in simplified language mode:

```typescript
const simplifiedTemplates: Record<string, (slots: SlotValues) => string> = {
  FOOD_UNDER_BUDGET: (s) => `Good job! You spent £${s.amount} on food. You have £${s.budget_remaining} left.`,
  FOOD_REPEAT_VENDOR: (s) => `You went to ${s.vendor} a lot this week. Want to learn about saving?`,
  DAILY_GOOD: () => `Good morning! Yesterday was good.`,
  // ... etc
};
```

### Speech Bubble Component

Create `components/pet/SpeechBubble.tsx` that:

1. Accepts a `message: string` prop (the resolved dialogue text)
2. Renders the text inside a rounded cream container with a triangular tail pointing up toward the terminal panel
3. **Typewriter animation**: text appears character-by-character at a configurable speed
   - Default: 30ms per character
   - Slow: 60ms per character
   - Fast: 15ms per character
   - Reduced motion: entire text appears instantly (no animation)
4. **Audio accompaniment**: each character triggers a soft "bloop" sound via `tonalAudio.ts`
   - The pitch varies slightly per character (randomised within a small range) for the Animal Crossing dialogue feel
   - The sound is separately toggle-able in accessibility settings (independent from other tonal audio)
   - If tonal audio is disabled, no sound plays
5. **TTS integration**: once the typewriter animation completes, the full message is announced via TTS
   - If reduced motion is enabled, TTS fires immediately
   - TTS respects the user's configured speech rate (slow/normal/fast)
6. **Tap to skip**: tapping the speech bubble during typewriter animation instantly reveals the full text
   - This is the standard Animal Crossing interaction pattern and also serves as an accessibility affordance

### Speech Bubble Accessibility

- `accessibilityRole`: `"text"`
- `accessibilityLabel`: the full message text (available immediately, even during typewriter animation)
- `accessibilityHint`: "Tap to skip animation" (during animation) or "Double tap to hear again" (after completion)
- Screen readers announce the full text immediately regardless of typewriter animation state
- In simplified language mode, the simplified template variant is used

---

## Multi-Sensory State Communication

Each pet state is communicated through FOUR sensory channels simultaneously. This is the core accessibility architecture — no single channel is required, and any combination of channels is sufficient.

### Haptic Patterns (extend `services/haptics.ts`)

Define these distinct patterns using Expo Haptics:

```typescript
const petHaptics = {
  thriving:  () => {
    // Quick double-pulse, like an excited heartbeat
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 100);
  },
  happy: () => {
    // Single gentle pulse
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  neutral: () => {
    // No haptic — absence of feedback IS the signal for neutral
  },
  worried: () => {
    // Slow medium vibration
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  critical: () => {
    // Three sharp pulses in quick succession
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 300);
  },
};
```

Haptic intensity setting (off/light/medium/strong) scales the impact style down or disables entirely.

### Tonal Audio Cues (extend `services/tonalAudio.ts`)

Each state has a short distinct sound:
- **Thriving**: ascending major chord arpeggio (C-E-G, bright and cheerful)
- **Happy**: single warm tone (middle C, soft piano-like)
- **Neutral**: very soft ambient tone (barely noticeable, like a gentle hum)
- **Worried**: descending minor interval (E-C, slightly tense)
- **Critical**: low repeated tone (like a gentle alarm, not harsh — more "concerned doorbell" than "fire alarm")

These play on state transitions only (not continuously). Volume follows the user's tonal audio preference.

### TTS Announcements (extend `services/audioFeedback.ts`)

On state transition, TTS announces: "{name} is now {state label}." followed by a brief context sentence:
- Thriving: "{name} is now thriving! Your budget is looking great."
- Happy: "{name} is now happy. You're doing well."
- Neutral: "{name} is feeling okay. Keep going!"
- Worried: "{name} is worried. Some of your spending categories are getting tight."
- Critical: "{name} is not doing well. Your budget needs attention."

TTS fires AFTER the tonal audio cue (so the sound primes the user for the verbal message). TTS speed follows user preference.

### Visual State Communication (summary)

- ASCII art changes (see five states above)
- Terminal panel border/glow colour changes to the state's `light` colour
- Pet name label updates: "── {name} is {state}! ──"
- Status indicator on home screen updates colour and label

---

## Dialogue Tone Guidelines

The pet's personality should be consistent across all messages. It is:
- **Warm and encouraging** — never judgmental about spending. "That's a big one!" not "You shouldn't have done that."
- **Gently curious** — asks questions rather than making accusations. "Hmm, noticed a lot of takeaway this week — want to explore why?" not "You spend too much on takeaway."
- **Celebratory on wins** — genuinely excited about streaks, under-budget weeks, lesson completions. "WE DID IT! Seven-day streak!" not "Achievement unlocked: 7 day streak."
- **Supportive on setbacks** — acknowledges overspending without catastrophising. "Tough week! But tomorrow's a new day." not "You went over budget again."
- **Uses first-person plural** — "we" and "us" not "you." The pet is a companion on the journey, not a judge. "We stayed under budget!" not "You stayed under budget."

In simplified language mode, all of the above still applies but with simpler vocabulary and shorter sentences. The emotional tone stays the same.
