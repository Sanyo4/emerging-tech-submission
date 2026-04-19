# Tamagotchi Budget Companion — Submission

A **voice-first, blindfolded-usable** React Native budget tracker with an
Animal-Crossing terminal aesthetic. A digital pet lives inside a terminal
panel and reacts to your spending — every action flows through natural-language
voice, routed through an on-device language model to deterministic handlers,
with haptics + tonal audio + TTS as the primary output channels.

---

## Purpose

This project was built as an educational assessment deliverable. Its
distinctive goals are:

1. **Accessibility as identity** — the app is designed to be fully usable
   with eyes closed. Voice is the primary input; haptics/tones/TTS are the
   primary outputs. Screens and cards are the secondary (visual) channel.
2. **A recognisable UI** — a single terminal-style panel (`#2C2137` background,
   `#F5E6D3` text, JetBrains Mono type) houses a pet portrait, dynamic content
   cards, and a suggestion-chip bar. No tab bar.
3. **Private by design** — no cloud, no bank-API connections, no PII leaves
   the device. The LLM runs on-device via Cactus for production; a HuggingFace
   Inference API fallback is provided only for desktop dev.

---

## Tech stack

| Layer              | Technology |
|--------------------|------------|
| Runtime            | React Native 0.83, Expo SDK 55 |
| Navigation         | Expo Router (file-based, single `(tabs)` stack) |
| Language           | TypeScript 5.9 (strict mode) |
| On-device LLM      | Cactus React Native (Gemma-style 270M function-calling model) |
| Dev fallback LLM   | HuggingFace Inference API |
| Persistence        | SQLite via `expo-sqlite` |
| Voice I/O          | `expo-speech-recognition` (in) + `expo-speech` (out) |
| Haptics            | `expo-haptics` |
| Tonal audio        | `expo-av` |
| Auth               | PIN-based with SHA-256 via `expo-crypto` |

---

## Architecture overview

The voice-first pipeline is the spine of the app:

```
  user speaks
      │
      ▼
 ┌────────────────────────┐
 │  ConversationContext    │  ← keyword intercept for multi-step flows
 │  (confirm / cancel /    │    (pending transaction? active game?)
 │   edit / game turn)     │
 └─────────┬──────────────┘
           │ no active flow
           ▼
 ┌────────────────────────┐
 │  Function Gemma (NLU)   │  ← on-device model picks 1 of 13 functions
 │  services/ai.ts         │    and extracts slot values
 └─────────┬──────────────┘
           ▼
 ┌────────────────────────┐
 │  functionExecutor       │  ← deterministic handlers — 13 user-facing
 │  services/              │    + 5 internal (keyword-matched) flows
 │    functionExecutor.ts  │
 └─────────┬──────────────┘
           ▼
 ┌────────────────────────┐    ┌──────────────┐
 │  DynamicContentArea     │───▶│  Haptic +    │
 │  renders card           │    │  Tonal cue   │
 └─────────┬──────────────┘    └──────────────┘
           ▼
 ┌────────────────────────┐
 │  TTS announces result   │
 └────────────────────────┘
```

**Why this design?**
- Keeps the LLM focused on NLU only; business logic is deterministic and
  testable.
- Pet dialogue uses *enumerated templates* (not freeform AI generation) to
  prevent hallucinations — important for a finance app.
- The keyword-intercept layer means "yes" / "no" / "change to 10" work even
  without an LLM round-trip, making the app feel responsive.

---

## Feature inventory

**13 user-facing voice functions** (sent to the model):
1. `log_transaction`
2. `check_budget_status`
3. `get_spending_summary`
4. `get_budget_overview`
5. `get_category_detail`
6. `adjust_budget_limit`
7. `get_recent_transactions`
8. `get_quest_log`
9. `accept_challenge`
10. `check_pet_status`
11. `get_mood_history`
12. `get_savings_projection`
13. `get_help`

**5 internal keyword-matched flows** (never sent to the model):
`detect_spending_pattern`, `get_micro_lesson`, `create_challenge`,
`calculate_savings_impact`, `check_time_triggers`.

**Other feature surface area:**
- 11-step voice-first onboarding (pet naming → goals → income → bills →
  flexible budget → persona → plan → accessibility → PIN → done).
- PIN-based local auth (SHA-256 hashed, session per launch).
- Gamification: care-points, levels, streaks, quests, challenges.
- Pet mood history.
- Settings screen with accessibility toggles (haptic intensity, TTS rate,
  screen-reader hints).

