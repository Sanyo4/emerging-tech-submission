# Brief 05 — Migration Plan

## Context for Claude Code

This brief describes how to transform the existing `micro-lessons-app` MVP into the Tamagotchi budget companion. The approach is an **in-place refactor** on a new git branch (not a fresh repo), so the full development history is preserved for assessment evidence. The user can always roll back via git.

The existing MVP is a working React Native (Expo Router) app with a solid backend: FunctionGemma AI pipeline, SQLite database, PIN authentication, voice input, haptics, tonal audio, TTS, and accessibility utilities. The refactor keeps ALL of this backend infrastructure and replaces the frontend with the terminal-themed pet UI described in Briefs 01–04.

---

## Phase 1: Foundation (Do First)

These changes create the base layer that everything else builds on. Nothing visible changes yet — this is plumbing.

### 1.1 Install new dependencies

```bash
npx expo install lottie-react-native    # for potential future animations
expo install @expo-google-fonts/nunito  # heading font
expo install @expo-google-fonts/jetbrains-mono  # terminal monospace font
npm install @dicebear/core @dicebear/collection  # avatar personalisation (optional)
```

### 1.2 Create the theme system

Build the entire `theme/` directory from Brief 01. This replaces `constants/theme.ts`. Create all files (colors.ts, typography.ts, spacing.ts, shadows.ts, accessibility.ts, components.ts, index.ts) and the ThemeProvider context. Wire the ThemeProvider into `app/_layout.tsx` so all screens can consume tokens via `useTheme()`.

### 1.3 Extend the database schema

Add the new tables from Brief 03 (pet_profile, pet_state_history, daily_care, engagement_events, accessibility_prefs) to `services/database.ts`. Run migrations on app startup. Do NOT remove any existing tables — the transaction, budget, lesson, and challenge tables are still needed.

### 1.4 Create the pet state engine

Build `services/petState.ts`, `services/petEvolution.ts`, `services/engagement.ts` from Brief 03. These are pure logic files with no UI — they read/write SQLite and expose functions. Write them so they can be tested independently.

### 1.5 Create ASCII art assets

Build the `assets/pet/` directory with all five emotional state ASCII art files from Brief 02. Also create the egg art for onboarding. Each file exports a `string[]` where each string is one line of art.

---

## Phase 2: Core Components (Do Second)

Build the reusable components that multiple screens share.

### 2.1 Terminal Panel component

`components/pet/PetTerminal.tsx` — the dark rounded rectangle that renders ASCII art. Accepts a `PetState` prop, looks up the art, renders it in monospace. Handles the state-tinted border, the name label, and the `accessibilityLabel`. This is the single most important visual component in the app.

### 2.2 Speech Bubble component

`components/pet/SpeechBubble.tsx` — the Animal Crossing dialogue box. Typewriter animation, bloop sounds, TTS integration, tap-to-skip. All configurable via accessibility prefs from the ThemeProvider.

### 2.3 Dialogue system

Build `services/petDialogue.ts` and `data/dialogueTemplates.ts` from Brief 02. Extend `data/functionDefs.ts` with the `pet_dialogue` function definition. Extend `services/functionExecutor.ts` with the dialogue function executor. This wires the pet's voice into the existing FunctionGemma pipeline.

### 2.4 Pet reaction system

Build `services/petReactions.ts` from Brief 02. This connects transaction logging to pet reactions — when a transaction is saved, it determines the reaction type and triggers the appropriate haptic, tonal, and visual response.

### 2.5 Shared UI components

Restyle the existing components to match the new theme. The NumPad, VoiceInput, and progress indicators should all use tokens from the ThemeProvider. Build any new shared components: terminal-styled buttons, terminal-styled toggle switches, the status bar.

---

## Phase 3: Screens (Do Third)

Replace the existing screens one at a time. Work through these in order so the app is always in a runnable state.

### 3.1 Home screen rewrite

`app/(tabs)/home.tsx` — This is the most important screen. Replace the current dashboard with the pet-centric layout from Brief 04: terminal panel with pet art at top, speech bubble below, quick action buttons, status bar. Wire it to the pet state engine so the ASCII art and dialogue update in real time. The "Log Spending" button opens the transaction input modal.

### 3.2 Onboarding rewrite

Replace the entire `app/onboarding/` directory with the new flow from Brief 04. Key changes from the current MVP: the welcome screen now introduces the pet egg and lets the user name it. The motivation cards are replaced by terminal-prompt yes/no questions (adapted from the reference OnboardingScreen.tsx scoring system). A new accessibility setup screen is added. The done screen shows the pet hatching.

Integrate the plan recommendation scoring from the reference file: 5 questions score toward 50/20/30 vs envelope method. The AI recommends the higher-scoring plan. The user can override.

Port over the onboarding data accumulator pattern from the existing `services/onboardingContext.tsx` and `services/onboardingWriter.ts` — these handle collecting data across screens and writing it all to the database at the end.

### 3.3 Budget detail screen

`app/(tabs)/budget.tsx` — Replace the current category card layout with the terminal-style table from Brief 04. The data source stays the same (SQLite budget/transaction tables), just the presentation changes.

### 3.4 Challenges screen

`app/(tabs)/challenges.tsx` — Reframe as the "Quest Log" terminal view. Update the challenge display to use pet-driven narratives from Brief 02. The underlying challenge logic and data stays the same.

### 3.5 Lessons screen

`app/(tabs)/lessons.tsx` — Reframe as a terminal directory listing with the pet-suggested lesson at top. Add `petTrigger` fields to the lesson data from `data/lessons.ts`. The lesson content and quiz mechanics stay the same.

### 3.6 History screen (new)

