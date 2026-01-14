/**
 * JobChangeService - ジョブ変更サービス
 * ジョブの変更を管理
 */

import type { Character } from '../../types/battle/battle';
import type { Job, JobHistory } from '../../types/character/job';
import type { BaseStats, DefaultStats } from '../../types/character/stats';
import type { EventBus } from '../../core/EventBus';
import type { DataChangeEvent } from '../../types/system/events';
import * as jobModule from '../../character/job';

/**
 * ジョブ変更結果
 */
export interface JobChangeResult {
  success: boolean;
  message: string;
  previousJob?: string;
  newJob?: string;
}

/**
 * 変更可能ジョブ情報
 */
export interface AvailableJobInfo<TStats extends BaseStats = DefaultStats> {
  job: Job<TStats>;
  canChange: boolean;
  reason?: string;
}

/**
 * JobChangeService
 * ジョブ変更を管理するサービスクラス
 * 
 * @example
 * const service = new JobChangeService();
 * const result = service.changeJob(character, mageJob);
 */
export class JobChangeService {
  private eventBus?: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * ジョブを変更する
   * 
   * @param character - キャラクター
   * @param job - 変更先のジョブ
   * @param jobHistory - ジョブ履歴（オプション）
   * @returns ジョブ変更結果
   * 
   * @example
   * const result = service.changeJob(character, mageJob);
   * if (result.success) {
   *   console.log('Job changed!');
   * }
   */
  changeJob<TStats extends BaseStats = DefaultStats>(
    character: Character,
    job: Job<TStats>,
    jobHistory?: JobHistory[]
  ): JobChangeResult {
    // 変更可否を検証
    const validation = jobModule.validateJobChangeConditions(character, job, jobHistory);

    if (!validation.canChange) {
      return {
        success: false,
        message: validation.reason || 'Cannot change job',
      };
    }

    const previousJob = character.job;

    // ジョブを変更
    character.job = job.id;

    // データ変更イベントを発行
    if (this.eventBus) {
      this.eventBus.emit<DataChangeEvent>('data-changed', {
        type: 'job-changed',
        timestamp: Date.now(),
        data: { characterId: character.id, previousJob, newJob: job.id }
      });
    }

    return {
      success: true,
      message: `${character.name} changed job to ${job.name}!`,
      previousJob,
      newJob: job.id,
    };
  }

  /**
   * 変更可能なジョブ一覧を取得
   * 
   * @param character - キャラクター
   * @param availableJobs - 利用可能なジョブ一覧
   * @param jobHistory - ジョブ履歴（オプション）
   * @returns 変更可能なジョブ情報の配列
   * 
   * @example
   * const availableJobs = service.getAvailableJobs(character, allJobs, jobHistory);
   */
  getAvailableJobs<TStats extends BaseStats = DefaultStats>(
    character: Character,
    availableJobs: Job<TStats>[],
    jobHistory?: JobHistory[]
  ): AvailableJobInfo<TStats>[] {
    return availableJobs
      .filter(job => job.id !== character.job)
      .map(job => {
        const validation = jobModule.validateJobChangeConditions(character, job, jobHistory);

        return {
          job,
          canChange: validation.canChange,
          reason: validation.reason,
        };
      });
  }

  /**
   * ジョブのステータス補正を適用
   * 
   * @param character - キャラクター
   * @param job - ジョブ
   * @returns ステータス補正
   * 
   * @example
   * const bonuses = service.applyJobBonuses(character, mageJob);
   * console.log('Magic bonus:', bonuses.magic);
   */
  applyJobBonuses<TStats extends BaseStats = DefaultStats>(
    character: Character,
    job: Job<TStats>
  ): Partial<TStats> {
    return jobModule.calculateJobStatModifiers(job);
  }

  /**
   * キャラクターが指定ジョブの経験があるかチェック
   * 
   * @param jobId - ジョブID
   * @param jobHistory - ジョブ履歴
   * @returns 経験がある場合true
   * 
   * @example
   * if (service.hasJobExperience('warrior', jobHistory)) {
   *   console.log('Character has been a warrior');
   * }
   */
  hasJobExperience(jobId: string, jobHistory: JobHistory[]): boolean {
    return jobModule.hasJobExperience(jobId, jobHistory);
  }
}
