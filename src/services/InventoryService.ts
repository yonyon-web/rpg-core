/**
 * InventoryService
 * 
 * インベントリの操作とビジネスロジックを管理するサービス
 * Core Engineの純粋な関数を利用してインベントリ管理を行う
 */

import type {
  Inventory,
  InventorySlot,
  InventorySearchCriteria,
  InventorySortBy,
  SortOrder,
  InventoryResult,
  InventoryStats,
  Item,
  UniqueId
} from '../types';

import {
  addItemToInventory,
  removeItemFromInventory,
  findItemSlot,
  searchItems,
  sortInventory,
  stackItems,
  getAvailableSlots,
  getInventoryStats
} from '../item/inventory';

/**
 * InventoryService
 * 
 * @example
 * ```typescript
 * const inventory: Inventory = {
 *   slots: [],
 *   maxSlots: 100,
 *   money: 1000,
 *   usedSlots: 0
 * };
 * 
 * const service = new InventoryService(inventory);
 * 
 * // アイテム追加
 * const result = service.addItem(potionItem, 5);
 * 
 * // アイテム検索
 * const consumables = service.getItemsByCategory('consumable');
 * 
 * // ソート
 * service.sort('name', 'asc');
 * ```
 */
export class InventoryService {
  private inventory: Inventory;
  
  /**
   * コンストラクタ
   * 
   * @param inventory - 管理対象のインベントリ
   */
  constructor(inventory: Inventory) {
    this.inventory = inventory;
  }
  
  // ===== 基本操作 =====
  
  /**
   * アイテムを追加
   * 
   * @param item - 追加するアイテム
   * @param quantity - 追加する数量
   * @returns 操作結果
   */
  addItem(item: Item, quantity: number): InventoryResult {
    return addItemToInventory(this.inventory, item, quantity);
  }
  
  /**
   * アイテムを削除
   * 
   * @param itemId - 削除するアイテムID
   * @param quantity - 削除する数量
   * @returns 操作結果
   */
  removeItem(itemId: UniqueId, quantity: number): InventoryResult {
    return removeItemFromInventory(this.inventory, itemId, quantity);
  }
  
  /**
   * アイテムを装備としてマーク
   * 
   * @param itemId - アイテムID
   * @param equipped - 装備中フラグ
   */
  markAsEquipped(itemId: UniqueId, equipped: boolean): void {
    const slot = findItemSlot(this.inventory, itemId);
    if (slot) {
      slot.isEquipped = equipped;
    }
  }
  
  // ===== 検索・フィルタ =====
  
  /**
   * アイテムを検索
   * 
   * @param itemId - アイテムID
   * @returns 見つかったスロット（見つからない場合はnull）
   */
  findItem(itemId: UniqueId): InventorySlot | null {
    return findItemSlot(this.inventory, itemId);
  }
  
  /**
   * 複数条件でアイテムを検索
   * 
   * @param criteria - 検索条件
   * @returns マッチしたスロットの配列
   */
  search(criteria: InventorySearchCriteria): InventorySlot[] {
    return searchItems(this.inventory, criteria);
  }
  
  /**
   * カテゴリでフィルタ
   * 
   * @param category - カテゴリ名
   * @returns 該当するスロットの配列
   */
  getItemsByCategory(category: string): InventorySlot[] {
    return searchItems(this.inventory, { category });
  }
  
  /**
   * 使用可能なアイテムを取得
   * 
   * @param context - 使用コンテキスト（'battle' または 'field'）
   * @returns 使用可能なスロットの配列
   */
  getUsableItems(context: 'battle' | 'field'): InventorySlot[] {
    return this.inventory.slots.filter(slot => 
      !slot.isEquipped && this.canUseItem(slot.item, context)
    );
  }
  
  /**
   * 装備中のアイテムを取得
   * 
   * @returns 装備中のスロットの配列
   */
  getEquippedItems(): InventorySlot[] {
    return searchItems(this.inventory, { isEquipped: true });
  }
  
