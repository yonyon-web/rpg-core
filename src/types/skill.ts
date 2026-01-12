/**
 * スキル関連の型定義
 */

import { UniqueId, Element, Probability } from './common';
import { StatusEffectType } from './statusEffect';

/**
 * スキルタイプ
 */
export type SkillType = 
  | 'physical'  // 物理攻撃
  | 'magic'     // 魔法攻撃
  | 'heal'      // 回復
  | 'buff'      // バフ
  | 'debuff'    // デバフ
  | 'special';  // 特殊

/**
 * 対象タイプ
 */
export type TargetType = 
  | 'single-enemy'    // 敵単体
  | 'all-enemies'     // 敵全体
  | 'single-ally'     // 味方単体
  | 'all-allies'      // 味方全体
  | 'self'            // 自分
  | 'random-enemies'  // 敵ランダム
  | 'random-allies';  // 味方ランダム

/**
 * 状態異常付与情報
 */
export interface StatusEffectApplication {
  effectType: StatusEffectType; // 状態異常タイプ
  probability: Probability;     // 付与確率
  duration: number;             // 持続ターン数
  power: number;                // 効果の強さ
}

/**
 * スキル定義
 */
export interface Skill {
  id: UniqueId;             // スキルID
  name: string;             // スキル名
  type: SkillType;          // スキルタイプ
  targetType: TargetType;   // 対象タイプ
  element: Element;         // 属性
  power: number;            // 威力（倍率）
  mpCost: number;           // 消費MP
  accuracy: number;         // 命中率（1.0 = 100%）
  criticalBonus: number;    // クリティカル率ボーナス
  isGuaranteedHit: boolean; // 必中フラグ
  statusEffects?: StatusEffectApplication[]; // 付与する状態異常
  description: string;      // スキル説明
}
