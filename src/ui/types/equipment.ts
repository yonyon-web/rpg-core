/**
 * Equipment UI Types
 * 装備UI用の型定義
 */

import type { 
  Combatant, 
  Equipment, 
  BaseEquipmentSlot,
  DefaultEquipmentSlot,
  BaseEquipmentType,
  DefaultEquipmentType,
  BaseStats,
  DefaultStats
} from '../../types';

/**
 * 装備変更のステージ
 */
export type EquipmentUIStage = 
  | 'selecting-slot'      // スロット選択中
  | 'selecting-equipment' // 装備選択中
  | 'confirming'          // 確認中
  | 'completed';          // 完了

/**
 * ステータス比較情報
 */
export interface StatsComparison<TStats extends BaseStats = DefaultStats> {
  current: Partial<TStats>;
  preview: Partial<TStats>;
  difference: Partial<TStats>;
}

/**
 * 装備UIの状態
 */
export interface EquipmentUIState<
  TStats extends BaseStats = DefaultStats,
  TSlot extends BaseEquipmentSlot = DefaultEquipmentSlot,
  TEquipType extends BaseEquipmentType = DefaultEquipmentType
> {
  // フロー管理
  stage: EquipmentUIStage;
  
  // 対象キャラクター
  character: Combatant<TStats, any, any, TSlot, TEquipType> | null;
  
  // 選択状態
  selectedSlot: TSlot | null;
  selectedEquipment: Equipment<TStats, TEquipType> | null;
  availableEquipment: Equipment<TStats, TEquipType>[];
  
  // ステータス比較
  statsComparison: StatsComparison<TStats> | null;
  
  // カーソル
  cursorIndex: number;
  
  // 装備可能性
  canEquip: boolean;
  equipmentReasons: string[];
}

/**
 * 装備UIのイベント
 */
export interface EquipmentEvents<
  TStats extends BaseStats = DefaultStats,
  TEquipType extends BaseEquipmentType = DefaultEquipmentType
> {
  'slot-selected': { slot: BaseEquipmentSlot };
  'equipment-selected': { equipment: Equipment<TStats, TEquipType> };
  'equipment-changed': { 
    slot: BaseEquipmentSlot; 
    oldEquipment: Equipment<TStats, TEquipType> | null;
    newEquipment: Equipment<TStats, TEquipType> | null;
  };
  'equipment-unequipped': { 
    slot: BaseEquipmentSlot; 
    equipment: Equipment<TStats, TEquipType> 
  };
  'stage-changed': { stage: EquipmentUIStage };
}
