/**
 * RewardController
 * 報酬受取UIコントローラー
 */

import { ObservableState } from '../../core/ObservableState';
import { EventEmitter } from '../../core/EventEmitter';
import type { RewardUIState, RewardEvents, RewardUIStage } from '../../types/reward';
import type { RewardService } from '../../../services/system/RewardService';
import type { BattleRewards } from '../../../types/battle';
import type { Combatant } from '../../../types/combatant';
import type { BaseStats, DefaultStats } from '../../../types/stats';

/**
 * RewardController
 * 報酬受取UIを管理するコントローラー
 * 
 * @template TStats - ステータスの型
 * 
 * @example
 * const controller = new RewardController(rewardService);
 * 
 * controller.subscribe((state) => {
 *   console.log('Stage:', state.stage);
 *   console.log('Exp distribution:', state.expDistribution);
 * });
 * 
 * controller.on('level-up', (data) => {
 *   console.log(`${data.characterId} leveled up!`);
 * });
 * 
 * await controller.showRewards(party, battleRewards);
 */
export class RewardController<TStats extends BaseStats = DefaultStats> {
  private state: ObservableState<RewardUIState<TStats>>;
  private events: EventEmitter<RewardEvents<TStats>>;
  private service: RewardService<any, TStats>;

  constructor(service: RewardService<any, TStats>) {
    this.service = service;
    
    this.state = new ObservableState<RewardUIState<TStats>>({
      stage: 'exp-distribution',
      expDistribution: [],
      levelUpResults: new Map(),
      goldTotal: 0,
      itemsReceived: [],
      currentCharacterIndex: 0,
      animationSpeed: 1.0,
      isAnimating: false,
    });
    
    this.events = new EventEmitter<RewardEvents<TStats>>();
  }

  /**
   * 状態を購読
   */
  subscribe(listener: (state: RewardUIState<TStats>) => void): () => void {
    return this.state.subscribe(listener);
  }

  /**
   * イベントを購読
   */
  on<K extends keyof RewardEvents<TStats>>(
    event: K,
    listener: (data: RewardEvents<TStats>[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }

  /**
   * 報酬を表示
   * 
   * @param party - パーティメンバー
   * @param rewards - 戦闘報酬
   */
  async showRewards(party: Combatant<TStats>[], rewards: BattleRewards): Promise<void> {
    // 報酬を配分
    const distributionResult = this.service.distributeRewards(party, rewards);
    
    // 状態を更新
    this.state.setState({
      stage: 'exp-distribution',
      expDistribution: distributionResult.expDistribution,
      levelUpResults: distributionResult.levelUpResults,
      goldTotal: distributionResult.goldTotal,
      itemsReceived: (distributionResult.itemsReceived || []) as any,
      currentCharacterIndex: 0,
      isAnimating: true,
    });
    
    // イベント発火
    this.events.emit('reward-started', { rewards: distributionResult });
    this.events.emit('exp-distributed', { distribution: distributionResult.expDistribution });
    
    // レベルアップがあれば通知
    for (const [characterId, results] of distributionResult.levelUpResults.entries()) {
      this.events.emit('level-up', { characterId, results });
    }
    
    // アイテムとゴールドを通知
    if (distributionResult.itemsReceived && distributionResult.itemsReceived.length > 0) {
      this.events.emit('items-received', { items: distributionResult.itemsReceived as any });
    }
    
    if (distributionResult.goldTotal > 0) {
      this.events.emit('gold-received', { amount: distributionResult.goldTotal });
    }
  }

  /**
   * 次のステージに進む
   */
  nextStage(): void {
    const currentState = this.state.getState();
    let nextStage: RewardUIStage;
    
    switch (currentState.stage) {
      case 'exp-distribution':
        nextStage = currentState.levelUpResults.size > 0 ? 'level-up' : 'items';
        break;
      case 'level-up':
        nextStage = 'items';
        break;
      case 'items':
        nextStage = 'gold';
        break;
      case 'gold':
        nextStage = 'completed';
        break;
      default:
        nextStage = 'completed';
    }
    
    this.state.setState({ stage: nextStage });
    this.events.emit('stage-changed', { stage: nextStage });
    
    if (nextStage === 'completed') {
      this.state.setState({ isAnimating: false });
      this.events.emit('reward-completed', {});
    }
  }

  /**
   * ステージをスキップ
   */
  skipStage(): void {
    this.nextStage();
  }

  /**
   * すべてのステージをスキップ
   */
  skipAll(): void {
    this.state.setState({
      stage: 'completed',
      isAnimating: false,
    });
    this.events.emit('stage-changed', { stage: 'completed' });
    this.events.emit('reward-completed', {});
  }

  /**
   * アニメーション速度を設定
   * 
   * @param speed - 速度（1.0 = 通常、2.0 = 2倍速）
   */
  setAnimationSpeed(speed: number): void {
    this.state.setState({ animationSpeed: Math.max(0.5, Math.min(5.0, speed)) });
    this.events.emit('animation-speed-changed', { speed });
  }

  /**
   * 現在の状態を取得
   */
  getState(): RewardUIState<TStats> {
    return this.state.getState();
  }
}
