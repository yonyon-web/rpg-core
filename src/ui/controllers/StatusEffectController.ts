/**
 * StatusEffectController
 * 
 * 状態異常UIの状態管理とイベント処理を行うコントローラー
 * StatusEffectServiceと連携して状態異常の表示と管理を行う
 */

import { ObservableState } from '../core/ObservableState';
import { EventEmitter } from '../core/EventEmitter';
import type { 
  StatusEffectUIState, 
  StatusEffectEvents, 
  ActiveStatusEffect,
  StatusEffectFilterType,
  StatusEffectSortBy
} from '../types/statusEffect';
import type { StatusEffectService } from '../../services/StatusEffectService';
import type { Combatant } from '../../types/combatant';
import type { StatusEffect } from '../../types/statusEffect';

/**
 * StatusEffectController クラス
 * 
 * @example
 * ```typescript
 * const statusEffectService = new StatusEffectService();
 * const controller = new StatusEffectController(statusEffectService);
 * 
 * // 状態を購読
 * controller.subscribe((state) => {
 *   console.log('Status effects:', state.activeEffects);
 * });
 * 
 * // 対象を設定
 * controller.setTarget(character);
 * 
 * // フィルタを変更
 * controller.setFilter('buff');
 * ```
 */
export class StatusEffectController {
  private state: ObservableState<StatusEffectUIState>;
  private events: EventEmitter<StatusEffectEvents>;
  private service: StatusEffectService;

  /**
   * コンストラクタ
   * 
   * @param service - StatusEffectService インスタンス
   */
  constructor(service: StatusEffectService) {
    this.service = service;
    
    // 初期状態を設定
    this.state = new ObservableState<StatusEffectUIState>({
      target: null,
      activeEffects: [],
      selectedEffect: null,
      filterType: 'all',
      sortBy: 'duration',
      cursorIndex: 0
    });
    
    this.events = new EventEmitter<StatusEffectEvents>();
  }

  /**
   * 状態を購読
   * 
   * @param listener - 状態変更時に呼ばれるリスナー
   * @returns 購読解除関数
   */
  subscribe(listener: (state: StatusEffectUIState) => void): () => void {
    return this.state.subscribe(listener);
  }

