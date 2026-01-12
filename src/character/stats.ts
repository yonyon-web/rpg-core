/**
 * Character stats calculation module
 */

import { Stats } from '../types';

/**
 * Calculate final stats with modifiers
 * @param baseStats - Base stats
 * @param modifiers - Array of stat modifiers to apply
 * @returns Final calculated stats
 */
export function calculateFinalStats(
  baseStats: Stats,
  modifiers: Array<Partial<Stats>>
): Stats {
  // Start with base stats
  const finalStats: Stats = { ...baseStats };

  // Apply each modifier
  for (const modifier of modifiers) {
    // Apply each stat that exists in the modifier
    if (modifier.maxHp !== undefined) {
      finalStats.maxHp = applyStatModifiers(finalStats.maxHp, modifier.maxHp);
    }
    if (modifier.maxMp !== undefined) {
      finalStats.maxMp = applyStatModifiers(finalStats.maxMp, modifier.maxMp);
    }
    if (modifier.attack !== undefined) {
      finalStats.attack = applyStatModifiers(finalStats.attack, modifier.attack);
    }
    if (modifier.defense !== undefined) {
      finalStats.defense = applyStatModifiers(finalStats.defense, modifier.defense);
    }
    if (modifier.magic !== undefined) {
      finalStats.magic = applyStatModifiers(finalStats.magic, modifier.magic);
    }
    if (modifier.magicDefense !== undefined) {
      finalStats.magicDefense = applyStatModifiers(finalStats.magicDefense, modifier.magicDefense);
    }
    if (modifier.speed !== undefined) {
      finalStats.speed = applyStatModifiers(finalStats.speed, modifier.speed);
    }
    if (modifier.luck !== undefined) {
      finalStats.luck = applyStatModifiers(finalStats.luck, modifier.luck);
    }
    if (modifier.accuracy !== undefined) {
      finalStats.accuracy = applyStatModifiers(finalStats.accuracy, modifier.accuracy);
    }
    if (modifier.evasion !== undefined) {
      finalStats.evasion = applyStatModifiers(finalStats.evasion, modifier.evasion);
    }
    if (modifier.criticalRate !== undefined) {
      finalStats.criticalRate = applyStatModifiers(finalStats.criticalRate, modifier.criticalRate);
    }
  }

  return finalStats;
}

/**
 * Apply a single stat modifier
 * @param baseStat - Base stat value
 * @param modifier - Modifier to apply
 * @returns Modified stat value (minimum 0)
 */
export function applyStatModifiers(baseStat: number, modifier: number): number {
  const result = baseStat + modifier;
  return Math.max(0, result);
}
