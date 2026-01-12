/**
 * Turn order calculation module
 */

import { Combatant, GameConfig } from '../types';

/**
 * Calculate turn order for combatants
 * @param participants - Array of combatants
 * @param config - Game configuration
 * @returns Ordered array of combatants (fastest first)
 */
export function calculateTurnOrder(
  participants: Combatant[],
  config: GameConfig
): Combatant[] {
  if (participants.length === 0) {
    return [];
  }

  // Create a copy with calculated speed values
  const participantsWithSpeed = participants.map(combatant => {
    // Apply speed variance: base speed ± (variance * base speed)
    const baseSpeed = combatant.stats.speed;
    const variance = 1.0 + (Math.random() * 2 - 1) * config.combat.speedVariance;
    const effectiveSpeed = baseSpeed * variance;

    return {
      combatant,
      effectiveSpeed,
    };
  });

  // Sort by effective speed (descending - highest first)
  participantsWithSpeed.sort((a, b) => b.effectiveSpeed - a.effectiveSpeed);

  // Return sorted combatants
  return participantsWithSpeed.map(p => p.combatant);
}

/**
 * Check for preemptive strike
 * @param party - Party members
 * @param enemies - Enemy combatants
 * @param config - Game configuration
 * @returns true if party gets preemptive strike
 */
export function checkPreemptiveStrike(
  party: Combatant[],
  enemies: Combatant[],
  config: GameConfig
): boolean {
  // Handle edge cases
  if (party.length === 0 || enemies.length === 0) {
    return false;
  }

  // Calculate average speed for party
  const partyAvgSpeed = party.reduce((sum, member) => sum + member.stats.speed, 0) / party.length;

  // Calculate average speed for enemies
  const enemyAvgSpeed = enemies.reduce((sum, enemy) => sum + enemy.stats.speed, 0) / enemies.length;

  // Calculate speed difference
  const speedDifference = partyAvgSpeed - enemyAvgSpeed;

  // Check if speed difference meets threshold
  // Preemptive strike occurs when party is significantly faster
  return speedDifference >= config.combat.preemptiveStrikeThreshold;
}
