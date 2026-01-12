/**
 * CraftService テスト
 */

import { CraftService } from '../../src/services/CraftService';
import type { CraftRecipe } from '../../src/types/craft';
import type { Character } from '../../src/types/battle';
import type { InventoryItem } from '../../src/craft/synthesis';

describe('CraftService', () => {
  let service: CraftService;

  beforeEach(() => {
    service = new CraftService();
  });

  // テスト用のレシピ作成ヘルパー
  const createRecipe = (overrides: Partial<CraftRecipe> = {}): CraftRecipe => ({
    id: 'recipe1',
    name: 'Health Potion',
    materials: [
      { itemId: 'herb', quantity: 2 },
      { itemId: 'water', quantity: 1 }
    ],
    result: { itemId: 'potion', quantity: 1 },
    baseSuccessRate: 0.9,
    ...overrides
  });

  // テスト用のインベントリ作成ヘルパー
  const createInventory = (): InventoryItem[] => [
    { itemId: 'herb', quantity: 5 },
    { itemId: 'water', quantity: 3 }
  ];

  // テスト用のキャラクター作成ヘルパー
  const createCharacter = (overrides: Partial<Character> = {}): Character => ({
    id: 'char1',
    name: 'Test Character',
    level: 10,
    currentHp: 100,
    currentMp: 50,
    stats: { 
      maxHp: 100,
      maxMp: 50,
      attack: 10, 
      defense: 10, 
      magic: 10,
      magicDefense: 10, 
      speed: 10,
      luck: 5,
      accuracy: 0,
      evasion: 0,
      criticalRate: 0
    },
    statusEffects: [],
    position: 0,
    skills: [],
    ...overrides
  });

  describe('registerRecipe', () => {
    test('should register a recipe', () => {
      const recipe = createRecipe();
      service.registerRecipe(recipe);
      
      expect(service.getRecipe(recipe.id)).toBe(recipe);
    });

    test('should overwrite existing recipe with same ID', () => {
      const recipe1 = createRecipe({ name: 'Recipe 1' });
      const recipe2 = createRecipe({ name: 'Recipe 2' });
      
      service.registerRecipe(recipe1);
      service.registerRecipe(recipe2);
      
      const retrieved = service.getRecipe(recipe1.id);
      expect(retrieved?.name).toBe('Recipe 2');
    });
  });

  describe('getRecipe', () => {
    test('should return undefined for non-existent recipe', () => {
      expect(service.getRecipe('nonexistent')).toBeUndefined();
    });

    test('should return registered recipe', () => {
      const recipe = createRecipe();
      service.registerRecipe(recipe);
      
      expect(service.getRecipe(recipe.id)).toBe(recipe);
    });
  });

  describe('getAllRecipes', () => {
    test('should return empty array when no recipes registered', () => {
      expect(service.getAllRecipes()).toEqual([]);
    });

    test('should return all registered recipes', () => {
      const recipe1 = createRecipe({ id: 'recipe1' });
      const recipe2 = createRecipe({ id: 'recipe2' });
      
      service.registerRecipe(recipe1);
      service.registerRecipe(recipe2);
      
      const recipes = service.getAllRecipes();
      expect(recipes).toHaveLength(2);
      expect(recipes).toContain(recipe1);
      expect(recipes).toContain(recipe2);
    });
  });

  describe('canCraft', () => {
    test('should return true when all conditions are met', () => {
      const recipe = createRecipe();
      const inventory = createInventory();
      
      service.registerRecipe(recipe);
      const result = service.canCraft(recipe, inventory);
      
      expect(result.canCraft).toBe(true);
    });

    test('should return false when materials are insufficient', () => {
      const recipe = createRecipe();
      const inventory: InventoryItem[] = [
        { itemId: 'herb', quantity: 1 }, // Not enough
        { itemId: 'water', quantity: 1 }
      ];
      
      const result = service.canCraft(recipe, inventory);
      
      expect(result.canCraft).toBe(false);
      expect(result.reason).toBe('Insufficient materials');
      expect(result.missingMaterials).toBeDefined();
    });

    test('should return false when character does not meet level requirement', () => {
      const recipe = createRecipe({
        requirements: { level: 15 }
      });
      const inventory = createInventory();
      const character = createCharacter({ level: 10 });
      
      const result = service.canCraft(recipe, inventory, character);
      
      expect(result.canCraft).toBe(false);
      expect(result.reason).toBe('Character does not meet requirements');
    });

    test('should return true when character meets level requirement', () => {
      const recipe = createRecipe({
        requirements: { level: 10 }
      });
      const inventory = createInventory();
      const character = createCharacter({ level: 10 });
      
      const result = service.canCraft(recipe, inventory, character);
      
      expect(result.canCraft).toBe(true);
    });

    test('should return false when character does not have required skill', () => {
      const recipe = createRecipe({
        requirements: { skillId: 'alchemy' }
      });
      const inventory = createInventory();
      const character = createCharacter({ skills: [] });
      
      const result = service.canCraft(recipe, inventory, character);
      
      expect(result.canCraft).toBe(false);
    });

    test('should return true when character has required skill', () => {
      const recipe = createRecipe({
        requirements: { skillId: 'alchemy' }
      });
      const inventory = createInventory();
      const character = createCharacter({
        skills: [{ 
          id: 'alchemy', 
          name: 'Alchemy', 
          type: 'special', 
          targetType: 'self', 
          element: 'none',
          power: 0,
          accuracy: 1.0,
          criticalBonus: 0,
          isGuaranteedHit: true,
          description: 'Alchemy skill'
        }]
      });
      
      const result = service.canCraft(recipe, inventory, character);
      
      expect(result.canCraft).toBe(true);
    });
  });

  describe('craft', () => {
    test('should craft item successfully with 100% success rate', () => {
      const recipe = createRecipe({ baseSuccessRate: 1.0 });
      const inventory = createInventory();
      
      service.registerRecipe(recipe);
      const result = service.craft(recipe, inventory, undefined, 0.5);
      
      expect(result.success).toBe(true);
      expect(result.item).toBeDefined();
      expect(result.item?.id).toBe('potion');
      expect(result.materialsConsumed).toEqual(recipe.materials);
      expect(result.message).toContain('Successfully crafted');
    });

    test('should fail crafting with 0% success rate', () => {
      const recipe = createRecipe({ baseSuccessRate: 0.0 });
      const inventory = createInventory();
      
      service.registerRecipe(recipe);
      const result = service.craft(recipe, inventory, undefined, 0.5);
      
      expect(result.success).toBe(false);
      expect(result.item).toBeUndefined();
      expect(result.message).toContain('failed');
    });

    test('should consume materials on failure by default', () => {
      const recipe = createRecipe({ baseSuccessRate: 0.0 });
      const inventory = createInventory();
      
      service.registerRecipe(recipe);
      const result = service.craft(recipe, inventory, undefined, 0.5);
      
      expect(result.success).toBe(false);
      expect(result.materialsConsumed).toEqual(recipe.materials);
    });

    test('should not consume materials on failure when configured', () => {
      const serviceWithConfig = new CraftService({
        returnMaterialsOnFailure: true
      });
      const recipe = createRecipe({ baseSuccessRate: 0.0 });
      const inventory = createInventory();
      
      serviceWithConfig.registerRecipe(recipe);
      const result = serviceWithConfig.craft(recipe, inventory, undefined, 0.5);
      
      expect(result.success).toBe(false);
      expect(result.materialsConsumed).toEqual([]);
    });

    test('should fail when materials are insufficient', () => {
      const recipe = createRecipe();
      const inventory: InventoryItem[] = [
        { itemId: 'herb', quantity: 1 }
      ];
      
      const result = service.craft(recipe, inventory);
      
      expect(result.success).toBe(false);
      expect(result.materialsConsumed).toEqual([]);
      expect(result.message).toMatch(/Cannot craft|Insufficient/);
    });

    test('should fail when character requirements are not met', () => {
      const recipe = createRecipe({
        requirements: { level: 20 }
      });
      const inventory = createInventory();
      const character = createCharacter({ level: 10 });
      
      const result = service.craft(recipe, inventory, character);
      
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Cannot craft|does not meet requirements/);
    });

    test('should use random value correctly for success check', () => {
      const recipe = createRecipe({ baseSuccessRate: 0.7 });
      const inventory = createInventory();
      
      // Success case: random < successRate
      const successResult = service.craft(recipe, inventory, undefined, 0.6);
      expect(successResult.success).toBe(true);
      
      // Failure case: random >= successRate
      const failResult = service.craft(recipe, inventory, undefined, 0.8);
      expect(failResult.success).toBe(false);
    });
  });

  describe('getAvailableRecipes', () => {
    test('should return all recipes with their craftability status', () => {
      const recipe1 = createRecipe({ id: 'recipe1' });
      const recipe2 = createRecipe({
        id: 'recipe2',
        materials: [{ itemId: 'rare_item', quantity: 1 }]
      });
      
      service.registerRecipe(recipe1);
      service.registerRecipe(recipe2);
      
      const inventory = createInventory();
      const available = service.getAvailableRecipes(inventory);
      
      expect(available).toHaveLength(2);
      expect(available[0].canCraft).toBe(true);
      expect(available[1].canCraft).toBe(false);
    });
  });

  describe('getCraftableRecipes', () => {
    test('should return only craftable recipes', () => {
      const recipe1 = createRecipe({ id: 'recipe1' });
      const recipe2 = createRecipe({
        id: 'recipe2',
        materials: [{ itemId: 'rare_item', quantity: 1 }]
      });
      const recipe3 = createRecipe({ id: 'recipe3' });
      
      service.registerRecipe(recipe1);
      service.registerRecipe(recipe2);
      service.registerRecipe(recipe3);
      
      const inventory = createInventory();
      const craftable = service.getCraftableRecipes(inventory);
      
      expect(craftable).toHaveLength(2);
      expect(craftable.map(r => r.id)).toEqual(['recipe1', 'recipe3']);
    });

    test('should return empty array when no recipes are craftable', () => {
      const recipe = createRecipe({
        materials: [{ itemId: 'rare_item', quantity: 1 }]
      });
      
      service.registerRecipe(recipe);
      
      const inventory: InventoryItem[] = [];
      const craftable = service.getCraftableRecipes(inventory);
      
      expect(craftable).toEqual([]);
    });
  });
});
