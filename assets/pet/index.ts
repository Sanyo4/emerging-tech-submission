import { eggArt } from './egg';
import { thrivingArt } from './thriving';
import { happyArt } from './happy';
import { neutralArt } from './neutral';
import { worriedArt } from './worried';
import { criticalArt } from './critical';
import type { PetMood } from '../../theme/colors';

export type PetArtKey = PetMood | 'egg';

export const petArtMap: Record<PetArtKey, string[]> = {
  egg: eggArt,
  thriving: thrivingArt,
  happy: happyArt,
  neutral: neutralArt,
  worried: worriedArt,
  critical: criticalArt,
};

/** Get the ASCII art lines for a given pet mood (or egg) */
export function getPetArt(state: PetArtKey): string[] {
  return petArtMap[state];
}
