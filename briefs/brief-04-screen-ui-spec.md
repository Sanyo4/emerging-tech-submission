# Brief 04 — Screen-by-Screen UI Specification

## Context for Claude Code

Every screen in this app uses the **terminal-in-Animal-Crossing** aesthetic from Brief 01. The core visual pattern is: a dark terminal panel (monospace font, warm parchment text on deep purple-black background) sitting inside a pastel cream card, surrounded by the warm ivory app background. Buttons are pill-shaped sage green. The pet's ASCII art lives in the terminal panel and is present on most screens.

This brief describes every screen in the app, what it shows, how it works, and how accessibility connects. The screens follow Expo Router's file-based routing in the `app/` directory.

Reference: The file `OnboardingScreen.tsx` provided by the team contains a useful plan-recommendation scoring system (5 yes/no questions scoring toward 50/20/30 vs envelope method) and voice-first financial data entry patterns. Adapt these into the terminal-themed onboarding below.

---

## Navigation Structure

```
app/
├── _layout.tsx                    # Root layout: ThemeProvider + AuthProvider + auth gate
├── login.tsx                      # PIN entry (terminal themed)
├── onboarding/
│   ├── _layout.tsx                # Stack nav + OnboardingProvider
│   ├── welcome.tsx                # Meet your pet + name it
│   ├── questions.tsx              # 5 yes/no questions (terminal prompt style)
│   ├── income.tsx                 # Voice/text income entry
│   ├── expenses.tsx               # Voice/text expenses entry
│   ├── plan.tsx                   # AI-recommended plan selection
│   ├── accessibility.tsx          # Accessibility preferences setup
│   ├── pin-setup.tsx              # Create PIN
│   └── done.tsx                   # Pet hatches / summary
├── (tabs)/
│   ├── _layout.tsx                # Tab navigator
│   ├── home.tsx                   # Pet home screen (main)
│   ├── budget.tsx                 # Budget detail view
│   ├── challenges.tsx             # Active challenges
│   ├── lessons.tsx                # Micro-lessons library
│   └── history.tsx                # Pet mood timeline
└── settings/
    ├── accessibility.tsx          # Full accessibility settings
    └── profile.tsx                # Pet profile, plan management
```

---

## Onboarding Flow

The onboarding is where the user meets their pet for the first time. The pet is present from the very first screen — initially as an egg in the terminal, then hatching at the end. Each screen is a terminal interaction where the pet (or the system) asks the user questions.

### `onboarding/welcome.tsx` — Meet Your Pet

The terminal panel shows an ASCII art egg with gentle animation (a `...` that cycles, or a subtle wobble indicator). Below the terminal, a speech bubble says: "Something's hatching! But first — what should we call it?"

A text input field (styled as a terminal prompt: `> _`) lets the user type a name. Voice input is also available via the mic button. The input method choice (voice or text) is remembered for subsequent screens.

```
Terminal panel:
┌──────────────────────────────────┐
│                                  │
│         ╭──────╮                 │
│         │  ??  │                 │
│         │  ..  │                 │
│         ╰──────╯                 │
│                                  │
│   > Name your pet: _             │
│                                  │
└──────────────────────────────────┘

Speech bubble: "Something's hatching! Give it a name to begin."

[🎙 Voice] [Continue →]
```

Accessibility: the terminal panel announces "An egg is waiting to hatch. Type or say a name for your pet." The text input has `accessibilityLabel="Pet name"` and `accessibilityHint="Type a name or tap the microphone to speak"`.

### `onboarding/questions.tsx` — Budget Style Questions

Adapted from the reference `OnboardingScreen.tsx` swipe card system, but presented as **terminal prompts** instead of swipe cards. The pet's egg wobbles in the corner of the terminal while the questions appear as command-line style yes/no prompts.

Five questions, each displayed one at a time in the terminal:

```
Terminal panel:
┌──────────────────────────────────┐
│  [Question 2 of 5]              │
│                                  │
│  "I have a specific savings      │
│   goal right now."               │
│                                  │
│  ── Goal Clarity ──              │
│                                  │
│  > [Y] Yes    [N] No            │
│                                  │
└──────────────────────────────────┘

Speech bubble: "Tell me about yourself! Say yes or no."

Progress: ●●○○○
```

The scoring system from the reference file is preserved exactly — each answer scores toward either 50/20/30 or envelope method. Voice input also works: the user can say "yes" or "no" and FunctionGemma parses the response.

