/**
 * 戦闘者関連の型定義
 */

import { UniqueId } from '../common';
import { BaseStats, DefaultStats } from '../character/stats';
import { 
  StatusEffect, 
  BaseStatusEffectType, 
  DefaultStatusEffectType,
  BaseStatusEffectCategory,
  DefaultStatusEffectCategory 
} from '../status/statusEffect';
import type { EquippedItems, BaseEquipmentSlot, DefaultEquipmentSlot, BaseEquipmentType, DefaultEquipmentType } from '../item/equipment';

/**
 * 戦闘者基本インターフェース
 * - キャラクターと敵の共通属性
 * - ジェネリック型TStatsでカスタムステータスをサポート
 * - ジェネリック型TEffectType, TEffectCategoryでカスタム状態異常をサポート
 * - ジェネリック型TSlot, TEquipTypeでカスタム装備スロットと装備タイプをサポート
 * 
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 * @template TEffectType - 状態異常タイプ（デフォルト: DefaultStatusEffectType）
 * @template TEffectCategory - 状態異常カテゴリ（デフォルト: DefaultStatusEffectCategory）
 * @template TSlot - 装備スロットタイプ（デフォルト: DefaultEquipmentSlot）
 * @template TEquipType - 装備タイプ（デフォルト: DefaultEquipmentType）
 * 
 * @example
 * // デフォルトのステータスと状態異常を使用
 * const combatant: Combatant = { ... };
 * 
 * @example
 * // カスタムステータスを使用
 * interface MyStats extends BaseStats {
 *   strength: number;
 *   intelligence: number;
 * }
 * const combatant: Combatant<MyStats> = { ... };
 * 
 * @example
 * // カスタム装備スロットを使用
 * type MySlot = 'leftHand' | 'rightHand' | 'head' | 'body';
 * type MyEquipType = 'sword' | 'axe' | 'helmet' | 'armor';
 * const combatant: Combatant<DefaultStats, DefaultStatusEffectType, DefaultStatusEffectCategory, MySlot, MyEquipType> = { ... };
 */
export interface Combatant<
  TStats extends BaseStats = DefaultStats,
  TEffectType extends BaseStatusEffectType = DefaultStatusEffectType,
  TEffectCategory extends BaseStatusEffectCategory = DefaultStatusEffectCategory,
  TSlot extends BaseEquipmentSlot = DefaultEquipmentSlot,
  TEquipType extends BaseEquipmentType = DefaultEquipmentType
> {
  id: UniqueId;              // ユニークID
  name: string;              // 名前
  level: number;             // レベル
  stats: TStats;             // ステータス
  currentHp: number;         // 現在のHP
  currentMp: number;         // 現在のMP
  currentExp?: number;       // 現在の経験値（オプショナル）
  equipment?: EquippedItems<TStats, TSlot, TEquipType>; // 装備（オプショナル）
  statusEffects: StatusEffect<TEffectType, TEffectCategory>[]; // 現在の状態異常
  position: number;          // 隊列位置（0=前列、1=後列）
}
