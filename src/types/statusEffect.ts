/**
 * 状態異常の型定義
 */

import { UniqueId, Timestamp } from './common';

/**
 * 状態異常タイプ
 */
export type StatusEffectType = 
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
 * 状態異常カテゴリ
 */
export type StatusEffectCategory = 
  | 'debuff'        // デバフ
  | 'buff'          // バフ
  | 'dot'           // 継続ダメージ
  | 'hot'           // 継続回復
  | 'disable';      // 行動制限

/**
 * 状態異常
 */
export interface StatusEffect {
  id: UniqueId;                     // 状態異常ID
  type: StatusEffectType;           // タイプ
  category: StatusEffectCategory;   // カテゴリ
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
