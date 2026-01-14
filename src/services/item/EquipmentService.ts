/**
 * EquipmentService - 装備管理サービス
 * キャラクターの装備変更と装備効果の管理
 */

import type { Combatant } from '../../types/battle/combatant';
import type { BaseStats, DefaultStats } from '../../types/character/stats';
import type { 
  Equipment, 
  BaseEquipmentSlot,
  DefaultEquipmentSlot,
  BaseEquipmentType,
  DefaultEquipmentType,
  EquipResult, 
  UnequipResult, 
  EquippedItems 
} from '../../types/item/equipment';
import type { EventBus } from '../../core/EventBus';
import type { DataChangeEvent } from '../../types/system/events';
import * as equipmentCore from '../../item/equipment';

/**
 * EquipmentService設定
 * @template TSlot - 装備スロットタイプ
 * @template TEquipType - 装備タイプ
 */
export interface EquipmentServiceConfig<
  TSlot extends BaseEquipmentSlot = DefaultEquipmentSlot,
  TEquipType extends BaseEquipmentType = DefaultEquipmentType
> {
  slotMapping?: equipmentCore.EquipmentSlotMapping<TSlot, TEquipType>;
}

/**
 * EquipmentService
 * 装備処理を管理するサービスクラス
 * 
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 * @template TSlot - 装備スロットタイプ（デフォルト: DefaultEquipmentSlot）
 * @template TEquipType - 装備タイプ（デフォルト: DefaultEquipmentType）
 * 
 * @example
 * // デフォルト設定で使用
 * const service = new EquipmentService();
 * const result = service.equipItem(character, weapon, 'weapon');
 * 
 * @example
 * // カスタムスロットマッピングで使用
 * const customMapping = {
 *   defaultSlot: { sword: 'mainHand', shield: 'offHand' },
 *   validSlots: { sword: ['mainHand'], shield: ['offHand'] }
 * };
 * const service = new EquipmentService({ slotMapping: customMapping });
 */
export class EquipmentService<
  TStats extends BaseStats = DefaultStats,
  TSlot extends BaseEquipmentSlot = DefaultEquipmentSlot,
  TEquipType extends BaseEquipmentType = DefaultEquipmentType
> {
  private config: EquipmentServiceConfig<TSlot, TEquipType>;
  private eventBus?: EventBus;

  constructor(config?: EquipmentServiceConfig<TSlot, TEquipType>, eventBus?: EventBus) {
    this.config = config || {};
    this.eventBus = eventBus;
  }

  /**
   * 装備を装着
   * 
   * @param character - キャラクター
   * @param equipment - 装備アイテム
   * @param slot - 装備スロット
   * @returns 装備結果
   */
  equipItem(
    character: Combatant<TStats, any, any, TSlot, TEquipType>, 
    equipment: Equipment<TStats, TEquipType>, 
    slot: TSlot
  ): EquipResult<TStats, TEquipType> {
    // 装備可能かチェック
    if (!equipmentCore.canEquip(character, equipment)) {
      return {
        success: false,
        reason: 'レベル要件を満たしていません'
      };
    }

    // スロットが適合するかチェック
    if (!equipmentCore.validateEquipmentSlot(slot, equipment.type, this.config.slotMapping)) {
      return {
        success: false,
        reason: 'このスロットには装備できません'
      };
    }

    // 装備を初期化（存在しない場合）
    if (!character.equipment) {
      character.equipment = {};
    }

    // 以前の装備を保存
    const previousEquipment = character.equipment[slot];

    // 装備を装着
    character.equipment[slot] = equipment;

    // データ変更イベントを発行
    if (this.eventBus) {
      this.eventBus.emit<DataChangeEvent>('data-changed', {
        type: 'equipment-changed',
        timestamp: Date.now(),
        data: { 
          characterId: character.id, 
          equipmentId: equipment.id, 
          slot,
          previousEquipmentId: previousEquipment?.id 
        }
      });
    }

    return {
      success: true,
      previousEquipment
    };
  }

  /**
   * 装備を解除
   * 
   * @param character - キャラクター
   * @param slot - 装備スロット
   * @returns 解除結果
   */
  unequipItem(
    character: Combatant<TStats, any, any, TSlot, TEquipType>, 
    slot: TSlot
  ): UnequipResult<TStats, TEquipType> {
    if (!character.equipment) {
      return {
        success: true
      };
    }

    const equipment = character.equipment[slot];
    
    // 装備を解除
    delete character.equipment[slot];

    // データ変更イベントを発行
    if (this.eventBus && equipment) {
      this.eventBus.emit<DataChangeEvent>('data-changed', {
        type: 'equipment-changed',
        timestamp: Date.now(),
        data: { 
          characterId: character.id, 
          equipmentId: equipment.id, 
          slot,
          action: 'unequip'
        }
      });
    }

    return {
      success: true,
      equipment
    };
  }

  /**
   * 装備中のアイテム一覧を取得
   * 
   * @param character - キャラクター
   * @returns 装備中のアイテム
   */
  getEquippedItems(character: Combatant<TStats, any, any, TSlot, TEquipType>): EquippedItems<TStats, TSlot, TEquipType> {
    return character.equipment || {};
  }

  /**
   * 装備によるステータス補正を取得
   * 
   * @param character - キャラクター
   * @returns ステータス補正
   */
  getEquipmentStats(character: Combatant<TStats, any, any, TSlot, TEquipType>): Partial<TStats> {
    if (!character.equipment) {
      return {};
    }

    const equipments = Object.values(character.equipment).filter(
      (e): e is Equipment<TStats, TEquipType> => e !== undefined
    );
    return equipmentCore.calculateTotalEquipmentEffects(equipments);
  }
}
