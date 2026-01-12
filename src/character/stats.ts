/**
 * キャラクターステータス計算モジュール
 */

import { BaseStats } from '../types';

/**
 * 修飾子を適用した最終ステータスを計算
 * 
 * ジェネリック関数でカスタムステータス型をサポート
 * 
 * @template TStats - ステータスの型
 * @param baseStats - 基礎ステータス
 * @param modifiers - 適用するステータス修飾子の配列
 * @returns 計算された最終ステータス
 * 
 * @example
 * // デフォルトステータスを使用
 * const finalStats = calculateFinalStats(baseStats, [equipmentBonus, buffBonus]);
 * 
 * @example
 * // カスタムステータスを使用
 * interface MyStats extends BaseStats {
 *   strength: number;
 *   intelligence: number;
 * }
 * const finalStats = calculateFinalStats<MyStats>(baseStats, modifiers);
 */
export function calculateFinalStats<TStats extends BaseStats>(
  baseStats: TStats,
  modifiers: Array<Partial<TStats>>
): TStats {
  // 基礎ステータスから開始
  const finalStats: TStats = { ...baseStats };

  // 各修飾子を適用
  for (const modifier of modifiers) {
    // 修飾子に存在する各ステータスを適用
    for (const key in modifier) {
      if (modifier[key] !== undefined) {
        // BaseStatsはRecord<string, number>なので、すべての値はnumber型
        (finalStats as Record<string, number>)[key] = applyStatModifiers(
          (finalStats as Record<string, number>)[key],
          modifier[key] as number
        );
      }
    }
  }

  return finalStats;
}

/**
 * 単一のステータス修飾子を適用
 * @param baseStat - 基礎ステータス値
 * @param modifier - 適用する修飾子
 * @returns 修正されたステータス値（最小値0）
 */
export function applyStatModifiers(baseStat: number, modifier: number): number {
  const result = baseStat + modifier;
  return Math.max(0, result);
}
