// Brief 03 — Evolution tier advancement and care quality tracking
import {
  getPetProfile,
  updatePetProfile,
  getDailyCareRange,
  type DailyCare,
} from './database';

export type EvolutionTier = 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'elder';
export type EvolutionPath = 'flourishing' | 'standard' | 'struggling';

/**
 * Tier thresholds: pet age in days determines tier.
 * Egg: day 0 only (during/just after onboarding)
 * Baby: days 1-3
 * Child: days 4-7
 * Teen: days 8-14
 * Adult: days 15-30
 * Elder: days 30+
 */
const TIER_ORDER: EvolutionTier[] = ['egg', 'baby', 'child', 'teen', 'adult', 'elder'];

function getTierForAge(days: number): EvolutionTier {
  if (days < 1) return 'egg';
  if (days <= 3) return 'baby';
  if (days <= 7) return 'child';
  if (days <= 14) return 'teen';
  if (days <= 30) return 'adult';
  return 'elder';
}

/**
 * Calculate the care path based on daily care records.
 * >60% good days = flourishing
 * >60% poor days = struggling
 * Otherwise = standard
 */
export function calculateCarePath(records: DailyCare[]): EvolutionPath {
  if (records.length === 0) return 'standard';

  const total = records.length;
  const goodDays = records.filter(r => r.care_quality === 'good').length;
  const poorDays = records.filter(r => r.care_quality === 'poor').length;

  if (goodDays / total > 0.6) return 'flourishing';
  if (poorDays / total > 0.6) return 'struggling';
  return 'standard';
}

/**
 * Check if the pet should advance to the next evolution tier.
 * Returns the new tier and path if advancement occurs.
 */
export async function checkEvolution(): Promise<{
  advanced: boolean;
  newTier?: EvolutionTier;
  newPath?: EvolutionPath;
}> {
  const profile = await getPetProfile();
  if (!profile) return { advanced: false };

  const createdAt = new Date(profile.created_at);
  const now = new Date();
  const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  const expectedTier = getTierForAge(ageInDays);
  const currentTierIndex = TIER_ORDER.indexOf(profile.evolution_tier as EvolutionTier);
  const expectedTierIndex = TIER_ORDER.indexOf(expectedTier);

  // No advancement needed
  if (expectedTierIndex <= currentTierIndex) {
    return { advanced: false };
  }

  // Calculate care path from daily records during the current tier
  const tierStartDate = createdAt.toISOString().split('T')[0];
  const todayDate = now.toISOString().split('T')[0];
  const careRecords = await getDailyCareRange(tierStartDate, todayDate);
  const newPath = calculateCarePath(careRecords);

  // Advance one tier at a time (in case multiple tiers were skipped)
  const newTier = TIER_ORDER[currentTierIndex + 1];

  await updatePetProfile({
    evolution_tier: newTier,
    evolution_path: newPath,
  });

  return {
    advanced: true,
    newTier,
    newPath,
  };
}

/** Get the pet's age in days */
export async function getPetAge(): Promise<number> {
  const profile = await getPetProfile();
  if (!profile) return 0;

  const createdAt = new Date(profile.created_at);
  const now = new Date();
  return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
}
