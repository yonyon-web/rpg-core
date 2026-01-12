/**
 * ジョブ（職業）関連の型定義
 */

import type { UniqueId } from './common';
import type { BaseStats, DefaultStats } from './stats';
import type { Skill } from './skill';

/**
 * ジョブ定義
 * 
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 */
export interface Job<TStats extends BaseStats = DefaultStats> {
  id: UniqueId;                  // ジョブID
  name: string;                  // ジョブ名
  description: string;           // 説明
  statModifiers: Partial<TStats>; // ステータス補正
  availableSkills?: UniqueId[];  // 習得可能スキルID
  levelRequirement?: number;     // 転職に必要なレベル
  requiredJobs?: UniqueId[];     // 前提ジョブ
}

/**
 * ジョブ変更要件
 */
export interface JobChangeRequirements {
  levelRequirement?: number;     // 必要レベル
  requiredJobs?: UniqueId[];     // 前提ジョブ（いずれかを経験していること）
  requiredStats?: {              // 必要なステータス
    [key: string]: number;
  };
}

/**
 * ジョブ履歴
 */
export interface JobHistory {
  jobId: UniqueId;               // ジョブID
  startedAt: number;             // 開始時刻（タイムスタンプ）
  endedAt?: number;              // 終了時刻（タイムスタンプ、現在のジョブの場合undefined）
  levelReached: number;          // そのジョブで到達したレベル
}
