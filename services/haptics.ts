import * as Haptics from 'expo-haptics';
import { Vibration, Platform } from 'react-native';
import type { BudgetState } from '../utils/budgetState';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Module-level state synced from ThemeProvider
let currentHapticIntensity: 'off' | 'light' | 'medium' | 'strong' = 'medium';
export function setHapticIntensity(v: typeof currentHapticIntensity) { currentHapticIntensity = v; }

function scaleImpactStyle(style: Haptics.ImpactFeedbackStyle): Haptics.ImpactFeedbackStyle {
  if (currentHapticIntensity === 'light') {
    if (style === Haptics.ImpactFeedbackStyle.Heavy) return Haptics.ImpactFeedbackStyle.Medium;
    if (style === Haptics.ImpactFeedbackStyle.Medium) return Haptics.ImpactFeedbackStyle.Light;
  }
  return style;
}

function scaleAndroidPattern(pattern: number[]): number[] {
  if (currentHapticIntensity === 'light') {
    return pattern.map((v, i) => i % 2 === 1 ? Math.round(v * 0.5) : v);
  }
  return pattern;
}

// Android vibration patterns: [wait, vibrate, wait, vibrate, ...]
const ANDROID_PATTERNS: Record<BudgetState, number[]> = {
  excellent: [0, 100, 500, 100, 500, 100],                         // 3 pulses, 500ms gaps
  good: [0, 100, 300, 100, 300, 100, 300, 100],                    // 4 pulses, 300ms gaps
  warning: [0, 80, 150, 80, 150, 80, 150, 80, 150, 80],            // 5 pulses, 150ms gaps
  critical: [0, 60, 50, 60, 50, 60, 50, 60, 50, 60, 50, 60, 50, 60], // 8 rapid pulses, 50ms gaps
  overBudget: [0, 300, 100, 100, 100, 100, 100, 300],              // Emergency SOS-like
};

// iOS: sequenced impactAsync calls with spec-matching intervals
const IOS_PATTERNS: Record<BudgetState, { count: number; interval: number; style: Haptics.ImpactFeedbackStyle }> = {
  excellent: { count: 3, interval: 500, style: Haptics.ImpactFeedbackStyle.Light },
  good: { count: 4, interval: 300, style: Haptics.ImpactFeedbackStyle.Light },
  warning: { count: 5, interval: 150, style: Haptics.ImpactFeedbackStyle.Medium },
  critical: { count: 8, interval: 50, style: Haptics.ImpactFeedbackStyle.Heavy },
  overBudget: { count: 5, interval: 100, style: Haptics.ImpactFeedbackStyle.Heavy },
};

export async function playBudgetHaptic(state: BudgetState): Promise<void> {
  if (Platform.OS === 'web' || currentHapticIntensity === 'off') return;
  if (Platform.OS === 'android') {
    Vibration.vibrate(scaleAndroidPattern(ANDROID_PATTERNS[state]));
    return;
  }

  // iOS: sequenced Haptics.impactAsync
  const pattern = IOS_PATTERNS[state];
  for (let i = 0; i < pattern.count; i++) {
    await Haptics.impactAsync(scaleImpactStyle(pattern.style));
    if (i < pattern.count - 1) {
      await delay(pattern.interval);
    }
  }
}

export async function playTransactionHaptic(): Promise<void> {
  if (Platform.OS === 'web' || currentHapticIntensity === 'off') return;
  await Haptics.impactAsync(scaleImpactStyle(Haptics.ImpactFeedbackStyle.Medium));
}

export async function playSuccessHaptic(): Promise<void> {
  if (Platform.OS === 'web' || currentHapticIntensity === 'off') return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

// === Voice Interaction Haptics ===

/** Rising double-tap: "speak now" */
export async function playMicActivateHaptic(): Promise<void> {
  if (Platform.OS === 'web' || currentHapticIntensity === 'off') return;
  if (Platform.OS === 'android') {
    Vibration.vibrate(scaleAndroidPattern([0, 40, 80, 60]));
    return;
  }
  await Haptics.impactAsync(scaleImpactStyle(Haptics.ImpactFeedbackStyle.Light));
  await delay(80);
  await Haptics.impactAsync(scaleImpactStyle(Haptics.ImpactFeedbackStyle.Medium));
}

/** Single notification success: "got it" */
export async function playMicDeactivateHaptic(): Promise<void> {
  if (Platform.OS === 'web' || currentHapticIntensity === 'off') return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Rapid triple light tap: "shake registered" */
export async function playShakeDetectedHaptic(): Promise<void> {
  if (Platform.OS === 'web' || currentHapticIntensity === 'off') return;
  if (Platform.OS === 'android') {
    Vibration.vibrate(scaleAndroidPattern([0, 30, 50, 30, 50, 30]));
    return;
  }
  for (let i = 0; i < 3; i++) {
    await Haptics.impactAsync(scaleImpactStyle(Haptics.ImpactFeedbackStyle.Light));
    if (i < 2) await delay(50);
  }
}

// === Pet State Haptic Patterns (Brief 02) ===
import type { PetMood } from './petState';

export async function playPetHaptic(state: PetMood): Promise<void> {
  if (Platform.OS === 'web' || currentHapticIntensity === 'off') return;

  switch (state) {
    case 'thriving':
      await Haptics.impactAsync(scaleImpactStyle(Haptics.ImpactFeedbackStyle.Light));
      await delay(100);
      await Haptics.impactAsync(scaleImpactStyle(Haptics.ImpactFeedbackStyle.Light));
      break;
    case 'happy':
      await Haptics.impactAsync(scaleImpactStyle(Haptics.ImpactFeedbackStyle.Light));
      break;
    case 'neutral':
      break;
    case 'worried':
      await Haptics.impactAsync(scaleImpactStyle(Haptics.ImpactFeedbackStyle.Medium));
      break;
    case 'critical':
      await Haptics.impactAsync(scaleImpactStyle(Haptics.ImpactFeedbackStyle.Heavy));
      await delay(150);
      await Haptics.impactAsync(scaleImpactStyle(Haptics.ImpactFeedbackStyle.Heavy));
      await delay(150);
      await Haptics.impactAsync(scaleImpactStyle(Haptics.ImpactFeedbackStyle.Heavy));
      break;
  }
}
