/**
 * InventoryService のテスト
 */

import { InventoryService } from '../../src/services/InventoryService';
import type { Inventory, Item, InventorySlot } from '../../src/types';

describe('InventoryService', () => {
  // テスト用のアイテム
  const potionItem: Item = {
    id: 'potion',
    name: 'Potion',
    type: 'consumable',
    description: 'HP回復',
    category: 'consumable',
    value: 50,
    rarity: 1,
    stackable: true,
    maxStack: 99,
    usableInBattle: true,
    usableOutOfBattle: true
  };
  
  const hiPotionItem: Item = {
    id: 'hi-potion',
    name: 'Hi-Potion',
    type: 'consumable',
    description: 'HP大回復',
    category: 'consumable',
    value: 200,
    rarity: 2,
    stackable: true,
    maxStack: 99,
    usableInBattle: true,
    usableOutOfBattle: true
  };
  
  const swordItem: Item = {
    id: 'sword',
    name: 'Iron Sword',
    type: 'equipment',
    description: '鉄の剣',
    category: 'weapon',
    value: 500,
    rarity: 2,
    stackable: false,
    usableInBattle: false,
    usableOutOfBattle: false
  };
  
  const keyItem: Item = {
    id: 'key',
    name: 'Old Key',
    type: 'key-item',
    description: '古い鍵',
    category: 'key-item',
    value: 0,
    rarity: 3,
    stackable: false,
    usableInBattle: false,
    usableOutOfBattle: true
  };
  
  function createEmptyInventory(): Inventory {
    return {
      slots: [],
      maxSlots: 10,
      money: 1000,
      usedSlots: 0
    };
  }
  
  describe('基本操作', () => {
    describe('addItem', () => {
      it('空のインベントリにアイテムを追加できる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        const result = service.addItem(potionItem, 5);
        
        expect(result.success).toBe(true);
        expect(result.slotsUsed).toBe(1);
        expect(result.itemsAdded).toBe(5);
        expect(inventory.usedSlots).toBe(1);
        expect(inventory.slots.length).toBe(1);
        expect(inventory.slots[0].item.id).toBe('potion');
        expect(inventory.slots[0].quantity).toBe(5);
      });
      
      it('スタック可能なアイテムは既存スロットに追加される', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 5);
        const result = service.addItem(potionItem, 3);
        
        expect(result.success).toBe(true);
        expect(result.slotsUsed).toBe(0); // 新しいスロットは使用していない
        expect(result.itemsAdded).toBe(3);
        expect(inventory.usedSlots).toBe(1);
        expect(inventory.slots[0].quantity).toBe(8);
      });
      
      it('スタック上限を超えると新しいスロットが作成される', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 98);
        const result = service.addItem(potionItem, 5);
        
        expect(result.success).toBe(true);
        expect(result.slotsUsed).toBe(1);
        expect(inventory.usedSlots).toBe(2);
        expect(inventory.slots[0].quantity).toBe(99); // maxStack
        expect(inventory.slots[1].quantity).toBe(4);
      });
      
      it('スタック不可アイテムは別スロットに追加される', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(swordItem, 1);
        const result = service.addItem(swordItem, 1);
        
        expect(result.success).toBe(true);
        expect(inventory.usedSlots).toBe(2);
        expect(inventory.slots.length).toBe(2);
      });
      
      it('インベントリが満杯の場合、追加に失敗する', () => {
        const inventory = createEmptyInventory();
        inventory.maxSlots = 2;
        const service = new InventoryService(inventory);
        
        service.addItem(swordItem, 1);
        service.addItem(keyItem, 1);
        
        const result = service.addItem(potionItem, 1);
        
        expect(result.success).toBe(false);
        expect(result.failureReason).toBe('インベントリが満杯です');
      });
      
      it('スタック上限を超え新スロットが必要な時にインベントリが満杯の場合、追加に失敗する', () => {
        const inventory = createEmptyInventory();
        inventory.maxSlots = 1; // 1スロットのみ
        const service = new InventoryService(inventory);
        
        // 既に98個追加されている
        service.addItem(potionItem, 98);
        
        // 5個追加しようとするが、maxStack=99を超えるため新スロットが必要
        // しかしインベントリが満杯なので失敗する
        const result = service.addItem(potionItem, 5);
        
        expect(result.success).toBe(false);
        expect(result.failureReason).toBe('インベントリが満杯です');
        expect(result.itemsAdded).toBe(0); // 追加されていない
        expect(inventory.slots[0].quantity).toBe(98); // 元の数量のまま
      });
    });
    
    describe('removeItem', () => {
      it('アイテムを削除できる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 10);
        const result = service.removeItem('potion', 3);
        
        expect(result.success).toBe(true);
        expect(result.itemsRemoved).toBe(3);
        expect(inventory.slots[0].quantity).toBe(7);
      });
      
      it('全て削除するとスロットが削除される', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 5);
        const result = service.removeItem('potion', 5);
        
        expect(result.success).toBe(true);
        expect(result.slotsUsed).toBe(-1);
        expect(inventory.usedSlots).toBe(0);
        expect(inventory.slots.length).toBe(0);
      });
      
      it('存在しないアイテムの削除は失敗する', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        const result = service.removeItem('nonexistent', 1);
        
        expect(result.success).toBe(false);
        expect(result.failureReason).toBe('アイテムが見つかりません');
      });
      
      it('数量不足の場合は削除に失敗する', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 3);
        const result = service.removeItem('potion', 5);
        
        expect(result.success).toBe(false);
        expect(result.failureReason).toBe('数量が不足しています');
      });
      
      it('装備中のアイテムは削除できない', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(swordItem, 1);
        service.markAsEquipped('sword', true);
        
        const result = service.removeItem('sword', 1);
        
        expect(result.success).toBe(false);
        expect(result.failureReason).toBe('装備中のアイテムは削除できません');
      });
    });
    
    describe('markAsEquipped', () => {
      it('アイテムを装備中としてマークできる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(swordItem, 1);
        service.markAsEquipped('sword', true);
        
        const slot = service.findItem('sword');
        expect(slot?.isEquipped).toBe(true);
      });
      
      it('装備を解除できる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(swordItem, 1);
        service.markAsEquipped('sword', true);
        service.markAsEquipped('sword', false);
        
        const slot = service.findItem('sword');
        expect(slot?.isEquipped).toBe(false);
      });
    });
  });
  
  describe('検索・フィルタ', () => {
    describe('findItem', () => {
      it('アイテムを検索できる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 5);
        const slot = service.findItem('potion');
        
        expect(slot).not.toBeNull();
        expect(slot?.item.id).toBe('potion');
        expect(slot?.quantity).toBe(5);
      });
      
      it('存在しないアイテムはnullを返す', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        const slot = service.findItem('nonexistent');
        expect(slot).toBeNull();
      });
    });
    
    describe('search', () => {
      it('カテゴリで検索できる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 5);
        service.addItem(swordItem, 1);
        
        const results = service.search({ category: 'consumable' });
        
        expect(results.length).toBe(1);
        expect(results[0].item.id).toBe('potion');
      });
      
      it('カスタム条件で検索できる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 5);
        service.addItem(hiPotionItem, 3);
        service.addItem(swordItem, 1);
        
        const results = service.search({
          customPredicate: (slot) => (slot.item.rarity || 0) >= 2
        });
        
        expect(results.length).toBe(2);
        expect(results.some(r => r.item.id === 'hi-potion')).toBe(true);
        expect(results.some(r => r.item.id === 'sword')).toBe(true);
      });
    });
    
    describe('getItemsByCategory', () => {
      it('カテゴリでフィルタできる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 5);
        service.addItem(hiPotionItem, 3);
        service.addItem(swordItem, 1);
        
        const consumables = service.getItemsByCategory('consumable');
        
        expect(consumables.length).toBe(2);
        expect(consumables.every(s => s.item.category === 'consumable')).toBe(true);
      });
    });
    
    describe('getUsableItems', () => {
      it('戦闘中使用可能なアイテムを取得できる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 5);
        service.addItem(swordItem, 1);
        
        const usable = service.getUsableItems('battle');
        
        expect(usable.length).toBe(1);
        expect(usable[0].item.id).toBe('potion');
      });
      
      it('フィールド使用可能なアイテムを取得できる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 5);
        service.addItem(keyItem, 1);
        
        const usable = service.getUsableItems('field');
        
        expect(usable.length).toBe(2);
      });
    });
    
    describe('getEquippedItems', () => {
      it('装備中のアイテムを取得できる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(swordItem, 1);
        service.addItem(potionItem, 5);
        service.markAsEquipped('sword', true);
        
        const equipped = service.getEquippedItems();
        
        expect(equipped.length).toBe(1);
        expect(equipped[0].item.id).toBe('sword');
      });
    });
  });
  
  describe('ソート・整理', () => {
    describe('sort', () => {
      it('名前でソートできる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(swordItem, 1);      // Iron Sword
        service.addItem(potionItem, 5);     // Potion
        service.addItem(hiPotionItem, 3);   // Hi-Potion
        
        service.sort('name', 'asc');
        const slots = service.getAllSlots();
        
        expect(slots[0].item.name).toBe('Hi-Potion');
        expect(slots[1].item.name).toBe('Iron Sword');
        expect(slots[2].item.name).toBe('Potion');
      });
      
      it('数量でソートできる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 5);
        service.addItem(hiPotionItem, 3);
        service.addItem(swordItem, 1);
        
        service.sort('quantity', 'desc');
        const slots = service.getAllSlots();
        
        expect(slots[0].quantity).toBe(5);
        expect(slots[1].quantity).toBe(3);
        expect(slots[2].quantity).toBe(1);
      });
      
      it('レアリティでソートできる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 5);     // rarity: 1
        service.addItem(hiPotionItem, 3);   // rarity: 2
        service.addItem(keyItem, 1);        // rarity: 3
        
        service.sort('rarity', 'desc');
        const slots = service.getAllSlots();
        
        expect(slots[0].item.rarity).toBe(3);
        expect(slots[1].item.rarity).toBe(2);
        expect(slots[2].item.rarity).toBe(1);
      });
    });
    
    describe('stack', () => {
      it('同じアイテムをスタックできる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        // 手動で分散させる
        inventory.slots.push({ item: potionItem, quantity: 30, slotIndex: 0 });
        inventory.slots.push({ item: swordItem, quantity: 1, slotIndex: 1 });
        inventory.slots.push({ item: potionItem, quantity: 40, slotIndex: 2 });
        inventory.usedSlots = 3;
        
        service.stack();
        const slots = service.getAllSlots();
        
        // potionが1スロットにまとまる
        const potionSlots = slots.filter(s => s.item.id === 'potion');
        expect(potionSlots.length).toBe(1);
        expect(potionSlots[0].quantity).toBe(70);
      });
      
      it('maxStackを超える場合は複数スロットに分割される', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        // 150個（maxStack=99を超える）
        inventory.slots.push({ item: potionItem, quantity: 80, slotIndex: 0 });
        inventory.slots.push({ item: potionItem, quantity: 70, slotIndex: 1 });
        inventory.usedSlots = 2;
        
        service.stack();
        const slots = service.getAllSlots();
        
        const potionSlots = slots.filter(s => s.item.id === 'potion');
        expect(potionSlots.length).toBe(2);
        expect(potionSlots[0].quantity).toBe(99);
        expect(potionSlots[1].quantity).toBe(51);
      });
    });
  });
  
  describe('統計・情報', () => {
    describe('getStats', () => {
      it('正しい統計情報を返す', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 5);     // value: 50
        service.addItem(hiPotionItem, 3);   // value: 200
        service.addItem(swordItem, 1);      // value: 500
        
        const stats = service.getStats();
        
        expect(stats.totalSlots).toBe(10);
        expect(stats.usedSlots).toBe(3);
        expect(stats.availableSlots).toBe(7);
        expect(stats.totalItems).toBe(9);
        expect(stats.uniqueItems).toBe(3);
        expect(stats.totalValue).toBe(50 * 5 + 200 * 3 + 500 * 1);
        expect(stats.money).toBe(1000);
      });
      
      it('カテゴリ別の統計を返す', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 5);
        service.addItem(hiPotionItem, 3);
        service.addItem(swordItem, 1);
        
        const stats = service.getStats();
        
        expect(stats.itemsByCategory['consumable']).toBe(8);
        expect(stats.itemsByCategory['weapon']).toBe(1);
      });
    });
    
    describe('getItemCount', () => {
      it('アイテムの所持数を取得できる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 7);
        
        expect(service.getItemCount('potion')).toBe(7);
      });
      
      it('存在しないアイテムは0を返す', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        expect(service.getItemCount('nonexistent')).toBe(0);
      });
    });
    
    describe('hasItem', () => {
      it('アイテムを所持しているか確認できる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addItem(potionItem, 5);
        
        expect(service.hasItem('potion')).toBe(true);
        expect(service.hasItem('potion', 5)).toBe(true);
        expect(service.hasItem('potion', 6)).toBe(false);
        expect(service.hasItem('nonexistent')).toBe(false);
      });
    });
  });
  
  describe('所持金管理', () => {
    describe('getMoney', () => {
      it('所持金を取得できる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        expect(service.getMoney()).toBe(1000);
      });
    });
    
    describe('addMoney', () => {
      it('所持金を追加できる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        service.addMoney(500);
        
        expect(service.getMoney()).toBe(1500);
      });
    });
    
    describe('removeMoney', () => {
      it('所持金を減らせる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        const result = service.removeMoney(300);
        
        expect(result).toBe(true);
        expect(service.getMoney()).toBe(700);
      });
      
      it('所持金不足の場合は失敗する', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        const result = service.removeMoney(1500);
        
        expect(result).toBe(false);
        expect(service.getMoney()).toBe(1000); // 変わらない
      });
    });
    
    describe('hasMoney', () => {
      it('所持金が十分にあるか確認できる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        expect(service.hasMoney(500)).toBe(true);
        expect(service.hasMoney(1000)).toBe(true);
        expect(service.hasMoney(1500)).toBe(false);
      });
    });
  });
  
  describe('判定メソッド', () => {
    describe('hasAvailableSlot', () => {
      it('空きがあるか確認できる', () => {
        const inventory = createEmptyInventory();
        inventory.maxSlots = 2;
        const service = new InventoryService(inventory);
        
        expect(service.hasAvailableSlot()).toBe(true);
        
        service.addItem(swordItem, 1);
        expect(service.hasAvailableSlot()).toBe(true);
        
        service.addItem(keyItem, 1);
        expect(service.hasAvailableSlot()).toBe(false);
      });
    });
    
    describe('isFull', () => {
      it('満杯かどうか確認できる', () => {
        const inventory = createEmptyInventory();
        inventory.maxSlots = 1;
        const service = new InventoryService(inventory);
        
        expect(service.isFull()).toBe(false);
        
        service.addItem(swordItem, 1);
        expect(service.isFull()).toBe(true);
      });
    });
    
    describe('isEmpty', () => {
      it('空かどうか確認できる', () => {
        const inventory = createEmptyInventory();
        const service = new InventoryService(inventory);
        
        expect(service.isEmpty()).toBe(true);
        
        service.addItem(potionItem, 1);
        expect(service.isEmpty()).toBe(false);
      });
    });
  });
  
  describe('統合テスト', () => {
    it('複雑なシナリオ: ショップでの購入と使用', () => {
      const inventory = createEmptyInventory();
      const service = new InventoryService(inventory);
      
      // ポーションを購入
      const potionCost = 50 * 3;
      expect(service.hasMoney(potionCost)).toBe(true);
      service.removeMoney(potionCost);
      service.addItem(potionItem, 3);
      
      // 残高確認
      expect(service.getMoney()).toBe(850);
      expect(service.hasItem('potion', 3)).toBe(true);
      
      // 戦闘で使用
      service.removeItem('potion', 1);
      expect(service.getItemCount('potion')).toBe(2);
      
      // 追加購入
      service.removeMoney(100);
      service.addItem(potionItem, 2);
      expect(service.getItemCount('potion')).toBe(4);
      
      // 統計確認
      const stats = service.getStats();
      expect(stats.totalItems).toBe(4);
      expect(stats.usedSlots).toBe(1); // スタック可能なので1スロット
      expect(stats.money).toBe(750);
    });
    
    it('複雑なシナリオ: インベントリ整理', () => {
      const inventory = createEmptyInventory();
      const service = new InventoryService(inventory);
      
      // 様々なアイテムを追加
      service.addItem(swordItem, 1);
      service.addItem(potionItem, 5);
      service.addItem(hiPotionItem, 3);
      service.addItem(keyItem, 1);
      
      // レアリティでソート
      service.sort('rarity', 'desc');
      const afterSort = service.getAllSlots();
      expect(afterSort[0].item.id).toBe('key'); // rarity: 3
      
      // カテゴリでフィルタ
      const consumables = service.getItemsByCategory('consumable');
      expect(consumables.length).toBe(2);
      
      // 統計確認
      const stats = service.getStats();
      expect(stats.uniqueItems).toBe(4);
      expect(stats.totalItems).toBe(10);
    });
  });
});
