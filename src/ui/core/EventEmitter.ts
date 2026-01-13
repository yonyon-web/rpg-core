/**
 * EventEmitter
 * 
 * 型安全なイベント管理クラス。イベントの登録・発火機能を提供する。
 * 
 * @example
 * ```typescript
 * type MyEvents = {
 *   'user-logged-in': { userId: string; username: string };
 *   'data-updated': { timestamp: number };
 *   'error-occurred': { message: string; code: number };
 * };
 * 
 * const emitter = new EventEmitter<MyEvents>();
 * 
 * // イベントを購読
 * const unsubscribe = emitter.on('user-logged-in', (data) => {
 *   console.log(`User ${data.username} logged in`);
 * });
 * 
 * // イベントを発火
 * emitter.emit('user-logged-in', { userId: '123', username: 'Alice' });
 * 
 * // 購読を解除
 * unsubscribe();
 * ```
 */

/**
 * イベントマップの型定義
 * イベント名をキー、イベントデータの型を値とするレコード
 */
export type EventMap = Record<string, any>;

/**
 * イベントリスナーの型定義
 */
export type EventListener<T = any> = (data: T) => void;

/**
 * EventEmitter クラス
 * 
 * イベントベースの通信を実現する。
 * 各イベントに型安全なリスナーを登録でき、イベント発火時にすべてのリスナーが呼ばれる。
 */
export class EventEmitter<Events extends EventMap> {
  private listeners: Map<keyof Events, Set<EventListener>> = new Map();
  
  /**
   * イベントリスナーを登録
   * 
   * 指定されたイベントにリスナーを登録する。
   * 返された関数を呼び出すことで購読を解除できる。
   * 
   * @param event - イベント名
   * @param listener - イベント発火時に呼ばれるリスナー関数
   * @returns 購読解除関数
   */
  on<K extends keyof Events>(
    event: K, 
    listener: EventListener<Events[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    
    // unsubscribe関数を返す
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }
  
  /**
   * イベントを発火
   * 
   * 指定されたイベントに登録されたすべてのリスナーを呼び出す。
   * 
   * @param event - イベント名
   * @param data - イベントデータ
   */
  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.listeners.get(event)?.forEach(listener => listener(data));
  }
  
  /**
   * 指定されたイベントのすべてのリスナーを削除
   * 
   * @param event - イベント名
   */
  removeAllListeners<K extends keyof Events>(event: K): void {
    this.listeners.delete(event);
  }
  
  /**
   * すべてのイベントのすべてのリスナーを削除
   */
  removeAllListenersForAllEvents(): void {
    this.listeners.clear();
  }
  
  /**
   * すべてのイベントのすべてのリスナーを削除（エイリアス）
   */
  clear(): void {
    this.removeAllListenersForAllEvents();
  }
}
