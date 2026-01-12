/**
 * status/effects - ステータス効果管理モジュール
 * ステータス効果の検証と管理に関する純粋な計算関数
 */

import type { Combatant } from '../types/combatant';
import type { StatusEffect, BaseStatusEffectType, BaseStatusEffectCategory } from '../types/statusEffect';
import type { BaseStats } from '../types/stats';

/**
 * 戦闘者が特定のステータス効果タイプを持っているかチェック
 * 
 * @param combatant - チェック対象の戦闘者
 * @param effectType - 検索するステータス効果タイプ
 * @returns ステータス効果を持っている場合true
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
 * IDでステータス効果を検索
 * 
 * @param combatant - 検索対象の戦闘者
 * @param effectId - 検索する効果のID
 * @returns 見つかった場合はステータス効果、それ以外はundefined
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
 * タイプでステータス効果を検索
 * 
 * @param combatant - 検索対象の戦闘者
 * @param effectType - 検索する効果のタイプ
 * @returns 見つかった場合はステータス効果、それ以外はundefined
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
 * 特定カテゴリの全ステータス効果を取得
 * 
 * @param combatant - 検索対象の戦闘者
 * @param category - フィルタリングするカテゴリ
 * @returns カテゴリに該当するステータス効果の配列
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
 * ステータス効果が解除可能かチェック
 * 
 * @param effect - チェック対象のステータス効果
 * @returns 解除可能な場合true
 * 
 * @example
 * ```typescript
 * if (canDispel(effect)) {
 *   // 効果を解除
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
 * ステータス効果がさらにスタック可能かチェック
 * 
 * @param effect - チェック対象のステータス効果
 * @returns スタック可能な場合true
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
 * ステータス効果が期限切れかチェック（duration <= 0）
 * 
 * @param effect - チェック対象のステータス効果
 * @returns 期限切れの場合true
 * 
 * @example
 * ```typescript
 * if (isExpired(effect)) {
 *   // 効果を削除
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
 * 期限切れのステータス効果を除外
 * 
 * @param effects - ステータス効果の配列
 * @returns 期限切れの効果を除外した配列
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
