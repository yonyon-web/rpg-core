/**
 * Inventory UI Types
 * インベントリUI用の型定義
 */

import type { Item, InventorySlot, InventorySortBy } from '../../types';
import type { Pagination, UISortOrder } from './common';

/**
 * インベントリUIの状態
 */
export interface InventoryUIState {
  // インベントリデータ
  slots: InventorySlot[];
  displayedSlots: InventorySlot[];
  
  // フィルタ・ソート
  filter: {
    category?: string;
    searchText?: string;
    stackableOnly?: boolean;
  };
  sortBy: InventorySortBy;
  sortOrder: UISortOrder;
  
  // ページネーション
  pagination: Pagination;
  
  // 選択状態
  selectedSlot: InventorySlot | null;
  cursorIndex: number;
  
  // 統計情報
  usedSlots: number;
  maxSlots: number;
  
  // リソース
  resources: Record<string, number>;  // すべてのリソース（money, SP, クラフトポイントなど）
}

/**
 * インベントリUIのイベント
 */
export interface InventoryEvents {
  'item-selected': { slot: InventorySlot };
  'item-removed': { item: Item; quantity: number; success: boolean };
  'item-discarded': { item: Item; quantity: number };
  'filter-changed': { filter: InventoryUIState['filter'] };
  'sort-changed': { sortBy: InventorySortBy; sortOrder: UISortOrder };
}

/**
 * インベントリコントローラーのオプション
 */
export interface InventoryControllerOptions {
  itemsPerPage?: number;
  defaultSortBy?: InventorySortBy;
  defaultSortOrder?: UISortOrder;
}
