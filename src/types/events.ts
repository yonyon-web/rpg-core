/**
 * イベント関連の型定義
 */

/**
 * データ変更イベントの型
 * 各サービスでデータが変更されたときに発行される
 */
export type DataChangeEventType = 
  | 'item-used'              // アイテムが使用された
  | 'equipment-changed'      // 装備が変更された
  | 'inventory-updated'      // インベントリが更新された
  | 'party-updated'          // パーティが更新された
  | 'craft-completed'        // クラフトが完了した
  | 'enhancement-completed'  // 強化が完了した
  | 'shop-transaction'       // ショップで取引された
  | 'reward-received'        // 報酬を受け取った
  | 'skill-learned'          // スキルを習得した
  | 'job-changed';           // ジョブが変更された

/**
 * データ変更イベント
 */
export interface DataChangeEvent {
  /** イベントタイプ */
  type: DataChangeEventType;
  /** タイムスタンプ */
  timestamp: number;
  /** イベントに関連する追加データ */
  data?: any;
}

/**
 * 自動セーブ完了イベント
 */
export interface AutoSaveCompletedEvent {
  /** タイムスタンプ */
  timestamp: number;
  /** セーブスロットID */
  slotId?: number;
}

/**
 * 自動セーブ失敗イベント
 */
export interface AutoSaveFailedEvent {
  /** タイムスタンプ */
  timestamp: number;
  /** エラーメッセージ */
  error: string;
  /** リトライ回数 */
  retryCount?: number;
}
