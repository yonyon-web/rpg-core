/**
 * ItemController
 * アイテム使用のヘッドレスUIコントローラー
 */

import { ObservableState } from '../core/ObservableState';
import { EventEmitter } from '../core/EventEmitter';
import type { ItemService } from '../../services/ItemService';
import type { 
  ItemUseUIState, 
  ItemUseEvents, 
  ItemUseUIStage,
  ItemUseContext,
  ItemEffectPreview
} from '../types/item';
import type { Combatant, ConsumableItem, ItemUseConditions } from '../../types';

/**
 * ItemController
 * アイテム使用フローを管理
 * 
 * @example
 * ```typescript
 * const controller = new ItemController(itemService);
 * 
 * // アイテム使用を開始（戦闘中）
 * controller.startItemUse(availableItems, targets, 'battle');
 * 
 * // アイテムを選択
 * controller.selectItem(potion);
 * 
 * // ターゲットを選択
 * controller.selectTarget(character);
 * 
 * // 使用を確定
 * await controller.confirmUse();
 * ```
 */
export class ItemController {
  private state: ObservableState<ItemUseUIState>;
  private events: EventEmitter<ItemUseEvents>;
  private service: ItemService;

  constructor(service: ItemService) {
    this.service = service;
    
    this.state = new ObservableState<ItemUseUIState>({
      stage: 'selecting-item',
      context: 'field',
      availableItems: [],
      selectedItem: null,
      availableTargets: [],
      selectedTarget: null,
      effectPreview: null,
      cursorIndex: 0,
      lastResult: null
    });

    this.events = new EventEmitter<ItemUseEvents>();
  }

  /**
   * 状態を購読
   */
  subscribe(listener: (state: ItemUseUIState) => void): () => void {
    return this.state.subscribe(listener);
  }