Instead of swipe cards (which are inaccessible to screen reader users and problematic for motor impairments), the terminal-prompt approach uses simple button presses or voice, which is universally accessible. The yes/no buttons are large pill-shaped buttons below the terminal (minimum 48x48dp touch targets).

Accessibility: each question is announced via TTS when it appears. The buttons have clear `accessibilityLabel` values ("Yes" and "No"). The progress dots are announced as "Question 2 of 5".

### `onboarding/income.tsx` — Income Entry

The pet's egg is still in the terminal. The question appears as a terminal prompt:

```
Terminal panel:
┌──────────────────────────────────┐
│                                  │
│  How much do you take home       │
│  each month?                     │
│                                  │
│  (The amount that lands in       │
│   your bank after tax)           │
│                                  │
│  > £ _                           │
│                                  │
└──────────────────────────────────┘

Speech bubble: "Don't worry about being exact — a rough number is fine!"

[🎙 Voice]  [Numpad below]  [Continue →]
```

The numpad component from the existing MVP (`components/NumPad.tsx`) appears below, styled with the pastel theme. Voice input is available as an alternative — the user says "about fifteen hundred" and FunctionGemma parses it to £1500.

### `onboarding/expenses.tsx` — Fixed Expenses Entry

Same terminal prompt pattern. The hint text explains what counts as fixed expenses.

### `onboarding/plan.tsx` — Plan Recommendation

After questions + income + expenses, the scoring system recommends a budget plan. This screen shows the recommendation in the terminal:

```
Terminal panel:
┌──────────────────────────────────┐
│                                  │
│  ── Analysis Complete ──         │
│                                  │
│  Based on your answers:          │
│                                  │
│  ★ RECOMMENDED: 50/20/30 Rule   │
│    Simple percentage splits.     │
│    50% needs, 20% savings,       │
│    30% wants.                    │
│                                  │
│  ○ Envelope Method               │
│    Fixed limits per category.    │
│                                  │
│  > Select: [1] or [2]           │
│                                  │
└──────────────────────────────────┘

Speech bubble: "I think this one suits you! But you can always switch later."
```

Two selectable options styled as terminal selections. The recommended plan has a star indicator. The user taps to select, or says the plan name.

### `onboarding/accessibility.tsx` — Accessibility Setup

A critical screen that sets up the user's accessibility preferences BEFORE they enter the main app. Presented as a friendly terminal-style checklist:

```
Terminal panel:
┌──────────────────────────────────┐
│                                  │
│  Let's set things up for you.    │
│                                  │
│  [x] Voice navigation            │
│  [ ] High contrast mode          │
│  [ ] Larger text                  │
│  [ ] Simplified language          │
│  [ ] Reduced animations           │
│                                  │
│  > Tap to toggle, or say         │
│    "turn on high contrast"       │
│                                  │
└──────────────────────────────────┘

Speech bubble: "These help me work better for you. You can change them anytime in settings!"
```

Each option is a toggle (checkbox styled as terminal brackets). The current voice/text input preference from the welcome screen pre-selects the voice navigation option. All toggles are large touch targets with clear labels.

### `onboarding/pin-setup.tsx` — Create PIN

Uses the existing `NumPad.tsx` component and PIN setup flow from the MVP. The terminal shows the PIN dots as they're entered. Confirm PIN on second entry.

### `onboarding/done.tsx` — Pet Hatches

The climax of onboarding. The terminal shows the egg cracking open and the pet appearing in its Baby evolution tier for the first time:

```
Terminal panel:
┌──────────────────────────────────┐
│                                  │
│         *  crack  *              │
│        ╭───────╮                 │
│        │ ╹   ╹ │                 │
│        │  ╰◡╯  │                 │
│        ╰───────╯                 │
│         /|   |\                  │
│                                  │
│   ── Buddy has hatched! ──       │
│                                  │
└──────────────────────────────────┘

Speech bubble: "Hi! I'm {name}! Let's figure out this money thing together!"

[Let's go! →]
```

A celebration haptic fires (the thriving pattern), the tonal audio plays the ascending major chord, and TTS announces the pet's first words. This is the first moment the user sees their pet alive — make it feel special.

The done screen also shows a brief summary: "Your plan: 50/20/30 Rule. Monthly income: £1,500. Pet name: Buddy." Below, a single CTA button enters the main app.

---

## Main App Screens (Tabs)

### `(tabs)/home.tsx` — Pet Home

The primary screen. The pet's terminal panel occupies the top half. Below it, the speech bubble shows the most recent pet dialogue (transaction reaction, daily check-in, or coaching trigger). Below the speech bubble, quick action buttons:

