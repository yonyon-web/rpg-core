/**
 * ショップ管理のCore Engine関数
 * - 純粋関数として実装
 * - ミュータブルな操作（在庫更新）を含む
 */

import type { Character } from '../types/battle';
import type { Inventory } from '../types/item';
import type { Shop, ShopItem, ShopTransaction } from '../types/shop';
import { findItemSlot } from '../item/inventory';

/**
 * 購入価格を計算
 * 
 * @param shopItem - ショップアイテム
 * @param quantity - 購入数量
 * @param shop - ショップ
 * @returns 合計購入価格
 */
export function calculateBuyPrice(
  shopItem: ShopItem,
  quantity: number,
  shop: Shop
): number {
  const multiplier = shop.buyPriceMultiplier ?? 1.0;
  return shopItem.buyPrice * quantity * multiplier;
}

/**
 * 売却価格を計算
 * 
 * @param shopItem - ショップアイテム
 * @param quantity - 売却数量
 * @param shop - ショップ
 * @returns 合計売却価格
 */
export function calculateSellPrice(
  shopItem: ShopItem,
  quantity: number,
  shop: Shop
): number {
  const multiplier = shop.sellPriceMultiplier ?? 0.5;
  const sellPrice = shopItem.sellPrice ?? shopItem.buyPrice * multiplier;
  return sellPrice * quantity;
}

/**
 * アイテムを購入可能かチェック
 * 
 * @param character - キャラクター
 * @param inventory - インベントリ
 * @param shopItem - ショップアイテム
 * @param quantity - 購入数量
 * @param shop - ショップ
 * @returns 購入可能ならtrue、理由を含む結果オブジェクト
 */
export function canBuyItem(
  character: Character,
  inventory: Inventory,
  shopItem: ShopItem,
  quantity: number,
  shop: Shop
): { canBuy: boolean; reason?: string } {
  // 購入不可フラグチェック
  if (shopItem.isPurchasable === false) {
    return { canBuy: false, reason: 'このアイテムは購入できません' };
  }

  // 数量チェック
  if (quantity <= 0) {
    return { canBuy: false, reason: '購入数量は1以上である必要があります' };
  }

  // 1回の取引での購入数制限チェック
  if (shopItem.maxPurchasePerTransaction !== undefined && 
      quantity > shopItem.maxPurchasePerTransaction) {
    return { 
      canBuy: false, 
      reason: `1回の取引で購入できる数は${shopItem.maxPurchasePerTransaction}個までです` 
    };
  }

  // 在庫チェック
  const stock = shopItem.stock ?? -1;
  if (stock >= 0 && stock < quantity) {
    return { canBuy: false, reason: '在庫が不足しています' };
  }

  // レベル要件チェック
  if (shopItem.requiredLevel !== undefined && 
      character.level < shopItem.requiredLevel) {
    return { 
      canBuy: false, 
      reason: `レベル${shopItem.requiredLevel}以上が必要です` 
    };
  }

  // 必要アイテムチェック
  if (shopItem.requiredItems) {
    for (const req of shopItem.requiredItems) {
      const slot = findItemSlot(inventory, req.itemId);
      if (!slot || slot.quantity < req.quantity * quantity) {
        return { 
          canBuy: false, 
          reason: `必要なアイテムが不足しています: ${req.itemId}` 
        };
      }
    }
  }

  // リソースコストチェック
  if (shopItem.resourceCost) {
    const { resourceId, amount } = shopItem.resourceCost;
    const totalCost = amount * quantity;
    const currentAmount = inventory.resources?.[resourceId] ?? 0;
    
    if (currentAmount < totalCost) {
      return { 
        canBuy: false, 
        reason: `${resourceId}が不足しています（必要: ${totalCost}, 所持: ${currentAmount}）` 
      };
    }
  } else {
    // 通常の金銭チェック
    const totalPrice = calculateBuyPrice(shopItem, quantity, shop);
    if (inventory.money < totalPrice) {
      return { 
        canBuy: false, 
        reason: `所持金が不足しています（必要: ${totalPrice}, 所持: ${inventory.money}）` 
      };
    }
  }

  // インベントリスペースチェック（スタック可能でない場合、または新規アイテムの場合）
  if (!shopItem.item.stackable) {
    const availableSlots = inventory.maxSlots - inventory.usedSlots;
    if (availableSlots < quantity) {
      return { 
        canBuy: false, 
        reason: 'インベントリの空きスロットが不足しています' 
      };
    }
  }

  return { canBuy: true };
}

