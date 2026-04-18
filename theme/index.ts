// Brief 01 — ThemeProvider context + useTheme() hook
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useFonts, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';

import { base, petStates, interactive, type PetMood, type PetStateColor } from './colors';
import { fonts, typeScale, lineHeight } from './typography';
import { spacing, radius } from './spacing';
import { shadows } from './shadows';
import * as componentTokens from './components';
import {
  type AccessibilitySettings,
  defaultAccessibility,
  getEffectiveFontScale,
  getResolvedColors,
  getTypewriterSpeed,
} from './accessibility';

export type { PetMood, PetStateColor } from './colors';
export type { AccessibilitySettings } from './accessibility';
export { getTypewriterSpeed } from './accessibility';

export interface ThemeColors {
  base: typeof base;
  petStates: Record<PetMood, PetStateColor>;
  interactive: typeof interactive;
}

export interface Theme {
  colors: ThemeColors;
  fonts: typeof fonts;
  typeScale: typeof typeScale;
  lineHeight: typeof lineHeight;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  components: typeof componentTokens;
  accessibility: AccessibilitySettings;
  fontScale: number;
  fontsLoaded: boolean;
  updateAccessibility: (partial: Partial<AccessibilitySettings>) => void;
}

const ThemeContext = createContext<Theme | null>(null);

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Called when fonts finish loading */
  onReady?: () => void;
}

export function ThemeProvider({ children, onReady }: ThemeProviderProps) {
  const [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>(defaultAccessibility);

  // Load accessibility prefs from SQLite on mount
  useEffect(() => {
    loadAccessibilityPrefs();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      onReady?.();
    }
  }, [fontsLoaded, onReady]);

  const loadAccessibilityPrefs = useCallback(async () => {
    try {
      // Dynamic import to avoid circular dependency with database
      const { getAccessibilityPrefs } = await import('../services/database');
      const prefs = await getAccessibilityPrefs();
      if (prefs) {
        setAccessibilitySettings({
          highContrast: prefs.high_contrast === 1,
          reducedMotion: prefs.reduced_motion === 1,
          simplifiedLanguage: prefs.simplified_language === 1,
          verboseScreenReader: prefs.verbose_screenreader === 1,
          textSize: prefs.text_size as AccessibilitySettings['textSize'],
          hapticIntensity: prefs.haptic_intensity as AccessibilitySettings['hapticIntensity'],
          tonalVolume: prefs.tonal_volume as AccessibilitySettings['tonalVolume'],
          bloopSound: prefs.bloop_sound === 1,
          ttsSpeed: prefs.tts_speed as AccessibilitySettings['ttsSpeed'],
        });
      }
    } catch {
      // Table may not exist yet (pre-step 4) — use defaults
    }
  }, []);

  const updateAccessibility = useCallback(async (partial: Partial<AccessibilitySettings>) => {
    setAccessibilitySettings(prev => ({ ...prev, ...partial }));

    // Persist to SQLite
    try {
      const { upsertAccessibilityPrefs } = await import('../services/database');
      const dbUpdate: Record<string, unknown> = {};
      if (partial.highContrast !== undefined) dbUpdate.high_contrast = partial.highContrast ? 1 : 0;
      if (partial.reducedMotion !== undefined) dbUpdate.reduced_motion = partial.reducedMotion ? 1 : 0;
      if (partial.simplifiedLanguage !== undefined) dbUpdate.simplified_language = partial.simplifiedLanguage ? 1 : 0;
      if (partial.verboseScreenReader !== undefined) dbUpdate.verbose_screenreader = partial.verboseScreenReader ? 1 : 0;
      if (partial.textSize !== undefined) dbUpdate.text_size = partial.textSize;
      if (partial.hapticIntensity !== undefined) dbUpdate.haptic_intensity = partial.hapticIntensity;
      if (partial.tonalVolume !== undefined) dbUpdate.tonal_volume = partial.tonalVolume;
      if (partial.bloopSound !== undefined) dbUpdate.bloop_sound = partial.bloopSound ? 1 : 0;
      if (partial.ttsSpeed !== undefined) dbUpdate.tts_speed = partial.ttsSpeed;
      if (Object.keys(dbUpdate).length > 0) {
        await upsertAccessibilityPrefs(dbUpdate);
      }
    } catch {
      // Table may not exist yet — state update still applied in-memory
    }
  }, []);

  // Sync accessibility settings to non-React service modules
  useEffect(() => {
    import('../services/haptics').then(m => m.setHapticIntensity(accessibilitySettings.hapticIntensity));
    import('../services/tonalAudio').then(m => {
      m.setBloopSound(accessibilitySettings.bloopSound);
      m.setTonalVolume(accessibilitySettings.tonalVolume);
    });
  }, [accessibilitySettings.hapticIntensity, accessibilitySettings.bloopSound, accessibilitySettings.tonalVolume]);

  const resolvedColors = useMemo(
    () => getResolvedColors(accessibilitySettings.highContrast),
    [accessibilitySettings.highContrast],
  );

  const fontScale = useMemo(
    () => getEffectiveFontScale(accessibilitySettings.textSize),
    [accessibilitySettings.textSize],
  );

  const theme = useMemo<Theme>(() => ({
    colors: resolvedColors,
    fonts,
    typeScale,
    lineHeight,
    spacing,
    radius,
    shadows,
    components: componentTokens,
    accessibility: accessibilitySettings,
    fontScale,
    fontsLoaded,
    updateAccessibility,
  }), [resolvedColors, accessibilitySettings, fontScale, fontsLoaded, updateAccessibility]);

  return React.createElement(ThemeContext.Provider, { value: theme }, children);
}
