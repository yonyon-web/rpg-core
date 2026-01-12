/**
 * 戦闘者関連の型定義
 */

import { UniqueId } from './common';
import { BaseStats, DefaultStats } from './stats';
import { StatusEffect } from './statusEffect';

/**
 * 戦闘者基本インターフェース
 * - キャラクターと敵の共通属性
 * - ジェネリック型TStatsでカスタムステータスをサポート
 * 
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 * 
 * @example
 * // デフォルトのステータスを使用
 * const combatant: Combatant = { ... };
 * 
 * @example
 * // カスタムステータスを使用
 * interface MyStats extends BaseStats {
 *   strength: number;
 *   intelligence: number;
 *   dexterity: number;
 * }
 * const combatant: Combatant<MyStats> = { ... };
 */
export interface Combatant<TStats extends BaseStats = DefaultStats> {
  id: UniqueId;              // ユニークID
  name: string;              // 名前
  level: number;             // レベル
  stats: TStats;             // ステータス
  currentHp: number;         // 現在のHP
  currentMp: number;         // 現在のMP
  statusEffects: StatusEffect[]; // 現在の状態異常
  position: number;          // 隊列位置（0=前列、1=後列）
}
