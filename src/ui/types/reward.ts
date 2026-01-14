/**
 * Reward UI Types
 * 報酬UI関連の型定義
 */

import type { Combatant } from '../../types/battle/combatant';
import type { BaseStats, DefaultStats } from '../../types/character/stats';
import type { Item } from '../../types/item/item';
import type { ExpDistribution, LevelUpResult, RewardDistributionResult } from '../../types/system/reward';

/**
 * 報酬表示ステージ
 */
export type RewardUIStage = 
  | 'exp-distribution'    // 経験値配分表示
  | 'level-up'           // レベルアップ演出
  | 'items'              // アイテム獲得表示
  | 'gold'               // ゴールド獲得表示
  | 'completed';         // 完了

/**
 * 報酬UI状態
 */
export interface RewardUIState<TStats extends BaseStats = DefaultStats> {
  stage: RewardUIStage;
  expDistribution: ExpDistribution[];
  levelUpResults: Map<string, LevelUpResult<TStats>[]>;
  goldTotal: number;
  itemsReceived: Item[];
  currentCharacterIndex: number;  // 現在表示中のキャラクターインデックス
  animationSpeed: number;          // アニメーション速度（1.0 = 通常）
  isAnimating: boolean;            // アニメーション中かどうか
}

/**
 * 報酬イベント
 */
export interface RewardEvents<TStats extends BaseStats = DefaultStats> {
  'reward-started': { rewards: RewardDistributionResult<TStats> };
  'exp-distributed': { distribution: ExpDistribution[] };
  'level-up': { characterId: string; results: LevelUpResult<TStats>[] };
  'items-received': { items: Item[] };
  'gold-received': { amount: number };
  'reward-completed': {};
  'animation-speed-changed': { speed: number };
  'stage-changed': { stage: RewardUIStage };
}
