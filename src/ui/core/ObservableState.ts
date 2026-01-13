/**
 * ObservableState
 * 
 * 型安全な状態管理クラス。状態の購読・通知機能を提供する。
 * UIフレームワークから状態の変更を監視できる。
 * 
 * @example
 * ```typescript
 * interface MyState {
 *   count: number;
 *   message: string;
 * }
 * 
 * const state = new ObservableState<MyState>({ count: 0, message: 'Hello' });
 * 
 * // 状態を購読
 * const unsubscribe = state.subscribe((newState) => {
 *   console.log('State changed:', newState);
 * });
 * 
 * // 状態を更新
 * state.setState({ count: 1, message: 'World' });
 * 
 * // 関数による更新
 * state.setState(prev => ({ ...prev, count: prev.count + 1 }));
 * 
 * // 購読を解除
 * unsubscribe();
 * ```
 */

/**
 * 状態変更リスナーの型定義
 */
export type Listener<T> = (state: T) => void;

/**
 * ObservableState クラス
 * 
 * 状態を保持し、変更を購読者に通知する。
 * Reactの useState や Vueの ref と同様の機能を提供する。
 */
export class ObservableState<T> {
  private state: T;
  private listeners: Set<Listener<T>> = new Set();
  
  /**
   * コンストラクタ
   * 
   * @param initialState - 初期状態
   */
  constructor(initialState: T) {
    this.state = initialState;
  }
  
  /**
   * 現在の状態を取得
   * 
   * @returns 現在の状態
   */
  getState(): T {
    return this.state;
  }
  
  /**
   * 状態を更新
   * 
   * 新しい状態をセットし、すべてのリスナーに通知する。
   * 関数を渡すことで、現在の状態を元に新しい状態を生成できる。
   * 
   * @param newState - 新しい状態、または状態を生成する関数
   */
  setState(newState: T | ((prev: T) => T)): void {
    const nextState = typeof newState === 'function' 
      ? (newState as (prev: T) => T)(this.state)
      : newState;
    
    this.state = nextState;
    this.notify();
  }
  
  /**
   * 状態変更を購読
   * 
   * リスナーを登録し、即座に現在の状態を通知する。
   * 返された関数を呼び出すことで購読を解除できる。
   * 
   * @param listener - 状態変更時に呼ばれるリスナー関数
   * @returns 購読解除関数
   */
  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    // 即座に現在の状態を通知
    listener(this.state);
    
    // unsubscribe関数を返す
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * すべてのリスナーに状態変更を通知
   * 
   * @private
   */
  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}