/**
 * アイテムを売却可能かチェック
 * 
 * @param inventory - インベントリ
 * @param itemId - アイテムID
 * @param quantity - 売却数量
 * @param shopItem - ショップアイテム（売却価格情報用）
 * @returns 売却可能ならtrue、理由を含む結果オブジェクト
 */
export function canSellItem(
  inventory: Inventory,
  itemId: string,
  quantity: number,
  shopItem?: ShopItem
): { canSell: boolean; reason?: string } {
  // 売却不可フラグチェック
  if (shopItem && shopItem.isSellable === false) {
    return { canSell: false, reason: 'このアイテムは売却できません' };
  }

  // 数量チェック
  if (quantity <= 0) {
    return { canSell: false, reason: '売却数量は1以上である必要があります' };
  }

  // アイテム所持チェック
  const slot = findItemSlot(inventory, itemId);
  if (!slot) {
    return { canSell: false, reason: 'アイテムを所持していません' };
  }

  if (slot.quantity < quantity) {
    return { 
      canSell: false, 
      reason: `アイテムが不足しています（必要: ${quantity}, 所持: ${slot.quantity}）` 
    };
  }

  // 装備中チェック
  if (slot.isEquipped) {
    return { canSell: false, reason: '装備中のアイテムは売却できません' };
  }

  return { canSell: true };
}

/**
 * アイテムを購入
 * - インベントリとショップの状態を更新（ミュータブル）
 * 
 * @param character - キャラクター
 * @param inventory - インベントリ
 * @param shopItem - ショップアイテム
 * @param quantity - 購入数量
 * @param shop - ショップ
 * @returns 取引結果
 */
export function buyItem(
  character: Character,
  inventory: Inventory,
  shopItem: ShopItem,
  quantity: number,
  shop: Shop
): ShopTransaction {
  // 購入可否チェック
  const checkResult = canBuyItem(character, inventory, shopItem, quantity, shop);
  if (!checkResult.canBuy) {
    return {
      success: false,
      failureReason: checkResult.reason
    };
  }

  const transaction: ShopTransaction = {
    success: true,
    itemsGained: [{ item: shopItem.item, quantity }]
  };

  // リソースコストの処理
  if (shopItem.resourceCost) {
    const { resourceId, amount } = shopItem.resourceCost;
    const totalCost = amount * quantity;
    
    if (!inventory.resources) {
      inventory.resources = {};
    }
    inventory.resources[resourceId] = (inventory.resources[resourceId] ?? 0) - totalCost;
    
    transaction.resourcesSpent = { [resourceId]: totalCost };
  } else {
    // 通常の金銭支払い
    const totalPrice = calculateBuyPrice(shopItem, quantity, shop);
    inventory.money -= totalPrice;
    transaction.moneySpent = totalPrice;
  }

  // 必要アイテムの消費
  if (shopItem.requiredItems) {
    transaction.itemsLost = [];
    for (const req of shopItem.requiredItems) {
      const slot = findItemSlot(inventory, req.itemId);
      if (slot) {
        const consumeQuantity = req.quantity * quantity;
        slot.quantity -= consumeQuantity;
        transaction.itemsLost.push({ 
          item: slot.item, 
          quantity: consumeQuantity 
        });
        
        // スロットが空になったら削除
        if (slot.quantity <= 0) {
          const index = inventory.slots.indexOf(slot);
          if (index !== -1) {
            inventory.slots.splice(index, 1);
            inventory.usedSlots--;
          }
        }
      }
    }
  }

  // インベントリにアイテム追加
  // スタック可能な場合は既存スロットに追加
  const existingSlot = findItemSlot(inventory, shopItem.item.id);
  if (existingSlot && shopItem.item.stackable) {
    existingSlot.quantity += quantity;
  } else {
    // 新規スロット作成 - slotIndexを追加
    const newSlotIndex = inventory.slots.length > 0 
      ? Math.max(...inventory.slots.map(s => s.slotIndex)) + 1 
      : 0;
      
    inventory.slots.push({
      item: shopItem.item,
      quantity,
      isEquipped: false,
      slotIndex: newSlotIndex,
      acquiredAt: Date.now()
    });
    inventory.usedSlots++;
  }

  // 在庫更新
  if (shopItem.stock !== undefined && shopItem.stock >= 0) {
    shopItem.stock -= quantity;
  }

  return transaction;
}

