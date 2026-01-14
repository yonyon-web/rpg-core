/**
 * character/growth - キャラクター成長計算モジュール
 * レベルアップと経験値に関する純粋な計算関数
 */

import type { BaseStats, DefaultStats } from '../types/character/stats';
import type { Combatant } from '../types/battle/combatant';
import type { BaseExpCurveType, DefaultExpCurveType, StatGrowthRates } from '../types/system/config';
import { filterAlive } from '../combat/combatantState';

/**
 * 経験値曲線関数の型
 */
export type ExpCurveFunction = (level: number, baseExp: number, growthRate: number) => number;

/**
 * 経験値曲線設定
 */
export interface ExpCurveConfig<TExpCurve extends BaseExpCurveType = DefaultExpCurveType> {
  type: TExpCurve;
  baseExpRequired?: number;    // デフォルト: 100
  expGrowthRate?: number;      // デフォルト: 1.2
  customCurve?: ExpCurveFunction; // カスタム曲線関数
}

/**
 * デフォルトの経験値曲線計算
 */
const defaultExpCurves: Record<DefaultExpCurveType, ExpCurveFunction> = {
  linear: (level: number, baseExp: number) => {
    // 線形: レベル2=200, レベル3=500, レベル4=900
    return ((level * (level + 1)) / 2) * baseExp - baseExp;
  },
  exponential: (level: number, baseExp: number, growthRate: number) => {
    // 指数: より急激な成長
    if (level <= 1) return 0;
    let total = 0;
    for (let i = 2; i <= level; i++) {
      total += Math.floor(baseExp * Math.pow(growthRate, i - 2));
    }
    return total;
  },
  custom: (level: number, baseExp: number) => {
    // customの場合はcustomCurve関数を使うべきだが、fallbackとして線形
    return ((level * (level + 1)) / 2) * baseExp - baseExp;
  }
};

/**
 * 指定レベルに到達するために必要な累積経験値を計算
 * カスタマイズ可能な経験値曲線をサポート
 * 
 * @param level - 目標レベル
 * @param config - 経験値曲線設定（オプション）
 * @returns そのレベルに到達するために必要な累積経験値（レベル1からの合計）
 * 
 * @example
 * // デフォルト（線形）
 * getExpForLevel(2); // 200
 * 
 * @example
 * // 指数曲線
 * getExpForLevel(2, { type: 'exponential', baseExpRequired: 100, expGrowthRate: 1.5 });
 * 
 * @example
 * // カスタム曲線
 * getExpForLevel(2, { 
 *   type: 'custom', 
 *   customCurve: (level, base) => level * level * base 
 * });
 */
export function getExpForLevel<TExpCurve extends BaseExpCurveType = DefaultExpCurveType>(
  level: number,
  config?: ExpCurveConfig<TExpCurve>
): number {
  if (level <= 1) return 0;
  
  const baseExp = config?.baseExpRequired ?? 100;
  const growthRate = config?.expGrowthRate ?? 1.2;
  
  // カスタム曲線が指定されている場合はそれを使用
  if (config?.customCurve) {
    return config.customCurve(level, baseExp, growthRate);
  }
  
  // デフォルト曲線タイプに基づいて計算
  const curveType = (config?.type ?? 'linear') as DefaultExpCurveType;
  const curveFunc = defaultExpCurves[curveType] || defaultExpCurves.linear;
  
  return curveFunc(level, baseExp, growthRate);
}

/**
 * レベルアップ判定
 * 
 * @param currentExp - 現在の累積経験値
 * @param currentLevel - 現在のレベル
 * @param config - 経験値曲線設定（オプション）
 * @returns レベルアップ可能かどうか
 */
export function canLevelUp<TExpCurve extends BaseExpCurveType = DefaultExpCurveType>(
  currentExp: number,
  currentLevel: number,
  config?: ExpCurveConfig<TExpCurve>
): boolean {
  const expRequired = getExpForLevel(currentLevel + 1, config);
  return currentExp >= expRequired;
}

/**
 * ステータス成長設定
 */
export interface StatGrowthConfig<TStats extends BaseStats = DefaultStats> {
  growthRates?: StatGrowthRates<TStats>;  // 固定成長率
  useRandomVariance?: boolean;            // ランダム分散を使用するか（デフォルト: true）
  variancePercent?: number;               // 分散率（デフォルト: 0.2 = ±20%）
}

/**
 * ステータス成長値の計算
 * カスタマイズ可能な成長率をサポート
 * 
 * @template TStats - ステータスの型
 * @param level - 成長先のレベル
 * @param config - ステータス成長設定（オプション）
 * @returns 成長値
 * 
 * @example
 * // デフォルト（ランダム分散あり）
 * calculateStatGrowth(2);
 * 
 * @example
 * // 固定成長率
 * calculateStatGrowth(2, {
 *   growthRates: { maxHp: 10, maxMp: 5, attack: 3, ... },
 *   useRandomVariance: false
 * });
 * 
 * @example
 * // カスタム分散率
 * calculateStatGrowth(2, {
 *   growthRates: { maxHp: 10, maxMp: 5, attack: 3, ... },
 *   useRandomVariance: true,
 *   variancePercent: 0.3  // ±30%
 * });
 */
