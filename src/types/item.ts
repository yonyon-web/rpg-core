/**
 * アイテム関連の型定義
 */

import type { UniqueId } from './common';
import type { BaseStats, DefaultStats } from './stats';
import type { Combatant } from './combatant';
import type { 
  BaseStatusEffectType, 
  DefaultStatusEffectType,
  BaseStatusEffectCategory,
  DefaultStatusEffectCategory 
} from './statusEffect';
import type { BaseTargetType, DefaultTargetType } from './skill';

/**
 * アイテムタイプの基底型
 * - ゲームごとに独自のアイテム分類を定義可能
 */
export type BaseItemType = string;

/**
 * デフォルトアイテムタイプ
 * - 標準的なJRPG向けのアイテム分類
 */
export type DefaultItemType =
  | 'consumable'      // 消耗品
  | 'key-item'        // キーアイテム
  | 'material'        // 素材
  | 'equipment';      // 装備品

/**
 * アイテム効果タイプ
 */
export type ItemEffectType =
  | 'heal-hp'           // HP回復
  | 'heal-mp'           // MP回復
  | 'heal-status'       // 状態異常回復
  | 'damage'            // ダメージ
  | 'buff'              // バフ効果
  | 'debuff'            // デバフ効果
  | 'revive';           // 蘇生

/**
 * アイテム効果
 * @template TEffectType - 状態異常タイプ（デフォルト: DefaultStatusEffectType）
 */
export interface ItemEffect<
  TEffectType extends BaseStatusEffectType = DefaultStatusEffectType
> {
  type: ItemEffectType;         // 効果タイプ
  value: number;                // 効果値（回復量、ダメージ量など）
  targetType: BaseTargetType;   // 対象タイプ
  statusEffectType?: TEffectType; // 状態異常タイプ（状態異常関連の場合）
}

/**
 * 消耗品アイテム
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 * @template TEffectType - 状態異常タイプ（デフォルト: DefaultStatusEffectType）
 * @template TItemType - アイテムタイプ（デフォルト: DefaultItemType）
 * @template TTargetType - 対象タイプ（デフォルト: DefaultTargetType）
 * 
 * @example
 * const potion: ConsumableItem = {
 *   id: 'potion',
 *   name: 'Potion',
 *   type: 'consumable',
 *   effect: { type: 'heal-hp', value: 50, targetType: 'single-ally' },
 *   usableInBattle: true
 * };
 */
export interface ConsumableItem<
  TStats extends BaseStats = DefaultStats,
  TEffectType extends BaseStatusEffectType = DefaultStatusEffectType,
  TItemType extends BaseItemType = DefaultItemType,
  TTargetType extends BaseTargetType = DefaultTargetType
> {
  id: UniqueId;                    // アイテムID
  name: string;                    // アイテム名
  type: TItemType;                 // アイテムタイプ
  description: string;             // 説明
  effect: ItemEffect<TEffectType>; // アイテム効果
  usableInBattle: boolean;         // 戦闘中使用可能か
  usableOutOfBattle: boolean;      // 戦闘外使用可能か
  targetType: TTargetType;         // 対象タイプ
  consumable: boolean;             // 消費するか
}

/**
 * アイテム使用条件
 */
export interface ItemUseConditions {
  inBattle?: boolean;              // 戦闘中かどうか
  targetAlive?: boolean;           // 対象が生存している必要があるか
  targetDead?: boolean;            // 対象が死亡している必要があるか
  minHpRate?: number;              // 対象の最小HP率（0.0-1.0）
  maxHpRate?: number;              // 対象の最大HP率（0.0-1.0）
}

/**
 * アイテム使用結果
 */
export interface ItemUseResult {
  success: boolean;
  message: string;
  effects?: {
    target: Combatant;
    hpRestored?: number;
    mpRestored?: number;
    statusRemoved?: string[];
    revived?: boolean;
  }[];
}
