/**
 * BattleController
 * 
 * 戦闘UIの状態管理とイベント処理を行うコントローラー
 * BattleServiceと連携して戦闘の進行を管理する
 */

import { BaseController } from '../core/BaseController';
import { ObservableState } from '../core/ObservableState';
import { EventEmitter } from '../core/EventEmitter';
import type { 
  BattleUIState, 
  BattleEvents, 
  BattleAnimation, 
  BattleMessage, 
  BattleMessageType,
  BattleMessageData
} from '../types/battle';
import type { BattleService } from '../../services/BattleService';
import type { Character, Enemy, BattleAction } from '../../types/battle';
import type { Combatant } from '../../types/combatant';

/**
 * BattleController クラス
 * 
 * @example
 * ```typescript
 * const battleService = new BattleService();
 * const controller = new BattleController(battleService);
 * 
 * // 状態を購読
 * controller.subscribe((state) => {
 *   console.log('Battle state:', state);
 * });
 * 
 * // イベントを購読
 * controller.on('battle-started', (data) => {
 *   console.log('Battle started!', data);
 * });
 * 
 * // 戦闘を開始
 * await controller.startBattle(party, enemies);
 * ```
 */
export class BattleController extends BaseController<BattleUIState, BattleEvents> {
  private service: BattleService;
  private messageIdCounter: number = 0;
  private animationIdCounter: number = 0;

  /**
   * コンストラクタ
   * 
   * @param service - BattleService インスタンス
   */
  constructor(service: BattleService) {
    super();
    this.service = service;
    
    // 初期状態を設定
    this.state = new ObservableState<BattleUIState>({
      phase: 'initializing',
      turnNumber: 0,
      playerParty: [],
      enemyGroup: [],
      currentActor: null,
      currentAnimation: null,
      animationQueue: [],
      messages: [],
      result: null,
      rewards: null,
      isWaitingForInput: false,
      canSkipAnimation: true
    });
    
    this.events = new EventEmitter<BattleEvents>();
  }

  /**
   * 戦闘を開始
   * 
   * @param party - プレイヤーパーティ
   * @param enemies - 敵グループ
   */
  async startBattle(party: Character[], enemies: Enemy[]): Promise<void> {
    // Serviceで戦闘開始
    await this.service.startBattle(party, enemies);
    const battleState = this.service.getState();
    
    if (!battleState) {
      throw new Error('Failed to start battle');
    }
    
    // UI状態を更新
    this.state.setState({
      phase: 'selecting-command',
      turnNumber: battleState.turnNumber,
      playerParty: [...battleState.playerParty],
      enemyGroup: [...battleState.enemyGroup],
      currentActor: battleState.turnOrder[0] || null,
      currentAnimation: null,
      animationQueue: [],
      messages: [],
      result: null,
      rewards: null,
      isWaitingForInput: true,
      canSkipAnimation: true
    });
    
    // メッセージを追加
    this.addMessage('battle-started', {
      actorName: party.length > 0 ? party[0].name : undefined
    }, 'info');
    
    // イベント発火
    this.events.emit('battle-started', { party, enemies });
    this.events.emit('turn-started', {
      turnNumber: battleState.turnNumber,
      actor: battleState.turnOrder[0]
    });
  }

  /**
   * アクションを実行
   * 
   * @param action - 実行するアクション
   */
  async executeAction(action: BattleAction): Promise<void> {
    this.state.setState(prev => ({
      ...prev,
      phase: 'executing-action',
      isWaitingForInput: false
    }));
    
    // Serviceでアクション実行（actor引数を追加）
    const result = await this.service.executeAction(action.actor, action);
    
    // アニメーションをキューに追加
    this.queueAnimation({
      id: this.generateAnimationId(),
      type: action.type === 'attack' ? 'attack' : action.type === 'skill' ? 'skill' : 'item',
      actor: action.actor,
      targets: action.targets,
      duration: 1000
    });
    
    // イベント発火
    this.events.emit('action-executed', { action, result });
    
    // メッセージを追加
    if (result.success) {
      const actorName = 'name' in action.actor ? action.actor.name : '???';
      const messageType: BattleMessageType = 
        action.type === 'attack' ? 'action-attack' :
        action.type === 'skill' ? 'action-skill' :
        action.type === 'item' ? 'action-item' : 'action-defend';
      
      this.addMessage(messageType, {
        actorName,
        actorId: action.actor.id,
        skillName: action.skill?.name,
        skillId: action.skill?.id,
        damage: result.damage
      }, 'info');
    }
    
    // アニメーション再生
    await this.playNextAnimation();
    
    // 戦闘終了チェック
    const battleState = this.service.getState();
    if (battleState?.result) {
      this.endBattle(battleState.result, battleState.rewards);
    } else {
      // 次のターンへ
      await this.advanceTurn();
    }
  }

