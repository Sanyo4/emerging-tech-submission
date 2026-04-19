// Brief 01 — Accessibility overrides and font scaling
import { PixelRatio } from 'react-native';
import { base, petStates, interactive, highContrast, type PetMood } from './colors';
import { fontScaleMultipliers, type TextSizePreset } from './typography';

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  simplifiedLanguage: boolean;
  textSize: TextSizePreset;
  hapticIntensity: 'off' | 'light' | 'medium' | 'strong';
  tonalVolume: 'off' | 'quiet' | 'normal' | 'loud';
  bloopSound: boolean;
  ttsSpeed: 'slow' | 'normal' | 'fast';
}

export const defaultAccessibility: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  simplifiedLanguage: false,
  textSize: 'medium',
  hapticIntensity: 'medium',
  tonalVolume: 'normal',
  bloopSound: true,
  ttsSpeed: 'normal',
};

/** Get the system font scale multiplied by the user's manual text size preference */
export function getEffectiveFontScale(textSize: TextSizePreset): number {
  const systemScale = PixelRatio.getFontScale();
  const manualMultiplier = fontScaleMultipliers[textSize];
  return systemScale * manualMultiplier;
}

/** Returns resolved colors based on high contrast preference */
export function getResolvedColors(isHighContrast: boolean) {
  if (!isHighContrast) {
    return { base, petStates, interactive };
  }

  return {
    base: {
      ...base,
      background: highContrast.background,
      surface: highContrast.surface,
      terminal: highContrast.terminal,
      terminalText: highContrast.terminalText,
      textPrimary: highContrast.textPrimary,
      textSecondary: highContrast.textSecondary,
      textOnDark: highContrast.terminalText,
    },
    petStates: {
      thriving: { ...petStates.thriving, ...highContrast.petStates.thriving },
      happy: { ...petStates.happy, ...highContrast.petStates.happy },
      neutral: { ...petStates.neutral, ...highContrast.petStates.neutral },
      worried: { ...petStates.worried, ...highContrast.petStates.worried },
      critical: { ...petStates.critical, ...highContrast.petStates.critical },
    },
    interactive: {
      ...interactive,
      primary: highContrast.interactive.primary,
      primaryPressed: highContrast.interactive.primaryPressed,
      primaryText: highContrast.interactive.primaryText,
    },
  };
}

/** Typewriter animation speed in ms per character */
export function getTypewriterSpeed(ttsSpeed: 'slow' | 'normal' | 'fast'): number {
  switch (ttsSpeed) {
    case 'slow': return 60;
    case 'normal': return 30;
    case 'fast': return 15;
  }
}
