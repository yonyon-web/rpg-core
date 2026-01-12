/**
 * Status Effect Core Engine Module
 * Pure functions for status effect management
 */

import type { Combatant } from '../types/combatant';
import type { StatusEffect, BaseStatusEffectType, BaseStatusEffectCategory } from '../types/statusEffect';
import type { BaseStats } from '../types/stats';

/**
 * Check if a combatant has a specific status effect type
 * 
 * @param combatant - The combatant to check
 * @param effectType - The status effect type to look for
 * @returns True if the combatant has the status effect
 * 
 * @example
 * ```typescript
 * const isPoisoned = hasStatusEffect(character, 'poison');
 * ```
 */
export function hasStatusEffect<
  TStats extends BaseStats,
  TEffectType extends BaseStatusEffectType,
  TEffectCategory extends BaseStatusEffectCategory
>(
  combatant: Combatant<TStats, TEffectType, TEffectCategory>,
  effectType: TEffectType
): boolean {
  return combatant.statusEffects.some(effect => effect.type === effectType);
}

/**
 * Find a status effect by ID
 * 
 * @param combatant - The combatant to search
 * @param effectId - The effect ID to find
 * @returns The status effect if found, undefined otherwise
 * 
 * @example
 * ```typescript
 * const effect = findEffectById(character, 'poison-1');
 * ```
 */
export function findEffectById<
  TStats extends BaseStats,
  TEffectType extends BaseStatusEffectType,
  TEffectCategory extends BaseStatusEffectCategory
>(
  combatant: Combatant<TStats, TEffectType, TEffectCategory>,
  effectId: string
): StatusEffect<TEffectType, TEffectCategory> | undefined {
  return combatant.statusEffects.find(effect => effect.id === effectId);
}

/**
 * Find a status effect by type
 * 
 * @param combatant - The combatant to search
 * @param effectType - The effect type to find
 * @returns The status effect if found, undefined otherwise
 * 
 * @example
 * ```typescript
 * const poisonEffect = findEffectByType(character, 'poison');
 * ```
 */
export function findEffectByType<
  TStats extends BaseStats,
  TEffectType extends BaseStatusEffectType,
  TEffectCategory extends BaseStatusEffectCategory
>(
  combatant: Combatant<TStats, TEffectType, TEffectCategory>,
  effectType: TEffectType
): StatusEffect<TEffectType, TEffectCategory> | undefined {
  return combatant.statusEffects.find(effect => effect.type === effectType);
}

/**
 * Get all status effects of a specific category
 * 
 * @param combatant - The combatant to search
 * @param category - The category to filter by
 * @returns Array of status effects in the category
 * 
 * @example
 * ```typescript
 * const debuffs = getEffectsByCategory(character, 'debuff');
 * ```
 */
export function getEffectsByCategory<
  TStats extends BaseStats,
  TEffectType extends BaseStatusEffectType,
  TEffectCategory extends BaseStatusEffectCategory
>(
  combatant: Combatant<TStats, TEffectType, TEffectCategory>,
  category: TEffectCategory
): StatusEffect<TEffectType, TEffectCategory>[] {
  return combatant.statusEffects.filter(effect => effect.category === category);
}

/**
 * Check if a status effect can be dispelled
 * 
 * @param effect - The status effect to check
 * @returns True if the effect can be dispelled
 * 
 * @example
 * ```typescript
 * if (canDispel(effect)) {
 *   // Remove the effect
 * }
 * ```
 */
export function canDispel<
  TEffectType extends BaseStatusEffectType,
  TEffectCategory extends BaseStatusEffectCategory
>(
  effect: StatusEffect<TEffectType, TEffectCategory>
): boolean {
  return effect.canBeDispelled;
}

/**
 * Check if a status effect can be stacked
 * 
 * @param effect - The status effect to check
 * @returns True if the effect can be stacked further
 * 
 * @example
 * ```typescript
 * if (canStack(effect)) {
 *   effect.stackCount++;
 * }
 * ```
 */
export function canStack<
  TEffectType extends BaseStatusEffectType,
  TEffectCategory extends BaseStatusEffectCategory
>(
  effect: StatusEffect<TEffectType, TEffectCategory>
): boolean {
  return effect.stackCount < effect.maxStack;
}

/**
 * Check if a status effect has expired (duration <= 0)
 * 
 * @param effect - The status effect to check
 * @returns True if the effect has expired
 * 
 * @example
 * ```typescript
 * if (isExpired(effect)) {
 *   // Remove the effect
 * }
 * ```
 */
export function isExpired<
  TEffectType extends BaseStatusEffectType,
  TEffectCategory extends BaseStatusEffectCategory
>(
  effect: StatusEffect<TEffectType, TEffectCategory>
): boolean {
  return effect.duration <= 0;
}

/**
 * Filter out expired status effects
 * 
 * @param effects - Array of status effects
 * @returns Array with expired effects removed
 * 
 * @example
 * ```typescript
 * const activeEffects = removeExpiredEffects(character.statusEffects);
 * ```
 */
export function removeExpiredEffects<
  TEffectType extends BaseStatusEffectType,
  TEffectCategory extends BaseStatusEffectCategory
>(
  effects: StatusEffect<TEffectType, TEffectCategory>[]
): StatusEffect<TEffectType, TEffectCategory>[] {
  return effects.filter(effect => !isExpired(effect));
}