  /**
   * ターンを進める
   */
  private async advanceTurn(): Promise<void> {
    await this.service.advanceTurn();
    const battleState = this.service.getState();
    
    if (!battleState) {
      return;
    }
    
    const currentActor = battleState.turnOrder[battleState.currentActorIndex];
    
    this.state.setState(prev => ({
      ...prev,
      phase: 'selecting-command',
      turnNumber: battleState.turnNumber,
      currentActor,
      isWaitingForInput: true
    }));
    
    this.events.emit('turn-started', {
      turnNumber: battleState.turnNumber,
      actor: currentActor
    });
  }

  /**
   * 戦闘を終了
   * 
   * @param result - 戦闘結果
   * @param rewards - 戦闘報酬
   */
  private endBattle(result: 'victory' | 'defeat' | 'escaped', rewards?: any): void {
    this.state.setState(prev => ({
      ...prev,
      phase: 'ended',
      result,
      rewards: rewards || null,
      isWaitingForInput: false
    }));
    
    // メッセージを追加（構造化データで）
    if (result === 'victory') {
      this.addMessage('battle-ended-victory', {}, 'success');
    } else if (result === 'defeat') {
      this.addMessage('battle-ended-defeat', {}, 'error');
    } else {
      this.addMessage('battle-ended-escaped', {}, 'info');
    }
    
    this.events.emit('battle-ended', { result, rewards });
  }

  /**
   * アニメーションをキューに追加
   * 
   * @param animation - 追加するアニメーション
   */
  private queueAnimation(animation: BattleAnimation): void {
    this.state.setState(prev => ({
      ...prev,
      animationQueue: [...prev.animationQueue, animation]
    }));
  }

  /**
   * 次のアニメーションを再生
   */
  private async playNextAnimation(): Promise<void> {
    const currentState = this.state.getState();
    
    if (currentState.animationQueue.length === 0) {
      return;
    }
    
    const animation = currentState.animationQueue[0];
    
    this.state.setState(prev => ({
      ...prev,
      phase: 'animating',
      currentAnimation: animation,
      animationQueue: prev.animationQueue.slice(1)
    }));
    
    this.events.emit('animation-started', animation);
    
    // アニメーション時間待機（グローバルsetTimeoutを使用）
    await new Promise<void>(resolve => {
      const timer = (globalThis as any).setTimeout(() => {
        resolve();
      }, animation.duration || 1000);
      
      // Nodeの場合はunrefで処理を続行可能に
      if (timer && typeof timer.unref === 'function') {
        timer.unref();
      }
    });
    
    this.state.setState(prev => ({
      ...prev,
      currentAnimation: null
    }));
    
    this.events.emit('animation-completed', animation);
    
    // 次のアニメーションがあれば再生
    const nextState = this.state.getState();
    if (nextState.animationQueue.length > 0) {
      await this.playNextAnimation();
    }
  }

  /**
   * メッセージを追加
   * 
   * @param messageType - メッセージタイプ
   * @param data - メッセージデータ
   * @param severity - 重要度
   */
  addMessage(
    messageType: BattleMessageType, 
    data: BattleMessageData = {}, 
    severity?: 'info' | 'success' | 'warning' | 'error'
  ): void {
    const message: BattleMessage = {
      id: this.generateMessageId(),
      messageType,
      data,
      timestamp: Date.now(),
      severity
    };
    
    this.state.setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
    
    this.events.emit('message-added', message);
  }

  /**
   * アニメーションをスキップ
   */
  skipAnimation(): void {
    const currentState = this.state.getState();
    
    if (currentState.currentAnimation) {
      this.events.emit('animation-completed', currentState.currentAnimation);
    }
    
    this.state.setState(prev => ({
      ...prev,
      currentAnimation: null,
      animationQueue: []
    }));
  }

  /**
   * メッセージIDを生成
   */
  private generateMessageId(): string {
    return `msg-${++this.messageIdCounter}`;
  }

  /**
   * アニメーションIDを生成
   */
  private generateAnimationId(): string {
    return `anim-${++this.animationIdCounter}`;
  }
}
