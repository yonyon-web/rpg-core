/**
 * JobChangeController
 * ジョブ変更UIコントローラー
 */

import { ObservableState } from '../../core/ObservableState';
import { EventEmitter } from '../../core/EventEmitter';
import type { JobChangeUIState, JobChangeEvents, JobChangeUIStage, JobFilterType, JobSortBy, StatsPreview } from '../../types/jobChange';
import type { UISortOrder } from '../../types/common';
import type { JobChangeService, AvailableJobInfo } from '../../../services/character/JobChangeService';
import type { Character } from '../../../types/battle/battle';
import type { Job, JobHistory } from '../../../types/character/job';
import type { BaseStats, DefaultStats } from '../../../types/character/stats';

/**
 * JobChangeController
 * ジョブ変更UIを管理するコントローラー
 * 
 * @template TStats - ステータスの型
 * 
 * @example
 * const controller = new JobChangeController(jobChangeService);
 * 
 * controller.subscribe((state) => {
 *   console.log('Stage:', state.stage);
 *   console.log('Available jobs:', state.availableJobs);
 *   if (state.statsPreview) {
 *     console.log('Stats preview:', state.statsPreview);
 *   }
 * });
 * 
 * controller.on('job-changed', (data) => {
 *   console.log(`${data.character.name} changed from ${data.previousJob} to ${data.newJob}!`);
 * });
 * 
 * controller.startJobSelection(character, allJobs, jobHistory);
 * controller.selectJob(newJob);
 * controller.previewStats();
 * await controller.confirmChange();
 */
export class JobChangeController<TStats extends BaseStats = DefaultStats> {
  private state: ObservableState<JobChangeUIState<TStats>>;
  private events: EventEmitter<JobChangeEvents<TStats>>;
  private service: JobChangeService;
  private jobHistory?: JobHistory[];

  constructor(service: JobChangeService) {
    this.service = service;
    
    this.state = new ObservableState<JobChangeUIState<TStats>>({
      stage: 'browsing',
      character: null,
      currentJob: null,
      availableJobs: [],
      selectedJob: null,
      cursorIndex: 0,
      filterType: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      statsPreview: null,
      error: null,
      isChanging: false,
    });
    
    this.events = new EventEmitter<JobChangeEvents<TStats>>();
  }

  /**
   * 状態を購読
   */
  subscribe(listener: (state: JobChangeUIState<TStats>) => void): () => void {
    return this.state.subscribe(listener);
  }

