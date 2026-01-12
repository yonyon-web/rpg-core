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
 * 経験値曲線タイプ
 */
export type ExpCurveType = 
  | 'linear'        // 線形（レベル × 基本値）
  | 'exponential'   // 指数（基本値 × レベル ^ 成長率）
  | 'custom';       // カスタム

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
 */
export interface GrowthConfig {
  expCurve: ExpCurveType;           // 経験値曲線タイプ
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
 */
export interface GameConfig {
  combat: CombatConfig;     // 戦闘パラメータ
  growth: GrowthConfig;     // 成長パラメータ
  balance: BalanceConfig;   // バランス調整
}
