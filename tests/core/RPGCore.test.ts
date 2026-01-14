/**
 * Tests for RPGCore
 * 依存関係注入システムのテスト
 */

import { RPGCore } from '../../src/core/RPGCore';
import { BattleService } from '../../src/services/battle/BattleService';
import { RewardService } from '../../src/services/system/RewardService';

describe('RPGCore', () => {
  describe('Dependency Injection', () => {
    it('should create RPGCore instance with default settings', () => {
      const rpg = new RPGCore();
      
      expect(rpg).toBeDefined();
      expect(rpg.config).toBeDefined();
      expect(rpg.eventBus).toBeDefined();
    });

    it('should provide access to all services', () => {
      const rpg = new RPGCore();
      
      expect(rpg.services.battle).toBeInstanceOf(BattleService);
      expect(rpg.services.item).toBeDefined();
      expect(rpg.services.equipment).toBeDefined();
      expect(rpg.services.party).toBeDefined();
      expect(rpg.services.statusEffect).toBeDefined();
      expect(rpg.services.inventory).toBeDefined();
      expect(rpg.services.reward).toBeInstanceOf(RewardService);
      expect(rpg.services.skillLearn).toBeDefined();
      expect(rpg.services.jobChange).toBeDefined();
      expect(rpg.services.craft).toBeDefined();
      expect(rpg.services.enhance).toBeDefined();
      expect(rpg.services.shop).toBeDefined();
      expect(rpg.services.command).toBeDefined();
      expect(rpg.services.enemyAI).toBeDefined();
      expect(rpg.services.enemyGroup).toBeDefined();
      expect(rpg.services.saveLoad).toBeDefined();
      expect(rpg.services.simulation).toBeDefined();
    });

    it('should inject dependencies into BattleService', () => {
      const rpg = new RPGCore();
      const battleService = rpg.services.battle;
      
      // BattleServiceがRewardServiceとBattleActionExecutorを持っていることを確認
      expect(battleService).toBeDefined();
      expect(battleService.getRewardService()).toBeDefined();
    });

    it('should return same instance for singleton services', () => {
      const rpg = new RPGCore();
      
      const battleService1 = rpg.services.battle;
      const battleService2 = rpg.services.battle;
      
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

      const rpg = new RPGCore({ config: customConfig });
      
      expect(rpg.config.combat.criticalMultiplier).toBe(3.0);
      expect(rpg.config.growth.expGrowthRate).toBe(1.5);
    });

    it('should provide access to controllers', () => {
      const rpg = new RPGCore();
      
      const battleController = rpg.controllers.battle();
      const itemController = rpg.controllers.item();
      
      expect(battleController).toBeDefined();
      expect(itemController).toBeDefined();
    });

    it('should allow custom service registration', () => {
      const rpg = new RPGCore();
      
      class CustomService {
        getValue() { return 42; }
      }
      
      rpg.container.register('customService', () => new CustomService());
      
      const customService = rpg.container.resolve<CustomService>('customService');
      expect(customService.getValue()).toBe(42);
    });

    it('should detect circular dependencies', () => {
      const rpg = new RPGCore();
      
      rpg.container.register('serviceA', (c) => {
        return { b: c.resolve('serviceB') };
      });
      
      rpg.container.register('serviceB', (c) => {
        return { a: c.resolve('serviceA') };
      });
      
      expect(() => {
        rpg.container.resolve('serviceA');
      }).toThrow('Circular dependency detected');
    });
  });

  describe('Service Container', () => {
    it('should list all registered services', () => {
      const rpg = new RPGCore();
      const services = rpg.container.getRegisteredServices();
      
      expect(services.length).toBeGreaterThan(0);
      expect(services).toContain('battleService');
      expect(services).toContain('itemService');
      expect(services).toContain('rewardService');
      expect(services).toContain('battleActionExecutor');
    });

    it('should check if service is registered', () => {
      const rpg = new RPGCore();
      
      expect(rpg.container.has('battleService')).toBe(true);
      expect(rpg.container.has('nonexistentService')).toBe(false);
    });
  });
});
