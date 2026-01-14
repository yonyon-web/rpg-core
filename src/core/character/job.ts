/**
 * character/job - ジョブ管理モジュール
 * ジョブ変更条件の検証と効果計算に関する純粋な計算関数
 */

import type { Character } from '../../types/battle';
import type { Job, JobChangeRequirements, JobHistory } from '../../types/character/job';
import type { UniqueId } from '../../types/common';
import type { BaseStats, DefaultStats } from '../../types/character/stats';

/**
 * ジョブ変更が可能かチェック
 * 
 * @param character - キャラクター
 * @param job - 変更先のジョブ
 * @param jobHistory - ジョブ履歴（オプション）
 * @returns 変更可能な場合true
 */
export function canChangeJob<TStats extends BaseStats = DefaultStats>(
  character: Character,
  job: Job<TStats>,
  jobHistory?: JobHistory[]
): boolean {
  // 同じジョブには変更できない
  if (character.job === job.id) {
    return false;
  }

  // レベル要件チェック
  if (job.levelRequirement && character.level < job.levelRequirement) {
    return false;
  }

  // 前提ジョブチェック
  if (job.requiredJobs && job.requiredJobs.length > 0) {
    const hasRequiredJob = job.requiredJobs.some(requiredJobId =>
      hasJobExperience(requiredJobId, jobHistory || [])
    );
    
    if (!hasRequiredJob) {
      return false;
    }
  }

  return true;
}

/**
 * ジョブ変更要件を取得
 * 
 * @param job - ジョブ
 * @returns ジョブ変更要件
 */
export function getJobRequirements<TStats extends BaseStats = DefaultStats>(
  job: Job<TStats>
): JobChangeRequirements {
  return {
    levelRequirement: job.levelRequirement,
    requiredJobs: job.requiredJobs,
  };
}

/**
 * ジョブ変更条件を検証し、失敗理由を返す
 * 
 * @param character - キャラクター
 * @param job - 変更先のジョブ
 * @param jobHistory - ジョブ履歴（オプション）
 * @returns { canChange: boolean, reason?: string }
 */
export function validateJobChangeConditions<TStats extends BaseStats = DefaultStats>(
  character: Character,
  job: Job<TStats>,
  jobHistory?: JobHistory[]
): { canChange: boolean; reason?: string } {
  // 同じジョブには変更できない
  if (character.job === job.id) {
    return { canChange: false, reason: 'Character already has this job' };
  }

  // レベル要件チェック
  if (job.levelRequirement && character.level < job.levelRequirement) {
    return {
      canChange: false,
      reason: `Requires level ${job.levelRequirement} (current: ${character.level})`,
    };
  }

  // 前提ジョブチェック
  if (job.requiredJobs && job.requiredJobs.length > 0) {
    const hasRequiredJob = job.requiredJobs.some(requiredJobId =>
      hasJobExperience(requiredJobId, jobHistory || [])
    );

    if (!hasRequiredJob) {
      return {
        canChange: false,
        reason: `Requires prerequisite job: ${job.requiredJobs.join(' or ')}`,
      };
    }
  }

  return { canChange: true };
}

/**
 * ジョブのステータス補正を計算
 * 
 * @param job - ジョブ
 * @returns ステータス補正
 */
export function calculateJobStatModifiers<TStats extends BaseStats = DefaultStats>(
  job: Job<TStats>
): Partial<TStats> {
  return job.statModifiers;
}

/**
 * キャラクターが指定ジョブの経験があるかチェック
 * 
 * @param jobId - ジョブID
 * @param jobHistory - ジョブ履歴
 * @returns 経験がある場合true
 */
export function hasJobExperience(jobId: UniqueId, jobHistory: JobHistory[]): boolean {
  return jobHistory.some(history => history.jobId === jobId);
}
