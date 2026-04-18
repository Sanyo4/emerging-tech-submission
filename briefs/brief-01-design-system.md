# Brief 01 — Design System: Animal Crossing Terminal

## Context for Claude Code

This app is a Tamagotchi-style financial wellbeing companion built in React Native (Expo Router). The visual direction is **a terminal/console interface styled with an Animal Crossing pastel aesthetic**. Think of it as a retro game console screen embedded in a warm, cosy UI shell. The pet character is rendered in ASCII art inside a monospace terminal panel, and the surrounding UI uses soft pastels, rounded shapes, and friendly typography inspired by Animal Crossing's UI language.

This file defines the complete design system. Every colour, font, spacing value, and component pattern referenced elsewhere in the app should come from this system. Build this as a `theme/` directory that exports a React Context provider so the entire app can consume tokens consistently.

---

## Colour Palette

### Base Layer (backgrounds and surfaces)

These are the foundation colours that make up the majority of the screen. The warm ivory/cream base gives the Animal Crossing "nice stationery" feel. Never use pure white (#FFFFFF) or pure black (#000000) in the default theme — they feel harsh against pastels.

```typescript
const base = {
  background:    '#FFFDF5',  // warm ivory — main app background
  surface:       '#FFF3DC',  // warm cream — cards, panels, modals
  surfaceAlt:    '#FFF8E7',  // lighter cream — secondary panels, input fields
  terminal:      '#2C2137',  // deep warm purple-black — terminal/console background
  terminalText:  '#F5E6D3',  // warm parchment — terminal text (NOT white, too harsh)
  textPrimary:   '#4A3728',  // warm brown — primary body text (7.2:1 on ivory)
  textSecondary: '#7D6B5D',  // muted brown — secondary/caption text (4.6:1 on ivory)
  textOnDark:    '#F5E6D3',  // parchment — text on terminal/dark surfaces
  border:        '#E8DCC8',  // subtle warm border for cards and dividers
};
```

### Pet State Accents

These colours communicate the pet's mood. They tint the card/container surrounding the terminal panel and appear in status indicators throughout the app. They should NEVER be used as text colours (insufficient contrast on light backgrounds) — only as backgrounds, borders, decorative elements, and icon fills.

```typescript
const petStates = {
  thriving: {
    light:  '#A8E6CF',  // mint green — backgrounds, card tints
    medium: '#6BC5A0',  // stronger mint — borders, icons
    dark:   '#3D8B6E',  // deep mint — text-safe accent (4.5:1 on ivory)
    label:  'Thriving',
  },
  happy: {
    light:  '#B5D8F7',  // sky blue
    medium: '#7BB8E8',  // medium blue
    dark:   '#4A8AC4',  // deep blue
    label:  'Happy',
  },
  neutral: {
    light:  '#FFE5A0',  // buttercup yellow
    medium: '#F5C842',  // warm gold
    dark:   '#C49B1A',  // deep gold
    label:  'Neutral',
  },
  worried: {
    light:  '#FFBCAD',  // peachy coral
    medium: '#F08E7A',  // warm coral
    dark:   '#C4604E',  // deep coral
    label:  'Worried',
  },
  critical: {
    light:  '#D4A5A5',  // dusty mauve
    medium: '#B87878',  // rose
    dark:   '#8E5252',  // deep rose
    label:  'Critical',
  },
};
```

### Interactive Elements

Buttons, toggles, and tappable elements. The primary action colour is sage green (Animal Crossing's signature UI colour). Use the `pressed` variant for active/pressed states to create the "physical button" feel AC is known for.

```typescript
const interactive = {
  primary:        '#88C9A1',  // sage green — primary buttons
  primaryPressed: '#6BA583',  // deeper sage — pressed state / bottom border
  primaryText:    '#2C4A38',  // dark green — text on primary buttons

  secondary:        '#F0DFC0',  // warm sand — secondary buttons
  secondaryPressed: '#D9C8A5',  // deeper sand — pressed state
  secondaryText:    '#4A3728',  // warm brown — text on secondary buttons

  danger:        '#E8A598',  // dusty coral — destructive/warning actions
  dangerPressed: '#C4806E',  // deeper coral — pressed state
  dangerText:    '#5C2E22',  // dark coral — text on danger buttons

  disabled:      '#E0D8CC',  // muted beige — disabled state
  disabledText:  '#A89E92',  // muted text on disabled
};
```

### High Contrast Mode Overrides

When the user enables high contrast in accessibility settings, these overrides replace the default palette. The goal is WCAG AAA compliance (7:1 contrast ratio) while maintaining the same colour *identity* — stronger versions of the same hues, not a completely different theme. The app should still feel like itself in high contrast mode.

```typescript
const highContrast = {
  background:    '#FFFFFF',  // pure white (HC only)
  surface:       '#FFF8E7',
  terminal:      '#1A1025',  // even deeper terminal
  terminalText:  '#FFFFFF',  // pure white terminal text (HC only)
  textPrimary:   '#1A1008',  // near-black warm brown (15:1 on white)
  textSecondary: '#4A3728',  // promoted to stronger brown

  // Pet state colours shift to higher saturation
  thriving:  { light: '#7DDBB0', medium: '#3DA87A', dark: '#1E6B4A' },
  happy:     { light: '#85BEF0', medium: '#4A8FD4', dark: '#2A5F9E' },
  neutral:   { light: '#FFD466', medium: '#D4A020', dark: '#8A6800' },
  worried:   { light: '#FF9E88', medium: '#D46A52', dark: '#8E3422' },
  critical:  { light: '#C47878', medium: '#9E4A4A', dark: '#6E2222' },

  // Stronger interactive colours
  primary:        '#5AAA7A',
  primaryPressed: '#3D8B5E',
  primaryText:    '#FFFFFF',
};
```

---

## Typography

### Font Families

Use Nunito for headings (rounded terminals give the Animal Crossing friendly feel) and the system default for body text (maximum readability for accessibility, and users with visual impairments are familiar with their platform's default font). The terminal panel uses a monospace font for the ASCII art — JetBrains Mono if available via Expo Google Fonts, otherwise the system monospace.

```typescript
const fonts = {
  heading:   'Nunito',          // install via expo-google-fonts
  body:      'System',          // platform default (SF Pro on iOS, Roboto on Android)
  monospace: 'JetBrainsMono',   // terminal/ASCII art — install via expo-google-fonts
  // Fallback: if Google Fonts fail to load, use system defaults
  headingFallback:   'System',
  monospaceFallback: 'Courier',
};
```

### Type Scale

Generous sizing throughout. The minimum interactive text size is 16px (accessibility requirement). The terminal uses a slightly larger monospace size so ASCII art is readable without squinting.

```typescript
const typeScale = {
  displayLarge:  28,  // screen titles ("Your Budget Buddy")
  displaySmall:  24,  // section headers within a screen
  titleLarge:    20,  // card titles, modal headers
  titleSmall:    18,  // sub-section headers
  bodyLarge:     16,  // primary body text (MINIMUM for interactive elements)
  bodySmall:     14,  // secondary text, captions (non-interactive only)
  caption:       12,  // fine print, timestamps (non-interactive only)
  terminal:      18,  // monospace text inside terminal panel
  terminalSmall: 14,  // terminal status text, decorative borders
};

const lineHeight = {
  tight:   1.2,  // headings only
  normal:  1.5,  // body text (WCAG recommended minimum)
  relaxed: 1.75, // terminal text (extra space helps ASCII art readability)
};
```

### Font Scaling

The app MUST respect the user's system font size preferences. Use React Native's `PixelRatio.getFontScale()` to detect the current setting and apply a multiplier to all type scale values. The accessibility settings screen also provides a manual override with four presets (Small = 0.85x, Medium = 1.0x, Large = 1.25x, Extra Large = 1.5x). When Extra Large is selected, some layout adjustments are needed — the terminal panel reduces its ASCII art to a simpler/smaller variant, and the speech bubble uses fewer characters per line.

---

## Spacing

Use a 4px base unit. Everything in the app should be a multiple of 4px. This creates visual rhythm and makes spacing decisions mechanical rather than arbitrary.

```typescript
const spacing = {
  xs:   4,   // tight gaps (between icon and label)
  sm:   8,   // small gaps (between related elements)
  md:   12,  // medium gaps (between sections within a card)
  lg:   16,  // large gaps (between cards, standard padding)
  xl:   24,  // extra large (between major sections)
  xxl:  32,  // page-level padding, top/bottom margins
  xxxl: 48,  // hero spacing (above the pet on home screen)
};
```

---

## Border Radius

Everything is rounded. This is the single most important visual signal that separates the Animal Crossing aesthetic from a standard fintech app. Sharp corners = serious business tool. Rounded corners = friendly game.

```typescript
const radius = {
  sm:       8,    // small elements (tags, badges)
  md:       12,   // cards, input fields
  lg:       16,   // modals, larger cards
  xl:       24,   // buttons (pill-shaped when combined with padding)
  full:     9999, // circular elements (avatar frame, status dots)
  terminal: 16,   // the terminal panel itself — rounded but not pill-shaped
};
```

---

## Shadows

Shadows are warm-tinted (not grey) to maintain the cosy feeling. Animal Crossing UI panels look like they have physical depth — like paper cards sitting on a wooden table.

```typescript
const shadows = {
  sm: {
    shadowColor: '#C4A882',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,  // Android
  },
  md: {
    shadowColor: '#C4A882',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#C4A882',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  // Special: "pressed" shadow for buttons (smaller = looks pushed in)
  pressed: {
    shadowColor: '#C4A882',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
};
```

---

## Component Patterns

### Terminal Panel

The centrepiece component. A dark rounded rectangle that holds the ASCII pet art. It should feel like a game console screen embedded in the pastel UI.

```
┌─────────────────────────────────────────┐
│  ┌───────────────────────────────────┐  │  ← cream card with mood-tinted
│  │                                   │  │    border/glow (petStates colour)
│  │   [ASCII PET ART HERE]            │  │
│  │                                   │  │  ← dark terminal bg (#2C2137)
│  │   (╹◡╹)♡                         │  │    warm parchment text (#F5E6D3)
│  │                                   │  │    monospace font (JetBrains Mono)
│  │   ── Buddy is thriving! ──        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 💬 "Great job staying under       │  │  ← speech bubble component
│  │    budget this week!"             │  │    warm cream bg, rounded corners
│  └──────────╮                        │  │    little tail pointing at terminal
│              ▼                        │  │
│  [ Log Spending ]  [ Challenges ]     │  │  ← pill buttons in sage green
└─────────────────────────────────────────┘
```

Key implementation details for the terminal panel:
- Background colour: `base.terminal` (#2C2137)
- Text colour: `base.terminalText` (#F5E6D3)
- Font: `fonts.monospace` at `typeScale.terminal` (18px)
- Line height: `lineHeight.relaxed` (1.75)
- Border radius: `radius.terminal` (16px)
- The outer card has a subtle border whose colour comes from the current pet state's `light` value
- In high contrast mode, terminal bg deepens to `highContrast.terminal` and text becomes pure white
- The terminal panel has an `accessibilityLabel` that describes the pet's current state in plain language
- The terminal panel is NOT read character-by-character by screen readers — it's treated as a single described image

### Speech Bubble

Animal Crossing's dialogue boxes with the typewriter text animation. The pet's messages appear here.

- Background: `base.surface` (#FFF3DC)
- Text colour: `base.textPrimary` (#4A3728)
- Font: `fonts.body` at `typeScale.bodyLarge` (16px)
- Border radius: `radius.lg` (16px)
- Has a small triangular tail (CSS triangle or SVG) pointing upward toward the terminal panel
- Text appears character-by-character with a configurable speed (slow/medium/fast in accessibility settings)
- Each character appearance triggers a subtle "bloop" sound via `tonalAudio.ts` (disable-able)
- When animation completes OR if reduced motion is enabled, full text is shown instantly
- TTS reads the complete message once the animation finishes (or immediately in reduced motion mode)
- In simplified language mode, the pet uses shorter sentences and simpler vocabulary

### Buttons

Pill-shaped with a "physical depth" effect achieved via a darker bottom border (like Animal Crossing's menu buttons that look pressable).

- Border radius: `radius.xl` (24px)
- Minimum height: 48px (accessibility touch target)
- Minimum width: 120px
- The `primaryPressed` colour creates a 3px bottom border that disappears on press (button appears to push down)
- Include both icon and text label (accessibility: never icon-only without a label)
- In high contrast mode, button text becomes white on stronger-coloured backgrounds

### Status Bar / Pet Mood Indicator

A horizontal bar or ring that shows overall budget health mapped to pet mood. NOT a traditional progress bar — more like the "health heart" in Zelda or the mood indicator in Animal Crossing's villager interaction.

- Use the current pet state's colour for the fill
- Include a small text label showing the state name ("Thriving", "Worried", etc.)
- Accessible: label is announced by screen reader, haptic pattern fires on state change

---

## Accessibility Integration Points

Every token and component in this system has been designed with accessibility as a primary constraint, not an afterthought. Here is the mapping:

**Visual accessibility (low vision, colour blindness):**
- All text/background combinations meet WCAG AA (4.5:1) in default mode and AAA (7:1) in high contrast mode
- Pet state is never communicated through colour alone — always paired with text label, icon, and position
- Font scaling is respected system-wide, with a manual override available
- Reduced motion mode disables all animations (typewriter effect, particle effects, transitions)

**Screen reader accessibility (blindness):**
- Terminal panel has a descriptive `accessibilityLabel` per state, not character-by-character reading
- Speech bubble text is announced via TTS after typewriter animation completes
- All buttons have text labels (never icon-only)
- Navigation follows a logical tab order matching visual layout

**Haptic/audio accessibility (deafblind, multi-sensory):**
- Each pet state has a distinct haptic pattern (defined in the pet character brief)
- Each pet state has a distinct tonal audio cue (defined in the pet character brief)
- Users can adjust haptic intensity (off/light/medium/strong) and tonal volume independently
- The speech bubble "bloop" sound is separately toggle-able

**Cognitive accessibility (learning disabilities):**
- Simplified language mode reduces vocabulary complexity throughout the UI
- Reduced cognitive load mode shows fewer items per screen (one challenge, one lesson suggestion)
- Consistent navigation — tab order and layout never dynamically rearrange
- Large touch targets (minimum 48x48dp, preferably 56x56dp for primary actions)

---

## File Structure

```
theme/
├── colors.ts          # base, petStates, interactive, highContrast
├── typography.ts       # fonts, typeScale, lineHeight
├── spacing.ts          # spacing, radius
├── shadows.ts          # shadow definitions
├── accessibility.ts    # high contrast overrides, font scale multiplier logic
├── components.ts       # component-level tokens (terminal, speechBubble, button, statusBar)
└── index.ts            # ThemeProvider context that composes everything + applies accessibility prefs
```

The `ThemeProvider` reads accessibility preferences from SQLite (the `accessibility_prefs` table) and applies high contrast overrides, font scale multipliers, and reduced motion flags globally. All components consume theme tokens via `useTheme()` hook — no hardcoded colours or sizes anywhere.
