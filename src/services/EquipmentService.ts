/**
 * EquipmentService - 装備管理サービス
 * キャラクターの装備変更と装備効果の管理
 */

import type { Combatant } from '../types/combatant';
import type { BaseStats, DefaultStats } from '../types/stats';
import type { Equipment, EquipmentSlot, EquipResult, UnequipResult, EquippedItems } from '../types/equipment';
import * as equipmentCore from '../item/equipment';

/**
 * EquipmentService
 * 装備処理を管理するサービスクラス
 * 
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 * 
 * @example
 * const service = new EquipmentService();
 * const result = service.equipItem(character, weapon, 'weapon');
 */
export class EquipmentService<TStats extends BaseStats = DefaultStats> {
  constructor() {
    // 初期化処理
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
    character: Combatant<TStats>, 
    equipment: Equipment<TStats>, 
    slot: EquipmentSlot
  ): EquipResult {
    // 装備可能かチェック
    if (!equipmentCore.canEquip(character, equipment)) {
      return {
        success: false,
        reason: 'レベル要件を満たしていません'
      };
    }

    // スロットが適合するかチェック
    if (!equipmentCore.validateEquipmentSlot(slot, equipment.type)) {
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
  unequipItem(character: Combatant<TStats>, slot: EquipmentSlot): UnequipResult {
    if (!character.equipment) {
      return {
        success: true
      };
    }

    const equipment = character.equipment[slot];
    
    // 装備を解除
    delete character.equipment[slot];

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
  getEquippedItems(character: Combatant<TStats>): EquippedItems<TStats> {
    return character.equipment || {};
  }

  /**
   * 装備によるステータス補正を取得
   * 
   * @param character - キャラクター
   * @returns ステータス補正
   */
  getEquipmentStats(character: Combatant<TStats>): Partial<TStats> {
    if (!character.equipment) {
      return {};
    }

    const equipments = Object.values(character.equipment).filter((e): e is Equipment<TStats> => e !== undefined);
    return equipmentCore.calculateTotalEquipmentEffects(equipments);
  }
}
