/**
 * Damage calculation module
 */

import { Combatant, Skill, GameConfig, DamageResult, Element, ElementResistance } from '../types';
import { calculateHitRate, checkHit, calculateCriticalRate, checkCritical } from './accuracy';

/**
 * Calculate physical damage
 * @param attacker - Attacking combatant
 * @param target - Target combatant
 * @param skill - Skill being used
 * @param config - Game configuration
 * @returns Damage calculation result
 */
export function calculatePhysicalDamage(
  attacker: Combatant,
  target: Combatant,
  skill: Skill,
  config: GameConfig
): DamageResult {
  const appliedModifiers: Array<{ source: string; multiplier: number }> = [];

  // Check if attack hits
  const hitRate = calculateHitRate(attacker, target, skill);
  const isHit = checkHit(hitRate);

  if (!isHit) {
    return {
      finalDamage: 0,
      baseDamage: 0,
      isCritical: false,
      isHit: false,
      elementalModifier: 1.0,
      variance: 0,
      appliedModifiers: [],
    };
  }

  // Calculate base damage: (attack * power) - defense
  const baseDamage = Math.max(1, attacker.stats.attack * skill.power - target.stats.defense);

  // Check for critical hit
  const criticalRate = calculateCriticalRate(attacker, skill, config);
  const isCritical = checkCritical(criticalRate);
  
  let finalDamage = baseDamage;

  // Apply critical multiplier
  if (isCritical) {
    const critMultiplier = config.combat.criticalMultiplier;
    finalDamage *= critMultiplier;
    appliedModifiers.push({ source: 'Critical', multiplier: critMultiplier });
  }

  // Apply elemental modifier
  // For Phase 1, we don't have elemental resistance data on combatants yet
  // So we'll just return 1.0 for now
  const elementalModifier = 1.0;
  finalDamage *= elementalModifier;

  // Apply damage variance
  const variance = 1.0 + (Math.random() * 2 - 1) * config.combat.damageVariance;
  finalDamage *= variance;
  appliedModifiers.push({ source: 'Variance', multiplier: variance });

  // Ensure minimum damage of 1
  finalDamage = Math.max(1, Math.floor(finalDamage));

  return {
    finalDamage,
    baseDamage,
    isCritical,
    isHit: true,
    elementalModifier,
    variance,
    appliedModifiers,
  };
}

/**
 * Calculate magic damage
 * @param attacker - Attacking combatant
 * @param target - Target combatant
 * @param skill - Skill being used
 * @param config - Game configuration
 * @returns Damage calculation result
 */
export function calculateMagicDamage(
  attacker: Combatant,
  target: Combatant,
  skill: Skill,
  config: GameConfig
): DamageResult {
  const appliedModifiers: Array<{ source: string; multiplier: number }> = [];

  // Check if attack hits
  const hitRate = calculateHitRate(attacker, target, skill);
  const isHit = checkHit(hitRate);

  if (!isHit) {
    return {
      finalDamage: 0,
      baseDamage: 0,
      isCritical: false,
      isHit: false,
      elementalModifier: 1.0,
      variance: 0,
      appliedModifiers: [],
    };
  }

  // Calculate base magic damage: (magic * power) - magicDefense
  const baseDamage = Math.max(1, attacker.stats.magic * skill.power - target.stats.magicDefense);

  // Check for critical hit
  const criticalRate = calculateCriticalRate(attacker, skill, config);
  const isCritical = checkCritical(criticalRate);
  
  let finalDamage = baseDamage;

  // Apply critical multiplier
  if (isCritical) {
    const critMultiplier = config.combat.criticalMultiplier;
    finalDamage *= critMultiplier;
    appliedModifiers.push({ source: 'Critical', multiplier: critMultiplier });
  }

  // Apply elemental modifier
  const elementalModifier = 1.0;
  finalDamage *= elementalModifier;

  // Apply damage variance
  const variance = 1.0 + (Math.random() * 2 - 1) * config.combat.damageVariance;
  finalDamage *= variance;
  appliedModifiers.push({ source: 'Variance', multiplier: variance });

  // Ensure minimum damage of 1
  finalDamage = Math.max(1, Math.floor(finalDamage));

  return {
    finalDamage,
    baseDamage,
    isCritical,
    isHit: true,
    elementalModifier,
    variance,
    appliedModifiers,
  };
}

/**
 * Calculate heal amount
 * @param caster - Caster combatant
 * @param target - Target combatant
 * @param skill - Skill being used
 * @param config - Game configuration
 * @returns Heal amount
 */
export function calculateHealAmount(
  caster: Combatant,
  target: Combatant,
  skill: Skill,
  config: GameConfig
): number {
  // Base heal: magic * power
  const baseHeal = caster.stats.magic * skill.power;

  // Apply small variance to heal amount
  const variance = 1.0 + (Math.random() * 2 - 1) * 0.05; // ±5% variance

  // Calculate final heal amount
  const healAmount = Math.max(1, Math.floor(baseHeal * variance));

  return healAmount;
}

/**
 * Calculate elemental modifier
 * @param attackElement - Attack element
 * @param targetResistance - Target's elemental resistance
 * @returns Elemental modifier (0.0~2.0+)
 */
export function calculateElementalModifier(
  attackElement: Element,
  targetResistance: ElementResistance
): number {
  // No element has no modifier
  if (attackElement === 'none') {
    return 1.0;
  }

  // Return resistance value for the attack element
  return targetResistance[attackElement];
}
