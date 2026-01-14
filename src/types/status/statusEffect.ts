/**
 * 状態異常の型定義
 */

import { UniqueId, Timestamp } from '../common';

/**
 * 状態異常タイプの基本型
 * - ゲームごとにカスタマイズ可能
 */
export type BaseStatusEffectType = string;

/**
 * デフォルト状態異常タイプ
 * - 標準的なJRPGで使用される状態異常
 */
export type DefaultStatusEffectType = 
  | 'poison'        // 毒
  | 'burn'          // 炎上
  | 'paralysis'     // 麻痺
  | 'sleep'         // 睡眠
  | 'confusion'     // 混乱
  | 'silence'       // 沈黙
  | 'blind'         // 暗闇
  | 'stun'          // スタン
  | 'regeneration'  // リジェネ
  | 'attack-up'     // 攻撃力アップ
  | 'attack-down'   // 攻撃力ダウン
  | 'defense-up'    // 防御力アップ
  | 'defense-down'  // 防御力ダウン
  | 'speed-up'      // 素早さアップ
  | 'speed-down';   // 素早さダウン



/**
 * 状態異常カテゴリの基本型
 * - ゲームごとにカスタマイズ可能
 */
export type BaseStatusEffectCategory = string;

/**
 * デフォルト状態異常カテゴリ
 * - 標準的なJRPGで使用されるカテゴリ
 */
export type DefaultStatusEffectCategory = 
  | 'debuff'        // デバフ
  | 'buff'          // バフ
  | 'dot'           // 継続ダメージ
  | 'hot'           // 継続回復
  | 'disable';      // 行動制限



/**
 * 状態異常
 * 
 * ジェネリック型でカスタム状態異常タイプとカテゴリをサポート
 * 
 * @template TType - 状態異常タイプ（デフォルト: DefaultStatusEffectType）
 * @template TCategory - 状態異常カテゴリ（デフォルト: DefaultStatusEffectCategory）
 * 
 * @example
 * // デフォルトの状態異常を使用
 * const effect: StatusEffect = { 
 *   type: 'poison',
 *   category: 'dot',
 *   // ...
 * };
 * 
 * @example
 * // カスタム状態異常を使用
 * type MyEffectType = 'freeze' | 'shock' | 'bleeding';
 * type MyEffectCategory = 'elemental' | 'physical';
 * const effect: StatusEffect<MyEffectType, MyEffectCategory> = {
 *   type: 'freeze',
 *   category: 'elemental',
 *   // ...
 * };
 */
export interface StatusEffect<
  TType extends BaseStatusEffectType = DefaultStatusEffectType,
  TCategory extends BaseStatusEffectCategory = DefaultStatusEffectCategory
> {
  id: UniqueId;                     // 状態異常ID
  type: TType;                      // タイプ
  category: TCategory;              // カテゴリ
  name: string;                     // 名前
  description: string;              // 説明
  power: number;                    // 効果の強さ
  duration: number;                 // 残り持続ターン数
  maxDuration: number;              // 最大持続ターン数
  stackCount: number;               // スタック数
  maxStack: number;                 // 最大スタック数
  canBeDispelled: boolean;          // 解除可能フラグ
  appliedAt: Timestamp;             // 付与時刻
  source?: UniqueId;                // 付与元ID
}
