/**
 * 戦闘者の状態チェックユーティリティ
 * 生存/戦闘不能判定などの共通ロジックを提供
 */

import type { Combatant } from '../types/combatant';
import type { BaseStats } from '../types/stats';

/**
 * 戦闘者が生存しているかチェック
 * @param combatant - 戦闘者
 * @returns 生存している場合true
 */
export function isAlive<TStats extends BaseStats = BaseStats>(
  combatant: Combatant<TStats>
): boolean {
  return combatant.currentHp > 0;
}

/**
 * 戦闘者が戦闘不能かチェック
 * @param combatant - 戦闘者
 * @returns 戦闘不能の場合true
 */
export function isDead<TStats extends BaseStats = BaseStats>(
  combatant: Combatant<TStats>
): boolean {
  return combatant.currentHp <= 0;
}

/**
 * 戦闘者配列から生存者のみフィルタ
 * @param combatants - 戦闘者の配列
 * @returns 生存している戦闘者の配列
 */
export function filterAlive<T extends Combatant<any>>(combatants: T[]): T[] {
  return combatants.filter(c => c.currentHp > 0);
}

/**
 * 戦闘者配列から戦闘不能者のみフィルタ
 * @param combatants - 戦闘者の配列
 * @returns 戦闘不能の戦闘者の配列
 */
export function filterDead<T extends Combatant<any>>(combatants: T[]): T[] {
  return combatants.filter(c => c.currentHp <= 0);
}

/**
 * 戦闘者配列の生存者数を取得
 * @param combatants - 戦闘者の配列
 * @returns 生存者数
 */
export function countAlive<TStats extends BaseStats = BaseStats>(
  combatants: Combatant<TStats>[]
): number {
  return combatants.filter(c => c.currentHp > 0).length;
}

/**
 * 戦闘者配列の戦闘不能者数を取得
 * @param combatants - 戦闘者の配列
 * @returns 戦闘不能者数
 */
export function countDead<TStats extends BaseStats = BaseStats>(
  combatants: Combatant<TStats>[]
): number {
  return combatants.filter(c => c.currentHp <= 0).length;
}

/**
 * 全員が生存しているかチェック
 * @param combatants - 戦闘者の配列
 * @returns 全員生存している場合true
 */
export function allAlive<TStats extends BaseStats = BaseStats>(
  combatants: Combatant<TStats>[]
): boolean {
  return combatants.every(c => c.currentHp > 0);
}

/**
 * 全員が戦闘不能かチェック
 * @param combatants - 戦闘者の配列
 * @returns 全員戦闘不能の場合true
 */
export function allDead<TStats extends BaseStats = BaseStats>(
  combatants: Combatant<TStats>[]
): boolean {
  return combatants.every(c => c.currentHp <= 0);
}
