/**
 * 報酬システムの型定義
 */

import type { UniqueId } from './common';
import type { BaseStats, DefaultStats } from './stats';
import type { DropItem } from './battle';

/**
 * レベルアップ結果
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 */
export interface LevelUpResult<TStats extends BaseStats = DefaultStats> {
  newLevel: number;
  statGrowth: Partial<TStats>;
  newSkills: UniqueId[];  // 習得したスキルIDのリスト
}

/**
 * 経験値配分結果
 */
export interface ExpDistribution {
  characterId: UniqueId;
  exp: number;
}

/**
 * 報酬配分結果
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 */
export interface RewardDistributionResult<TStats extends BaseStats = DefaultStats> {
  expDistribution: ExpDistribution[];
  levelUpResults: Map<UniqueId, LevelUpResult<TStats>[]>;
  goldTotal: number;
  itemsReceived: DropItem[];
}
