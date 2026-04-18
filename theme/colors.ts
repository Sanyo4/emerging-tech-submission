// Brief 01 — Complete colour palette

export const base = {
  background: '#FFFDF5',    // warm ivory — main app background
  surface: '#FFF3DC',       // warm cream — cards, panels, modals
  surfaceAlt: '#FFF8E7',    // lighter cream — secondary panels, input fields
  terminal: '#2C2137',      // deep warm purple-black — terminal/console background
  terminalText: '#F5E6D3',  // warm parchment — terminal text (NOT white)
  textPrimary: '#4A3728',   // warm brown — primary body text (7.2:1 on ivory)
  textSecondary: '#7D6B5D', // muted brown — secondary/caption text (4.6:1 on ivory)
  textOnDark: '#F5E6D3',    // parchment — text on terminal/dark surfaces
  border: '#E8DCC8',        // subtle warm border for cards and dividers
};

export type PetMood = 'thriving' | 'happy' | 'neutral' | 'worried' | 'critical';

export interface PetStateColor {
  light: string;
  medium: string;
  dark: string;
  label: string;
}

export const petStates: Record<PetMood, PetStateColor> = {
  thriving: {
    light: '#A8E6CF',   // mint green
    medium: '#6BC5A0',
    dark: '#3D8B6E',
    label: 'Thriving',
  },
  happy: {
    light: '#B5D8F7',   // sky blue
    medium: '#7BB8E8',
    dark: '#4A8AC4',
    label: 'Happy',
  },
  neutral: {
    light: '#FFE5A0',   // buttercup yellow
    medium: '#F5C842',
    dark: '#C49B1A',
    label: 'Neutral',
  },
  worried: {
    light: '#FFBCAD',   // peachy coral
    medium: '#F08E7A',
    dark: '#C4604E',
    label: 'Worried',
  },
  critical: {
    light: '#D4A5A5',   // dusty mauve
    medium: '#B87878',
    dark: '#8E5252',
    label: 'Critical',
  },
};

export const interactive = {
  primary: '#88C9A1',          // sage green — primary buttons
  primaryPressed: '#6BA583',   // deeper sage — pressed state
  primaryText: '#2C4A38',      // dark green — text on primary buttons

  secondary: '#F0DFC0',        // warm sand — secondary buttons
  secondaryPressed: '#D9C8A5', // deeper sand — pressed state
  secondaryText: '#4A3728',    // warm brown — text on secondary buttons

  danger: '#E8A598',           // dusty coral — destructive/warning actions
  dangerPressed: '#C4806E',    // deeper coral — pressed state
  dangerText: '#5C2E22',       // dark coral — text on danger buttons

  disabled: '#E0D8CC',         // muted beige — disabled state
  disabledText: '#A89E92',     // muted text on disabled
};

export const highContrast = {
  background: '#FFFFFF',
  surface: '#FFF8E7',
  terminal: '#1A1025',
  terminalText: '#FFFFFF',
  textPrimary: '#1A1008',
  textSecondary: '#4A3728',

  petStates: {
    thriving: { light: '#7DDBB0', medium: '#3DA87A', dark: '#1E6B4A' },
    happy: { light: '#85BEF0', medium: '#4A8FD4', dark: '#2A5F9E' },
    neutral: { light: '#FFD466', medium: '#D4A020', dark: '#8A6800' },
    worried: { light: '#FF9E88', medium: '#D46A52', dark: '#8E3422' },
    critical: { light: '#C47878', medium: '#9E4A4A', dark: '#6E2222' },
  },

  interactive: {
    primary: '#5AAA7A',
    primaryPressed: '#3D8B5E',
    primaryText: '#FFFFFF',
  },
};
