/**
 * EnhanceService テスト
 */

import { EnhanceService, ResourceManager } from '../../src/services/EnhanceService';
import type { EnhancableEquipment } from '../../src/types/craft';

describe('EnhanceService', () => {
  let service: EnhanceService;

  beforeEach(() => {
    service = new EnhanceService({
      maxLevel: 10,
      baseSuccessRate: 0.9,
      successRateDecay: 0.05,
      failurePenalty: 'none'
    });
  });

  // テスト用の装備作成ヘルパー
  const createEquipment = (overrides: Partial<EnhancableEquipment> = {}): EnhancableEquipment => ({
    id: 'sword1',
    enhanceLevel: 0,
    baseStats: {
      attack: 100,
      defense: 50
    },
    ...overrides
  });

  // テスト用のリソースマネージャー作成ヘルパー
  const createResourceManager = (gold: number = 10000, resources?: Record<string, number>): ResourceManager => ({
    gold,
    resources
  });

  describe('constructor', () => {
    test('should create service with config', () => {
      expect(service).toBeDefined();
      expect(service.getConfig().maxLevel).toBe(10);
    });

    test('should use default requirePayment', () => {
      expect(service.getConfig().requirePayment).toBe(true);
    });
  });

  describe('canEnhance', () => {
    test('should return true when equipment can be enhanced', () => {
      const equipment = createEquipment();
      const resourceManager = createResourceManager(10000);
      const result = service.canEnhance(equipment, resourceManager);
      
      expect(result.canEnhance).toBe(true);
      expect(result.successRate).toBeDefined();
      expect(result.cost).toBeDefined();
    });

    test('should return false when equipment is at max level', () => {
      const equipment = createEquipment({ enhanceLevel: 10 });
      const result = service.canEnhance(equipment);
      
      expect(result.canEnhance).toBe(false);
      expect(result.reason).toContain('max level');
    });

    test('should return false when gold is insufficient', () => {
      const equipment = createEquipment();
      const resourceManager = createResourceManager(0);
      const result = service.canEnhance(equipment, resourceManager);
      
      expect(result.canEnhance).toBe(false);
      expect(result.reason).toContain('Insufficient resources');
    });

    test('should not check gold when requirePayment is false', () => {
      const serviceNoPayment = new EnhanceService({
        maxLevel: 10,
        baseSuccessRate: 0.9,
        successRateDecay: 0.05,
        failurePenalty: 'none',
        requirePayment: false
      });
      
      const equipment = createEquipment();
      const resourceManager = createResourceManager(0);
      const result = serviceNoPayment.canEnhance(equipment, resourceManager);
      
      expect(result.canEnhance).toBe(true);
    });
  });

  describe('enhance', () => {
    test('should enhance equipment successfully with 100% success rate', () => {
      const serviceHighSuccess = new EnhanceService({
        maxLevel: 10,
        baseSuccessRate: 1.0,
        successRateDecay: 0,
        failurePenalty: 'none'
      });
      
      const equipment = createEquipment();
      const resourceManager = createResourceManager(10000);
      const result = serviceHighSuccess.enhance(equipment, resourceManager, 0.5);
      
      expect(result.success).toBe(true);
      expect(result.newLevel).toBe(1);
      expect(result.previousLevel).toBe(0);
      expect(result.stats).toBeDefined();
      expect(result.costConsumed).toBeDefined();
      expect(result.message).toContain('Successfully enhanced');
      expect(equipment.enhanceLevel).toBe(1);
      
      // ゴールドが消費されているか確認
      expect(resourceManager.gold).toBeLessThan(10000);
    });

    test('should fail enhancement with 0% success rate', () => {
      const serviceLowSuccess = new EnhanceService({
        maxLevel: 10,
        baseSuccessRate: 0.0,
        successRateDecay: 0,
        failurePenalty: 'none'
      });
      
      const equipment = createEquipment();
      const resourceManager = createResourceManager(10000);
      const initialGold = resourceManager.gold;
      const result = serviceLowSuccess.enhance(equipment, resourceManager, 0.5);
      
      expect(result.success).toBe(false);
      expect(result.newLevel).toBe(0);
      expect(result.destroyed).toBe(false);
      expect(result.costConsumed).toBeDefined();
      expect(result.message).toContain('failed');
      
      // 失敗してもゴールドが消費されているか確認
      expect(resourceManager.gold).toBeLessThan(initialGold);
    });

    test('should downgrade equipment on failure when penalty is downgrade', () => {
      const serviceWithPenalty = new EnhanceService({
        maxLevel: 10,
        baseSuccessRate: 0.0,
        successRateDecay: 0,
        failurePenalty: 'downgrade'
      });
      
      const equipment = createEquipment({ enhanceLevel: 5 });
      const resourceManager = createResourceManager(10000);
      const result = serviceWithPenalty.enhance(equipment, resourceManager, 0.5);
      
      expect(result.success).toBe(false);
      expect(result.newLevel).toBe(4);
      expect(result.message).toContain('downgraded');
      expect(equipment.enhanceLevel).toBe(4);
    });

    test('should destroy equipment on failure when penalty is destroy', () => {
      const serviceWithDestroy = new EnhanceService({
        maxLevel: 10,
        baseSuccessRate: 0.0,
        successRateDecay: 0,
        failurePenalty: 'destroy'
      });
      
      const equipment = createEquipment({ enhanceLevel: 5 });
      const resourceManager = createResourceManager(10000);
      const result = serviceWithDestroy.enhance(equipment, resourceManager, 0.5);
      
      expect(result.success).toBe(false);
      expect(result.destroyed).toBe(true);
      expect(result.message).toContain('destroyed');
    });

    test('should fail when equipment is at max level', () => {
      const equipment = createEquipment({ enhanceLevel: 10 });
      const resourceManager = createResourceManager(10000);
      const result = service.enhance(equipment, resourceManager);
      
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Cannot enhance|max level/);
    });

    test('should fail when gold is insufficient', () => {
      const equipment = createEquipment();
      const resourceManager = createResourceManager(0);
      const result = service.enhance(equipment, resourceManager);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient resources');
    });

    test('should use random value correctly for success check', () => {
      const equipment1 = createEquipment();
      const equipment2 = createEquipment();
      const rm1 = createResourceManager(10000);
      const rm2 = createResourceManager(10000);
      
      // Success case: random < successRate (0.9)
      const successResult = service.enhance(equipment1, rm1, 0.5);
      expect(successResult.success).toBe(true);
      
      // Failure case: random >= successRate (0.9)
      const failResult = service.enhance(equipment2, rm2, 0.95);
      expect(failResult.success).toBe(false);
    });

    test('should calculate enhanced stats correctly', () => {
      const serviceHighSuccess = new EnhanceService({
        maxLevel: 10,
        baseSuccessRate: 1.0,
        successRateDecay: 0,
        failurePenalty: 'none'
      });
      
      const equipment = createEquipment({
        baseStats: { attack: 100, defense: 50 }
      });
      
      const resourceManager = createResourceManager(10000);
      const result = serviceHighSuccess.enhance(equipment, resourceManager, 0.5);
      
      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      // +1レベルで10%ボーナス
      expect(result.stats!.attack).toBe(110);
      expect(result.stats!.defense).toBe(55);
    });

    test('should decrease success rate as level increases', () => {
      const equipment = createEquipment();
      
      const rate0 = service.getSuccessRate(equipment);
      equipment.enhanceLevel = 5;
      const rate5 = service.getSuccessRate(equipment);
      
      expect(rate5).toBeLessThan(rate0);
    });
  });

  describe('getEnhanceCost', () => {
    test('should return cost for level 0', () => {
      const equipment = createEquipment();
      const cost = service.getEnhanceCost(equipment);
      
      expect(cost).toBeDefined();
      expect(cost.gold).toBeGreaterThan(0);
    });

    test('should return higher cost for higher level', () => {
      const equipment1 = createEquipment({ enhanceLevel: 0 });
      const equipment2 = createEquipment({ enhanceLevel: 5 });
      
      const cost1 = service.getEnhanceCost(equipment1);
      const cost2 = service.getEnhanceCost(equipment2);
      
      expect(cost2.gold!).toBeGreaterThan(cost1.gold!);
    });
  });

  describe('getSuccessRate', () => {
    test('should return success rate', () => {
      const equipment = createEquipment();
      const rate = service.getSuccessRate(equipment);
      
      expect(rate).toBe(0.9);
    });

    test('should return lower success rate for higher level', () => {
      const equipment1 = createEquipment({ enhanceLevel: 0 });
      const equipment2 = createEquipment({ enhanceLevel: 5 });
      
      const rate1 = service.getSuccessRate(equipment1);
      const rate2 = service.getSuccessRate(equipment2);
      
      expect(rate2).toBeLessThan(rate1);
      expect(rate2).toBe(0.9 - 0.05 * 5);
    });

    test('should not return negative success rate', () => {
      const equipment = createEquipment({ enhanceLevel: 20 });
      const rate = service.getSuccessRate(equipment);
      
      expect(rate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('custom enhancement bonus', () => {
    test('should use custom stat bonuses when provided', () => {
      const serviceHighSuccess = new EnhanceService({
        maxLevel: 10,
        baseSuccessRate: 1.0,
        successRateDecay: 0,
        failurePenalty: 'none'
      });
      
      const equipment = createEquipment({
        baseStats: { attack: 100, defense: 50 },
        enhancementBonus: {
          statBonuses: {
            attack: 0.2, // 20% bonus per level
            defense: 0.05  // 5% bonus per level
          }
        }
      });
      
      const resourceManager = createResourceManager(10000);
      const result = serviceHighSuccess.enhance(equipment, resourceManager, 0.5);
      
      expect(result.success).toBe(true);
      expect(result.stats!.attack).toBe(120); // 100 + 100*1*0.2
      expect(result.stats!.defense).toBe(52);  // 50 + 50*1*0.05
    });
  });

  describe('custom resource costs', () => {
    test('should support custom resource costs', () => {
      const equipment = createEquipment({
        enhanceCost: {
          gold: 500,
          resources: {
            'enhancement_stone': 3,
            'magic_dust': 5
          }
        }
      });
      
      const resourceManager = createResourceManager(1000, {
        'enhancement_stone': 10,
        'magic_dust': 10
      });
      
      const serviceHighSuccess = new EnhanceService({
        maxLevel: 10,
        baseSuccessRate: 1.0,
        successRateDecay: 0,
        failurePenalty: 'none'
      });
      
      const result = serviceHighSuccess.enhance(equipment, resourceManager, 0.5);
      
      expect(result.success).toBe(true);
      expect(resourceManager.gold).toBe(500); // 1000 - 500
      expect(resourceManager.resources!['enhancement_stone']).toBe(7); // 10 - 3
      expect(resourceManager.resources!['magic_dust']).toBe(5); // 10 - 5
    });

    test('should fail when custom resources are insufficient', () => {
      const equipment = createEquipment({
        enhanceCost: {
          gold: 500,
          resources: {
            'enhancement_stone': 3
          }
        }
      });
      
      const resourceManager = createResourceManager(1000, {
        'enhancement_stone': 1 // Not enough
      });
      
      const result = service.canEnhance(equipment, resourceManager);
      
      expect(result.canEnhance).toBe(false);
      expect(result.reason).toContain('Insufficient resources');
    });
  });

  describe('updateConfig', () => {
    test('should update config', () => {
      service.updateConfig({ maxLevel: 15 });
      
      expect(service.getConfig().maxLevel).toBe(15);
    });

    test('should preserve other config values', () => {
      service.updateConfig({ maxLevel: 15 });
      
      expect(service.getConfig().baseSuccessRate).toBe(0.9);
      expect(service.getConfig().failurePenalty).toBe('none');
    });
  });

  describe('getConfig', () => {
    test('should return current config', () => {
      const config = service.getConfig();
      
      expect(config.maxLevel).toBe(10);
      expect(config.baseSuccessRate).toBe(0.9);
      expect(config.successRateDecay).toBe(0.05);
      expect(config.failurePenalty).toBe('none');
    });

    test('should return immutable config', () => {
      const config = service.getConfig();
      
      // Verify it's a copy by changing it
      (config as any).maxLevel = 999;
      
      // Original should be unchanged
      expect(service.getConfig().maxLevel).toBe(10);
    });
  });
});
