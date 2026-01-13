/**
 * インベントリ管理の基本操作
 * 
 * インベントリシステムのCore Engine実装
 * アイテムの追加、削除、検索、ソート、スタック処理などの純粋な状態操作を提供
 */

import type {
  Inventory,
  InventorySlot,
  InventorySearchCriteria,
  InventorySortBy,
  SortOrder,
  InventoryOperationOptions,
  InventoryResult,
  InventoryStats,
  Item,
  UniqueId
} from '../types';

/**
 * アイテムをインベントリに追加
 * 
 * @param inventory - インベントリ
 * @param item - 追加するアイテム
 * @param quantity - 追加する数量
 * @param options - 操作オプション
 * @returns 操作結果
 */
export function addItemToInventory(
  inventory: Inventory,
  item: Item,
  quantity: number,
  options?: InventoryOperationOptions
): InventoryResult {
  // スタック可能なアイテムは既存スロットに追加
  if (item.stackable) {
    const existingSlot = findItemSlot(inventory, item.id);
    const maxStack = item.maxStack || 99;
    
    if (existingSlot) {
      const canAdd = maxStack - existingSlot.quantity;
      if (canAdd >= quantity) {
        // 全て既存スロットに追加できる
        existingSlot.quantity += quantity;
        return {
          success: true,
          slotsUsed: 0,
          itemsAdded: quantity
        };
      } else if (canAdd > 0) {
        // 一部を既存スロットに追加し、残りを新スロットに
        const remaining = quantity - canAdd;
        
        // 新しいスロットを追加できるか確認
        if (inventory.usedSlots >= inventory.maxSlots && !options?.allowOverflow) {
          return {
            success: false,
            slotsUsed: 0,
            itemsAdded: 0, // 追加できなかった
            failureReason: 'インベントリが満杯です'
          };
        }
        
        // ここで既存スロットを更新
        existingSlot.quantity = maxStack;
        
        const newSlot: InventorySlot = {
          item,
          quantity: remaining,
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
  
  // カテゴリ別制限チェック
  if (item.category && inventory.categoryLimits && !options?.allowOverflow) {
    if (!canAddToCategory(inventory, item.category, 1)) {
      return {
        success: false,
        slotsUsed: 0,
        failureReason: `カテゴリ「${item.category}」のスロットが満杯です`
      };
    }
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
 * 
 * @param inventory - インベントリ
 * @param itemId - 削除するアイテムID
 * @param quantity - 削除する数量
 * @param options - 操作オプション
 * @returns 操作結果
 */
export function removeItemFromInventory(
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
    
    // スロットインデックスを再割り当て
    inventory.slots.forEach((s, i) => {
      s.slotIndex = i;
    });
    
    inventory.usedSlots--;
    
    return {
      success: true,
      slotsUsed: -1,
      itemsRemoved: quantity
    };
  }
  
  return {
    success: true,
    slotsUsed: 0,
    itemsRemoved: quantity
  };
}

/**
 * アイテムを検索
 * 
 * @param inventory - インベントリ
 * @param itemId - 検索するアイテムID
 * @returns 見つかったスロット（見つからない場合はnull）
 */
export function findItemSlot(
  inventory: Inventory,
  itemId: UniqueId
): InventorySlot | null {
  return inventory.slots.find(slot => slot.item.id === itemId) || null;
}

/**
 * 複数条件でアイテムを検索
 * カスタム条件関数により柔軟な検索が可能
 * 
 * @param inventory - インベントリ
 * @param criteria - 検索条件
 * @returns マッチしたスロットの配列
 */
export function searchItems(
  inventory: Inventory,
  criteria: InventorySearchCriteria
): InventorySlot[] {
  return inventory.slots.filter(slot => {
    // 標準の検索条件
    if (criteria.itemId && slot.item.id !== criteria.itemId) return false;
    if (criteria.category && slot.item.category !== criteria.category) return false;
    if (criteria.name && !slot.item.name.includes(criteria.name)) return false;
    if (criteria.minQuantity && slot.quantity < criteria.minQuantity) return false;
    if (criteria.maxQuantity && slot.quantity > criteria.maxQuantity) return false;
    if (criteria.isEquipped !== undefined && slot.isEquipped !== criteria.isEquipped) return false;
    
    // カスタム条件関数が指定されている場合
    if (criteria.customPredicate && !criteria.customPredicate(slot)) return false;
    
    return true;
  });
}

/**
 * インベントリをソート
 * 
 * @param inventory - インベントリ
 * @param sortBy - ソート基準
 * @param order - ソート順序（デフォルト: 'asc'）
 * @returns ソートされたインベントリ（新しいオブジェクト）
 */
export function sortInventory(
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
  
  // スロットインデックスを再割り当て
  sorted.forEach((slot, index) => {
    slot.slotIndex = index;
  });
  
  return {
    ...inventory,
    slots: sorted
  };
}

/**
 * インベントリの空きスロット数を取得
 * 
 * @param inventory - インベントリ
 * @returns 空きスロット数
 */
export function getAvailableSlots(inventory: Inventory): number {
  return inventory.maxSlots - inventory.usedSlots;
}

/**
 * アイテムをスタック（同じアイテムをまとめる）
 * 
 * @param inventory - インベントリ
 * @returns スタック処理されたインベントリ（新しいオブジェクト）
 */
export function stackItems(inventory: Inventory): Inventory {
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
 * 
 * @param inventory - インベントリ
 * @returns 統計情報
 */
export function getInventoryStats(inventory: Inventory): InventoryStats {
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
    resources: inventory.resources
  };
}

/**
 * リソース量を取得
 * 
 * @param inventory - インベントリ
 * @param resourceId - リソースID（例: 'sp', 'craft-points', 'tokens'）
 * @returns リソース量（存在しない場合は0）
 */
export function getResource(
  inventory: Inventory,
  resourceId: string
): number {
  return inventory.resources?.[resourceId] || 0;
}

/**
 * リソースを追加
 * 
 * @param inventory - インベントリ
 * @param resourceId - リソースID
 * @param amount - 追加する量
 */
export function addResource(
  inventory: Inventory,
  resourceId: string,
  amount: number
): void {
  if (!inventory.resources) {
    inventory.resources = {};
  }
  inventory.resources[resourceId] = (inventory.resources[resourceId] || 0) + amount;
}

/**
 * リソースを減らす
 * 
 * @param inventory - インベントリ
 * @param resourceId - リソースID
 * @param amount - 減らす量
 * @returns 成功したか（リソース不足の場合はfalse）
 */
export function removeResource(
  inventory: Inventory,
  resourceId: string,
  amount: number
): boolean {
  const current = getResource(inventory, resourceId);
  if (current < amount) {
    return false;
  }
  
  // currentが0以上の場合、resourcesを初期化して値を設定
  if (!inventory.resources) {
    inventory.resources = {};
  }
  inventory.resources[resourceId] = current - amount;
  return true;
}

/**
 * リソースが十分にあるか確認
 * 
 * @param inventory - インベントリ
 * @param resourceId - リソースID
 * @param amount - 必要な量
 * @returns 十分にあるか
 */
export function hasResource(
  inventory: Inventory,
  resourceId: string,
  amount: number
): boolean {
  return getResource(inventory, resourceId) >= amount;
}

/**
 * リソースを設定
 * 
 * @param inventory - インベントリ
 * @param resourceId - リソースID
 * @param amount - 設定する量
 */
export function setResource(
  inventory: Inventory,
  resourceId: string,
  amount: number
): void {
  if (!inventory.resources) {
    inventory.resources = {};
  }
  inventory.resources[resourceId] = amount;
}

/**
 * カテゴリのスロット使用状況を取得
 * - カテゴリ別制限がある場合、そのカテゴリの使用スロット数を返す
 * - groupIdがある場合、同じグループの全カテゴリの合計を返す
 * 
 * @param inventory - インベントリ
 * @param category - カテゴリ名
 * @returns 使用中のスロット数
 */
export function getCategorySlotUsage(
  inventory: Inventory,
  category: string
): number {
  if (!inventory.categoryLimits) {
    return 0;
  }
  
  // このカテゴリの制限設定を検索
  const limit = inventory.categoryLimits.find(l => l.category === category);
  if (!limit) {
    return 0;
  }
  
  // groupIdがある場合、同じグループの全カテゴリをカウント
  if (limit.groupId) {
    const groupCategories = inventory.categoryLimits
      .filter(l => l.groupId === limit.groupId)
      .map(l => l.category);
    
    return inventory.slots.filter(slot => 
      groupCategories.includes(slot.item.category || '')
    ).length;
  }
  
  // 単一カテゴリの場合
  return inventory.slots.filter(slot => 
    slot.item.category === category
  ).length;
}

/**
 * カテゴリの空きスロット数を取得
 * 
 * @param inventory - インベントリ
 * @param category - カテゴリ名
 * @returns 空きスロット数（制限なしの場合は-1）
 */
export function getCategoryAvailableSlots(
  inventory: Inventory,
  category: string
): number {
  if (!inventory.categoryLimits) {
    return -1; // 制限なし
  }
  
  let limit = inventory.categoryLimits.find(l => l.category === category);
  if (!limit) {
    // groupIdで検索
    const groupLimit = inventory.categoryLimits.find(l => 
      l.groupId && inventory.categoryLimits?.some(l2 => 
        l2.category === category && l2.groupId === l.groupId
      )
    );
    if (!groupLimit) {
      return -1; // 制限なし
    }
    limit = groupLimit;
  }
  
  const used = getCategorySlotUsage(inventory, category);
  return Math.max(0, limit.maxSlots - used);
}

/**
 * カテゴリにアイテムを追加できるかチェック
 * 
 * @param inventory - インベントリ
 * @param category - カテゴリ名
 * @param slotsNeeded - 必要なスロット数（デフォルト: 1）
 * @returns 追加可能な場合true
 */
export function canAddToCategory(
  inventory: Inventory,
  category: string,
  slotsNeeded: number = 1
): boolean {
  const available = getCategoryAvailableSlots(inventory, category);
  
  // 制限なしの場合
  if (available === -1) {
    return true;
  }
  
  return available >= slotsNeeded;
}

/**
 * カテゴリ別スロット統計を取得
 * 
 * @param inventory - インベントリ
 * @returns カテゴリ別の使用状況
 */
export function getCategorySlotStats(
  inventory: Inventory
): Record<string, { used: number; max: number; available: number }> {
  const stats: Record<string, { used: number; max: number; available: number }> = {};
  
  if (!inventory.categoryLimits) {
    return stats;
  }
  
  // 処理済みのgroupIdを追跡
  const processedGroups = new Set<string>();
  
  for (const limit of inventory.categoryLimits) {
    // groupIdがあり、すでに処理済みの場合はスキップ
    if (limit.groupId && processedGroups.has(limit.groupId)) {
      continue;
    }
    
    const used = getCategorySlotUsage(inventory, limit.category);
    const available = limit.maxSlots - used;
    
    if (limit.groupId) {
      // グループの場合、グループ名で統計を記録
      stats[limit.groupId] = {
        used,
        max: limit.maxSlots,
        available: Math.max(0, available)
      };
      processedGroups.add(limit.groupId);
    } else {
      // 単一カテゴリの場合
      stats[limit.category] = {
        used,
        max: limit.maxSlots,
        available: Math.max(0, available)
      };
    }
  }
  
  return stats;
}
