// Brief 01 — Typography system

export const fonts = {
  heading: 'Nunito_700Bold',
  headingMedium: 'Nunito_600SemiBold',
  body: undefined, // system default (SF Pro on iOS, Roboto on Android)
  monospace: 'JetBrainsMono_400Regular',
  monospaceBold: 'JetBrainsMono_700Bold',
  // Fallbacks if Google Fonts fail to load
  headingFallback: undefined, // system default
  monospaceFallback: 'Courier',
};

export const typeScale = {
  displayLarge: 28,   // screen titles ("Your Budget Buddy")
  displaySmall: 24,   // section headers within a screen
  titleLarge: 20,     // card titles, modal headers
  titleSmall: 18,     // sub-section headers
  bodyLarge: 16,      // primary body text (MINIMUM for interactive elements)
  bodySmall: 14,      // secondary text, captions (non-interactive only)
  caption: 12,        // fine print, timestamps (non-interactive only)
  terminal: 18,       // monospace text inside terminal panel
  terminalSmall: 14,  // terminal status text, decorative borders
};

export const lineHeight = {
  tight: 1.2,     // headings only
  normal: 1.5,    // body text (WCAG recommended minimum)
  relaxed: 1.75,  // terminal text (extra space helps ASCII art readability)
};

export type TextSizePreset = 'small' | 'medium' | 'large' | 'extra_large';

export const fontScaleMultipliers: Record<TextSizePreset, number> = {
  small: 0.85,
  medium: 1.0,
  large: 1.25,
  extra_large: 1.5,
};
