/**
 * ItemService - アイテム使用サービス
 * アイテムの使用を管理
 */

import type { Combatant } from '../../types/battle/combatant';
import type { ConsumableItem, ItemUseConditions, ItemUseResult } from '../../types/item/item';
import type { EventBus } from '../../core/EventBus';
import type { DataChangeEvent } from '../../types/system/events';
import * as itemEffects from '../../core/item/effects';

/**
 * 使用可能アイテム情報
 */
export interface UsableItemInfo {
  item: ConsumableItem;
  canUse: boolean;
  reason?: string;
}

/**
 * ItemService
 * アイテム使用を管理するサービスクラス
 * 
 * @example
 * const service = new ItemService();
 * const result = service.useItem(potion, character, { inBattle: true });
 * 
 * @example
 * // イベントバスを使用する
 * const eventBus = new EventBus();
 * const service = new ItemService(eventBus);
 */
export class ItemService {
  private eventBus?: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * アイテムを使用する
   * 
   * @param item - 使用するアイテム
   * @param target - 対象
   * @param conditions - 使用条件
   * @returns アイテム使用結果
   * 
   * @example
   * const result = service.useItem(potion, character, { inBattle: true });
   * if (result.success) {
   *   console.log('Item used!');
   * }
   */
  useItem(
    item: ConsumableItem,
    target: Combatant,
    conditions: ItemUseConditions
  ): ItemUseResult {
    // 対象の検証
    const validation = itemEffects.validateItemTarget(item, target, conditions);

    if (!validation.valid) {
      return {
        success: false,
        message: validation.reason || 'Cannot use item',
      };
    }

    // 効果を適用
    const effect = itemEffects.getItemEffect(item);
    const effects = [];

    switch (effect.type) {
      case 'heal-hp': {
        const hpRestored = itemEffects.calculateHpRestore(target, effect.value);
        target.currentHp += hpRestored;
        effects.push({
          target,
          hpRestored,
        });
        break;
      }

      case 'heal-mp': {
        const mpRestored = itemEffects.calculateMpRestore(target, effect.value);
        target.currentMp += mpRestored;
        effects.push({
          target,
          mpRestored,
        });
        break;
      }

      case 'revive': {
        const hpRestored = Math.min(effect.value, target.stats.maxHp);
        target.currentHp = hpRestored;
        effects.push({
          target,
          hpRestored,
          revived: true,
        });
        break;
      }

      case 'heal-status': {
        // Status effect healing - delegated to StatusEffectService
        // This effect type is handled by StatusEffectService.removeStatusEffect
        effects.push({
          target,
          statusRemoved: [],
        });
        break;
      }

      default:
        return {
          success: false,
          message: 'Unknown item effect type',
        };
    }

    // データ変更イベントを発行
    if (this.eventBus) {
      this.eventBus.emit<DataChangeEvent>('data-changed', {
        type: 'item-used',
        timestamp: Date.now(),
        data: { itemId: item.id, targetId: target.id }
      });
    }

    return {
      success: true,
      message: `${target.name} used ${item.name}`,
      effects,
    };
  }

  /**
   * 使用可能なアイテム一覧を取得
   * 
   * @param items - アイテム一覧
   * @param target - 対象
   * @param conditions - 使用条件
   * @returns 使用可能なアイテム情報の配列
   * 
   * @example
   * const usableItems = service.getUsableItems(inventory, character, { inBattle: true });
   */
  getUsableItems(
    items: ConsumableItem[],
    target: Combatant,
    conditions: ItemUseConditions
  ): UsableItemInfo[] {
    return items
      .filter(item => {
        // 戦闘中/戦闘外でフィルタ
        if (conditions.inBattle) {
          return item.usableInBattle;
        } else {
          return item.usableOutOfBattle;
        }
      })
      .map(item => {
        const validation = itemEffects.validateItemTarget(item, target, conditions);

        return {
          item,
          canUse: validation.valid,
          reason: validation.reason,
        };
      });
  }

  /**
   * アイテムが使用可能かチェック
   * 
   * @param item - アイテム
   * @param target - 対象
   * @param conditions - 使用条件
   * @returns 使用可能な場合true
   * 
   * @example
   * if (service.canUseItem(potion, character, { inBattle: true })) {
   *   console.log('Can use potion');
   * }
   */
  canUseItem(
    item: ConsumableItem,
    target: Combatant,
    conditions: ItemUseConditions
  ): boolean {
    return itemEffects.canUseItem(item, target, conditions);
  }

  /**
   * アイテム効果を適用（内部使用）
   * 
   * @param item - アイテム
   * @param target - 対象
   * @returns 効果適用結果
   * 
   * @example
   * const effects = service.applyItemEffect(potion, character);
   */
  applyItemEffect(item: ConsumableItem, target: Combatant) {
    const effect = itemEffects.getItemEffect(item);
    
    switch (effect.type) {
      case 'heal-hp':
        return itemEffects.calculateHpRestore(target, effect.value);
      case 'heal-mp':
        return itemEffects.calculateMpRestore(target, effect.value);
      default:
        return 0;
    }
  }
}
