// Brief 01 — Component-level token presets
import { base, petStates, interactive, type PetMood } from './colors';
import { fonts, typeScale, lineHeight } from './typography';
import { spacing, radius } from './spacing';
import { shadows } from './shadows';

/** Terminal panel styling tokens */
export const terminalPanel = {
  backgroundColor: base.terminal,
  textColor: base.terminalText,
  fontFamily: fonts.monospace,
  fontSize: typeScale.terminal,
  lineHeight: lineHeight.relaxed,
  borderRadius: radius.terminal,
  padding: spacing.lg,
  /** Returns border color based on pet state */
  borderColorForState: (state: PetMood) => petStates[state].light,
};

/** Speech bubble styling tokens */
export const speechBubble = {
  backgroundColor: base.surface,
  textColor: base.textPrimary,
  fontFamily: fonts.body,
  fontSize: typeScale.bodyLarge,
  lineHeight: lineHeight.normal,
  borderRadius: radius.lg,
  padding: spacing.lg,
  tailSize: 10,
};

/** Button styling tokens */
export const button = {
  primary: {
    backgroundColor: interactive.primary,
    pressedBackgroundColor: interactive.primaryPressed,
    textColor: interactive.primaryText,
    borderRadius: radius.xl,
    minHeight: 48,
    minWidth: 120,
    bottomBorderWidth: 3,
    shadow: shadows.md,
    pressedShadow: shadows.pressed,
  },
  secondary: {
    backgroundColor: interactive.secondary,
    pressedBackgroundColor: interactive.secondaryPressed,
    textColor: interactive.secondaryText,
    borderRadius: radius.xl,
    minHeight: 48,
    minWidth: 120,
    bottomBorderWidth: 3,
    shadow: shadows.sm,
    pressedShadow: shadows.pressed,
  },
  danger: {
    backgroundColor: interactive.danger,
    pressedBackgroundColor: interactive.dangerPressed,
    textColor: interactive.dangerText,
    borderRadius: radius.xl,
    minHeight: 48,
    minWidth: 120,
    bottomBorderWidth: 3,
    shadow: shadows.sm,
    pressedShadow: shadows.pressed,
  },
  disabled: {
    backgroundColor: interactive.disabled,
    textColor: interactive.disabledText,
  },
};

/** Status indicator tokens */
export const statusIndicator = {
  dotSize: 12,
  fontSize: typeScale.bodySmall,
  colorForState: (state: PetMood) => petStates[state].medium,
  labelForState: (state: PetMood) => petStates[state].label,
};