`app/(tabs)/history.tsx` — New screen showing the pet mood timeline from Brief 04. Reads from the `pet_state_history` SQLite table. Terminal-styled day-by-day view with mood symbols and spending totals.

### 3.7 Login screen restyle

`app/login.tsx` — Add the small pet art above the PIN dots. Restyle with the new theme. The PIN verification logic from `services/authContext.tsx` stays identical.

### 3.8 Settings screens

`app/settings/accessibility.tsx` — Full accessibility settings with all toggles from Brief 04. Reads/writes the `accessibility_prefs` table. Changes apply globally via ThemeProvider.

`app/settings/profile.tsx` — Pet profile view showing stats, evolution tier, streak, and plan management.

---

## Phase 4: Integration & Polish (Do Last)

### 4.1 Wire pet reactions to transaction flow

The existing flow is: user inputs transaction → `ai.ts` parses via FunctionGemma → `functionExecutor.ts` saves to SQLite. After the save step, add: call `petReactions.ts` to determine reaction → call `petState.ts` to recalculate → update pet terminal on home screen → fire haptic + tonal + TTS → show dialogue in speech bubble.

### 4.2 Wire pet dialogue to lesson/challenge triggers

When the pet state engine detects a pattern (e.g., repeated food overspending), the coaching trigger system generates a dialogue message suggesting a relevant lesson. This appears in the speech bubble on the next app open.

### 4.3 Daily check-in logic

In `app/_layout.tsx`, on app foreground: check if this is the first open today → if so, finalise yesterday's care quality record, check evolution, run daily greeting dialogue.

### 4.4 Notification system

Build `services/notifications.ts` using `expo-notifications`. Schedule pet-framed reminders: morning greeting, evening "log your spending" nudge, streak milestone alerts. All notification text follows the pet's voice guidelines from Brief 02.

### 4.5 Tab bar styling

Restyle the bottom tab navigator with the pastel theme. Each tab has an icon AND text label. The home tab icon could be a simple pet face glyph.

---

## Files Carried Over Unchanged

These files from the current MVP should NOT be modified (or only minimally to add imports):

```
services/ai.ts                    # FunctionGemma integration — the crown jewel
services/authContext.tsx            # PIN auth state management
services/onboardingContext.tsx      # Onboarding data accumulator pattern
services/onboardingWriter.ts       # Writes onboarding data to DB
utils/pin.ts                       # SHA-256 hashing
data/plans.ts                      # Budget plan definitions and scoring
data/lessons.ts                    # 16 micro-lesson definitions (add petTrigger field)
data/functionDefs.ts               # Function schemas (extend, don't replace)
services/functionExecutor.ts       # Function call executor (extend, don't replace)
```

## Files Modified (Extend, Don't Rewrite)

```
services/database.ts               # Add new tables, keep existing ones
services/haptics.ts                # Add pet state patterns alongside existing patterns
services/tonalAudio.ts             # Add pet state cues alongside existing cues
services/audioFeedback.ts          # Add pet state TTS announcements
utils/budgetState.ts               # Add 0-100 score output alongside existing status
utils/accessibility.ts             # Add verbose mode, simplified language detection
utils/gamification.ts              # Rename XP to "care points" in display strings
```

## Files Created New

```
theme/*                            # Entire theme directory (Brief 01)
assets/pet/*                       # ASCII art files (Brief 02)
data/dialogueTemplates.ts          # Pet dialogue message templates (Brief 02)
services/petState.ts               # Pet state derivation engine (Brief 03)
services/petEvolution.ts           # Evolution tier and path logic (Brief 03)
services/petReactions.ts           # Transaction reaction system (Brief 02)
services/petDialogue.ts            # Dialogue generation via FunctionGemma (Brief 02)
services/engagement.ts             # Engagement event tracking (Brief 03)
services/notifications.ts          # Push notification scheduling
components/pet/PetTerminal.tsx     # Terminal panel component
components/pet/SpeechBubble.tsx    # Dialogue bubble component
app/(tabs)/history.tsx             # Pet mood timeline screen
app/settings/accessibility.tsx     # Accessibility settings screen
app/settings/profile.tsx           # Pet profile screen
app/onboarding/welcome.tsx         # Pet naming screen
app/onboarding/questions.tsx       # Terminal-style yes/no questions
app/onboarding/accessibility.tsx   # Accessibility setup screen
```

## Files Deleted (Replaced by New Versions)

The existing screen files in `app/(tabs)/` and `app/onboarding/` are replaced by the new terminal-themed versions. Don't delete them before the new versions are working — build the new screens, verify they work, then remove the old files. Git branch makes this safe.

---

## Build Order Summary

This is the order Claude Code should work through. Each step should result in a runnable app.

1. Create git branch `tamagotchi-overhaul`
2. Install dependencies
3. Build `theme/` directory → verify ThemeProvider works in `_layout.tsx`
4. Extend database schema → verify migrations run
5. Build pet state engine services → verify with unit logic (no UI needed)
6. Create ASCII art assets
7. Build PetTerminal component → test with a hardcoded state
8. Build SpeechBubble component → test with hardcoded text
9. Build dialogue system (templates + FunctionGemma extension)
10. Rewrite home screen → verify pet displays and reacts to state
11. Rewrite onboarding flow → verify full flow from welcome to pet hatch
12. Rewrite budget, challenges, lessons screens → verify data displays correctly
13. Build history screen → verify timeline renders from state history
14. Restyle login screen
15. Build settings screens
16. Wire pet reactions to transaction flow → verify end-to-end: log transaction → pet reacts
17. Wire coaching triggers → verify lesson suggestions appear in speech bubble
18. Build notification system
19. Style tab bar
20. Full accessibility pass: test with screen reader, test haptics, test high contrast, test font scaling
