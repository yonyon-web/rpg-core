# インベントリ（バッグ）システム設計

アイテムや装備を管理するインベントリ（バッグ）システムの包括的な設計。Core Engine、Service、Headless UIの3層で構成。

## 目次

1. [概要](#概要)
2. [Core Engine層](#core-engine層)
3. [Service層](#service層)
4. [Headless UI層](#headless-ui層)
5. [統合例](#統合例)

---

## 概要

### システムの役割

インベントリシステムは以下の機能を提供します：

- **アイテム管理**: アイテムの追加、削除、検索、ソート
- **装備管理**: 装備アイテムの管理と装備中との区別
- **カテゴリ分類**: アイテムをカテゴリ別に整理
- **容量管理**: スロット数や重量による制限
- **フィルタリング**: 使用可能、装備可能などの条件でフィルタ
- **スタック管理**: 同じアイテムの数量管理

### 3層アーキテクチャ

```
┌─────────────────────────────────────┐
│  Headless UI Layer                  │
│  InventoryController                │  ← UI状態管理、ユーザー操作
│  - 表示状態の管理                    │
│  - フィルタ/ソートの状態             │
│  - 選択状態の管理                    │
└─────────────────────────────────────┘
              ↓ 委譲
┌─────────────────────────────────────┐
│  Service Layer                      │
│  InventoryService                   │  ← ビジネスロジック
│  - アイテム操作の調整                │
│  - 使用可否の判定                    │
│  - 装備可否の判定                    │
└─────────────────────────────────────┘
              ↓ 委譲
┌─────────────────────────────────────┐
│  Core Engine Layer                  │
│  inventory/ モジュール              │  ← 純粋な状態操作
│  - インベントリの直接操作            │
│  - アイテムの追加/削除               │
│  - スタック処理                      │
└─────────────────────────────────────┘
```

---

## Core Engine層

### データ型定義

```typescript
/**
 * インベントリスロット（既存の定義を拡張）
 */
interface InventorySlot {
  item: Item;                       // アイテム
  quantity: number;                 // 数量
  isEquipped?: boolean;             // 装備中フラグ（装備アイテムの場合）
  slotIndex: number;                // スロットインデックス
  acquiredAt?: number;              // 取得日時（タイムスタンプ）
}

/**
 * インベントリ（既存の定義を拡張）
 */
interface Inventory {
  slots: InventorySlot[];           // スロットリスト
  maxSlots: number;                 // 最大スロット数
  money: number;                    // 所持金
  usedSlots: number;                // 使用中のスロット数
}

/**
 * インベントリ検索条件
 */
interface InventorySearchCriteria {
  itemId?: UniqueId;                // アイテムID
  category?: ItemCategory;          // カテゴリ
  name?: string;                    // 名前（部分一致）
  minQuantity?: number;             // 最小数量
  maxQuantity?: number;             // 最大数量
  isEquipped?: boolean;             // 装備中フラグ
}

/**
 * インベントリソート基準
 */
type InventorySortBy = 
  | 'name'                          // 名前順
  | 'category'                      // カテゴリ順
  | 'quantity'                      // 数量順
  | 'rarity'                        // レアリティ順
  | 'value'                         // 価値順
  | 'acquired'                      // 取得日時順
  | 'type';                         // タイプ順

/**
 * ソート順序
 */
type SortOrder = 'asc' | 'desc';

/**
 * インベントリ操作オプション
 */
interface InventoryOperationOptions {
  allowOverflow?: boolean;          // 容量超過を許可
  skipEquipped?: boolean;           // 装備中アイテムをスキップ
  preferStackable?: boolean;        // スタック可能アイテムを優先
}
```

### Core Engine 関数

```typescript
/**
 * inventory/management.ts - インベントリ管理の基本操作
 */

/**
 * アイテムをインベントリに追加
 */
function addItemToInventory(
  inventory: Inventory,
  item: Item,
  quantity: number,
  options?: InventoryOperationOptions
): InventoryResult {
  // スタック可能なアイテムは既存スロットに追加
  if (item.stackable) {
    const existingSlot = findItemSlot(inventory, item.id);
    if (existingSlot && existingSlot.quantity + quantity <= item.maxStack) {
      existingSlot.quantity += quantity;
      return {
        success: true,
        slotsUsed: 0,
        itemsAdded: quantity
      };
    }
  }
  
  // 新しいスロットに追加
  if (inventory.usedSlots >= inventory.maxSlots && !options?.allowOverflow) {
    return {
      success: false,
      slotsUsed: 0,
      failureReason: 'インベントリが満杯です'
    };
  }
  
  const newSlot: InventorySlot = {
    item,
    quantity,
    slotIndex: inventory.slots.length,
    acquiredAt: Date.now()
  };
  
  inventory.slots.push(newSlot);
  inventory.usedSlots++;
  
  return {
    success: true,
    slotsUsed: 1,
    itemsAdded: quantity
  };
}

/**
 * アイテムをインベントリから削除
 */
function removeItemFromInventory(
  inventory: Inventory,
  itemId: UniqueId,
  quantity: number,
  options?: InventoryOperationOptions
): InventoryResult {
  const slot = findItemSlot(inventory, itemId);
  
  if (!slot) {
    return {
      success: false,
      slotsUsed: 0,
      failureReason: 'アイテムが見つかりません'
    };
  }
  
  if (slot.isEquipped && !options?.skipEquipped) {
    return {
      success: false,
      slotsUsed: 0,
      failureReason: '装備中のアイテムは削除できません'
    };
  }
  
  if (slot.quantity < quantity) {
    return {
      success: false,
      slotsUsed: 0,
      failureReason: '数量が不足しています'
    };
  }
  
  slot.quantity -= quantity;
  
  // 数量が0になったらスロットを削除
  if (slot.quantity === 0) {
    const index = inventory.slots.indexOf(slot);
    inventory.slots.splice(index, 1);
    inventory.usedSlots--;
  }
  
  return {
    success: true,
    slotsUsed: slot.quantity === 0 ? -1 : 0,
    itemsRemoved: quantity
  };
}

/**
 * アイテムを検索
 */
function findItemSlot(
  inventory: Inventory,
  itemId: UniqueId
): InventorySlot | null {
  return inventory.slots.find(slot => slot.item.id === itemId) || null;
}

/**
 * 複数条件でアイテムを検索
 */
function searchItems(
  inventory: Inventory,
  criteria: InventorySearchCriteria
): InventorySlot[] {
  return inventory.slots.filter(slot => {
    if (criteria.itemId && slot.item.id !== criteria.itemId) return false;
    if (criteria.category && slot.item.category !== criteria.category) return false;
    if (criteria.name && !slot.item.name.includes(criteria.name)) return false;
    if (criteria.minQuantity && slot.quantity < criteria.minQuantity) return false;
    if (criteria.maxQuantity && slot.quantity > criteria.maxQuantity) return false;
    if (criteria.isEquipped !== undefined && slot.isEquipped !== criteria.isEquipped) return false;
    return true;
  });
}

/**
 * インベントリをソート
 */
function sortInventory(
  inventory: Inventory,
  sortBy: InventorySortBy,
  order: SortOrder = 'asc'
): Inventory {
  const sorted = [...inventory.slots].sort((a, b) => {
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
        comparison = (a.item.rarity || 0) - (b.item.rarity || 0);
        break;
      case 'value':
        comparison = (a.item.value || 0) - (b.item.value || 0);
        break;
      case 'acquired':
        comparison = (a.acquiredAt || 0) - (b.acquiredAt || 0);
        break;
      case 'type':
        comparison = a.item.type.localeCompare(b.item.type);
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
  
  return {
    ...inventory,
    slots: sorted
  };
}

/**
 * インベントリの空きスロット数を取得
 */
function getAvailableSlots(inventory: Inventory): number {
  return inventory.maxSlots - inventory.usedSlots;
}

/**
 * アイテムをスタック
 */
function stackItems(inventory: Inventory): Inventory {
  const stacked: InventorySlot[] = [];
  const processedIds = new Set<UniqueId>();
  
  for (const slot of inventory.slots) {
    if (processedIds.has(slot.item.id)) continue;
    
    if (slot.item.stackable) {
      // 同じアイテムを全て集約
      const sameItems = inventory.slots.filter(s => s.item.id === slot.item.id);
      const totalQuantity = sameItems.reduce((sum, s) => sum + s.quantity, 0);
      
      // maxStackを考慮して分割
      const maxStack = slot.item.maxStack || 99;
      let remaining = totalQuantity;
      
      while (remaining > 0) {
        const quantity = Math.min(remaining, maxStack);
        stacked.push({
          ...slot,
          quantity,
          slotIndex: stacked.length
        });
        remaining -= quantity;
      }
      
      processedIds.add(slot.item.id);
    } else {
      stacked.push({
        ...slot,
        slotIndex: stacked.length
      });
    }
  }
  
  return {
    ...inventory,
    slots: stacked,
    usedSlots: stacked.length
  };
}

/**
 * インベントリの統計情報を取得
 */
function getInventoryStats(inventory: Inventory): InventoryStats {
  const itemsByCategory: Record<string, number> = {};
  let totalValue = 0;
  let equippedCount = 0;
  
  for (const slot of inventory.slots) {
    // カテゴリ別集計
    const category = slot.item.category;
    itemsByCategory[category] = (itemsByCategory[category] || 0) + slot.quantity;
    
    // 合計価値
    totalValue += (slot.item.value || 0) * slot.quantity;
    
    // 装備中カウント
    if (slot.isEquipped) equippedCount++;
  }
  
  return {
    totalSlots: inventory.maxSlots,
    usedSlots: inventory.usedSlots,
    availableSlots: getAvailableSlots(inventory),
    totalItems: inventory.slots.reduce((sum, slot) => sum + slot.quantity, 0),
    uniqueItems: inventory.slots.length,
    itemsByCategory,
    totalValue,
    equippedCount,
    money: inventory.money
  };
}

interface InventoryStats {
  totalSlots: number;
  usedSlots: number;
  availableSlots: number;
  totalItems: number;
  uniqueItems: number;
  itemsByCategory: Record<string, number>;
  totalValue: number;
  equippedCount: number;
  money: number;
}
```

---

## Service層

### InventoryService

```typescript
/**
 * InventoryService
 * インベントリの操作とビジネスロジックを管理
 */
class InventoryService {
  private coreEngine: CoreEngine;
  private inventory: Inventory;
  
  constructor(coreEngine: CoreEngine, inventory: Inventory) {
    this.coreEngine = coreEngine;
    this.inventory = inventory;
  }
  
  // ===== 基本操作 =====
  
  /**
   * アイテムを追加
   */
  addItem(item: Item, quantity: number): InventoryResult {
    return this.coreEngine.addItemToInventory(this.inventory, item, quantity);
  }
  
  /**
   * アイテムを削除
   */
  removeItem(itemId: UniqueId, quantity: number): InventoryResult {
    return this.coreEngine.removeItemFromInventory(this.inventory, itemId, quantity);
  }
  
  /**
   * アイテムを使用（削除 + 効果適用）
   */
  async useItem(itemId: UniqueId, target?: Character): Promise<ItemUseResult> {
    const slot = this.coreEngine.findItemSlot(this.inventory, itemId);
    if (!slot) {
      throw new Error('アイテムが見つかりません');
    }
    
    // 使用可否チェック
    if (!this.canUseItem(slot.item)) {
      throw new Error('このアイテムは使用できません');
    }
    
    // 削除
    const removeResult = this.removeItem(itemId, 1);
    if (!removeResult.success) {
      throw new Error(removeResult.failureReason);
    }
    
    // 効果適用（ItemServiceに委譲）
    // ここでは簡略化
    return {
      success: true,
      item: slot.item,
      targets: target ? [target] : [],
      effects: []
    };
  }
  
  /**
   * アイテムを装備としてマーク
   */
  markAsEquipped(itemId: UniqueId, equipped: boolean): void {
    const slot = this.coreEngine.findItemSlot(this.inventory, itemId);
    if (slot) {
      slot.isEquipped = equipped;
    }
  }
  
  // ===== 検索・フィルタ =====
  
  /**
   * カテゴリでフィルタ
   */
  getItemsByCategory(category: ItemCategory): InventorySlot[] {
    return this.coreEngine.searchItems(this.inventory, { category });
  }
  
  /**
   * 使用可能なアイテムを取得
   */
  getUsableItems(context: 'battle' | 'field'): InventorySlot[] {
    return this.inventory.slots.filter(slot => 
      !slot.isEquipped && this.canUseItem(slot.item, context)
    );
  }
  
  /**
   * 装備可能なアイテムを取得
   */
  getEquippableItems(character: Character, slot: EquipmentType): InventorySlot[] {
    return this.inventory.slots.filter(inventorySlot => {
      if (inventorySlot.isEquipped) return false;
      const item = inventorySlot.item;
      if (item.type !== 'equipment') return false;
      
      const equipment = item as Equipment;
      return equipment.equipmentType === slot &&
             this.canEquip(character, equipment);
    });
  }
  
  /**
   * 装備中のアイテムを取得
   */
  getEquippedItems(): InventorySlot[] {
    return this.coreEngine.searchItems(this.inventory, { isEquipped: true });
  }
  
  // ===== ソート・整理 =====
  
  /**
   * ソート
   */
  sort(sortBy: InventorySortBy, order: SortOrder = 'asc'): void {
    this.inventory = this.coreEngine.sortInventory(this.inventory, sortBy, order);
  }
  
  /**
   * スタック整理
   */
  stackItems(): void {
    this.inventory = this.coreEngine.stackItems(this.inventory);
  }
  
  // ===== 統計・情報 =====
  
  /**
   * インベントリ統計を取得
   */
  getStats(): InventoryStats {
    return this.coreEngine.getInventoryStats(this.inventory);
  }
  
  /**
   * 空きスロット数を取得
   */
  getAvailableSlots(): number {
    return this.coreEngine.getAvailableSlots(this.inventory);
  }
  
  /**
   * アイテムの所持数を取得
   */
  getItemCount(itemId: UniqueId): number {
    const slot = this.coreEngine.findItemSlot(this.inventory, itemId);
    return slot ? slot.quantity : 0;
  }
  
  // ===== 判定ロジック =====
  
  /**
   * アイテムが使用可能か判定
   */
  private canUseItem(item: Item, context?: 'battle' | 'field'): boolean {
    if (item.type !== 'consumable' && item.type !== 'key') return false;
    if (!context) return true;
    
    // コンテキスト別の使用可否
    return this.coreEngine.checkItemUsable(item, context);
  }
  
  /**
   * 装備が装備可能か判定
   */
  private canEquip(character: Character, equipment: Equipment): boolean {
    // 職業制限チェック
    if (equipment.requiredJob && !equipment.requiredJob.includes(character.job)) {
      return false;
    }
    
    // レベル制限チェック
    if (equipment.requiredLevel && character.level < equipment.requiredLevel) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 現在のインベントリを取得
   */
  getInventory(): Inventory {
    return this.inventory;
  }
}
```

---

## Headless UI層

### InventoryController

```typescript
/**
 * インベントリUI状態
 */
interface InventoryUIState {
  // 表示モード
  mode: 'view' | 'use' | 'equip' | 'discard' | 'sort';
  
  // フィルタ
  currentCategory: ItemCategory | 'all';
  searchQuery: string;
  showEquippedOnly: boolean;
  showUsableOnly: boolean;
  
  // ソート
  sortBy: InventorySortBy;
  sortOrder: SortOrder;
  
  // 選択
  selectedSlot: InventorySlot | null;
  selectedSlots: InventorySlot[];  // 複数選択用
  
  // ページネーション
  currentPage: number;
  itemsPerPage: number;
  
  // 表示用データ
  displayedSlots: InventorySlot[];
  totalItems: number;
  stats: InventoryStats;
  
  // カーソル
  cursorIndex: number;
  
  // 処理中フラグ
  isProcessing: boolean;
}

/**
 * インベントリイベント
 */
type InventoryEvents = {
  'item-selected': { slot: InventorySlot };
  'item-used': { result: ItemUseResult };
  'item-discarded': { slot: InventorySlot };
  'item-equipped': { slot: InventorySlot };
  'filter-changed': { category: ItemCategory | 'all' };
  'sort-changed': { sortBy: InventorySortBy; order: SortOrder };
  'inventory-updated': { stats: InventoryStats };
};

/**
 * InventoryController
 * インベントリUIの状態管理
 */
class InventoryController {
  private state: ObservableState<InventoryUIState>;
  private events: EventEmitter<InventoryEvents>;
  private service: InventoryService;
  
  constructor(service: InventoryService) {
    this.service = service;
    this.state = new ObservableState<InventoryUIState>({
      mode: 'view',
      currentCategory: 'all',
      searchQuery: '',
      showEquippedOnly: false,
      showUsableOnly: false,
      sortBy: 'category',
      sortOrder: 'asc',
      selectedSlot: null,
      selectedSlots: [],
      currentPage: 1,
      itemsPerPage: 20,
      displayedSlots: [],
      totalItems: 0,
      stats: this.service.getStats(),
      cursorIndex: 0,
      isProcessing: false
    });
    this.events = new EventEmitter<InventoryEvents>();
    
    this.updateDisplay();
  }
  
  subscribe(listener: (state: InventoryUIState) => void): () => void {
    return this.state.subscribe(listener);
  }
  
  on<K extends keyof InventoryEvents>(
    event: K,
    listener: (data: InventoryEvents[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }
  
  // ===== モード切替 =====
  
  setMode(mode: InventoryUIState['mode']): void {
    this.state.setState(prev => ({
      ...prev,
      mode,
      selectedSlot: null,
      selectedSlots: []
    }));
    this.updateDisplay();
  }
  
  // ===== フィルタリング =====
  
  setCategory(category: ItemCategory | 'all'): void {
    this.state.setState(prev => ({
      ...prev,
      currentCategory: category,
      currentPage: 1,
      cursorIndex: 0
    }));
    this.updateDisplay();
    this.events.emit('filter-changed', { category });
  }
  
  setSearchQuery(query: string): void {
    this.state.setState(prev => ({
      ...prev,
      searchQuery: query,
      currentPage: 1,
      cursorIndex: 0
    }));
    this.updateDisplay();
  }
  
  toggleEquippedOnly(): void {
    this.state.setState(prev => ({
      ...prev,
      showEquippedOnly: !prev.showEquippedOnly,
      currentPage: 1,
      cursorIndex: 0
    }));
    this.updateDisplay();
  }
  
  toggleUsableOnly(): void {
    this.state.setState(prev => ({
      ...prev,
      showUsableOnly: !prev.showUsableOnly,
      currentPage: 1,
      cursorIndex: 0
    }));
    this.updateDisplay();
  }
  
  // ===== ソート =====
  
  setSorting(sortBy: InventorySortBy, order?: SortOrder): void {
    const currentState = this.state.getState();
    const newOrder = order || (currentState.sortBy === sortBy ? 
      (currentState.sortOrder === 'asc' ? 'desc' : 'asc') : 'asc');
    
    this.service.sort(sortBy, newOrder);
    
    this.state.setState(prev => ({
      ...prev,
      sortBy,
      sortOrder: newOrder,
      currentPage: 1,
      cursorIndex: 0
    }));
    
    this.updateDisplay();
    this.events.emit('sort-changed', { sortBy, order: newOrder });
  }
  
  // ===== 選択 =====
  
  selectSlot(slot: InventorySlot): void {
    this.state.setState(prev => ({
      ...prev,
      selectedSlot: slot
    }));
    this.events.emit('item-selected', { slot });
  }
  
  selectSlotAt(index: number): void {
    const currentState = this.state.getState();
    const slot = currentState.displayedSlots[index];
    if (slot) {
      this.selectSlot(slot);
    }
  }
  
  toggleSlotSelection(slot: InventorySlot): void {
    this.state.setState(prev => {
      const isSelected = prev.selectedSlots.some(s => s.slotIndex === slot.slotIndex);
      return {
        ...prev,
        selectedSlots: isSelected
          ? prev.selectedSlots.filter(s => s.slotIndex !== slot.slotIndex)
          : [...prev.selectedSlots, slot]
      };
    });
  }
  
  clearSelection(): void {
    this.state.setState(prev => ({
      ...prev,
      selectedSlot: null,
      selectedSlots: []
    }));
  }
  
  // ===== アクション =====
  
  async useItem(slot?: InventorySlot): Promise<void> {
    const targetSlot = slot || this.state.getState().selectedSlot;
    if (!targetSlot) return;
    
    this.state.setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const result = await this.service.useItem(targetSlot.item.id);
      this.events.emit('item-used', { result });
      this.updateDisplay();
    } catch (error) {
      console.error('アイテム使用エラー:', error);
    } finally {
      this.state.setState(prev => ({ ...prev, isProcessing: false }));
    }
  }
  
  async discardItem(slot?: InventorySlot, quantity: number = 1): Promise<void> {
    const targetSlot = slot || this.state.getState().selectedSlot;
    if (!targetSlot) return;
    
    this.state.setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      await this.service.removeItem(targetSlot.item.id, quantity);
      this.events.emit('item-discarded', { slot: targetSlot });
      this.clearSelection();
      this.updateDisplay();
    } catch (error) {
      console.error('アイテム破棄エラー:', error);
    } finally {
      this.state.setState(prev => ({ ...prev, isProcessing: false }));
    }
  }
  
  stackItems(): void {
    this.service.stackItems();
    this.updateDisplay();
  }
  
  // ===== ページネーション =====
  
  nextPage(): void {
    const currentState = this.state.getState();
    const maxPage = Math.ceil(currentState.totalItems / currentState.itemsPerPage);
    if (currentState.currentPage < maxPage) {
      this.state.setState(prev => ({
        ...prev,
        currentPage: prev.currentPage + 1,
        cursorIndex: 0
      }));
      this.updateDisplay();
    }
  }
  
  prevPage(): void {
    const currentState = this.state.getState();
    if (currentState.currentPage > 1) {
      this.state.setState(prev => ({
        ...prev,
        currentPage: prev.currentPage - 1,
        cursorIndex: 0
      }));
      this.updateDisplay();
    }
  }
  
  setPage(page: number): void {
    this.state.setState(prev => ({
      ...prev,
      currentPage: page,
      cursorIndex: 0
    }));
    this.updateDisplay();
  }
  
  // ===== カーソル移動 =====
  
  moveCursor(delta: number): void {
    const currentState = this.state.getState();
    const maxIndex = currentState.displayedSlots.length - 1;
    const newIndex = Math.max(0, Math.min(maxIndex, currentState.cursorIndex + delta));
    
    this.state.setState(prev => ({
      ...prev,
      cursorIndex: newIndex
    }));
    
    // カーソル位置のアイテムを自動選択
    this.selectSlotAt(newIndex);
  }
  
  // ===== 内部ヘルパー =====
  
  private updateDisplay(): void {
    const currentState = this.state.getState();
    const inventory = this.service.getInventory();
    
    // フィルタリング
    let filtered = inventory.slots;
    
    if (currentState.currentCategory !== 'all') {
      filtered = filtered.filter(slot => slot.item.category === currentState.currentCategory);
    }
    
    if (currentState.showEquippedOnly) {
      filtered = filtered.filter(slot => slot.isEquipped);
    }
    
    if (currentState.showUsableOnly) {
      const usableSlots = this.service.getUsableItems('field');
      const usableIds = new Set(usableSlots.map(s => s.item.id));
      filtered = filtered.filter(slot => usableIds.has(slot.item.id));
    }
    
    if (currentState.searchQuery) {
      const query = currentState.searchQuery.toLowerCase();
      filtered = filtered.filter(slot => 
        slot.item.name.toLowerCase().includes(query) ||
        slot.item.description?.toLowerCase().includes(query)
      );
    }
    
    // ページネーション
    const start = (currentState.currentPage - 1) * currentState.itemsPerPage;
    const end = start + currentState.itemsPerPage;
    const displayedSlots = filtered.slice(start, end);
    
    // 統計更新
    const stats = this.service.getStats();
    
    this.state.setState(prev => ({
      ...prev,
      displayedSlots,
      totalItems: filtered.length,
      stats
    }));
    
    this.events.emit('inventory-updated', { stats });
  }
  
  /**
   * インベントリを再読み込み
   */
  refresh(): void {
    this.updateDisplay();
  }
}
```

### 使用例（React）

```typescript
function InventoryScreen() {
  const [state, setState] = useState<InventoryUIState>();
  const controllerRef = useRef<InventoryController>();
  
  useEffect(() => {
    const inventory = gameState.party.inventory;
    const service = new InventoryService(coreEngine, inventory);
    const controller = new InventoryController(service);
    
    controllerRef.current = controller;
    const unsubscribe = controller.subscribe(setState);
    
    // イベントリスナー
    controller.on('item-used', ({ result }) => {
      console.log('アイテムを使用しました:', result);
    });
    
    return unsubscribe;
  }, []);
  
  if (!state) return <div>Loading...</div>;
  
  return (
    <div className="inventory-screen">
      {/* ヘッダー：統計情報 */}
      <InventoryHeader stats={state.stats} />
      
      {/* フィルタとソート */}
      <InventoryFilters
        currentCategory={state.currentCategory}
        sortBy={state.sortBy}
        sortOrder={state.sortOrder}
        onCategoryChange={(cat) => controllerRef.current?.setCategory(cat)}
        onSortChange={(sortBy) => controllerRef.current?.setSorting(sortBy)}
      />
      
      {/* アイテムリスト */}
      <InventoryGrid
        slots={state.displayedSlots}
        selectedSlot={state.selectedSlot}
        cursorIndex={state.cursorIndex}
        onSelectSlot={(slot) => controllerRef.current?.selectSlot(slot)}
        onUseItem={(slot) => controllerRef.current?.useItem(slot)}
      />
      
      {/* ページネーション */}
      <InventoryPagination
        currentPage={state.currentPage}
        totalItems={state.totalItems}
        itemsPerPage={state.itemsPerPage}
        onPageChange={(page) => controllerRef.current?.setPage(page)}
      />
      
      {/* アクションボタン */}
      <InventoryActions
        selectedSlot={state.selectedSlot}
        mode={state.mode}
        onUse={() => controllerRef.current?.useItem()}
        onDiscard={() => controllerRef.current?.discardItem()}
        onStack={() => controllerRef.current?.stackItems()}
      />
    </div>
  );
}
```

---

## 統合例

### ゲーム初期化時

```typescript
// Core Engine初期化
const coreEngine = new CoreEngine(config);

// インベントリ作成
const inventory: Inventory = {
  slots: [],
  maxSlots: 100,
  money: 1000,
  usedSlots: 0
};

// 初期アイテム追加
coreEngine.addItemToInventory(inventory, potionItem, 5);
coreEngine.addItemToInventory(inventory, swordItem, 1);

// Service作成
const inventoryService = new InventoryService(coreEngine, inventory);

// Controller作成（UI層）
const inventoryController = new InventoryController(inventoryService);
```

### アイテム取得時

```typescript
// 戦闘報酬でアイテム取得
const droppedItems = battleResult.drops;

for (const drop of droppedItems) {
  const result = inventoryService.addItem(drop.item, drop.quantity);
  
  if (!result.success) {
    // インベントリが満杯の場合の処理
    showMessage('インベントリが満杯です');
    break;
  }
}

// UI更新
inventoryController.refresh();
```

### ショップでの購入

```typescript
async function buyItem(item: Item, quantity: number): Promise<boolean> {
  const totalCost = item.value * quantity;
  const currentMoney = inventoryService.getInventory().money;
  
  if (currentMoney < totalCost) {
    showMessage('所持金が不足しています');
    return false;
  }
  
  // スロット確認
  const availableSlots = inventoryService.getAvailableSlots();
  if (availableSlots === 0 && !item.stackable) {
    showMessage('インベントリが満杯です');
    return false;
  }
  
  // 購入処理
  const result = inventoryService.addItem(item, quantity);
  if (result.success) {
    inventoryService.getInventory().money -= totalCost;
    inventoryController.refresh();
    return true;
  }
  
  return false;
}
```

---

## 拡張性の考慮

### カスタムフィルタ

```typescript
// ユーザー定義のフィルタ関数
type CustomFilter = (slot: InventorySlot) => boolean;

class InventoryController {
  setCustomFilter(filter: CustomFilter): void {
    // カスタムフィルタの適用
  }
}

// 使用例：レア度3以上のアイテムのみ表示
controller.setCustomFilter(slot => (slot.item.rarity || 0) >= 3);
```

### 重量制限システム

```typescript
interface InventoryWithWeight extends Inventory {
  totalWeight: number;
  maxWeight: number;
}

// Core Engineに重量計算関数を追加
function calculateTotalWeight(inventory: InventoryWithWeight): number {
  return inventory.slots.reduce((total, slot) => {
    return total + (slot.item.weight || 0) * slot.quantity;
  }, 0);
}
```

### インベントリ拡張

```typescript
// バッグのアップグレード
function upgradeInventorySize(inventory: Inventory, additionalSlots: number): void {
  inventory.maxSlots += additionalSlots;
}
```

---

## まとめ

このインベントリシステム設計により：

1. **明確な責務分離**: Core Engine（純粋な状態操作）、Service（ビジネスロジック）、UI Controller（UI状態管理）が明確に分離
2. **拡張性**: カスタムフィルタ、重量システム、容量拡張などが容易に追加可能
3. **再利用性**: 各層が独立しているため、異なるUIフレームワークでも再利用可能
4. **保守性**: 各機能が適切な層に配置され、変更の影響範囲が明確

このデザインをベースに、ゲーム固有の要件に応じてカスタマイズしてください。
