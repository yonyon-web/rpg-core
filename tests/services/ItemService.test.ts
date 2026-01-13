/**
 * ItemService tests
 * アイテム使用サービスのテスト
 */

import { ItemService } from '../../src/services/ItemService';
import { Character } from '../../src/types/battle';
import { ConsumableItem } from '../../src/types/item';
import { DefaultStats } from '../../src/types/stats';

describe('ItemService', () => {
  let service: ItemService;

  // テスト用キャラクター作成
  const createTestCharacter = (overrides?: Partial<Character>): Character => ({
    id: 'char-1',
    name: 'Hero',
    level: 10,
    stats: {
      maxHp: 100,
      maxMp: 50,
      attack: 20,
      defense: 15,
      magic: 10,
      magicDefense: 12,
      speed: 18,
      luck: 8,
      accuracy: 95,
      evasion: 10,
      criticalRate: 5,
    } as DefaultStats,
    currentHp: 50,
    currentMp: 25,
    currentExp: 1000,
    learnedSkills: [],
    statusEffects: [],
    position: 0,
    job: 'warrior',
    ...overrides,
  });

  // テスト用アイテム作成
  const createTestItem = (overrides?: Partial<ConsumableItem>): ConsumableItem => ({
    id: 'item-potion',
    name: 'Potion',
    type: 'consumable',
    description: 'Restores 50 HP',
    effect: {
      type: 'heal-hp',
      value: 50,
      targetType: 'single-ally',
    },
    usableInBattle: true,
    usableOutOfBattle: true,
    targetType: 'single-ally',
    consumable: true,
    ...overrides,
  });

  beforeEach(() => {
    service = new ItemService();
  });

  describe('useItem', () => {
    test('should successfully use HP restore item', () => {
      const character = createTestCharacter({ currentHp: 50 });
      const item = createTestItem();

      const result = service.useItem(item, character, { inBattle: true });

      expect(result.success).toBe(true);
      expect(result.effects).toHaveLength(1);
      expect(result.effects![0].hpRestored).toBe(50);
      expect(character.currentHp).toBe(100);
    });

    test('should not exceed max HP when using restore item', () => {
      const character = createTestCharacter({ currentHp: 80 });
      const item = createTestItem({ effect: { type: 'heal-hp', value: 50, targetType: 'single-ally' } });

      const result = service.useItem(item, character, { inBattle: true });

      expect(result.success).toBe(true);
      expect(character.currentHp).toBe(100);
      expect(result.effects![0].hpRestored).toBe(20);
    });

    test('should successfully use MP restore item', () => {
      const character = createTestCharacter({ currentMp: 10 });
      const item = createTestItem({
        effect: { type: 'heal-mp', value: 30, targetType: 'single-ally' },
      });

      const result = service.useItem(item, character, { inBattle: true });

      expect(result.success).toBe(true);
      expect(character.currentMp).toBe(40);
      expect(result.effects![0].mpRestored).toBe(30);
    });

    test('should not exceed max MP when using restore item', () => {
      const character = createTestCharacter({ currentMp: 40 });
      const item = createTestItem({
        effect: { type: 'heal-mp', value: 30, targetType: 'single-ally' },
      });

      const result = service.useItem(item, character, { inBattle: true });

      expect(result.success).toBe(true);
      expect(character.currentMp).toBe(50);
      expect(result.effects![0].mpRestored).toBe(10);
    });

    test('should revive dead character', () => {
      const character = createTestCharacter({ currentHp: 0 });
      const item = createTestItem({
        effect: { type: 'revive', value: 50, targetType: 'single-ally' },
      });

      const result = service.useItem(item, character, { inBattle: true });

      expect(result.success).toBe(true);
      expect(character.currentHp).toBe(50);
      expect(result.effects![0].revived).toBe(true);
    });

    test('should fail when using item on invalid target', () => {
      const character = createTestCharacter({ currentHp: 100 });
      const item = createTestItem();

      const result = service.useItem(item, character, { inBattle: true });

      expect(result.success).toBe(false);
      expect(result.message).toContain('already at full HP');
    });

    test('should fail when using battle-only item outside battle', () => {
      const character = createTestCharacter({ currentHp: 50 });
      const item = createTestItem({ usableOutOfBattle: false });

      const result = service.useItem(item, character, { inBattle: false });

      expect(result.success).toBe(false);
      expect(result.message).toContain('not usable outside');
    });

    test('should succeed when using item outside battle if allowed', () => {
      const character = createTestCharacter({ currentHp: 50 });
      const item = createTestItem({ usableOutOfBattle: true });

      const result = service.useItem(item, character, { inBattle: false });

      expect(result.success).toBe(true);
      expect(character.currentHp).toBe(100);
    });

    test('should fail when using revive on alive character', () => {
      const character = createTestCharacter({ currentHp: 50 });
      const item = createTestItem({
        effect: { type: 'revive', value: 50, targetType: 'single-ally' },
      });

      const result = service.useItem(item, character, { inBattle: true });

      expect(result.success).toBe(false);
      expect(result.message).toContain('not dead');
    });
  });

  describe('getUsableItems', () => {
    test('should return empty array when no items are usable', () => {
      const character = createTestCharacter({ currentHp: 100 });
      const items: ConsumableItem[] = [];

      const result = service.getUsableItems(items, character, { inBattle: true });

      expect(result).toEqual([]);
    });

    test('should filter out items not usable in current context', () => {
      const character = createTestCharacter({ currentHp: 50 });
      const item1 = createTestItem({ id: 'item-1', usableInBattle: true });
      const item2 = createTestItem({ id: 'item-2', usableInBattle: false });

      const result = service.getUsableItems([item1, item2], character, { inBattle: true });

      expect(result).toHaveLength(1);
      expect(result[0].item.id).toBe('item-1');
    });

    test('should include usability information', () => {
      const character = createTestCharacter({ currentHp: 100 });
      const item = createTestItem();

      const result = service.getUsableItems([item], character, { inBattle: true });

      expect(result).toHaveLength(1);
      expect(result[0].canUse).toBe(false);
      expect(result[0].reason).toContain('already at full HP');
    });

    test('should mark usable items correctly', () => {
      const character = createTestCharacter({ currentHp: 50 });
      const item = createTestItem();

      const result = service.getUsableItems([item], character, { inBattle: true });

      expect(result).toHaveLength(1);
      expect(result[0].canUse).toBe(true);
    });
  });

  describe('canUseItem', () => {
    test('should return true when item can be used', () => {
      const character = createTestCharacter({ currentHp: 50 });
      const item = createTestItem();

      const result = service.canUseItem(item, character, { inBattle: true });

      expect(result).toBe(true);
    });

    test('should return false when item cannot be used', () => {
      const character = createTestCharacter({ currentHp: 100 });
      const item = createTestItem();

      const result = service.canUseItem(item, character, { inBattle: true });

      expect(result).toBe(false);
    });
  });
});
