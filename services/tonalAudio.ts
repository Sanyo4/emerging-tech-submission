import { Audio } from 'expo-av';
import type { BudgetState } from '../utils/budgetState';

// Module-level state synced from ThemeProvider
let currentBloopEnabled = true;
let currentTonalVolume: 'off' | 'quiet' | 'normal' | 'loud' = 'normal';
export function setBloopSound(v: boolean) { currentBloopEnabled = v; }
export function setTonalVolume(v: typeof currentTonalVolume) { currentTonalVolume = v; }

const SOUND_FILES: Record<BudgetState, ReturnType<typeof require>> = {
  excellent: require('../assets/sounds/excellent.wav'),
  good: require('../assets/sounds/good.wav'),
  warning: require('../assets/sounds/warning.wav'),
  critical: require('../assets/sounds/critical.wav'),
  overBudget: require('../assets/sounds/overbudget.wav'),
};

let currentSound: Audio.Sound | null = null;

export async function playBudgetTone(state: BudgetState): Promise<void> {
  if (!currentBloopEnabled || currentTonalVolume === 'off') return;

  try {
    await stopTone();

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
      });
    } catch {
      // setAudioModeAsync may fail on web — safe to ignore
    }

    const { sound } = await Audio.Sound.createAsync(SOUND_FILES[state]);
    currentSound = sound;

    const volumeMap: Record<string, number> = { quiet: 0.3, normal: 0.7, loud: 1.0 };
    await sound.setVolumeAsync(volumeMap[currentTonalVolume] ?? 0.7);

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        if (currentSound === sound) {
          currentSound = null;
        }
      }
    });

    await sound.playAsync();
  } catch (err) {
    console.warn('Tonal audio playback failed:', err);
  }
}

export async function stopTone(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {
      // Already unloaded
    }
    currentSound = null;
  }
}

// === Pet State Tonal Cues (Brief 02) ===
// Reuse existing budget state tones mapped to pet moods until dedicated pet WAVs are created.
// Mapping: thriving→excellent, happy→good, neutral→good, worried→warning, critical→critical
import type { PetMood } from './petState';

const PET_TONE_MAP: Record<PetMood, BudgetState> = {
  thriving: 'excellent',
  happy: 'good',
  neutral: 'good',
  worried: 'warning',
  critical: 'critical',
};

export async function playPetTone(state: PetMood): Promise<void> {
  const budgetState = PET_TONE_MAP[state];
  await playBudgetTone(budgetState);
}
