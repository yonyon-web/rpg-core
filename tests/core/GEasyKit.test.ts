/**
 * Tests for GEasyKit
 * 依存関係注入システムのテスト
 */

import { GEasyKit } from '../../src/core/GEasyKit';
import { BattleService } from '../../src/services/battle/BattleService';
import { RewardService } from '../../src/services/system/RewardService';

describe('GEasyKit', () => {
  describe('Dependency Injection', () => {
    it('should create GEasyKit instance with default settings', () => {
      const kit = new GEasyKit();
      
      expect(kit).toBeDefined();
      expect(kit.config).toBeDefined();
      expect(kit.eventBus).toBeDefined();
    });

    it('should provide access to all services', () => {
      const kit = new GEasyKit();
      
      expect(kit.services.battle).toBeInstanceOf(BattleService);
      expect(kit.services.item).toBeDefined();
      expect(kit.services.equipment).toBeDefined();
      expect(kit.services.party).toBeDefined();
      expect(kit.services.statusEffect).toBeDefined();
      expect(kit.services.inventory).toBeDefined();
      expect(kit.services.reward).toBeInstanceOf(RewardService);
      expect(kit.services.skillLearn).toBeDefined();
      expect(kit.services.jobChange).toBeDefined();
      expect(kit.services.craft).toBeDefined();
      expect(kit.services.enhance).toBeDefined();
      expect(kit.services.shop).toBeDefined();
      expect(kit.services.command).toBeDefined();
      expect(kit.services.enemyAI).toBeDefined();
      expect(kit.services.enemyGroup).toBeDefined();
      expect(kit.services.saveLoad).toBeDefined();
      expect(kit.services.simulation).toBeDefined();
    });

    it('should inject dependencies into BattleService', () => {
      const kit = new GEasyKit();
      const battleService = kit.services.battle;
      
      // BattleServiceがRewardServiceとBattleActionExecutorを持っていることを確認
      expect(battleService).toBeDefined();
      expect(battleService.getRewardService()).toBeDefined();
    });

    it('should return same instance for singleton services', () => {
      const kit = new GEasyKit();
      
      const battleService1 = kit.services.battle;
      const battleService2 = kit.services.battle;
      
      expect(battleService1).toBe(battleService2);
    });

    it('should allow custom configuration', () => {
      const customConfig = {
        combat: {
          baseCriticalRate: 0.1,
          criticalMultiplier: 3.0,
          damageVariance: 0.15,
          escapeBaseRate: 0.5,
          escapeRateIncrement: 0.1,
          preemptiveStrikeThreshold: 50,
          speedVariance: 0.1,
        },
        growth: {
          expCurve: 'exponential' as const,
          baseExpRequired: 100,
          expGrowthRate: 1.5,
          maxLevel: 99,
          statGrowthRates: {
            maxHp: 15,
            maxMp: 8,
            attack: 4,
            defense: 3,
            magic: 4,
            magicDefense: 3,
            speed: 2,
            luck: 1,
            accuracy: 1,
            evasion: 1,
            criticalRate: 0.01,
          },
        },
        balance: {
          maxPartySize: 4,
          dropRateModifier: 1.0,
        },
      };

      const kit = new GEasyKit({ config: customConfig });
      
      expect(kit.config.combat.criticalMultiplier).toBe(3.0);
      expect(kit.config.growth.expGrowthRate).toBe(1.5);
    });

    it('should provide access to controllers', () => {
      const kit = new GEasyKit();
      
      const battleController = kit.controllers.battle();
      const itemController = kit.controllers.item();
      
      expect(battleController).toBeDefined();
      expect(itemController).toBeDefined();
    });

    it('should allow custom service registration', () => {
      const kit = new GEasyKit();
      
      class CustomService {
        getValue() { return 42; }
      }
      
      kit.container.register('customService', () => new CustomService());
      
      const customService = kit.container.resolve<CustomService>('customService');
      expect(customService.getValue()).toBe(42);
    });

    it('should detect circular dependencies', () => {
      const kit = new GEasyKit();
      
      kit.container.register('serviceA', (c) => {
        return { b: c.resolve('serviceB') };
      });
      
      kit.container.register('serviceB', (c) => {
        return { a: c.resolve('serviceA') };
      });
      
      expect(() => {
        kit.container.resolve('serviceA');
      }).toThrow('Circular dependency detected');
    });
  });

  describe('Service Container', () => {
    it('should list all registered services', () => {
      const kit = new GEasyKit();
      const services = kit.container.getRegisteredServices();
      
      expect(services.length).toBeGreaterThan(0);
      expect(services).toContain('battleService');
      expect(services).toContain('itemService');
      expect(services).toContain('rewardService');
      expect(services).toContain('battleActionExecutor');
    });

    it('should check if service is registered', () => {
      const kit = new GEasyKit();
      
      expect(kit.container.has('battleService')).toBe(true);
      expect(kit.container.has('nonexistentService')).toBe(false);
    });
  });
});