  /**
   * 装備可能でないアイテムを取得
   * 
   * @returns 装備可能でないスロットの配列
   */
  getNonEquippedItems(): InventorySlot[] {
    return searchItems(this.inventory, { isEquipped: false });
  }
  
  // ===== ソート・整理 =====
  
  /**
   * ソート
   * 
   * @param sortBy - ソート基準
   * @param order - ソート順序（デフォルト: 'asc'）
   */
  sort(sortBy: InventorySortBy, order: SortOrder = 'asc'): void {
    this.inventory = sortInventory(this.inventory, sortBy, order);
  }
  
  /**
   * スタック整理（同じアイテムをまとめる）
   */
  stack(): void {
    this.inventory = stackItems(this.inventory);
  }
  
  // ===== 統計・情報 =====
  
  /**
   * インベントリ統計を取得
   * 
   * @returns 統計情報
   */
  getStats(): InventoryStats {
    return getInventoryStats(this.inventory);
  }
  
  /**
   * 空きスロット数を取得
   * 
   * @returns 空きスロット数
   */
  getAvailableSlots(): number {
    return getAvailableSlots(this.inventory);
  }
  
  /**
   * アイテムの所持数を取得
   * 
   * @param itemId - アイテムID
   * @returns 所持数（見つからない場合は0）
   */
  getItemCount(itemId: UniqueId): number {
    const slot = findItemSlot(this.inventory, itemId);
    return slot ? slot.quantity : 0;
  }
  
  /**
   * アイテムを所持しているか確認
   * 
   * @param itemId - アイテムID
   * @param minQuantity - 最小数量（デフォルト: 1）
   * @returns 所持しているか
   */
  hasItem(itemId: UniqueId, minQuantity: number = 1): boolean {
    return this.getItemCount(itemId) >= minQuantity;
  }
  
  /**
   * 所持金を取得
   * 
   * @returns 所持金
   */
  getMoney(): number {
    return this.inventory.money;
  }
  
  /**
   * 所持金を追加
   * 
   * @param amount - 追加する金額
   */
  addMoney(amount: number): void {
    this.inventory.money += amount;
  }
  
  /**
   * 所持金を減らす
   * 
   * @param amount - 減らす金額
   * @returns 成功したか（所持金不足の場合はfalse）
   */
  removeMoney(amount: number): boolean {
    if (this.inventory.money < amount) {
      return false;
    }
    this.inventory.money -= amount;
    return true;
  }
  
  /**
   * 所持金が十分にあるか確認
   * 
   * @param amount - 必要な金額
   * @returns 十分にあるか
   */
  hasMoney(amount: number): boolean {
    return this.inventory.money >= amount;
  }
  
  // ===== 判定ロジック =====
  
  /**
   * アイテムが使用可能か判定
   * 
   * @param item - アイテム
   * @param context - 使用コンテキスト
   * @returns 使用可能か
   */
  private canUseItem(item: Item, context?: 'battle' | 'field'): boolean {
    if (!context) return true;
    
    // コンテキスト別の使用可否
    if (context === 'battle') {
      return item.usableInBattle === true;
    } else {
      return item.usableOutOfBattle === true;
    }
  }
  
  /**
   * スロットが空かどうか確認
   * 
   * @returns 空きがあるか
   */
  hasAvailableSlot(): boolean {
    return this.getAvailableSlots() > 0;
  }
  
  /**
   * インベントリが満杯かどうか確認
   * 
   * @returns 満杯か
   */
  isFull(): boolean {
    return this.getAvailableSlots() === 0;
  }
  
  /**
   * インベントリが空かどうか確認
   * 
   * @returns 空か
   */
  isEmpty(): boolean {
    return this.inventory.usedSlots === 0;
  }
  
  // ===== ゲッター =====
  
  /**
   * 現在のインベントリを取得
   * 
   * @returns インベントリ
   */
  getInventory(): Inventory {
    return this.inventory;
  }
  
  /**
   * 全てのスロットを取得
   * 
   * @returns スロットの配列
   */
  getAllSlots(): InventorySlot[] {
    return this.inventory.slots;
  }
}
