/**
 * ショップ関連の型定義
 */

import type { Item, UniqueId } from './item';

/**
 * ショップアイテム
 * - ショップで販売されるアイテムの情報
 */
export interface ShopItem {
  item: Item;                                     // 販売アイテム
  buyPrice: number;                               // 購入価格
  sellPrice?: number;                             // 売却価格（省略時はbuyPrice * sellPriceMultiplier）
  stock?: number;                                 // 在庫数（省略時は-1で無限、0以上で在庫制限あり）
  resourceCost?: {                                // リソースコスト（お金の代わりにSPやトークン等で購入）
    resourceId: string;
    amount: number;
  };
  requiredLevel?: number;                         // 購入に必要なキャラクターレベル
  requiredItems?: {                               // 購入に必要なアイテム（消費される）
    itemId: UniqueId;
    quantity: number;
  }[];
  maxPurchasePerTransaction?: number;             // 1回の取引で購入可能な最大数（省略時は制限なし）
  isPurchasable?: boolean;                        // 購入可能フラグ（省略時はtrue）
  isSellable?: boolean;                           // 売却可能フラグ（省略時はtrue）
}

/**
 * ショップ
 * - ショップの設定と販売アイテムリスト
 */
export interface Shop {
  id: UniqueId;                                   // ショップID
  name: string;                                   // ショップ名
  items: ShopItem[];                              // 販売アイテムリスト
  buyPriceMultiplier?: number;                    // 購入価格倍率（省略時は1.0）
  sellPriceMultiplier?: number;                   // 売却価格倍率（省略時は0.5）
  restockOnVisit?: boolean;                       // 訪問時に在庫を補充するか（省略時はfalse）
}

/**
 * ショップ取引結果
 * - 購入・売却の結果情報
 */
export interface ShopTransaction {
  success: boolean;                               // 取引成功フラグ
  moneySpent?: number;                            // 消費したお金
  moneyGained?: number;                           // 獲得したお金
  resourcesSpent?: Record<string, number>;        // 消費したリソース
  itemsGained?: { item: Item; quantity: number }[]; // 獲得したアイテム
  itemsLost?: { item: Item; quantity: number }[];   // 失ったアイテム
  failureReason?: string;                         // 失敗理由
}
