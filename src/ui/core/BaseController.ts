/**
 * BaseController
 * 
 * すべてのUIコントローラーの基底クラス
 * ObservableStateとEventEmitterの共通機能を提供
 */

import { ObservableState } from './ObservableState';
import { EventEmitter, EventMap } from './EventEmitter';

/**
 * BaseController 抽象クラス
 * 
 * @template TState - UIの状態型
 * @template TEvents - イベントの型
 * 
 * @example
 * ```typescript
 * interface MyState { count: number; }
 * interface MyEvents { incremented: { newCount: number }; }
 * 
 * class MyController extends BaseController<MyState, MyEvents> {
 *   constructor() {
 *     super();
 *     this.state = new ObservableState<MyState>({ count: 0 });
 *     this.events = new EventEmitter<MyEvents>();
 *   }
 *   
 *   increment(): void {
 *     const currentState = this.state.getState();
 *     this.state.setState({ count: currentState.count + 1 });
 *     this.events.emit('incremented', { newCount: currentState.count + 1 });
 *   }
 * }
 * ```
 */
export abstract class BaseController<TState, TEvents extends EventMap> {
  protected state!: ObservableState<TState>;
  protected events!: EventEmitter<TEvents>;
  
  /**
   * 状態を購読
   * 
   * @param listener - 状態変更時に呼ばれるリスナー
   * @returns 購読解除関数
   */
  subscribe(listener: (state: TState) => void): () => void {
    return this.state.subscribe(listener);
  }
  
  /**
   * イベントを購読
   * 
   * @param event - イベント名
   * @param listener - イベント発火時に呼ばれるリスナー
   * @returns 購読解除関数
   */
  on<K extends keyof TEvents>(
    event: K,
    listener: (data: TEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }
  
  /**
   * 現在の状態を取得
   * 
   * @returns 現在の状態
   */
  getState(): TState {
    return this.state.getState();
  }
}