  /**
   * イベントを購読
   */
  on<K extends keyof JobChangeEvents<TStats>>(
    event: K,
    listener: (data: JobChangeEvents<TStats>[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }

  /**
   * ジョブ選択を開始
   * 
   * @param character - キャラクター
   * @param availableJobs - 利用可能なジョブ一覧
   * @param currentJob - 現在のジョブ（オプション）
   * @param jobHistory - ジョブ履歴（オプション）
   */
  startJobSelection(
    character: Character,
    availableJobs: Job<TStats>[],
    currentJob?: Job<TStats>,
    jobHistory?: JobHistory[]
  ): void {
    this.jobHistory = jobHistory;
    const availableJobInfos = this.service.getAvailableJobs<TStats>(character, availableJobs, jobHistory);
    
    this.state.setState({
      stage: 'browsing',
      character,
      currentJob: currentJob || null,
      availableJobs: availableJobInfos,
      selectedJob: null,
      cursorIndex: 0,
      statsPreview: null,
      error: null,
    });
    
    this.events.emit('job-selection-started', { character, jobs: availableJobInfos });
  }

  /**
   * ジョブを選択
   * 
   * @param job - 選択するジョブ
   */
  selectJob(job: Job<TStats>): void {
    const currentState = this.state.getState();
    
    // 選択したジョブがリストに存在するか確認
    const jobInfo = currentState.availableJobs.find(j => j.job.id === job.id);
    if (!jobInfo) {
      this.state.setState({ error: 'Job not found in available jobs' });
      return;
    }
    
    // 変更可能かチェック
    if (!jobInfo.canChange) {
      this.state.setState({ error: jobInfo.reason || 'Cannot change to this job' });
      return;
    }
    
    this.state.setState({
      selectedJob: job,
      stage: 'previewing',
      error: null,
    });
    
    this.events.emit('job-selected', { job });
  }

  /**
   * ステータス変化をプレビュー
   */
  previewStats(): void {
    const currentState = this.state.getState();
    
    if (!currentState.character || !currentState.selectedJob) {
      this.state.setState({ error: 'No character or job selected' });
      return;
    }
    
    // 現在のステータス
    const currentStats = currentState.character.stats as unknown as TStats;
    
    // ジョブ変更後のステータスボーナスを計算
    const jobBonuses = this.service.applyJobBonuses<TStats>(currentState.character, currentState.selectedJob);
    
    // 変更後のステータスを計算
    const afterStats = { ...currentStats } as TStats;
    const differences: Partial<TStats> = {};
    
    for (const [key, bonus] of Object.entries(jobBonuses)) {
      const statKey = key as keyof TStats;
      if (typeof bonus === 'number') {
        const currentValue = currentStats[statKey] as any;
        if (typeof currentValue === 'number') {
          const newValue = currentValue + bonus;
          (afterStats as any)[statKey] = newValue;
          (differences as any)[statKey] = bonus;
        }
      }
    }
    
    const preview: StatsPreview<TStats> = {
      current: currentStats,
      after: afterStats,
      differences,
    };
    
    this.state.setState({
      statsPreview: preview,
      stage: 'confirming',
    });
    
    this.events.emit('stats-previewed', { preview });
  }

  /**
   * ジョブ変更を確定
   */
  async confirmChange(): Promise<void> {
    const currentState = this.state.getState();
    
    if (!currentState.character || !currentState.selectedJob) {
      this.state.setState({ error: 'No character or job selected' });
      return;
    }
    
    this.state.setState({ isChanging: true, stage: 'changing' });
    
    // ジョブを変更
    const result = this.service.changeJob<TStats>(
      currentState.character,
      currentState.selectedJob,
      this.jobHistory
    );
    
    if (result.success) {
      // ステータスボーナスを適用
      if (currentState.statsPreview) {
        currentState.character.stats = currentState.statsPreview.after as any;
      }
      
      this.state.setState({
        stage: 'completed',
        isChanging: false,
        error: null,
        currentJob: currentState.selectedJob,
      });
      
      if (result.previousJob && result.newJob) {
        this.events.emit('job-changed', {
          character: currentState.character,
          previousJob: result.previousJob,
          newJob: result.newJob,
        });
      }
    } else {
      this.state.setState({
        stage: 'confirming',
        isChanging: false,
        error: result.message,
      });
      
      this.events.emit('job-change-failed', { reason: result.message });
    }
  }

  /**
   * フィルタを設定
   * 
   * @param filterType - フィルタタイプ
   */
  setFilter(filterType: JobFilterType): void {
    this.state.setState({ filterType });
    this.events.emit('filter-changed', { filterType });
    this.applyFilterAndSort();
  }

  /**
   * ソートを設定
   * 
   * @param sortBy - ソート基準
   * @param order - ソート順
   */
  setSortBy(sortBy: JobSortBy, order: UISortOrder = 'asc'): void {
    this.state.setState({ sortBy, sortOrder: order });
    this.events.emit('sort-changed', { sortBy, order });
    this.applyFilterAndSort();
  }

  /**
   * カーソル移動
   * 
   * @param delta - 移動量（+1 = 次、-1 = 前）
   */
  moveCursor(delta: number): void {
    const currentState = this.state.getState();
    const newIndex = currentState.cursorIndex + delta;
    const maxIndex = currentState.availableJobs.length - 1;
    
    if (newIndex >= 0 && newIndex <= maxIndex) {
      this.state.setState({ cursorIndex: newIndex });
    }
  }

  /**
   * 選択をキャンセル
   */
  cancel(): void {
    this.state.setState({
      stage: 'browsing',
      selectedJob: null,
      statsPreview: null,
      error: null,
    });
    
    this.events.emit('selection-cancelled', {});
  }

  /**
   * フィルタとソートを適用
   */
  private applyFilterAndSort(): void {
    const currentState = this.state.getState();
    let filtered = [...currentState.availableJobs];
    
    // フィルタ適用
    if (currentState.filterType === 'available') {
      filtered = filtered.filter(j => j.canChange);
    } else if (currentState.filterType === 'unavailable') {
      filtered = filtered.filter(j => !j.canChange);
    }
    
    // ソート適用
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (currentState.sortBy) {
        case 'name':
          comparison = a.job.name.localeCompare(b.job.name);
          break;
        case 'level':
          // ジョブレベル要件でソート（存在する場合）
          const levelA = (a.job as any).levelRequirement || 0;
          const levelB = (b.job as any).levelRequirement || 0;
          comparison = levelA - levelB;
          break;
      }
      
      return currentState.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    this.state.setState({ availableJobs: filtered });
  }

  /**
   * 現在の状態を取得
   */
  getState(): JobChangeUIState<TStats> {
    return this.state.getState();
  }
}