  /**
   * イベントを購読
   */
  on<K extends keyof ItemUseEvents>(
    event: K,
    listener: (data: ItemUseEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }

  /**
   * 現在の状態を取得
   */
  getState(): ItemUseUIState {
    return this.state.getState();
  }

  /**
   * アイテム使用を開始
   */
  startItemUse(
    availableItems: ConsumableItem[],
    availableTargets: Combatant[],
    context: ItemUseContext = 'field'
  ): void {
    this.state.setState({
      stage: 'selecting-item',
      context,
      availableItems,
      availableTargets,
      selectedItem: null,
      selectedTarget: null,
      effectPreview: null,
      cursorIndex: 0,
      lastResult: null
    });
    
    this.events.emit('context-changed', { context });
    this.events.emit('stage-changed', { stage: 'selecting-item' });
  }

  /**
   * コンテキストを設定
   */
  setContext(context: ItemUseContext): void {
    this.state.setState({ context });
    this.events.emit('context-changed', { context });
    
    // コンテキストが変わったら選択をリセット
    this.reset();
  }

  /**
   * アイテムを選択
   */
  selectItem(item: ConsumableItem | null): void {
    const currentState = this.state.getState();
    
    this.state.setState({
      selectedItem: item,
      stage: item ? 'selecting-target' : 'selecting-item',
      selectedTarget: null,
      effectPreview: null,
      cursorIndex: 0
    });
    
    if (item) {
      this.events.emit('item-selected', { item });
      this.events.emit('stage-changed', { stage: 'selecting-target' });
    }
  }

  /**
   * ターゲットを選択
   */
  selectTarget(target: Combatant | null): void {
    const currentState = this.state.getState();
    
    if (!currentState.selectedItem) {
      return;
    }
    
    // 効果プレビューを計算
    const effectPreview = target
      ? this.calculateEffectPreview(currentState.selectedItem, target, currentState.context)
      : null;
    
    this.state.setState({
      selectedTarget: target,
      effectPreview,
      stage: target ? 'confirming' : 'selecting-target'
    });
    
    if (target) {
      this.events.emit('target-selected', { target });
      this.events.emit('stage-changed', { stage: 'confirming' });
    }
  }

  /**
   * 使用を確定
   */
  async confirmUse(): Promise<boolean> {
    const currentState = this.state.getState();
    
    if (!currentState.selectedItem || !currentState.selectedTarget) {
      return false;
    }
    
    this.state.setState({ stage: 'executing' });
    this.events.emit('stage-changed', { stage: 'executing' });
    
    // アイテムを使用
    const conditions: ItemUseConditions = {
      inBattle: currentState.context === 'battle'
    };
    
    const result = this.service.useItem(
      currentState.selectedItem,
      currentState.selectedTarget,
      conditions
    );
    
    this.state.setState({
      stage: 'completed',
      lastResult: {
        success: result.success,
        message: result.message
      }
    });
    
    this.events.emit('item-used', {
      item: currentState.selectedItem,
      target: currentState.selectedTarget,
      success: result.success,
      message: result.message
    });
    this.events.emit('stage-changed', { stage: 'completed' });
    
    return result.success;
  }

  /**
   * 効果プレビューを計算
   */
  private calculateEffectPreview(
    item: ConsumableItem,
    target: Combatant,
    context: ItemUseContext
  ): ItemEffectPreview {
    const conditions: ItemUseConditions = {
      inBattle: context === 'battle'
    };
    
    // アイテムが使用可能かチェック
    const canUse = this.service.canUseItem(item, target, conditions);
    
    // 効果を推定（実際の効果計算はItemServiceで行われる）
    const estimatedEffect: ItemEffectPreview['estimatedEffect'] = {};
    
    if (item.effect) {
      switch (item.effect.type) {
        case 'heal-hp':
          estimatedEffect.hpRestore = Math.floor(
            typeof item.effect.value === 'number' 
              ? item.effect.value 
              : target.stats.maxHp * 0.5
          );
          break;
        case 'heal-mp':
          estimatedEffect.mpRestore = Math.floor(
            typeof item.effect.value === 'number' 
              ? item.effect.value 
              : target.stats.maxMp * 0.5
          );
          break;
        case 'heal-status':
          estimatedEffect.statusEffects = ['status-healing'];
          break;
      }
    }
    
    return {
      item,
      target,
      canUse,
      estimatedEffect
    };
  }

  /**
   * カーソルを移動
   */
  moveCursor(direction: 'up' | 'down'): void {
    const currentState = this.state.getState();
    
    let maxIndex = 0;
    if (currentState.stage === 'selecting-item') {
      maxIndex = currentState.availableItems.length - 1;
    } else if (currentState.stage === 'selecting-target') {
      maxIndex = currentState.availableTargets.length - 1;
    }
    
    let newIndex = currentState.cursorIndex;
    if (direction === 'up') {
      newIndex = Math.max(0, newIndex - 1);
    } else {
      newIndex = Math.min(maxIndex, newIndex + 1);
    }
    
    this.state.setState({ cursorIndex: newIndex });
  }

  /**
   * キャンセル
   */
  cancel(): void {
    const currentState = this.state.getState();
    
    if (currentState.stage === 'selecting-target' || currentState.stage === 'confirming') {
      this.state.setState({
        stage: 'selecting-item',
        selectedItem: null,
        selectedTarget: null,
        effectPreview: null,
        cursorIndex: 0
      });
      this.events.emit('stage-changed', { stage: 'selecting-item' });
    } else {
      this.reset();
    }
  }

  /**
   * リセット
   */
  reset(): void {
    this.state.setState({
      stage: 'selecting-item',
      selectedItem: null,
      selectedTarget: null,
      effectPreview: null,
      cursorIndex: 0,
      lastResult: null
    });
    
    this.events.emit('stage-changed', { stage: 'selecting-item' });
  }

  /**
   * クリーンアップ
   */
  destroy(): void {
    this.events.clear();
  }
}
