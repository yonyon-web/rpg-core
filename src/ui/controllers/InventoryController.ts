/**
 * InventoryController
 * インベントリ管理のヘッドレスUIコントローラー
 */

import { ObservableState } from '../core/ObservableState';
import { EventEmitter } from '../core/EventEmitter';
import type { InventoryService } from '../../services/item/InventoryService';
import type { 
  InventoryUIState, 
  InventoryEvents, 
  InventoryControllerOptions 
} from '../types/inventory';
import type { Item, InventorySlot, InventorySortBy } from '../../types';
import type { UISortOrder } from '../types/common';

/**
 * InventoryController
 * インベントリの表示と操作を管理
 * 
 * @example
 * ```typescript
 * const controller = new InventoryController(inventoryService);
 * 
 * // 状態を購読
 * controller.subscribe((state) => {
 *   console.log('Slots:', state.displayedSlots);
 *   console.log('Money:', state.money);
 * });
 * 
 * // フィルタを設定
 * controller.setFilter({ category: 'consumable' });
 * controller.setSortBy('name', 'asc');
 * 
 * // アイテムを選択
 * controller.selectSlot(slot);
 * ```
 */
export class InventoryController {
  private state: ObservableState<InventoryUIState>;
  private events: EventEmitter<InventoryEvents>;
  private service: InventoryService;
  private options: Required<InventoryControllerOptions>;

  constructor(
    service: InventoryService,
    options?: InventoryControllerOptions
  ) {
    this.service = service;
    this.options = {
      itemsPerPage: options?.itemsPerPage ?? 20,
      defaultSortBy: options?.defaultSortBy ?? 'name',
      defaultSortOrder: options?.defaultSortOrder ?? 'asc'
    };

    const inventory = service.getInventory();
    
    this.state = new ObservableState<InventoryUIState>({
      slots: inventory.slots,
      displayedSlots: inventory.slots.slice(0, this.options.itemsPerPage),
      filter: {},
      sortBy: this.options.defaultSortBy,
      sortOrder: this.options.defaultSortOrder,
      pagination: {
        currentPage: 1,
        totalPages: Math.ceil(inventory.slots.length / this.options.itemsPerPage),
        itemsPerPage: this.options.itemsPerPage,
        totalItems: inventory.slots.length
      },
      selectedSlot: null,
      cursorIndex: 0,
      usedSlots: inventory.usedSlots,
      maxSlots: inventory.maxSlots,
      resources: inventory.resources || {}
    });

    this.events = new EventEmitter<InventoryEvents>();
  }

  /**
   * 状態を購読
   */
  subscribe(listener: (state: InventoryUIState) => void): () => void {
    return this.state.subscribe(listener);
  }

