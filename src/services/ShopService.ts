/**
 * ShopService
 * 
 * ショップの操作とビジネスロジックを管理するサービス
 * Core Engineの純粋な関数を利用してショップ管理を行う
 */

import type { Character } from '../types/battle';
import type { Shop, ShopItem, ShopTransaction } from '../types/shop';
import type { UniqueId } from '../types/item';
import type { InventoryService } from './InventoryService';

import {
  calculateBuyPrice,
  calculateSellPrice,
  canBuyItem as canBuyItemCore,
  canSellItem as canSellItemCore,
  buyItem as buyItemCore,
  sellItem as sellItemCore,
  getAvailableItems as getAvailableItemsCore
} from '../shop/shop';

/**
 * ShopService
 * 
 * @example
 * ```typescript
 * const shop: Shop = {
 *   id: 'weapon-shop',
 *   name: 'Weapon Shop',
 *   items: [
 *     { item: swordItem, buyPrice: 500, stock: 10 },
 *     { item: potionItem, buyPrice: 50, stock: -1 }
 *   ]
 * };
 * 
 * const inventoryService = new InventoryService(inventory);
 * const shopService = new ShopService(shop, inventoryService);
 * 
 * // アイテム購入
 * const result = shopService.buyItem(character, 0, 2);
 * 
 * // アイテム売却
 * const sellResult = shopService.sellItem(character, 'old-sword', 1);
 * ```
 */
export class ShopService {
  private shop: Shop;
  private inventoryService: InventoryService;
  private initialStocks: Map<number, number>;  // 元の在庫数を記憶
  
  /**
   * コンストラクタ
   * 
   * @param shop - 管理対象のショップ
   * @param inventoryService - インベントリサービス
   */
  constructor(shop: Shop, inventoryService: InventoryService) {
    this.shop = shop;
    this.inventoryService = inventoryService;
    this.initialStocks = new Map();
    
    // 初期在庫を記憶
    shop.items.forEach((item, index) => {
      if (item.stock !== undefined) {
        this.initialStocks.set(index, item.stock);
      }
    });
  }
  
  // ===== 購入操作 =====
  
  /**
   * アイテムを購入
   * 
   * @param character - キャラクター
   * @param shopItemIndex - ショップアイテムのインデックス
   * @param quantity - 購入数量
   * @returns 取引結果
   */
  buyItem(
    character: Character,
    shopItemIndex: number,
    quantity: number
  ): ShopTransaction {
    const shopItem = this.shop.items[shopItemIndex];
    if (!shopItem) {
      return {
        success: false,
        failureReason: 'ショップアイテムが見つかりません'
      };
    }
    
    const inventory = this.inventoryService.getInventory();
    return buyItemCore(character, inventory, shopItem, quantity, this.shop);
  }
  
  /**
   * アイテムを購入可能かチェック
   * 
   * @param character - キャラクター
   * @param shopItemIndex - ショップアイテムのインデックス
   * @param quantity - 購入数量
   * @returns 購入可能ならtrue、理由を含む結果オブジェクト
   */
  canBuyItem(
    character: Character,
    shopItemIndex: number,
    quantity: number
  ): { canBuy: boolean; reason?: string } {
    const shopItem = this.shop.items[shopItemIndex];
    if (!shopItem) {
      return { canBuy: false, reason: 'ショップアイテムが見つかりません' };
    }
    
    const inventory = this.inventoryService.getInventory();
    return canBuyItemCore(character, inventory, shopItem, quantity, this.shop);
  }
  
  /**
   * 購入価格を取得
   * 
   * @param shopItemIndex - ショップアイテムのインデックス
   * @param quantity - 購入数量
   * @returns 合計購入価格
   */
  getBuyPrice(shopItemIndex: number, quantity: number): number {
    const shopItem = this.shop.items[shopItemIndex];
    if (!shopItem) {
      return 0;
    }
    
    return calculateBuyPrice(shopItem, quantity, this.shop);
  }
  
  // ===== 売却操作 =====
  
  /**
   * アイテムを売却
   * 
   * @param character - キャラクター
   * @param itemId - アイテムID
   * @param quantity - 売却数量
   * @returns 取引結果
   */
  sellItem(
    character: Character,
    itemId: UniqueId,
    quantity: number
  ): ShopTransaction {
    const inventory = this.inventoryService.getInventory();
    
    // ショップアイテムを検索（売却価格情報取得のため）
    const shopItem = this.findShopItemByItemId(itemId);
    if (!shopItem) {
      return {
        success: false,
        failureReason: 'このアイテムは売却できません'
      };
    }
    
    return sellItemCore(inventory, shopItem, itemId, quantity, this.shop);
  }
  
  /**
   * アイテムを売却可能かチェック
   * 
   * @param itemId - アイテムID
   * @param quantity - 売却数量
   * @returns 売却可能ならtrue、理由を含む結果オブジェクト
   */
  canSellItem(
    itemId: UniqueId,
    quantity: number
  ): { canSell: boolean; reason?: string } {
    const inventory = this.inventoryService.getInventory();
    const shopItem = this.findShopItemByItemId(itemId);
    
    return canSellItemCore(inventory, itemId, quantity, shopItem);
  }
  
  /**
   * 売却価格を取得
   * 
   * @param itemId - アイテムID
   * @param quantity - 売却数量
   * @returns 合計売却価格
   */
  getSellPrice(itemId: UniqueId, quantity: number): number {
    const shopItem = this.findShopItemByItemId(itemId);
    if (!shopItem) {
      return 0;
    }
    
    return calculateSellPrice(shopItem, quantity, this.shop);
  }
  
  // ===== クエリ操作 =====
  
  /**
   * キャラクターが購入可能なアイテムを取得
   * 
   * @param character - キャラクター
   * @returns 購入可能なショップアイテム配列
   */
  getAvailableItems(character: Character): ShopItem[] {
    return getAvailableItemsCore(character, this.shop);
  }
  
  /**
   * ショップアイテムを取得
   * 
   * @param index - ショップアイテムのインデックス
   * @returns ショップアイテム
   */
  getShopItem(index: number): ShopItem | undefined {
    return this.shop.items[index];
  }
  
  /**
   * すべてのショップアイテムを取得
   * 
   * @returns すべてのショップアイテム
   */
  getAllShopItems(): ShopItem[] {
    return this.shop.items;
  }
  
  /**
   * アイテムIDからショップアイテムを検索
   * 
   * @param itemId - アイテムID
   * @returns ショップアイテム（見つからない場合はundefined）
   */
  findShopItemByItemId(itemId: UniqueId): ShopItem | undefined {
    return this.shop.items.find(shopItem => shopItem.item.id === itemId);
  }
  
  // ===== 管理操作 =====
  
  /**
   * ショップの在庫を補充
   * - 初期在庫に戻す
   */
  restockShop(): void {
    this.shop.items.forEach((item, index) => {
      const initialStock = this.initialStocks.get(index);
      if (initialStock !== undefined) {
        item.stock = initialStock;
      }
    });
  }
  
  /**
   * ショップを取得
   * 
   * @returns ショップ
   */
  getShop(): Shop {
    return this.shop;
  }
}
