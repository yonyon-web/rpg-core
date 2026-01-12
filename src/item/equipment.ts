/**
 * item/equipment - 装備管理モジュール
 * 装備の検証と効果計算に関する純粋な計算関数
 */

import type { BaseStats, DefaultStats } from '../types/stats';
import type { Combatant } from '../types/combatant';
import type { Equipment, EquipmentSlot, EquipmentType } from '../types/equipment';

/**
 * 装備可能かチェック
 * 
 * @param character - キャラクター
 * @param equipment - 装備アイテム
 * @returns 装備可能な場合true
 */
export function canEquip<TStats extends BaseStats = DefaultStats>(
  character: Combatant<TStats>,
  equipment: Equipment<TStats>
): boolean {
  // レベル要件チェック
  if (character.level < equipment.levelRequirement) {
    return false;
  }
  
  return true;
}

/**
 * 装備タイプに対応するスロットを取得
 * 
 * @param equipmentType - 装備タイプ
 * @returns 対応するスロット
 */
export function getSlotForEquipmentType(equipmentType: EquipmentType): EquipmentSlot {
  const slotMap: Record<EquipmentType, EquipmentSlot> = {
    weapon: 'weapon',
    shield: 'shield',
    helmet: 'head',
    armor: 'body',
    accessory: 'accessory1' // デフォルトはaccessory1
  };
  
  return slotMap[equipmentType];
}

/**
 * スロットに装備タイプが適合するかチェック
 * 
 * @param slot - 装備スロット
 * @param equipmentType - 装備タイプ
 * @returns 適合する場合true
 */
export function validateEquipmentSlot(slot: EquipmentSlot, equipmentType: EquipmentType): boolean {
  const validSlots: Record<EquipmentType, EquipmentSlot[]> = {
    weapon: ['weapon'],
    shield: ['shield'],
    helmet: ['head'],
    armor: ['body'],
    accessory: ['accessory1', 'accessory2']
  };
  
  return validSlots[equipmentType]?.includes(slot) ?? false;
}

/**
 * 装備からステータス補正を取得
 * 
 * @param equipment - 装備アイテム
 * @returns ステータス補正
 */
export function getEquipmentEffects<TStats extends BaseStats = DefaultStats>(
  equipment: Equipment<TStats>
): Partial<TStats> {
  return equipment.statModifiers;
}

/**
 * 複数装備の効果を合算
 * 
 * @param equipments - 装備アイテムの配列
 * @returns 合算されたステータス補正
 */
export function calculateTotalEquipmentEffects<TStats extends BaseStats = DefaultStats>(
  equipments: Equipment<TStats>[]
): Partial<TStats> {
  const total: Partial<TStats> = {};
  
  for (const equipment of equipments) {
    const effects = getEquipmentEffects(equipment);
    
    for (const [key, value] of Object.entries(effects)) {
      const statKey = key as keyof TStats;
      if (typeof value === 'number') {
        const current = (total[statKey] as number) || 0;
        total[statKey] = (current + value) as TStats[keyof TStats];
      }
    }
  }
  
  return total;
}