  /**
   * イベントを購読
   */
  on<K extends keyof InventoryEvents>(
    event: K,
    listener: (data: InventoryEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }

  /**
   * 現在の状態を取得
   */
  getState(): InventoryUIState {
    return this.state.getState();
  }

  /**
   * インベントリを更新
   */
  refresh(): void {
    const inventory = this.service.getInventory();
    const currentState = this.state.getState();
    
    // フィルタとソートを適用
    let slots = inventory.slots;
    
    // フィルタを適用
    if (currentState.filter.category) {
      slots = slots.filter(slot => slot.item.category === currentState.filter.category);
    }
    if (currentState.filter.searchText) {
      const searchLower = currentState.filter.searchText.toLowerCase();
      slots = slots.filter(slot => 
        slot.item.name.toLowerCase().includes(searchLower) ||
        slot.item.description?.toLowerCase().includes(searchLower)
      );
    }
    if (currentState.filter.stackableOnly) {
      slots = slots.filter(slot => slot.item.stackable);
    }
    
    // ソートを適用
    slots = this.applySorting(slots, currentState.sortBy, currentState.sortOrder);
    
    // ページネーションを計算
    const totalPages = Math.ceil(slots.length / this.options.itemsPerPage);
    const currentPage = Math.min(currentState.pagination.currentPage, totalPages || 1);
    const startIndex = (currentPage - 1) * this.options.itemsPerPage;
    const displayedSlots = slots.slice(startIndex, startIndex + this.options.itemsPerPage);
    
    this.state.setState({
      slots: inventory.slots,
      displayedSlots,
      pagination: {
        currentPage,
        totalPages,
        itemsPerPage: this.options.itemsPerPage,
        totalItems: slots.length
      },
      usedSlots: inventory.usedSlots,
      maxSlots: inventory.maxSlots,
      resources: inventory.resources || {}
    });
  }

  /**
   * フィルタを設定
   */
  setFilter(filter: InventoryUIState['filter']): void {
    this.state.setState({ filter });
    this.refresh();
    this.events.emit('filter-changed', { filter });
  }

  /**
   * ソート条件を設定
   */
  setSortBy(sortBy: InventorySortBy, sortOrder: UISortOrder = 'asc'): void {
    this.state.setState({ sortBy, sortOrder });
    this.refresh();
    this.events.emit('sort-changed', { sortBy, sortOrder });
  }

  /**
   * ページを変更
   */
  setPage(page: number): void {
    const currentState = this.state.getState();
    if (page < 1 || page > currentState.pagination.totalPages) {
      return;
    }
    
    this.state.setState(prev => ({
      pagination: { ...prev.pagination, currentPage: page }
    }));
    this.refresh();
  }

  /**
   * スロットを選択
   */
  selectSlot(slot: InventorySlot | null): void {
    this.state.setState({ selectedSlot: slot });
    if (slot) {
      this.events.emit('item-selected', { slot });
    }
  }

  /**
   * カーソルを移動
   */
  moveCursor(direction: 'up' | 'down'): void {
    const currentState = this.state.getState();
    const maxIndex = currentState.displayedSlots.length - 1;
    
    let newIndex = currentState.cursorIndex;
    if (direction === 'up') {
      newIndex = Math.max(0, newIndex - 1);
    } else {
      newIndex = Math.min(maxIndex, newIndex + 1);
    }
    
    this.state.setState({ cursorIndex: newIndex });
    
    // カーソルに合わせてアイテムを選択
    if (currentState.displayedSlots[newIndex]) {
      this.selectSlot(currentState.displayedSlots[newIndex]);
    }
  }

  /**
   * アイテムをインベントリから削除します
   * 注意: アイテムの効果適用が必要な場合はItemControllerを使用してください
   * 
   * @param item - 削除するアイテム
   * @param quantity - 削除する数量（デフォルト: 1）
   * @returns 削除に成功したか
   */
  removeItem(item: Item, quantity: number = 1): boolean {
    const result = this.service.removeItem(item.id, quantity);
    
    if (result.success) {
      this.events.emit('item-removed', { item, quantity, success: true });
      this.refresh();
      return true;
    }
    
    this.events.emit('item-removed', { item, quantity, success: false });
    return false;
  }

  /**
   * アイテムを破棄
   */
  discardItem(item: Item, quantity: number): boolean {
    const result = this.service.removeItem(item.id, quantity);
    if (result.success) {
      this.events.emit('item-discarded', { item, quantity });
      this.refresh();
    }
    return result.success;
  }

  /**
   * ソートを適用
   */
  private applySorting(
    slots: InventorySlot[], 
    sortBy: InventorySortBy, 
    sortOrder: UISortOrder
  ): InventorySlot[] {
    const sorted = [...slots].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.item.name.localeCompare(b.item.name);
          break;
        case 'category':
          comparison = a.item.category.localeCompare(b.item.category);
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'rarity':
          const rarityOrder: Record<string, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
          const rarityA = a.item.rarity ? rarityOrder[a.item.rarity] ?? 0 : 0;
          const rarityB = b.item.rarity ? rarityOrder[b.item.rarity] ?? 0 : 0;
          comparison = rarityA - rarityB;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }

  /**
   * クリーンアップ
   */
  destroy(): void {
    this.events.clear();
  }
}
