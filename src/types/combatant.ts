/**
 * 戦闘者関連の型定義
 */

import { UniqueId } from './common';
import { Stats } from './stats';
import { StatusEffect } from './statusEffect';

/**
 * 戦闘者基本インターフェース
 * - キャラクターと敵の共通属性
 */
export interface Combatant {
  id: UniqueId;              // ユニークID
  name: string;              // 名前
  level: number;             // レベル
  stats: Stats;              // ステータス
  currentHp: number;         // 現在のHP
  currentMp: number;         // 現在のMP
  statusEffects: StatusEffect[]; // 現在の状態異常
  position: number;          // 隊列位置（0=前列、1=後列）
}
