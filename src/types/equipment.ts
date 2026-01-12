/**
 * 装備システムの型定義
 */

import type { UniqueId } from './common';
import type { BaseStats, DefaultStats } from './stats';

/**
 * 装備スロットタイプ
 */
export type EquipmentSlot = 
  | 'weapon'          // 武器
  | 'shield'          // 盾
  | 'head'            // 頭
  | 'body'            // 体
  | 'accessory1'      // アクセサリー1
  | 'accessory2';     // アクセサリー2

/**
 * 装備タイプ
 */
export type EquipmentType =
  | 'weapon'
  | 'shield'
  | 'helmet'
  | 'armor'
  | 'accessory';

/**
 * 装備アイテム
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 */
export interface Equipment<TStats extends BaseStats = DefaultStats> {
  id: UniqueId;
  name: string;
  type: EquipmentType;
  levelRequirement: number;          // 必要レベル
  statModifiers: Partial<TStats>;    // ステータス補正
  description?: string;
}

/**
 * 装備中のアイテムマップ
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 */
export type EquippedItems<TStats extends BaseStats = DefaultStats> = Partial<Record<EquipmentSlot, Equipment<TStats>>>;

/**
 * 装備結果
 */
export interface EquipResult {
  success: boolean;
  reason?: string;
  previousEquipment?: Equipment;
}

/**
 * 装備解除結果
 */
export interface UnequipResult {
  success: boolean;
  equipment?: Equipment;
  reason?: string;
}
