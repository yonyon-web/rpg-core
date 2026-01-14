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
} from '../../types';
import type { EventBus } from '../../core/EventBus';
import type { DataChangeEvent } from '../../types/events';

import {
  addItemToInventory,
  removeItemFromInventory,
  findItemSlot,
  searchItems,
  sortInventory,
  stackItems,
  getAvailableSlots,
  getInventoryStats,
  getResource,
  addResource,
  removeResource,
  hasResource,
  setResource,
  getCategorySlotUsage,
  getCategoryAvailableSlots,
  canAddToCategory,
  getCategorySlotStats
} from '../../item/inventory';

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
  private eventBus?: EventBus;
  
  /**
   * コンストラクタ
   * 
   * @param inventory - 管理対象のインベントリ
   * @param eventBus - イベントバス（オプション）
   */
  constructor(inventory: Inventory, eventBus?: EventBus) {
    this.inventory = inventory;
    this.eventBus = eventBus;
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
    const result = addItemToInventory(this.inventory, item, quantity);
    
    // データ変更イベントを発行
    if (result.success && this.eventBus) {
      this.eventBus.emit<DataChangeEvent>('data-changed', {
        type: 'inventory-updated',
        timestamp: Date.now(),
        data: { itemId: item.id, quantity, action: 'add' }
      });
    }
    
    return result;
  }
  
  /**
   * アイテムを削除
   * 
   * @param itemId - 削除するアイテムID
   * @param quantity - 削除する数量
   * @returns 操作結果
   */
  removeItem(itemId: UniqueId, quantity: number): InventoryResult {
    const result = removeItemFromInventory(this.inventory, itemId, quantity);
    
    // データ変更イベントを発行
    if (result.success && this.eventBus) {
      this.eventBus.emit<DataChangeEvent>('data-changed', {
        type: 'inventory-updated',
        timestamp: Date.now(),
        data: { itemId, quantity, action: 'remove' }
      });
    }
    
    return result;
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
    return this.inventory.resources['money'] || 0;
  }
  
  /**
   * 所持金を追加
   * 
   * @param amount - 追加する金額
   */
  addMoney(amount: number): void {
    this.inventory.resources['money'] = (this.inventory.resources['money'] || 0) + amount;
  }
  
  /**
   * 所持金を減らす
   * 
   * @param amount - 減らす金額
   * @returns 成功したか（所持金不足の場合はfalse）
   */
  removeMoney(amount: number): boolean {
    const money = this.inventory.resources['money'] || 0;
    if (money < amount) {
      return false;
    }
    this.inventory.resources['money'] = money - amount;
    return true;
  }
  
  /**
   * 所持金が十分にあるか確認
   * 
   * @param amount - 必要な金額
   * @returns 十分にあるか
   */
  hasMoney(amount: number): boolean {
    return (this.inventory.resources['money'] || 0) >= amount;
  }
  
  // ===== リソース管理 =====
  
  /**
   * リソース量を取得
   * 
   * @param resourceId - リソースID（例: 'sp', 'craft-points', 'tokens'）
   * @returns リソース量（存在しない場合は0）
   * 
   * @example
   * ```typescript
   * // スキルポイント取得
   * const sp = service.getResource('sp');
   * 
   * // クラフトポイント取得
   * const craftPoints = service.getResource('craft-points');
   * ```
   */
  getResource(resourceId: string): number {
    return getResource(this.inventory, resourceId);
  }
  
  /**
   * リソースを追加
   * 
   * @param resourceId - リソースID
   * @param amount - 追加する量
   * 
   * @example
   * ```typescript
   * // スキルポイントを5追加
   * service.addResource('sp', 5);
   * 
   * // クラフトポイントを10追加
   * service.addResource('craft-points', 10);
   * ```
   */
  addResource(resourceId: string, amount: number): void {
    addResource(this.inventory, resourceId, amount);
  }
  
  /**
   * リソースを減らす
   * 
   * @param resourceId - リソースID
   * @param amount - 減らす量
   * @returns 成功したか（リソース不足の場合はfalse）
   * 
   * @example
   * ```typescript
   * // スキル習得にSP消費
   * if (service.removeResource('sp', 10)) {
   *   console.log('スキルを習得しました');
   * } else {
   *   console.log('SPが不足しています');
   * }
   * ```
   */
  removeResource(resourceId: string, amount: number): boolean {
    return removeResource(this.inventory, resourceId, amount);
  }
  
  /**
   * リソースが十分にあるか確認
   * 
   * @param resourceId - リソースID
   * @param amount - 必要な量
   * @returns 十分にあるか
   * 
   * @example
   * ```typescript
   * // クラフト実行前のチェック
   * if (service.hasResource('craft-points', 50)) {
   *   // クラフト実行
   * }
   * ```
   */
  hasResource(resourceId: string, amount: number): boolean {
    return hasResource(this.inventory, resourceId, amount);
  }
  
  /**
   * リソースを設定
   * 
   * @param resourceId - リソースID
   * @param amount - 設定する量
   * 
   * @example
   * ```typescript
   * // 初期SPを設定
   * service.setResource('sp', 100);
   * ```
   */
  setResource(resourceId: string, amount: number): void {
    setResource(this.inventory, resourceId, amount);
  }
  
  /**
   * 全リソースを取得
   * 
   * @returns リソースのレコード（存在しない場合は空オブジェクト）
   * 
   * @example
   * ```typescript
   * const resources = service.getAllResources();
   * // { sp: 50, 'craft-points': 100, tokens: 25 }
   * ```
   */
  getAllResources(): Record<string, number> {
    return this.inventory.resources || {};
  }
  
  // ===== カテゴリ別スロット管理 =====
  
  /**
   * カテゴリのスロット使用状況を取得
   * 
   * @param category - カテゴリ名
   * @returns 使用中のスロット数
   * 
   * @example
   * ```typescript
   * const used = service.getCategorySlotUsage('consumable');
   * console.log(`消耗品: ${used}スロット使用中`);
   * ```
   */
  getCategorySlotUsage(category: string): number {
    return getCategorySlotUsage(this.inventory, category);
  }
  
  /**
   * カテゴリの空きスロット数を取得
   * 
   * @param category - カテゴリ名
   * @returns 空きスロット数（制限なしの場合は-1）
   * 
   * @example
   * ```typescript
   * const available = service.getCategoryAvailableSlots('weapon');
   * if (available === -1) {
   *   console.log('制限なし');
   * } else {
   *   console.log(`空き: ${available}スロット`);
   * }
   * ```
   */
  getCategoryAvailableSlots(category: string): number {
    return getCategoryAvailableSlots(this.inventory, category);
  }
  
  /**
   * カテゴリにアイテムを追加できるかチェック
   * 
   * @param category - カテゴリ名
   * @param slotsNeeded - 必要なスロット数（デフォルト: 1）
   * @returns 追加可能な場合true
   * 
   * @example
   * ```typescript
   * if (service.canAddToCategory('armor', 1)) {
   *   // 防具を追加可能
   * }
   * ```
   */
  canAddToCategory(category: string, slotsNeeded: number = 1): boolean {
    return canAddToCategory(this.inventory, category, slotsNeeded);
  }
  
  /**
   * カテゴリ別スロット統計を取得
   * 
   * @returns カテゴリ別の使用状況
   * 
   * @example
   * ```typescript
   * const stats = service.getCategorySlotStats();
   * // {
   * //   equipment: { used: 20, max: 30, available: 10 },
   * //   consumable: { used: 15, max: 50, available: 35 }
   * // }
   * ```
   */
  getCategorySlotStats(): Record<string, { used: number; max: number; available: number }> {
    return getCategorySlotStats(this.inventory);
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
