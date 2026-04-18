import * as Speech from 'expo-speech';
import type { MicroLesson } from '../data/lessons';
import type { BudgetState } from '../utils/budgetState';
import { playBudgetHaptic } from './haptics';
import { playBudgetTone } from './tonalAudio';

const SPEECH_PARAMS: Record<BudgetState, { rate: number; pitch: number }> = {
  excellent: { rate: 0.85, pitch: 1.1 },
  good: { rate: 0.9, pitch: 1.0 },
  warning: { rate: 1.0, pitch: 0.9 },
  critical: { rate: 1.1, pitch: 0.8 },
  overBudget: { rate: 1.15, pitch: 0.7 },
};

export async function speakBudgetState(
  state: BudgetState,
  spent: number,
  limit: number,
): Promise<void> {
  const isSpeaking = await Speech.isSpeakingAsync();
  if (isSpeaking) return;

  const percentage = Math.round((spent / limit) * 100);
  const params = SPEECH_PARAMS[state];

  let message: string;
  switch (state) {
    case 'excellent':
      message = `You're doing great. ${percentage}% of your budget used.`;
      break;
    case 'good':
      message = `On track. ${percentage}% of your budget used.`;
      break;
    case 'warning':
      message = `Heads up. ${percentage}% of your budget is gone.`;
      break;
    case 'critical':
      message = `Careful. You've used ${percentage}% of your budget.`;
      break;
    case 'overBudget': {
      const overAmount = (spent - limit).toFixed(0);
      message = `You've gone over budget by £${overAmount}.`;
      break;
    }
  }

  Speech.speak(message, {
    language: 'en-US',
    rate: params.rate,
    pitch: params.pitch,
  });
}

/**
 * Coordinated multi-sensory budget feedback:
 * 1. Haptic fires first (near-zero latency)
 * 2. Tonal cue plays (~1 second)
 * 3. TTS announces after tone finishes
 */
export async function playFullBudgetFeedback(
  state: BudgetState,
  spent: number,
  limit: number,
): Promise<void> {
  // 1. Haptic — fire and forget (near-instant)
  playBudgetHaptic(state);

  // 2. Tonal cue — wait for it to play (~1s)
  await playBudgetTone(state);

  // Small gap between tone and speech
  await new Promise((r) => setTimeout(r, 300));

  // 3. TTS announcement
  await speakBudgetState(state, spent, limit);
}

// === Pet State Multi-Sensory Feedback (Brief 02) ===
import type { PetMood } from './petState';
import { playPetHaptic } from './haptics';
import { playPetTone } from './tonalAudio';

const PET_TTS_MESSAGES: Record<PetMood, (name: string) => string> = {
  thriving: (n) => `${n} is now thriving! Your budget is looking great.`,
  happy: (n) => `${n} is now happy. You're doing well.`,
  neutral: (n) => `${n} is feeling okay. Keep going!`,
  worried: (n) => `${n} is worried. Some of your spending categories are getting tight.`,
  critical: (n) => `${n} is not doing well. Your budget needs attention.`,
};

/**
 * Coordinated multi-sensory pet state feedback:
 * 1. Haptic fires first
 * 2. Tonal cue plays
 * 3. TTS announces state transition
 */
export async function playFullPetFeedback(
  state: PetMood,
  petName: string,
): Promise<void> {
  // 1. Haptic
  playPetHaptic(state);

  // 2. Tonal cue
  await playPetTone(state);

  // Small gap
  await new Promise((r) => setTimeout(r, 300));

  // 3. TTS
  const isSpeaking = await Speech.isSpeakingAsync();
  if (!isSpeaking) {
    Speech.speak(PET_TTS_MESSAGES[state](petName), {
      language: 'en-US',
      rate: 0.9,
    });
  }
}

// === Voice-First Helpers ===

/**
 * Stop all audio output immediately — used when mic is pressed.
 */
export function stopAllAudio(): void {
  Speech.stop();
}

export function speakQuestOffer(
  lesson: MicroLesson,
  onDone?: () => void,
): void {
  const template = lesson.challengeTemplate;
  // Lead with the lesson title + insight — those are unique per lesson, so
  // different quests sound distinct even in the first few seconds. The
  // challenge title/description is templated ("Make X for Y days...") and was
  // making every quest sound the same.
  const message = [
    'New quest.',
    `${lesson.title}.`,
    lesson.insight ? `${lesson.insight}.` : '',
    `Challenge: ${template.title}.`,
    `${template.duration_days} day${template.duration_days === 1 ? '' : 's'} for ${template.xp_reward} care points.`,
    'Say accept quest to start, or say maybe later to skip.',
  ]
    .filter(Boolean)
    .join(' ');

  Speech.stop();
  Speech.speak(message, {
    language: 'en-US',
    rate: 0.9,
    pitch: 1.0,
    onDone,
    onStopped: () => {},
  });
}