```
┌─────────────────────────────────────┐
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │   [ASCII PET — current      │    │
│  │    state from Brief 02]     │    │
│  │                             │    │
│  │   ── Buddy is happy! ──    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 💬 "Nice one! That's well  │    │
│  │    under your food budget." │    │
│  └──────────╮                  │    │
│              ▼                  │    │
│                                     │
│  [ 🎙 Log Spending ]               │
│                                     │
│  [ 📊 Budget ]  [ ⭐ Challenges ]  │
│                                     │
│  ── Status: Happy · Streak: 5d ──  │
│                                     │
└─────────────────────────────────────┘
```

The "Log Spending" button is the primary CTA (sage green, largest). It opens a modal or bottom sheet with the voice input component and text input as alternative. When a transaction is logged, the pet reacts immediately (Brief 02).

The status bar at the bottom shows the current pet state (with state colour dot) and the active streak count. Tapping it navigates to the history tab.

Accessibility: screen reader announces pet state on load, then the most recent dialogue message. The "Log Spending" button is the first focus target.

### `(tabs)/budget.tsx` — Budget Detail

The detailed budget breakdown, presented as **terminal-style tables** rather than a graphical dashboard:

```
Terminal panel:
┌──────────────────────────────────┐
│  ── Budget Overview ──           │
│                                  │
│  CATEGORY     SPENT    LEFT      │
│  ─────────    ─────    ────      │
│  Food         £120     £80       │
│  Transport    £45      £55       │
│  Fun          £90      £10  ⚠   │
│  Bills        £450     £0   ✓   │
│  Savings      £100     —   ✓    │
│                                  │
│  TOTAL        £805     £195     │
│                                  │
└──────────────────────────────────┘

Speech bubble: "Fun budget is getting tight — only £10 left this week!"
```

The ⚠ and ✓ indicators provide at-a-glance status without relying on colour. Each row is tappable to see transaction detail for that category.

Accessibility: the table data is read row-by-row by screen readers with clear column headers. The warning/check indicators have `accessibilityLabel` values ("warning: approaching limit" and "on track").

### `(tabs)/challenges.tsx` — Active Challenges

Challenges are presented in the terminal as a quest log:

```
Terminal panel:
┌──────────────────────────────────┐
│  ── Quest Log ──                 │
│                                  │
│  ★ ACTIVE                        │
│  "Stay under food budget"        │
│  Progress: ████░░░░ 4/7 days    │
│  Reward: +15 care points         │
│                                  │
│  ○ AVAILABLE                     │
│  "Complete the savings lesson"   │
│  Reward: +10 care points         │
│                                  │
│  ✓ COMPLETED                     │
│  "Log spending for 3 days"       │
│  +10 care points earned          │
│                                  │
└──────────────────────────────────┘

Speech bubble: "We're on day 4 of the food budget challenge! Keep going!"
```

Progress bars are ASCII-style block characters (█ and ░). Completed challenges show with ✓. The pet's speech bubble encourages progress on the active challenge.

### `(tabs)/lessons.tsx` — Micro-Lessons Library

The 16 existing micro-lessons displayed as a terminal directory listing:

```
Terminal panel:
┌──────────────────────────────────┐
│  ── Lessons ──                   │
│                                  │
│  📖 SUGGESTED FOR YOU            │
│  > The Latte Effect              │
│    "Small costs add up fast"     │
│                                  │
│  📚 ALL LESSONS                  │
│  [✓] Intro to Budgeting         │
│  [✓] Needs vs Wants             │
│  [ ] The Latte Effect            │
│  [ ] Impulse Spending            │
│  [ ] Emergency Funds             │
│  [ ] ...                         │
│                                  │
└──────────────────────────────────┘

Speech bubble: "I noticed a lot of small purchases — this one might help!"
```

The "suggested for you" section is driven by the AI coaching trigger system (Brief 02). Completed lessons show ✓. Tapping a lesson opens a detail view with the lesson content, followed by the associated gamified challenge.

### `(tabs)/history.tsx` — Pet Mood Timeline

The pet's mood over time, displayed as a terminal-style timeline:

```
Terminal panel:
┌──────────────────────────────────┐
│  ── Buddy's Journey ──           │
│                                  │
│  Mon  ★ Thriving  £32 spent      │
│  Tue  ☺ Happy     £18 spent      │
│  Wed  ☺ Happy     £45 spent      │
│  Thu  ● Neutral   £67 spent      │
│  Fri  ☹ Worried   £89 spent      │
│  Sat  ☺ Happy     £12 spent      │
│  Sun  ★ Thriving  £8 spent       │
│                                  │
│  This week: avg Happy            │
│  Last week: avg Neutral ↑        │
│                                  │
└──────────────────────────────────┘

Speech bubble: "Look at us — trending upward this week!"
```

