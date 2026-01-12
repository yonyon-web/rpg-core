/**
 * ゲーム設定の型定義
 */

import { Probability } from './common';
import type { BaseStats } from './stats';
import type { CustomFormulas } from './formulas';

/**
 * 戦闘設定
 */
export interface CombatConfig {
  baseCriticalRate: Probability;    // 基本クリティカル率（0.05 = 5%）
  criticalMultiplier: number;       // クリティカル倍率（2.0 = 2倍）
  damageVariance: number;           // ダメージ分散（0.1 = ±10%）
  escapeBaseRate: Probability;      // 基本逃走成功率（0.5 = 50%）
  escapeRateIncrement: number;      // 逃走試行毎の成功率上昇（0.1 = +10%）
  preemptiveStrikeThreshold: number; // 先制攻撃の素早さ差閾値
  speedVariance: number;            // 行動順のランダム幅
}

/**
 * 経験値曲線タイプの基底型
 * - ゲームごとに独自の経験値曲線を定義可能
 * 
 * @example
 * // ローグライク向け
 * type RoguelikeExpCurve = 'stepped' | 'segmented' | 'milestone';
 * 
 * @example
 * // MMORPG向け
 * type MMOExpCurve = 'early-fast' | 'mid-slow' | 'late-moderate';
 */
export type BaseExpCurveType = string;

/**
 * デフォルト経験値曲線タイプ
 * - 標準的なJRPG向けの経験値曲線
 */
export type DefaultExpCurveType = 
  | 'linear'        // 線形（レベル × 基本値）
  | 'exponential'   // 指数（基本値 × レベル ^ 成長率）
  | 'custom';       // カスタム

/**
 * 経験値曲線タイプ（後方互換性のためのエイリアス）
 * @deprecated DefaultExpCurveTypeを使用してください
 */
export type ExpCurveType = DefaultExpCurveType;

/**
 * ステータス成長率
 * - カスタムステータスに対応するため、ジェネリック型で定義
 * 
 * @template TStats - カスタムステータス型（デフォルト: 各ステータスにnumber型の成長率を持つ型）
 * 
 * @example
 * // デフォルトステータスの場合
 * const defaultGrowth: StatGrowthRates = {
 *   maxHp: 10,
 *   maxMp: 5,
 *   attack: 2,
 *   // ... その他のステータス
 * };
 * 
 * @example
 * // カスタムステータスの場合
 * interface MyStats extends BaseStats {
 *   strength: number;
 *   intelligence: number;
 *   vitality: number;
 * }
 * const customGrowth: StatGrowthRates<MyStats> = {
 *   strength: 3,
 *   intelligence: 2,
 *   vitality: 5,
 * };
 */
export type StatGrowthRates<TStats extends BaseStats = BaseStats> = {
  [K in keyof TStats]: number;
};

/**
 * 成長設定
 * 
 * @template TExpCurve - 経験値曲線タイプ（デフォルト: DefaultExpCurveType）
 * @template TStats - カスタムステータス型（デフォルト: BaseStats）
 * 
 * @example
 * // デフォルトの経験値曲線を使用
 * const growth: GrowthConfig = {
 *   expCurve: 'exponential',
 *   // ...
 * };
 * 
 * @example
 * // カスタム経験値曲線を使用
 * type MyExpCurve = 'fast' | 'normal' | 'slow';
 * const growth: GrowthConfig<MyExpCurve> = {
 *   expCurve: 'fast',
 *   // ...
 * };
 * 
 * @example
 * // カスタムステータスと経験値曲線を使用
 * interface MyStats extends BaseStats {
 *   strength: number;
 *   dexterity: number;
 * }
 * type MyExpCurve = 'fast' | 'slow';
 * const growth: GrowthConfig<MyExpCurve, MyStats> = {
 *   expCurve: 'fast',
 *   statGrowthRates: {
 *     strength: 3,
 *     dexterity: 2,
 *   },
 *   // ...
 * };
 */
export interface GrowthConfig<
  TExpCurve extends BaseExpCurveType = DefaultExpCurveType,
  TStats extends BaseStats = BaseStats
> {
  expCurve: TExpCurve;                     // 経験値曲線タイプ
  baseExpRequired: number;                 // 基本必要経験値（100）
  expGrowthRate: number;                   // 経験値成長率（1.2）
  statGrowthRates: StatGrowthRates<TStats>; // ステータス成長率
  maxLevel: number;                        // 最大レベル（99）
}

/**
 * バランス設定
 */
export interface BalanceConfig {
  maxPartySize: number;             // 最大パーティサイズ
  dropRateModifier: number;         // ドロップ率修飾子（1.0 = 100%）
}

/**
 * ゲーム設定
 * - ゲーム全体のパラメータと設定
 * 
 * @template TExpCurve - 経験値曲線タイプ（デフォルト: DefaultExpCurveType）
 * @template TStats - カスタムステータス型（デフォルト: BaseStats）
 * 
 * @example
 * // デフォルトの設定を使用
 * const config: GameConfig = { ... };
 * 
 * @example
 * // カスタム経験値曲線を使用
 * type MyExpCurve = 'fast' | 'normal' | 'slow';
 * const config: GameConfig<MyExpCurve> = { ... };
 * 
 * @example
 * // カスタム計算式を使用
 * const config: GameConfig = {
 *   combat: { ... },
 *   growth: { ... },
 *   balance: { ... },
 *   customFormulas: {
 *     hitRate: (attacker, target, skill) => { ... },
 *     physicalDamage: (attacker, target, skill, isCritical, config) => { ... },
 *   },
 * };
 */
export interface GameConfig<
  TExpCurve extends BaseExpCurveType = DefaultExpCurveType,
  TStats extends BaseStats = BaseStats
> {
  combat: CombatConfig;                      // 戦闘パラメータ
  growth: GrowthConfig<TExpCurve, TStats>;   // 成長パラメータ
  balance: BalanceConfig;                    // バランス調整
  customFormulas?: CustomFormulas<TStats>;   // カスタム計算式（オプション）
}
