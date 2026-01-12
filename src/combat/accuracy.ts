/**
 * Accuracy and critical hit calculation module
 */

import { Combatant, Skill, GameConfig } from '../types';

/**
 * Calculate hit rate
 * @param attacker - Attacking combatant
 * @param target - Target combatant
 * @param skill - Skill being used
 * @returns Hit rate (0.0~1.0)
 */
export function calculateHitRate(
  attacker: Combatant,
  target: Combatant,
  skill: Skill
): number {
  // Guaranteed hit skills always hit
  if (skill.isGuaranteedHit) {
    return 1.0;
  }

  // Base hit rate from skill accuracy
  let hitRate = skill.accuracy;

  // Add attacker's accuracy stat (converted to percentage)
  hitRate += attacker.stats.accuracy / 100;

  // Subtract target's evasion stat (converted to percentage)
  hitRate -= target.stats.evasion / 100;

  // Ensure minimum 5% hit rate
  hitRate = Math.max(0.05, hitRate);

  // Cap at 100%
  hitRate = Math.min(1.0, hitRate);

  return hitRate;
}

/**
 * Check if attack hits
 * @param hitRate - Hit rate (0.0~1.0)
 * @returns true if hit, false if miss
 */
export function checkHit(hitRate: number): boolean {
  return Math.random() < hitRate;
}

/**
 * Calculate critical hit rate
 * @param attacker - Attacking combatant
 * @param skill - Skill being used
 * @param config - Game configuration
 * @returns Critical rate (0.0~1.0)
 */
export function calculateCriticalRate(
  attacker: Combatant,
  skill: Skill,
  config: GameConfig
): number {
  // Start with base critical rate from config
  let critRate = config.combat.baseCriticalRate;

  // Add luck-based critical rate (1 luck = 0.1% crit)
  critRate += attacker.stats.luck * 0.001;

  // Add combatant's critical rate stat
  critRate += attacker.stats.criticalRate;

  // Add skill's critical bonus
  critRate += skill.criticalBonus;

  // Cap at 100%
  critRate = Math.min(1.0, critRate);

  return critRate;
}

/**
 * Check if attack is critical
 * @param criticalRate - Critical rate (0.0~1.0)
 * @returns true if critical, false otherwise
 */
export function checkCritical(criticalRate: number): boolean {
  return Math.random() < criticalRate;
}