  /**
   * イベントを購読
   * 
   * @param event - イベント名
   * @param listener - イベント発火時に呼ばれるリスナー
   * @returns 購読解除関数
   */
  on<K extends keyof StatusEffectEvents>(
    event: K,
    listener: (data: StatusEffectEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }

  /**
   * 現在の状態を取得
   * 
   * @returns 現在の状態異常UI状態
   */
  getState(): StatusEffectUIState {
    return this.state.getState();
  }

  /**
   * 対象を設定
   * 
   * @param target - 状態異常を表示する対象
   */
  setTarget(target: Combatant): void {
    this.state.setState(prev => ({
      ...prev,
      target,
      activeEffects: this.getActiveEffects(target),
      selectedEffect: null,
      cursorIndex: 0
    }));
    
    // フィルタとソートを適用
    this.applyFilterAndSort();
  }

  /**
   * 対象のアクティブな状態異常を取得
   * 
   * @param target - 対象
   * @returns アクティブな状態異常リスト
   */
  private getActiveEffects(target: Combatant): ActiveStatusEffect[] {
    if (!target.statusEffects) {
      return [];
    }
    
    return target.statusEffects.map(effect => ({
      ...effect,
      remainingDuration: effect.duration || 0,
      stackCount: effect.stackCount || 1
    }));
  }

  /**
   * フィルタを設定
   * 
   * @param filterType - フィルタタイプ
   */
  setFilter(filterType: StatusEffectFilterType): void {
    this.state.setState(prev => ({
      ...prev,
      filterType,
      cursorIndex: 0
    }));
    
    this.events.emit('filter-changed', { filterType });
    this.applyFilterAndSort();
  }

  /**
   * ソート基準を設定
   * 
   * @param sortBy - ソート基準
   */
  setSortBy(sortBy: StatusEffectSortBy): void {
    this.state.setState(prev => ({
      ...prev,
      sortBy,
      cursorIndex: 0
    }));
    
    this.events.emit('sort-changed', { sortBy });
    this.applyFilterAndSort();
  }

  /**
   * フィルタとソートを適用
   */
  private applyFilterAndSort(): void {
    const currentState = this.state.getState();
    
    if (!currentState.target) {
      return;
    }
    
    let effects = this.getActiveEffects(currentState.target);
    
    // フィルタを適用
    if (currentState.filterType && currentState.filterType !== 'all') {
      effects = effects.filter(effect => {
        const category = effect.category;
        if (currentState.filterType === 'buff') {
          return category === 'buff' || category === 'hot';
        } else if (currentState.filterType === 'debuff') {
          return category === 'debuff' || category === 'dot';
        } else if (currentState.filterType === 'ailment') {
          return category === 'disable';
        }
        return true;
      });
    }
    
    // ソートを適用
    effects.sort((a, b) => {
      if (currentState.sortBy === 'duration') {
        return b.remainingDuration - a.remainingDuration;
      } else if (currentState.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (currentState.sortBy === 'severity') {
        // 重要度順（カテゴリ順）
        const severityOrder = { ailment: 3, debuff: 2, buff: 1 };
        const aSeverity = severityOrder[a.category as keyof typeof severityOrder] || 0;
        const bSeverity = severityOrder[b.category as keyof typeof severityOrder] || 0;
        return bSeverity - aSeverity;
      }
      return 0;
    });
    
    this.state.setState(prev => ({
      ...prev,
      activeEffects: effects
    }));
  }

  /**
   * 状態異常を選択
   * 
   * @param effect - 選択する状態異常
   */
  selectEffect(effect: ActiveStatusEffect): void {
    this.state.setState(prev => ({
      ...prev,
      selectedEffect: effect
    }));
    
    this.events.emit('effect-selected', { effect });
  }

  /**
   * カーソルを移動
   * 
   * @param direction - 移動方向（1: 下、-1: 上）
   */
  moveCursor(direction: number): void {
    const currentState = this.state.getState();
    const maxIndex = currentState.activeEffects.length - 1;
    
    if (maxIndex < 0) {
      return;
    }
    
    let newIndex = currentState.cursorIndex + direction;
    
    // ループさせる
    if (newIndex < 0) {
      newIndex = maxIndex;
    } else if (newIndex > maxIndex) {
      newIndex = 0;
    }
    
    this.state.setState(prev => ({
      ...prev,
      cursorIndex: newIndex,
      selectedEffect: prev.activeEffects[newIndex] || null
    }));
  }

  /**
   * 状態異常を付与
   * 
   * @param target - 対象
   * @param effect - 付与する状態異常
   */
  applyEffect(target: Combatant, effect: StatusEffect): void {
    const result = this.service.applyEffect(target, effect);
    
    if (result.success) {
      // 表示を更新
      if (this.state.getState().target === target) {
        this.setTarget(target);
      }
      
      this.events.emit('effect-applied', { target, effect });
    }
  }

  /**
   * 状態異常を解除
   * 
   * @param target - 対象
   * @param effectId - 解除する状態異常のID
   */
  removeEffect(target: Combatant, effectId: string): void {
    const result = this.service.removeEffect(target, effectId);
    
    if (result.success) {
      // 表示を更新
      if (this.state.getState().target === target) {
        this.setTarget(target);
      }
      
      this.events.emit('effect-removed', { target, effectId });
    }
  }

  /**
   * 全ての状態異常を取得（フィルタなし）
   * 
   * @returns すべての状態異常
   */
  getAllEffects(): ActiveStatusEffect[] {
    const currentState = this.state.getState();
    
    if (!currentState.target) {
      return [];
    }
    
    return this.getActiveEffects(currentState.target);
  }

  /**
   * 状態異常の数を取得
   * 
   * @param category - カテゴリ（省略時は全体）
   * @returns 状態異常の数
   */
  getEffectCount(category?: 'buff' | 'debuff' | 'ailment'): number {
    const currentState = this.state.getState();
    
    if (!currentState.target) {
      return 0;
    }
    
    const effects = this.getActiveEffects(currentState.target);
    
    if (!category) {
      return effects.length;
    }
    
    return effects.filter(e => e.category === category).length;
  }
}
