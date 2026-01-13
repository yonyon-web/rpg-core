/**
 * StatusEffectController
 * 
 * 状態異常UIの表示と管理を行うコントローラー
 * StatusEffectServiceと連携して状態異常の取得、フィルタ、ソートを行う
 * 
 * ステートレス設計: 対象キャラクターは内部で保持せず、
 * 各メソッドの引数として受け取る。これにより複数キャラクターの
 * 状態異常を同時に表示できる。
 */

import { EventEmitter } from '../core/EventEmitter';
import type { 
  StatusEffectEvents, 
  ActiveStatusEffect,
  StatusEffectFilterType,
  StatusEffectSortBy
} from '../types/statusEffect';
import type { StatusEffectService } from '../../services/StatusEffectService';
import type { Combatant } from '../../types/combatant';
import type { StatusEffect } from '../../types/statusEffect';

/**
 * StatusEffectController クラス
 * 
 * @example
 * ```typescript
 * const statusEffectService = new StatusEffectService();
 * const controller = new StatusEffectController(statusEffectService);
 * 
 * // 複数キャラクターの状態異常を取得
 * party.forEach(character => {
 *   const effects = controller.getActiveEffects(character);
 *   console.log(`${character.name}:`, effects);
 * });
 * 
 * // フィルタとソートを適用
 * const buffs = controller.getActiveEffects(character, { 
 *   filterType: 'buff', 
 *   sortBy: 'duration' 
 * });
 * ```
 */
export class StatusEffectController {
  private events: EventEmitter<StatusEffectEvents>;
  private service: StatusEffectService;

  /**
   * コンストラクタ
   * 
   * @param service - StatusEffectService インスタンス
   */
  constructor(service: StatusEffectService) {
    this.service = service;
    this.events = new EventEmitter<StatusEffectEvents>();
  }

  /**
   * イベントを購読
   * 
   * @param event - イベント名
   * @param listener - イベント発火時に呼ばれるリスナー
   * @returns 購読解除関数
   */
  on<K extends keyof StatusEffectEvents>(
    event: K,
    listener: (data: StatusEffectEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }

  /**
   * 対象のアクティブな状態異常を取得
   * 
   * @param target - 対象キャラクター
   * @param options - フィルタとソートのオプション
   * @returns アクティブな状態異常リスト
   * 
   * @example
   * ```typescript
   * // すべての状態異常を取得
   * const allEffects = controller.getActiveEffects(character);
   * 
   * // バフのみをフィルタして取得
   * const buffs = controller.getActiveEffects(character, { filterType: 'buff' });
   * 
   * // 重要度順にソート
   * const sorted = controller.getActiveEffects(character, { sortBy: 'severity' });
   * ```
   */
  getActiveEffects(
    target: Combatant,
    options?: {
      filterType?: StatusEffectFilterType;
      sortBy?: StatusEffectSortBy;
    }
  ): ActiveStatusEffect[] {
    if (!target.statusEffects) {
      return [];
    }
    
    let effects: ActiveStatusEffect[] = target.statusEffects.map(effect => ({
      ...effect,
      remainingDuration: effect.duration || 0,
      stackCount: effect.stackCount || 1
    }));
    
    // フィルタを適用
    if (options?.filterType && options.filterType !== 'all') {
      effects = this.applyFilter(effects, options.filterType);
    }
    
    // ソートを適用
    if (options?.sortBy) {
      effects = this.applySorting(effects, options.sortBy);
    }
    
    return effects;
  }

  /**
   * フィルタを適用
   * 
   * @param effects - 状態異常リスト
   * @param filterType - フィルタタイプ
   * @returns フィルタ後の状態異常リスト
   */
  private applyFilter(
    effects: ActiveStatusEffect[],
    filterType: StatusEffectFilterType
  ): ActiveStatusEffect[] {
    if (!filterType || filterType === 'all') {
      return effects;
    }
    
    return effects.filter(effect => {
      const category = effect.category;
      if (filterType === 'buff') {
        return category === 'buff' || category === 'hot';
      } else if (filterType === 'debuff') {
        return category === 'debuff' || category === 'dot';
      } else if (filterType === 'ailment') {
        return category === 'disable';
      }
      return true;
    });
  }

  /**
   * ソートを適用
   * 
   * @param effects - 状態異常リスト
   * @param sortBy - ソート基準
   * @returns ソート後の状態異常リスト
   */
  private applySorting(
    effects: ActiveStatusEffect[],
    sortBy: StatusEffectSortBy
  ): ActiveStatusEffect[] {
    const sorted = [...effects];
    
    sorted.sort((a, b) => {
      if (sortBy === 'duration') {
        return b.remainingDuration - a.remainingDuration;
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'severity') {
        // 重要度順（カテゴリ順）
        const severityOrder = { ailment: 3, disable: 3, debuff: 2, dot: 2, buff: 1, hot: 1 };
        const aSeverity = severityOrder[a.category as keyof typeof severityOrder] || 0;
        const bSeverity = severityOrder[b.category as keyof typeof severityOrder] || 0;
        return bSeverity - aSeverity;
      }
      return 0;
    });
    
    return sorted;
  }

  /**
   * 状態異常の数を取得
   * 
   * @param target - 対象キャラクター
   * @param category - カテゴリ（省略時は全体）
   * @returns 状態異常の数
   * 
   * @example
   * ```typescript
   * // すべての状態異常の数
   * const totalCount = controller.getEffectCount(character);
   * 
   * // バフの数のみ
   * const buffCount = controller.getEffectCount(character, 'buff');
   * ```
   */
  getEffectCount(
    target: Combatant,
    filterType?: StatusEffectFilterType
  ): number {
    const effects = this.getActiveEffects(target, { filterType });
    return effects.length;
  }

  /**
   * 特定の状態異常が付与されているか確認
   * 
   * @param target - 対象キャラクター
   * @param effectId - 状態異常ID
   * @returns 付与されている場合はtrue
   */
  hasEffect(target: Combatant, effectId: string): boolean {
    if (!target.statusEffects) {
      return false;
    }
    return target.statusEffects.some(effect => effect.id === effectId);
  }

  /**
   * 状態異常を付与
   * 
   * @param target - 対象
   * @param effect - 付与する状態異常
   */
  applyEffect(target: Combatant, effect: StatusEffect): void {
    const result = this.service.applyEffect(target, effect);
    
    if (result.success) {
      this.events.emit('effect-applied', { target, effect });
    }
  }

  /**
   * 状態異常を解除
   * 
   * @param target - 対象
   * @param effectId - 解除する状態異常のID
   */
  removeEffect(target: Combatant, effectId: string): void {
    const result = this.service.removeEffect(target, effectId);
    
    if (result.success) {
      this.events.emit('effect-removed', { target, effectId });
    }
  }
}
