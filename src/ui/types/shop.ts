import type { Item } from '../../types/item';
import type { LoadingState, ErrorState } from './common';

/**
 * ショップUIの状態
 */
export interface ShopUIState {
  /** 現在のステージ */
  stage: ShopUIStage;
  /** ショップのアイテム一覧 */
  shopItems: ShopUIItem[];
  /** 選択されたアイテム */
  selectedItem: ShopUIItem | null;
  /** 取引モード */
  mode: ShopMode;
  /** 取引数量 */
  quantity: number;
  /** 合計価格 */
  totalPrice: number;
  /** 購入/売却可能か */
  canTrade: boolean;
  /** 不可能な理由 */
  tradeReasons: string[];
  /** プレイヤーの所持金 */
  playerMoney: number;
  /** フィルタタイプ */
  filterType: ShopFilterType;
  /** ソート基準 */
  sortBy: ShopSortBy;
  /** ソート順 */
  sortOrder: 'asc' | 'desc';
  /** ページネーション */
  pagination: {
    page: number;
    perPage: number;
    totalPages: number;
    totalItems: number;
  };
  /** ローディング状態 */
  loading: LoadingState;
  /** エラー状態 */
  error: ErrorState;
}

/**
 * ショップアイテム（UI用）
 */
export interface ShopUIItem {
  /** アイテム */
  item: Item;
  /** 購入価格 */
  buyPrice: number;
  /** 売却価格 */
  sellPrice: number;
  /** 在庫数（nullは無限） */
  stock: number | null;
  /** 購入条件 */
  requirements?: {
    /** 必要レベル */
    level?: number;
    /** 必要アイテム */
    requiredItems?: Array<{ itemId: string; quantity: number }>;
  };
}

/**
 * ショップUIのステージ
 */
export type ShopUIStage = 'browsing' | 'buying' | 'selling' | 'confirming' | 'completed';

/**
 * ショップモード
 */
export type ShopMode = 'buy' | 'sell';

/**
 * ショップフィルタタイプ
 */
export type ShopFilterType = 'all' | 'buyable' | 'unbuyable' | 'sellable';

/**
 * ショップソート基準
 */
export type ShopSortBy = 'name' | 'price' | 'category';

/**
 * ショップUIのイベント
 */
export interface ShopEvents {
  /** ショップ開始 */
  'shop-started': { items: ShopUIItem[]; playerMoney: number };
  /** モード変更 */
  'mode-changed': { mode: ShopMode };
  /** アイテム選択 */
  'item-selected': { item: ShopUIItem };
  /** 購入実行 */
  'item-bought': { item: ShopUIItem; quantity: number; totalPrice: number };
  /** 売却実行 */
  'item-sold': { item: ShopUIItem; quantity: number; totalPrice: number };
  /** 取引失敗 */
  'trade-failed': { item: ShopUIItem; reason: string };
  /** フィルタ変更 */
  'filter-changed': { filterType: ShopFilterType };
  /** ソート変更 */
  'sort-changed': { sortBy: ShopSortBy; order: 'asc' | 'desc' };
  /** 数量変更 */
  'quantity-changed': { quantity: number };
  /** ページ変更 */
  'page-changed': { page: number };
  /** ステージ変更 */
  'stage-changed': { stage: ShopUIStage };
}
