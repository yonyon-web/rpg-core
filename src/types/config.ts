/**
 * ゲーム設定の型定義
 */

import { Probability } from './common';

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
 */
export interface StatGrowthRates {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  magic: number;
  magicDefense: number;
  speed: number;
  luck: number;
}

/**
 * 成長設定
 * 
 * @template TExpCurve - 経験値曲線タイプ（デフォルト: DefaultExpCurveType）
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
 */
export interface GrowthConfig<
  TExpCurve extends BaseExpCurveType = DefaultExpCurveType
> {
  expCurve: TExpCurve;              // 経験値曲線タイプ
  baseExpRequired: number;          // 基本必要経験値（100）
  expGrowthRate: number;            // 経験値成長率（1.2）
  statGrowthRates: StatGrowthRates; // ステータス成長率
  maxLevel: number;                 // 最大レベル（99）
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
 * 
 * @example
 * // デフォルトの設定を使用
 * const config: GameConfig = { ... };
 * 
 * @example
 * // カスタム経験値曲線を使用
 * type MyExpCurve = 'fast' | 'normal' | 'slow';
 * const config: GameConfig<MyExpCurve> = { ... };
 */
export interface GameConfig<
  TExpCurve extends BaseExpCurveType = DefaultExpCurveType
> {
  combat: CombatConfig;              // 戦闘パラメータ
  growth: GrowthConfig<TExpCurve>;   // 成長パラメータ
  balance: BalanceConfig;            // バランス調整
}
