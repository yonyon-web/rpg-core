/**
 * 装備システムの型定義
 */

import type { UniqueId } from '../common';
import type { BaseStats, DefaultStats } from '../character/stats';

/**
 * 装備スロットタイプの基底型
 * - ゲームごとに独自の装備スロットを定義可能
 * 
 * @example
 * // アクションRPG向け
 * type ActionRPGSlot = 'mainHand' | 'offHand' | 'head' | 'body' | 'feet' | 'ring1' | 'ring2';
 * 
 * @example
 * // シンプルRPG向け
 * type SimpleSlot = 'weapon' | 'armor';
 */
export type BaseEquipmentSlot = string;

/**
 * デフォルト装備スロットタイプ
 * - 標準的なJRPG向けの装備スロット
 */
export type DefaultEquipmentSlot = 
  | 'weapon'          // 武器
  | 'shield'          // 盾
  | 'head'            // 頭
  | 'body'            // 体
  | 'accessory1'      // アクセサリー1
  | 'accessory2';     // アクセサリー2

/**
 * 装備タイプの基底型
 * - ゲームごとに独自の装備タイプを定義可能
 * 
 * @example
 * // MMO向け
 * type MMOEquipType = 'sword' | 'axe' | 'bow' | 'staff' | 'cloth' | 'leather' | 'plate';
 * 
 * @example
 * // カジュアルRPG向け
 * type CasualEquipType = 'weapon' | 'outfit' | 'accessory';
 */
export type BaseEquipmentType = string;

/**
 * デフォルト装備タイプ
 * - 標準的なJRPG向けの装備タイプ
 */
export type DefaultEquipmentType =
  | 'weapon'
  | 'shield'
  | 'helmet'
  | 'armor'
  | 'accessory';

/**
 * 装備アイテム
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 * @template TEquipType - 装備タイプ（デフォルト: DefaultEquipmentType）
 * 
 * @example
 * // デフォルトの装備タイプを使用
 * const weapon: Equipment = { type: 'weapon', ... };
 * 
 * @example
 * // カスタム装備タイプを使用
 * type MyEquipType = 'sword' | 'axe' | 'bow';
 * const weapon: Equipment<DefaultStats, MyEquipType> = { type: 'sword', ... };
 */
export interface Equipment<
  TStats extends BaseStats = DefaultStats,
  TEquipType extends BaseEquipmentType = DefaultEquipmentType
> {
  id: UniqueId;
  name: string;
  type: TEquipType;
  levelRequirement: number;          // 必要レベル
  statModifiers: Partial<TStats>;    // ステータス補正
  description?: string;
}

/**
 * 装備中のアイテムマップ
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 * @template TSlot - 装備スロットタイプ（デフォルト: DefaultEquipmentSlot）
 * @template TEquipType - 装備タイプ（デフォルト: DefaultEquipmentType）
 * 
 * @example
 * // デフォルトのスロットと装備タイプを使用
 * const equipped: EquippedItems = { weapon: weaponItem, ... };
 * 
 * @example
 * // カスタムスロットを使用
 * type MySlot = 'leftHand' | 'rightHand' | 'head';
 * const equipped: EquippedItems<DefaultStats, MySlot> = { leftHand: sword, ... };
 */
export type EquippedItems<
  TStats extends BaseStats = DefaultStats,
  TSlot extends BaseEquipmentSlot = DefaultEquipmentSlot,
  TEquipType extends BaseEquipmentType = DefaultEquipmentType
> = Partial<Record<TSlot, Equipment<TStats, TEquipType>>>;

/**
 * 装備結果
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 * @template TEquipType - 装備タイプ（デフォルト: DefaultEquipmentType）
 */
export interface EquipResult<
  TStats extends BaseStats = DefaultStats,
  TEquipType extends BaseEquipmentType = DefaultEquipmentType
> {
  success: boolean;
  reason?: string;
  previousEquipment?: Equipment<TStats, TEquipType>;
}

/**
 * 装備解除結果
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 * @template TEquipType - 装備タイプ（デフォルト: DefaultEquipmentType）
 */
export interface UnequipResult<
  TStats extends BaseStats = DefaultStats,
  TEquipType extends BaseEquipmentType = DefaultEquipmentType
> {
  success: boolean;
  equipment?: Equipment<TStats, TEquipType>;
  reason?: string;
}
