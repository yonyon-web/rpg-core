/**
 * character/growth - キャラクター成長計算モジュール
 * レベルアップと経験値に関する純粋な計算関数
 */

import type { BaseStats, DefaultStats } from '../types/stats';
import type { Combatant } from '../types/combatant';

/**
 * 指定レベルに到達するために必要な累積経験値を計算
 * 線形成長: level * 100
 * 
 * @param level - 目標レベル
 * @returns そのレベルに到達するために必要な累積経験値（レベル1からの合計）
 */
export function getExpForLevel(level: number): number {
  if (level <= 1) return 0;
  // レベル2: 200, レベル3: 500, レベル4: 900 のように累積
  return ((level * (level + 1)) / 2) * 100 - 100;
}

/**
 * レベルアップ判定
 * 
 * @param currentExp - 現在の累積経験値
 * @param currentLevel - 現在のレベル
 * @returns レベルアップ可能かどうか
 */
export function canLevelUp(currentExp: number, currentLevel: number): boolean {
  const expRequired = getExpForLevel(currentLevel + 1);
  return currentExp >= expRequired;
}

/**
 * ステータス成長値の計算
 * 各ステータスごとの成長値を返す
 * 
 * @template TStats - ステータスの型
 * @param level - 成長先のレベル
 * @returns 成長値
 */
export function calculateStatGrowth<TStats extends BaseStats = DefaultStats>(
  level: number
): Partial<TStats> {
  // デフォルトの成長値
  // レベルに応じてランダムな成長を与える
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
  const aliveMembers = party.filter(c => c.currentHp > 0);
  
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
