/**
 * EventBus - アプリケーション全体のイベントバス
 * サービス間の疎結合な通信を実現
 */

/**
 * イベントリスナー関数の型
 */
export type EventListener<T = any> = (event: T) => void;

/**
 * EventBus
 * アプリケーション全体で使用できるイベントバスクラス
 * サービス間の疎結合な通信を実現するためのPub/Subパターン実装
 * 
 * @example
 * const eventBus = new EventBus();
 * 
 * // イベントリスナーを登録
 * eventBus.on('data-changed', (event) => {
 *   console.log('Data changed:', event);
 * });
 * 
 * // イベントを発行
 * eventBus.emit('data-changed', { type: 'item-used', timestamp: Date.now() });
 * 
 * // イベントリスナーを削除
 * eventBus.off('data-changed', listener);
 */
export class EventBus {
  private listeners: Map<string, Set<EventListener>>;

  constructor() {
    this.listeners = new Map();
  }

  /**
   * イベントリスナーを登録する
   * 
   * @param eventName - イベント名
   * @param listener - イベントリスナー関数
   * 
   * @example
   * eventBus.on('data-changed', (event) => {
   *   console.log('Data changed:', event);
   * });
   */
  on<T = any>(eventName: string, listener: EventListener<T>): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(listener as EventListener);
  }

  /**
   * イベントリスナーを削除する
   * 
   * @param eventName - イベント名
   * @param listener - 削除するイベントリスナー関数
   * 
   * @example
   * const listener = (event) => console.log(event);
   * eventBus.on('data-changed', listener);
   * eventBus.off('data-changed', listener);
   */
  off<T = any>(eventName: string, listener: EventListener<T>): void {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      eventListeners.delete(listener as EventListener);
      if (eventListeners.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  /**
   * イベントを発行する
   * 登録されているすべてのリスナーを同期的に実行
   * 
   * @param eventName - イベント名
   * @param event - イベントデータ
   * 
   * @example
   * eventBus.emit('data-changed', {
   *   type: 'item-used',
   *   timestamp: Date.now(),
   *   data: { itemId: 'potion-1' }
   * });
   */
  emit<T = any>(eventName: string, event: T): void {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          // リスナーのエラーは他のリスナーに影響を与えない
          console.error(`Error in event listener for "${eventName}":`, error);
        }
      });
    }
  }

  /**
   * 一度だけ実行されるイベントリスナーを登録する
   * 
   * @param eventName - イベント名
   * @param listener - イベントリスナー関数
   * 
   * @example
   * eventBus.once('game-loaded', () => {
   *   console.log('Game loaded!');
   * });
   */
  once<T = any>(eventName: string, listener: EventListener<T>): void {
    const onceListener: EventListener<T> = (event: T) => {
      this.off(eventName, onceListener);
      listener(event);
    };
    this.on(eventName, onceListener);
  }

  /**
   * すべてのイベントリスナーを削除する
   * 
   * @param eventName - イベント名（省略時はすべてのイベント）
   * 
   * @example
   * // 特定のイベントのリスナーをすべて削除
   * eventBus.removeAllListeners('data-changed');
   * 
   * // すべてのイベントのリスナーを削除
   * eventBus.removeAllListeners();
   */
  removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * イベントのリスナー数を取得する
   * 
   * @param eventName - イベント名
   * @returns リスナー数
   * 
   * @example
   * const count = eventBus.listenerCount('data-changed');
   */
  listenerCount(eventName: string): number {
    const eventListeners = this.listeners.get(eventName);
    return eventListeners ? eventListeners.size : 0;
  }

  /**
   * イベント名の一覧を取得する
   * 
   * @returns イベント名の配列
   * 
   * @example
   * const events = eventBus.eventNames();
   * console.log(events); // ['data-changed', 'auto-save-completed', ...]
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
}
