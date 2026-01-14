/**
 * Job Change UI Types
 * ジョブ変更UI関連の型定義
 */

import type { Character } from '../../types/battle';
import type { Job, JobHistory } from '../../types/job';
import type { BaseStats, DefaultStats } from '../../types/stats';
import type { CursorIndex, UISortOrder } from './common';
import type { AvailableJobInfo } from '../../services/character/JobChangeService';

/**
 * ジョブ変更UIステージ
 */
export type JobChangeUIStage =
  | 'browsing'      // ジョブ一覧表示
  | 'previewing'    // ステータス変化プレビュー
  | 'confirming'    // 転職確認
  | 'changing'      // 転職処理中
  | 'completed';    // 完了

/**
 * ジョブフィルタタイプ
 */
export type JobFilterType = 'all' | 'available' | 'unavailable';

/**
 * ジョブソート基準
 */
export type JobSortBy = 'name' | 'level';

/**
 * ステータス変化プレビュー
 */
export interface StatsPreview<TStats extends BaseStats = DefaultStats> {
  current: TStats;
  after: TStats;
  differences: Partial<TStats>;  // 差分（正: 上昇、負: 下降）
}

/**
 * ジョブ変更UI状態
 */
export interface JobChangeUIState<TStats extends BaseStats = DefaultStats> {
  stage: JobChangeUIStage;
  character: Character | null;
  currentJob: Job<TStats> | null;
  availableJobs: AvailableJobInfo<TStats>[];
  selectedJob: Job<TStats> | null;
  cursorIndex: CursorIndex;
  filterType: JobFilterType;
  sortBy: JobSortBy;
  sortOrder: UISortOrder;
  statsPreview: StatsPreview<TStats> | null;
  error: string | null;
  isChanging: boolean;
}

/**
 * ジョブ変更イベント
 */
export interface JobChangeEvents<TStats extends BaseStats = DefaultStats> {
  'job-selection-started': { character: Character; jobs: AvailableJobInfo<TStats>[] };
  'job-selected': { job: Job<TStats> };
  'job-changed': { character: Character; previousJob: string; newJob: string };
  'job-change-failed': { reason: string };
  'stats-previewed': { preview: StatsPreview<TStats> };
  'filter-changed': { filterType: JobFilterType };
  'sort-changed': { sortBy: JobSortBy; order: UISortOrder };
  'selection-cancelled': {};
}