Each day's row is tappable to show a detailed breakdown. The symbols (★ ☺ ● ☹ ✕) provide mood indication without relying on colour. The weekly summary with trend arrow gives quick feedback on progress.

---

## Settings Screens

### `settings/accessibility.tsx`

The full accessibility settings screen — an expanded version of what was set during onboarding. Terminal-themed with toggle controls:

```
Terminal panel:
┌──────────────────────────────────┐
│  ── Accessibility Settings ──    │
│                                  │
│  DISPLAY                         │
│  Text size:     [< Medium >]     │
│  High contrast: [OFF]            │
│  Reduce motion: [OFF]            │
│                                  │
│  AUDIO & HAPTICS                 │
│  Haptic feedback: [< Medium >]   │
│  Sound effects:   [ON]           │
│  Bloop sounds:    [ON]           │
│  TTS speed:       [< Normal >]   │
│                                  │
│  LANGUAGE                        │
│  Simplified mode: [OFF]          │
│  Verbose reader:  [OFF]          │
│                                  │
└──────────────────────────────────┘
```

Each setting immediately previews its effect. Changing text size reflows the terminal text. Toggling high contrast switches the palette. Changes are persisted to the `accessibility_prefs` SQLite table and applied globally via the ThemeProvider.

### `settings/profile.tsx`

Pet profile management and budget plan settings. Terminal-themed with the pet's current stats:

```
Terminal panel:
┌──────────────────────────────────┐
│  ── Pet Profile ──               │
│                                  │
│  Name:      Buddy                │
│  Age:       12 days              │
│  Stage:     Child                │
│  Path:      Flourishing          │
│  Streak:    5 days               │
│  Level:     3                    │
│                                  │
│  Budget Plan: 50/20/30 Rule      │
│  [Change Plan]                   │
│                                  │
│  [Edit Name]  [Reset Data]       │
│                                  │
└──────────────────────────────────┘
```

---

## Login Screen

### `login.tsx` — PIN Entry

Terminal-themed PIN entry. The pet's current ASCII art is visible (small version) above the PIN dots, giving the user a reason to unlock — they want to check on their pet.

```
Terminal panel:
┌──────────────────────────────────┐
│                                  │
│        [small pet art]           │
│                                  │
│   ── Enter PIN to check on      │
│      Buddy ──                    │
│                                  │
│        ● ● ○ ○                   │
│                                  │
└──────────────────────────────────┘

[NumPad below — pastel styled]
```

---

## Modal / Bottom Sheet: Log Spending

When the user taps "Log Spending" on the home screen, a bottom sheet slides up with the voice input component and a text alternative:

```
┌──────────────────────────────────┐
│  ── Log a transaction ──         │
│                                  │
│  Say or type what you spent:     │
│                                  │
│  > "£12 at Greggs for lunch"     │
│                                  │
│  [🎙 Hold to speak]              │
│                                  │
│  Or type: > £ _                  │
│  Category: [auto-detected]       │
│                                  │
│  [Save]  [Cancel]                │
│                                  │
└──────────────────────────────────┘
```

FunctionGemma parses both voice and text input into structured transaction data (amount, vendor, category). The category is auto-detected but editable — shown as a terminal-style selection that the user can tap to change.

After saving, the bottom sheet dismisses and the pet reacts immediately on the home screen.

---

## Universal Screen Patterns

Every screen follows these patterns:

**Terminal panel is the primary content area.** All data, text, and interactive content is presented within the dark terminal panel. The pastel UI surrounds it as the frame.

**Pet is present on most screens.** The home screen shows the full pet. Other screens show a small pet indicator in the terminal header or footer. The pet's presence reinforces the game feeling.

**Speech bubble appears when the pet has something to say.** Not every screen needs a speech bubble. It appears on home (always), during onboarding (every screen), and on other screens when triggered by a coaching event.

**Navigation is via bottom tab bar.** Five tabs: Home (pet icon), Budget (chart icon), Challenges (star icon), Lessons (book icon), History (clock icon). Tab bar is styled with the pastel theme. Each tab icon has a text label (never icon-only).

**Back navigation** uses the standard Expo Router stack behaviour. A terminal-styled back indicator (`← Back`) appears in the top-left when applicable.
