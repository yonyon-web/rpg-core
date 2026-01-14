/**
 * StatusEffectService - 状態異常管理サービス
 * 状態異常の付与、解除、更新を管理
 */

import type { Combatant } from '../../types/battle/combatant';
import type { StatusEffect, BaseStatusEffectType, BaseStatusEffectCategory } from '../../types/status/statusEffect';
import type { BaseStats, DefaultStats } from '../../types/character/stats';
import * as effects from '../../status/effects';

/**
 * 状態異常操作の結果
 */
export interface StatusEffectOperationResult {
  success: boolean;
  reason?: string;
}

/**
 * StatusEffectService
 * 状態異常の管理を行うサービスクラス
 * 
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 * @template TEffectType - 状態異常タイプ（デフォルト: DefaultStatusEffectType）
 * @template TEffectCategory - 状態異常カテゴリ（デフォルト: DefaultStatusEffectCategory）
 * 
 * @example
 * // デフォルト設定で使用
 * const service = new StatusEffectService();
 * 
 * @example
 * // 状態異常の付与
 * const effect: StatusEffect = { ... };
 * service.applyEffect(character, effect);
 * 
 * @example
 * // 状態異常の解除
 * service.removeEffect(character, 'effect-id');
 * 
 * @example
 * // ターン終了時の処理
 * service.decrementDurations(character);
 */
export class StatusEffectService<
  TStats extends BaseStats = DefaultStats,
  TEffectType extends BaseStatusEffectType = string,
  TEffectCategory extends BaseStatusEffectCategory = string
> {
  /**
   * 状態異常を付与する
   * - 同じタイプの状態異常が既に存在する場合、スタック数を増やす
   * - 最大スタック数を超える場合はスタックしない
   * 
   * @param combatant - 対象の戦闘者
   * @param effect - 付与する状態異常
   * @returns 操作結果
   * 
   * @example
   * ```typescript
   * const poison: StatusEffect = { ... };
   * const result = service.applyEffect(character, poison);
   * ```
   */
  applyEffect(
    combatant: Combatant<TStats, TEffectType, TEffectCategory>,
    effect: StatusEffect<TEffectType, TEffectCategory>
  ): StatusEffectOperationResult {
    // 既存の同タイプの状態異常を検索
    const existing = effects.findEffectByType(combatant, effect.type);

    if (existing) {
      // スタック可能な場合はスタック数を増やす
      if (effects.canStack(existing)) {
        existing.stackCount++;
        return { success: true };
      } else {
        return { 
          success: false, 
          reason: '最大スタック数に達しています' 
        };
      }
    }

    // 新規付与
    combatant.statusEffects.push(effect);
    return { success: true };
  }

  /**
   * 状態異常を解除する
   * - 解除不可能な状態異常は解除できない
   * 
   * @param combatant - 対象の戦闘者
   * @param effectId - 解除する状態異常のID
   * @returns 操作結果
   * 
   * @example
   * ```typescript
   * const result = service.removeEffect(character, 'poison-1');
   * ```
   */
  removeEffect(
    combatant: Combatant<TStats, TEffectType, TEffectCategory>,
    effectId: string
  ): StatusEffectOperationResult {
    const effect = effects.findEffectById(combatant, effectId);

    if (!effect) {
      return { 
        success: false, 
        reason: '指定された状態異常が存在しません' 
      };
    }

    if (!effects.canDispel(effect)) {
      return { 
        success: false, 
        reason: 'この状態異常は解除できません' 
      };
    }

    const index = combatant.statusEffects.indexOf(effect);
    combatant.statusEffects.splice(index, 1);
    
    return { success: true };
  }

  /**
   * ターン終了時に状態異常の持続時間を減らす
   * - 持続時間が0になった状態異常は自動的に削除される
   * 
   * @param combatant - 対象の戦闘者
   * 
   * @example
   * ```typescript
   * // ターン終了時に呼び出す
   * service.decrementDurations(character);
   * ```
   */
  decrementDurations(
    combatant: Combatant<TStats, TEffectType, TEffectCategory>
  ): void {
    // 各状態異常の持続時間を減らす
    combatant.statusEffects.forEach(effect => {
      effect.duration--;
    });

    // 持続時間が0になった状態異常を削除
    combatant.statusEffects = effects.removeExpiredEffects(combatant.statusEffects);
  }

  /**
   * 特定のタイプの状態異常を持っているか確認する
   * 
   * @param combatant - 対象の戦闘者
   * @param effectType - 確認する状態異常タイプ
   * @returns 持っている場合true
   * 
   * @example
   * ```typescript
   * if (service.hasEffect(character, 'poison')) {
   *   // 毒状態の処理
   * }
   * ```
   */
  hasEffect(
    combatant: Combatant<TStats, TEffectType, TEffectCategory>,
    effectType: TEffectType
  ): boolean {
    return effects.hasStatusEffect(combatant, effectType);
  }

  /**
   * 特定のカテゴリの状態異常を取得する
   * 
   * @param combatant - 対象の戦闘者
   * @param category - カテゴリ
   * @returns 該当する状態異常の配列
   * 
   * @example
   * ```typescript
   * const debuffs = service.getEffectsByCategory(character, 'debuff');
   * ```
   */
  getEffectsByCategory(
    combatant: Combatant<TStats, TEffectType, TEffectCategory>,
    category: TEffectCategory
  ): StatusEffect<TEffectType, TEffectCategory>[] {
    return effects.getEffectsByCategory(combatant, category);
  }

  /**
   * すべての状態異常を取得する
   * 
   * @param combatant - 対象の戦闘者
   * @returns すべての状態異常の配列
   * 
   * @example
   * ```typescript
   * const allEffects = service.getAllEffects(character);
   * ```
   */
  getAllEffects(
    combatant: Combatant<TStats, TEffectType, TEffectCategory>
  ): StatusEffect<TEffectType, TEffectCategory>[] {
    return [...combatant.statusEffects];
  }

  /**
   * すべての状態異常をクリアする
   * 
   * @param combatant - 対象の戦闘者
   * 
   * @example
   * ```typescript
   * service.clearAllEffects(character);
   * ```
   */
  clearAllEffects(
    combatant: Combatant<TStats, TEffectType, TEffectCategory>
  ): void {
    combatant.statusEffects = [];
  }

  /**
   * 解除可能な状態異常のみクリアする
   * 
   * @param combatant - 対象の戦闘者
   * 
   * @example
   * ```typescript
   * // 解除可能な状態異常のみ削除
   * service.clearDispellableEffects(character);
   * ```
   */
  clearDispellableEffects(
    combatant: Combatant<TStats, TEffectType, TEffectCategory>
  ): void {
    combatant.statusEffects = combatant.statusEffects.filter(
      effect => !effects.canDispel(effect)
    );
  }
}
