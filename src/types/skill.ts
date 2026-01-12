/**
 * スキル関連の型定義
 */

import { UniqueId, BaseElement, DefaultElement, Probability } from './common';
import { BaseStatusEffectType, DefaultStatusEffectType } from './statusEffect';

/**
 * スキルタイプの基底型
 * - ゲームごとに独自のスキル分類を定義可能
 * 
 * @example
 * // アクションRPG向け
 * type ActionSkillType = 'light-attack' | 'heavy-attack' | 'guard' | 'dodge' | 'special';
 * 
 * @example
 * // 戦略ゲーム向け
 * type StrategySkillType = 'melee' | 'ranged' | 'support' | 'tactics';
 */
export type BaseSkillType = string;

/**
 * デフォルトスキルタイプ
 * - 標準的なJRPG向けのスキル分類
 */
export type DefaultSkillType = 
  | 'physical'  // 物理攻撃
  | 'magic'     // 魔法攻撃
  | 'heal'      // 回復
  | 'buff'      // バフ
  | 'debuff'    // デバフ
  | 'special';  // 特殊

/**
 * スキルタイプ（後方互換性のためのエイリアス）
 * @deprecated DefaultSkillTypeを使用してください
 */
export type SkillType = DefaultSkillType;

/**
 * 対象タイプの基底型
 * - ゲームごとに独自の対象選択システムを定義可能
 * 
 * @example
 * // 戦略ゲーム向け
 * type TacticsTargetType = 'range-3' | 'line-3' | 'fan-shape' | 'cross-shape';
 * 
 * @example
 * // カードゲーム向け
 * type CardTargetType = 'adjacent-cards' | 'entire-row' | 'random-2';
 */
export type BaseTargetType = string;

/**
 * デフォルト対象タイプ
 * - 標準的なJRPG向けの対象選択
 */
export type DefaultTargetType = 
  | 'single-enemy'    // 敵単体
  | 'all-enemies'     // 敵全体
  | 'single-ally'     // 味方単体
  | 'all-allies'      // 味方全体
  | 'self'            // 自分
  | 'random-enemies'  // 敵ランダム
  | 'random-allies';  // 味方ランダム

/**
 * 対象タイプ（後方互換性のためのエイリアス）
 * @deprecated DefaultTargetTypeを使用してください
 */
export type TargetType = DefaultTargetType;

/**
 * 状態異常付与情報
 * 
 * @template TEffectType - 状態異常タイプ（デフォルト: DefaultStatusEffectType）
 */
export interface StatusEffectApplication<
  TEffectType extends BaseStatusEffectType = DefaultStatusEffectType
> {
  effectType: TEffectType;      // 状態異常タイプ
  probability: Probability;     // 付与確率
  duration: number;             // 持続ターン数
  power: number;                // 効果の強さ
}

/**
 * スキル定義
 * 
 * @template TElement - 属性タイプ（デフォルト: DefaultElement）
 * @template TSkillType - スキルタイプ（デフォルト: DefaultSkillType）
 * @template TTargetType - 対象タイプ（デフォルト: DefaultTargetType）
 * @template TEffectType - 状態異常タイプ（デフォルト: DefaultStatusEffectType）
 * 
 * @example
 * // デフォルトの型を使用
 * const skill: Skill = {
 *   id: 'skill-1',
 *   type: 'physical',
 *   targetType: 'single-enemy',
 *   element: 'fire',
 *   // ...
 * };
 * 
 * @example
 * // カスタム型を使用（SF風）
 * type SciFiElement = 'plasma' | 'laser' | 'emp';
 * type SciFiSkillType = 'tech' | 'weapon' | 'hack';
 * type SciFiTarget = 'single' | 'area' | 'all';
 * type SciFiEffect = 'stunned' | 'shield-boost';
 * 
 * const skill: Skill<SciFiElement, SciFiSkillType, SciFiTarget, SciFiEffect> = {
 *   id: 'skill-emp',
 *   type: 'hack',
 *   targetType: 'area',
 *   element: 'emp',
 *   statusEffects: [{ effectType: 'stunned', ... }],
 *   // ...
 * };
 */
export interface Skill<
  TElement extends BaseElement = DefaultElement,
  TSkillType extends BaseSkillType = DefaultSkillType,
  TTargetType extends BaseTargetType = DefaultTargetType,
  TEffectType extends BaseStatusEffectType = DefaultStatusEffectType
> {
  id: UniqueId;             // スキルID
  name: string;             // スキル名
  type: TSkillType;         // スキルタイプ
  targetType: TTargetType;  // 対象タイプ
  element: TElement;        // 属性
  power: number;            // 威力（倍率）
  mpCost: number;           // 消費MP
  accuracy: number;         // 命中率（1.0 = 100%）
  criticalBonus: number;    // クリティカル率ボーナス
  isGuaranteedHit: boolean; // 必中フラグ
  statusEffects?: StatusEffectApplication<TEffectType>[]; // 付与する状態異常
  description: string;      // スキル説明
}
