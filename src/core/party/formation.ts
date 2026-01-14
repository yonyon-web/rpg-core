/**
 * party/formation - パーティフォーメーション管理モジュール
 * パーティ構成の検証とフォーメーション計算に関する純粋な計算関数
 */

import type { Combatant } from '../../types/battle/combatant';
import type { BaseStats, DefaultStats } from '../../types/character/stats';

/**
 * パーティにメンバーを追加可能かチェック
 * 
 * @param party - パーティ
 * @param maxSize - 最大サイズ
 * @returns 追加可能な場合true
 */
export function canAddMember<TStats extends BaseStats = DefaultStats>(
  party: Combatant<TStats>[],
  maxSize: number
): boolean {
  return party.length < maxSize;
}

/**
 * パーティからメンバーを削除可能かチェック
 * 
 * @param party - パーティ
 * @param minSize - 最小サイズ
 * @returns 削除可能な場合true
 */
export function canRemoveMember<TStats extends BaseStats = DefaultStats>(
  party: Combatant<TStats>[],
  minSize: number
): boolean {
  return party.length > minSize;
}

/**
 * パーティに指定IDのメンバーが存在するかチェック
 * 
 * @param party - パーティ
 * @param memberId - メンバーID
 * @returns 存在する場合true
 */
export function hasMember<TStats extends BaseStats = DefaultStats>(
  party: Combatant<TStats>[],
  memberId: string
): boolean {
  return party.some(member => member.id === memberId);
}

/**
 * インデックスが有効かチェック
 * 
 * @param party - パーティ
 * @param index - インデックス
 * @returns 有効な場合true
 */
export function isValidIndex<TStats extends BaseStats = DefaultStats>(
  party: Combatant<TStats>[],
  index: number
): boolean {
  return index >= 0 && index < party.length;
}

/**
 * パーティサイズが有効かチェック
 * 
 * @param party - パーティ
 * @param minSize - 最小サイズ
 * @param maxSize - 最大サイズ
 * @returns 有効な場合true
 */
export function isValidPartySize<TStats extends BaseStats = DefaultStats>(
  party: Combatant<TStats>[],
  minSize: number,
  maxSize: number
): boolean {
  return party.length >= minSize && party.length <= maxSize;
}
