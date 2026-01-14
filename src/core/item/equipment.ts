/**
 * item/equipment - 装備管理モジュール
 * 装備の検証と効果計算に関する純粋な計算関数
 */

import type { BaseStats, DefaultStats } from '../../types/character/stats';
import type { Combatant } from '../../types/battle/combatant';
import type { 
  Equipment, 
  BaseEquipmentSlot, 
  DefaultEquipmentSlot,
  BaseEquipmentType, 
  DefaultEquipmentType 
} from '../../types/item/equipment';

/**
 * 装備可能かチェック
 * 
 * @param character - キャラクター
 * @param equipment - 装備アイテム
 * @returns 装備可能な場合true
 */
export function canEquip<
  TStats extends BaseStats = DefaultStats,
  TEquipType extends BaseEquipmentType = DefaultEquipmentType
>(
  character: Combatant<TStats, any, any, any, TEquipType>,
  equipment: Equipment<TStats, TEquipType>
): boolean {
  // レベル要件チェック
  if (character.level < equipment.levelRequirement) {
    return false;
  }
  
  return true;
}

/**
 * 装備タイプとスロットのマッピング設定
 * @template TSlot - 装備スロットタイプ
 * @template TEquipType - 装備タイプ
 */
export type EquipmentSlotMapping<
  TSlot extends BaseEquipmentSlot = DefaultEquipmentSlot,
  TEquipType extends BaseEquipmentType = DefaultEquipmentType
> = {
  defaultSlot: Record<TEquipType, TSlot>;
  validSlots: Record<TEquipType, TSlot[]>;
};

/**
 * デフォルトの装備スロットマッピング
 */
export const defaultEquipmentSlotMapping: EquipmentSlotMapping<DefaultEquipmentSlot, DefaultEquipmentType> = {
  defaultSlot: {
    weapon: 'weapon',
    shield: 'shield',
    helmet: 'head',
    armor: 'body',
    accessory: 'accessory1'
  },
  validSlots: {
    weapon: ['weapon'],
    shield: ['shield'],
    helmet: ['head'],
    armor: ['body'],
    accessory: ['accessory1', 'accessory2']
  }
};

/**
 * 装備タイプに対応するスロットを取得
 * 
 * @param equipmentType - 装備タイプ
 * @param slotMapping - スロットマッピング設定（オプショナル）
 * @returns 対応するスロット
 * 
 * @example
 * // デフォルトマッピングを使用
 * const slot = getSlotForEquipmentType('weapon');
 * 
 * @example
 * // カスタムマッピングを使用
 * const customMapping = {
 *   defaultSlot: { sword: 'mainHand', bow: 'mainHand' },
 *   validSlots: { sword: ['mainHand'], bow: ['mainHand'] }
 * };
 * const slot = getSlotForEquipmentType('sword', customMapping);
 */
export function getSlotForEquipmentType<
  TSlot extends BaseEquipmentSlot = DefaultEquipmentSlot,
  TEquipType extends BaseEquipmentType = DefaultEquipmentType
>(
  equipmentType: TEquipType,
  slotMapping?: EquipmentSlotMapping<TSlot, TEquipType>
): TSlot {
  const mapping = slotMapping || (defaultEquipmentSlotMapping as any);
  return mapping.defaultSlot[equipmentType];
}

/**
 * スロットに装備タイプが適合するかチェック
 * 
 * @param slot - 装備スロット
 * @param equipmentType - 装備タイプ
 * @param slotMapping - スロットマッピング設定（オプショナル）
 * @returns 適合する場合true
 * 
 * @example
 * // デフォルトマッピングを使用
 * const isValid = validateEquipmentSlot('weapon', 'weapon');
 * 
 * @example
 * // カスタムマッピングを使用
 * const customMapping = {
 *   defaultSlot: { sword: 'mainHand', dagger: 'offHand' },
 *   validSlots: { sword: ['mainHand'], dagger: ['mainHand', 'offHand'] }
 * };
 * const isValid = validateEquipmentSlot('offHand', 'dagger', customMapping);
 */
export function validateEquipmentSlot<
  TSlot extends BaseEquipmentSlot = DefaultEquipmentSlot,
  TEquipType extends BaseEquipmentType = DefaultEquipmentType
>(
  slot: TSlot,
  equipmentType: TEquipType,
  slotMapping?: EquipmentSlotMapping<TSlot, TEquipType>
): boolean {
  const mapping = slotMapping || (defaultEquipmentSlotMapping as any);
  return mapping.validSlots[equipmentType]?.includes(slot) ?? false;
}

/**
 * 装備からステータス補正を取得
 * 
 * @param equipment - 装備アイテム
 * @returns ステータス補正
 */
export function getEquipmentEffects<
  TStats extends BaseStats = DefaultStats,
  TEquipType extends BaseEquipmentType = DefaultEquipmentType
>(
  equipment: Equipment<TStats, TEquipType>
): Partial<TStats> {
  return equipment.statModifiers;
}

/**
 * 複数装備の効果を合算
 * 
 * @param equipments - 装備アイテムの配列
 * @returns 合算されたステータス補正
 */
export function calculateTotalEquipmentEffects<
  TStats extends BaseStats = DefaultStats,
  TEquipType extends BaseEquipmentType = DefaultEquipmentType
>(
  equipments: Equipment<TStats, TEquipType>[]
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
