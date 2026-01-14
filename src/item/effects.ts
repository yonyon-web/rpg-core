/**
 * item/effects - アイテム効果モジュール
 * アイテム使用条件の検証と効果計算に関する純粋な計算関数
 */

import type { Combatant } from '../types/battle/combatant';
import type { ConsumableItem, ItemEffect, ItemUseConditions } from '../types/item/item';

/**
 * アイテムが使用可能かチェック
 * 
 * @param item - アイテム
 * @param target - 対象
 * @param conditions - 使用条件
 * @returns 使用可能な場合true
 */
export function canUseItem(
  item: ConsumableItem,
  target: Combatant,
  conditions: ItemUseConditions
): boolean {
  // 対象の生死チェック（追加条件）
  if (conditions.targetAlive && target.currentHp <= 0) {
    return false;
  }

  if (conditions.targetDead && target.currentHp > 0) {
    return false;
  }

  // HP率チェック（追加条件）
  if (conditions.minHpRate !== undefined) {
    const hpRate = target.currentHp / target.stats.maxHp;
    if (hpRate < conditions.minHpRate) {
      return false;
    }
  }

  if (conditions.maxHpRate !== undefined) {
    const hpRate = target.currentHp / target.stats.maxHp;
    if (hpRate > conditions.maxHpRate) {
      return false;
    }
  }

  // 基本的な検証はvalidateItemTargetに委譲
  return validateItemTarget(item, target, conditions).valid;
}

/**
 * アイテム効果を取得
 * 
 * @param item - アイテム
 * @returns アイテム効果
 */
export function getItemEffect(item: ConsumableItem): ItemEffect {
  return item.effect;
}

/**
 * アイテムの対象を検証
 * 
 * @param item - アイテム
 * @param target - 対象
 * @param conditions - 使用条件
 * @returns { valid: boolean, reason?: string }
 */
export function validateItemTarget(
  item: ConsumableItem,
  target: Combatant,
  conditions: ItemUseConditions
): { valid: boolean; reason?: string } {
  // 戦闘中かどうかのチェック
  if (conditions.inBattle && !item.usableInBattle) {
    return { valid: false, reason: 'Item is not usable in battle' };
  }

  if (!conditions.inBattle && !item.usableOutOfBattle) {
    return { valid: false, reason: 'Item is not usable outside of battle' };
  }

  // アイテム効果に応じた検証
  const effect = item.effect;

  if (effect.type === 'heal-hp') {
    if (target.currentHp <= 0) {
      return { valid: false, reason: 'Target is dead' };
    }
    if (target.currentHp >= target.stats.maxHp) {
      return { valid: false, reason: 'Target is already at full HP' };
    }
  }

  if (effect.type === 'heal-mp') {
    if (target.currentHp <= 0) {
      return { valid: false, reason: 'Target is dead' };
    }
    if (target.currentMp >= target.stats.maxMp) {
      return { valid: false, reason: 'Target is already at full MP' };
    }
  }

  if (effect.type === 'revive') {
    if (target.currentHp > 0) {
      return { valid: false, reason: 'Target is not dead' };
    }
  }

  return { valid: true };
}

/**
 * HP回復を計算
 * 
 * @param target - 対象
 * @param healAmount - 回復量
 * @returns 実際の回復量
 */
export function calculateHpRestore(target: Combatant, healAmount: number): number {
  const maxHp = target.stats.maxHp;
  const currentHp = target.currentHp;
  const newHp = Math.min(maxHp, currentHp + healAmount);
  return newHp - currentHp;
}

/**
 * MP回復を計算
 * 
 * @param target - 対象
 * @param restoreAmount - 回復量
 * @returns 実際の回復量
 */
export function calculateMpRestore(target: Combatant, restoreAmount: number): number {
  const maxMp = target.stats.maxMp;
  const currentMp = target.currentMp;
  const newMp = Math.min(maxMp, currentMp + restoreAmount);
  return newMp - currentMp;
}