/**
 * アイテムを売却
 * - インベントリの状態を更新（ミュータブル）
 * 
 * @param inventory - インベントリ
 * @param shopItem - ショップアイテム（売却価格情報用）
 * @param itemId - アイテムID
 * @param quantity - 売却数量
 * @param shop - ショップ
 * @returns 取引結果
 */
export function sellItem(
  inventory: Inventory,
  shopItem: ShopItem,
  itemId: string,
  quantity: number,
  shop: Shop
): ShopTransaction {
  // 売却可否チェック
  const checkResult = canSellItem(inventory, itemId, quantity, shopItem);
  if (!checkResult.canSell) {
    return {
      success: false,
      failureReason: checkResult.reason
    };
  }

  const slot = findItemSlot(inventory, itemId);
  if (!slot) {
    return {
      success: false,
      failureReason: 'アイテムが見つかりません'
    };
  }

  // 売却価格計算
  const totalPrice = calculateSellPrice(shopItem, quantity, shop);

  // インベントリからアイテム削除
  slot.quantity -= quantity;
  if (slot.quantity <= 0) {
    const index = inventory.slots.indexOf(slot);
    if (index !== -1) {
      inventory.slots.splice(index, 1);
      inventory.usedSlots--;
    }
  }

  // 金銭追加
  inventory.money += totalPrice;

  return {
    success: true,
    moneyGained: totalPrice,
    itemsLost: [{ item: slot.item, quantity }]
  };
}

/**
 * キャラクターが購入可能なアイテムを取得
 * - レベル要件、購入可能フラグでフィルタリング
 * 
 * @param character - キャラクター
 * @param shop - ショップ
 * @returns 購入可能なショップアイテム配列
 */
export function getAvailableItems(
  character: Character,
  shop: Shop
): ShopItem[] {
  return shop.items.filter(shopItem => {
    // 購入不可フラグチェック
    if (shopItem.isPurchasable === false) {
      return false;
    }

    // レベル要件チェック
    if (shopItem.requiredLevel !== undefined && 
        character.level < shopItem.requiredLevel) {
      return false;
    }

    // 在庫チェック（在庫0は表示しない）
    if (shopItem.stock !== undefined && shopItem.stock === 0) {
      return false;
    }

    return true;
  });
}

/**
 * ショップの在庫を補充
 * - 元の在庫数に戻す（ShopItemのstock値を元に戻す処理が必要な場合用）
 * - Note: 元の在庫数を記憶していないため、外部で管理する必要あり
 * 
 * @param shop - ショップ
 */
export function restockShop(shop: Shop): void {
  // Note: このAPIは在庫をリセットするフックとして提供
  // 実際の在庫数の復元はService層で行う（元の値を記憶する必要があるため）
  if (shop.restockOnVisit) {
    // Service層で実装
  }
}