---

## Folder layout

```
pluto-submission/
├── app/                    Expo Router screens
│   ├── _layout.tsx           Root — AuthProvider + auth gate
│   ├── login.tsx             PIN entry
│   ├── (tabs)/               Single voice-first panel
│   │   ├── _layout.tsx         Stack wrapper (no tab bar)
│   │   └── index.tsx           Home — pet, cards, mic, chips
│   ├── onboarding/           11-step voice-first intake
│   ├── settings/             Accessibility + PIN settings
│   └── demo/                 Pet gallery + sandboxed minigames
├── components/
│   ├── cards/                Terminal-style card renderers
│   ├── games/                Minigame components
│   ├── pet/                  Pet portrait, evolution states
│   ├── DynamicContentArea.tsx
│   ├── VoiceControl.tsx        Always-visible mic + TTS interrupt
│   └── SuggestionChips.tsx
├── services/
│   ├── ai.ts                   Function Gemma (Cactus / HF swap)
│   ├── functionExecutor.ts     13 user + 5 internal handler routing
│   ├── conversationContext.ts  Keyword state machine
│   ├── database.ts             SQLite schema + CRUD
│   ├── authContext.tsx         PIN auth
│   ├── onboardingContext.tsx   Onboarding in-memory accumulator
│   ├── onboardingWriter.ts     Batch-write to DB on complete
│   ├── audioFeedback.ts        TTS + coordinated multi-sensory cues
│   ├── haptics.ts              Haptic patterns by budget state
│   ├── tonalAudio.ts           Tonal cue cues
│   └── petReactions.ts         Dialogue template selection
├── data/                   Config: plans, lessons, function defs
├── theme/                  Tokens: colors, typography, spacing
├── utils/                  Helpers (PIN hashing, gamification, etc.)
├── constants/              Theme + fallback category constants
├── hooks/                  React hooks
├── assets/                 Fonts + images
├── scripts/                cors-proxy.js (dev-only)
├── briefs/                 Design-brief source material
├── docs/                   Architecture notes
├── app.json                Expo config
├── eas.json                EAS build profiles (preview APK, prod app-bundle)
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Quick start (reviewer)

```bash
# 1. install deps
npm install

# 2. (optional) enable HF fallback for desktop dev
cp .env.example .env.local
#   then paste a HuggingFace token into .env.local

# 3. start the Expo dev server
npx expo start
#   press 'i' for iOS simulator or 'a' for Android emulator
```

The app launches to the PIN screen on subsequent runs — on first launch it
goes through the 11-step onboarding.

### Native builds (optional — requires your own Expo account)

```bash
# preview APK (internal distribution)
eas build --platform android --profile preview

# production app-bundle
eas build --platform android --profile production
```

See <https://docs.expo.dev/build/introduction/> for EAS setup.

---

## Known limitations (honesty section)

- **No automated test suite** — verification is manual (boot the app, exercise
  the voice functions, confirm cards render correctly).
- **No ESLint / Prettier** — relying on TypeScript strict mode + editor
  conventions. `npx tsc --noEmit` exits 0 on the submitted codebase.
- **`expo-av` is flagged as unmaintained** by the React Native Directory;
  still ships in Expo SDK 55. Migration to `expo-audio` is planned for the
  next SDK upgrade.
- **Web target is CORS-limited** — the app is intended for native iOS/Android
  via Expo Go or a native build. A small `scripts/cors-proxy.js` is provided
  as a dev convenience for `npx expo start --web`, but it is not a supported
  deployment target.
- **Cactus on-device model is ~270MB** — first launch after a native build
  downloads the model; subsequent launches are instant.
- **`.npmrc` with `legacy-peer-deps=true`** — `cactus-react-native@1.12.0`
  peer-declares `react-native-nitro-modules@^0.33.9`, but the project pins
  `^0.34.1` (API-compatible at runtime). The `.npmrc` lets `npm install` run
  without an ERESOLVE error. Remove it if you prefer to pass
  `--legacy-peer-deps` manually.

---

## Verifying the submitted code

```bash
# from inside this directory:
npm install
npx tsc --noEmit         # must exit 0
npx expo-doctor          # expected: 15/17 checks pass; the 2 warnings are
                         # expo-av (unmaintained) and cactus-react-native
                         # (no RN Directory metadata) — both documented above
```

---

## Credits

Built by Sanyo for Emerging Technologies module. The pet art, terminal
palette, dialogue templates, and function schema were designed specifically
for this project.
