/**
 * キャラクターステータス計算モジュール
 */

import { Stats } from '../types';

/**
 * 修飾子を適用した最終ステータスを計算
 * @param baseStats - 基礎ステータス
 * @param modifiers - 適用するステータス修飾子の配列
 * @returns 計算された最終ステータス
 */
export function calculateFinalStats(
  baseStats: Stats,
  modifiers: Array<Partial<Stats>>
): Stats {
  // 基礎ステータスから開始
  const finalStats: Stats = { ...baseStats };

  // 各修飾子を適用
  for (const modifier of modifiers) {
    // 修飾子に存在する各ステータスを適用
    if (modifier.maxHp !== undefined) {
      finalStats.maxHp = applyStatModifiers(finalStats.maxHp, modifier.maxHp);
    }
    if (modifier.maxMp !== undefined) {
      finalStats.maxMp = applyStatModifiers(finalStats.maxMp, modifier.maxMp);
    }
    if (modifier.attack !== undefined) {
      finalStats.attack = applyStatModifiers(finalStats.attack, modifier.attack);
    }
    if (modifier.defense !== undefined) {
      finalStats.defense = applyStatModifiers(finalStats.defense, modifier.defense);
    }
    if (modifier.magic !== undefined) {
      finalStats.magic = applyStatModifiers(finalStats.magic, modifier.magic);
    }
    if (modifier.magicDefense !== undefined) {
      finalStats.magicDefense = applyStatModifiers(finalStats.magicDefense, modifier.magicDefense);
    }
    if (modifier.speed !== undefined) {
      finalStats.speed = applyStatModifiers(finalStats.speed, modifier.speed);
    }
    if (modifier.luck !== undefined) {
      finalStats.luck = applyStatModifiers(finalStats.luck, modifier.luck);
    }
    if (modifier.accuracy !== undefined) {
      finalStats.accuracy = applyStatModifiers(finalStats.accuracy, modifier.accuracy);
    }
    if (modifier.evasion !== undefined) {
      finalStats.evasion = applyStatModifiers(finalStats.evasion, modifier.evasion);
    }
    if (modifier.criticalRate !== undefined) {
      finalStats.criticalRate = applyStatModifiers(finalStats.criticalRate, modifier.criticalRate);
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