export function calculateStatGrowth<TStats extends BaseStats = DefaultStats>(
  level: number,
  config?: StatGrowthConfig<TStats>
): Partial<TStats> {
  const useRandom = config?.useRandomVariance ?? true;
  const variancePercent = config?.variancePercent ?? 0.2;
  
  // カスタム成長率が指定されている場合
  if (config?.growthRates) {
    const growth: Partial<TStats> = {};
    
    for (const [key, baseValue] of Object.entries(config.growthRates)) {
      const statKey = key as keyof TStats;
      
      if (useRandom && typeof baseValue === 'number') {
        // ランダム分散を適用
        const variance = baseValue * variancePercent;
        const min = Math.max(0, baseValue - variance);
        const max = baseValue + variance;
        growth[statKey] = Math.floor(min + Math.random() * (max - min + 1)) as TStats[keyof TStats];
      } else {
        // 固定値
        growth[statKey] = baseValue as TStats[keyof TStats];
      }
    }
    
    return growth;
  }
  
  // デフォルトの成長値（従来の動作を維持）
  const baseGrowth: Partial<DefaultStats> = {
    maxHp: Math.floor(8 + Math.random() * 5),       // 8-12
    maxMp: Math.floor(3 + Math.random() * 3),       // 3-5
    attack: Math.floor(2 + Math.random() * 2),      // 2-3
    defense: Math.floor(1 + Math.random() * 2),     // 1-2
    magic: Math.floor(1 + Math.random() * 2),       // 1-2
    magicDefense: Math.floor(1 + Math.random() * 2), // 1-2
    speed: Math.floor(1 + Math.random() * 2),       // 1-2
    luck: Math.floor(0 + Math.random() * 2),        // 0-1
    accuracy: 0,
    evasion: 0,
    criticalRate: 0
  };
  
  return baseGrowth as Partial<TStats>;
}

/**
 * パーティへの経験値配分を計算
 * 生存しているメンバーのみに均等に配分
 * 
 * @template TStats - ステータスの型
 * @param party - パーティメンバー
 * @param totalExp - 配分する総経験値
 * @returns 各キャラクターへの配分経験値のマップ
 */
export function distributeExpToParty<TStats extends BaseStats = DefaultStats>(
  party: Combatant<TStats>[],
  totalExp: number
): Map<string, number> {
  const aliveMembers = filterAlive(party);
  
  if (aliveMembers.length === 0) {
    return new Map();
  }
  
  const expPerMember = Math.floor(totalExp / aliveMembers.length);
  const distribution = new Map<string, number>();
  
  for (const member of aliveMembers) {
    distribution.set(member.id, expPerMember);
  }
  
  return distribution;
}

/**
 * ジョブレベルアップに必要な経験値を計算
 * 
 * @param jobLevel - 目標ジョブレベル
 * @param config - 経験値曲線設定（オプション）
 * @returns そのジョブレベルに到達するために必要な累積経験値
 * 
 * @example
 * getJobExpForLevel(2); // ジョブレベル2に必要な経験値
 */
export function getJobExpForLevel<TExpCurve extends BaseExpCurveType = DefaultExpCurveType>(
  jobLevel: number,
  config?: ExpCurveConfig<TExpCurve>
): number {
  // ジョブレベルは通常レベルと同じ曲線を使用するが、baseExpは少なめ
  const baseExp = config?.baseExpRequired ?? 80;
  const growthRate = config?.expGrowthRate ?? 1.15;
  
  if (jobLevel <= 1) return 0;
  
  // カスタム曲線が指定されている場合はそれを使用
  if (config?.customCurve) {
    return config.customCurve(jobLevel, baseExp, growthRate);
  }
  
  // デフォルトは線形曲線
  const curveType = (config?.type ?? 'linear') as DefaultExpCurveType;
  const curveFunc = defaultExpCurves[curveType] || defaultExpCurves.linear;
  
  return curveFunc(jobLevel, baseExp, growthRate);
}

/**
 * ジョブレベルアップ判定
 * 
 * @param currentJobExp - 現在のジョブ経験値
 * @param currentJobLevel - 現在のジョブレベル
 * @param config - 経験値曲線設定（オプション）
 * @returns ジョブレベルアップ可能かどうか
 */
export function canJobLevelUp<TExpCurve extends BaseExpCurveType = DefaultExpCurveType>(
  currentJobExp: number,
  currentJobLevel: number,
  config?: ExpCurveConfig<TExpCurve>
): boolean {
  const expRequired = getJobExpForLevel(currentJobLevel + 1, config);
  return currentJobExp >= expRequired;
}
