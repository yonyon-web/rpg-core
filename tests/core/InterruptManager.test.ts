/**
 * Tests for InterruptManager
 */

import { InterruptManager } from '../../src/core/combat/InterruptManager';
import { InterruptContext, InterruptResult, InterruptDefinition } from '../../src/types/core/interrupt';
import { Character, Enemy } from '../../src/types';

describe('InterruptManager', () => {
  let manager: InterruptManager;

  const createCharacter = (id: string, name: string, job?: string): Character => ({
    id,
    name,
    job,
    level: 10,
    stats: {
      maxHp: 100,
      maxMp: 50,
      attack: 50,
      defense: 30,
      magic: 40,
      magicDefense: 25,
      speed: 60,
      luck: 15,
      accuracy: 10,
      evasion: 5,
      criticalRate: 0.05,
    },
    currentHp: 100,
    currentMp: 50,
    statusEffects: [],
    position: 0,
    learnedSkills: [],
  });

  const createEnemy = (id: string, name: string, enemyType: string): Enemy => ({
    id,
    name,
    level: 5,
    stats: {
      maxHp: 50,
      maxMp: 20,
      attack: 30,
      defense: 20,
      magic: 25,
      magicDefense: 15,
      speed: 40,
      luck: 10,
      accuracy: 8,
      evasion: 3,
      criticalRate: 0.03,
    },
    currentHp: 50,
    currentMp: 20,
    statusEffects: [],
    position: 0,
    enemyType,
    skills: [],
    aiStrategy: 'balanced',
    expReward: 50,
    moneyReward: 20,
  });

  beforeEach(() => {
    manager = new InterruptManager();
  });

  describe('registerCommon', () => {
    it('共通ルール割り込みを登録できる', () => {
      const definition: InterruptDefinition = {
        id: 'common-interrupt',
        name: 'Common Interrupt',
        priority: 100,
        handler: async () => ({ executed: false }),
        enabled: true,
      };

      manager.registerCommon(definition);
      expect(manager.getCount()).toBe(1);
      expect(manager.getCountByType('common')).toBe(1);
    });
  });

  describe('registerEnemy', () => {
    it('敵個別の割り込みを登録できる', () => {
      const definition: InterruptDefinition = {
        id: 'enemy-interrupt',
        name: 'Enemy Interrupt',
        priority: 80,
        handler: async () => ({ executed: false }),
        enabled: true,
      };

      manager.registerEnemy('dragon', definition);
      expect(manager.getCount()).toBe(1);
      expect(manager.getCountByType('enemy')).toBe(1);
    });
  });

  describe('registerCharacter', () => {
    it('キャラクター個別の割り込みを登録できる', () => {
      const definition: InterruptDefinition = {
        id: 'character-interrupt',
        name: 'Character Interrupt',
        priority: 90,
        handler: async () => ({ executed: false }),
        enabled: true,
      };

      manager.registerCharacter('hero1', definition);
      expect(manager.getCount()).toBe(1);
      expect(manager.getCountByType('character')).toBe(1);
    });
  });

  describe('registerJob', () => {
    it('ジョブ別の割り込みを登録できる', () => {
      const definition: InterruptDefinition = {
        id: 'job-interrupt',
        name: 'Job Interrupt',
        priority: 70,
        handler: async () => ({ executed: false }),
        enabled: true,
      };

      manager.registerJob('warrior', definition);
      expect(manager.getCount()).toBe(1);
      expect(manager.getCountByType('job')).toBe(1);
    });
  });

  describe('registerEquipment', () => {
    it('装備個別の割り込みを登録できる', () => {
      const definition: InterruptDefinition = {
        id: 'equipment-interrupt',
        name: 'Equipment Interrupt',
        priority: 65,
        handler: async () => ({ executed: false }),
        enabled: true,
      };

      manager.registerEquipment('sword-of-flames', definition);
      expect(manager.getCount()).toBe(1);
      expect(manager.getCountByType('equipment')).toBe(1);
    });
  });

  describe('unregister', () => {
    it('割り込みを削除できる', () => {
      const definition: InterruptDefinition = {
        id: 'test-interrupt',
        name: 'Test Interrupt',
        priority: 100,
        handler: async () => ({ executed: false }),
        enabled: true,
      };

      manager.registerCommon(definition);
      expect(manager.getCount()).toBe(1);

      const removed = manager.unregister('test-interrupt');
      expect(removed).toBe(true);
      expect(manager.getCount()).toBe(0);
    });

    it('存在しない割り込みの削除は失敗する', () => {
      const removed = manager.unregister('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('setEnabled', () => {
    it('割り込みを有効/無効化できる', () => {
      const definition: InterruptDefinition = {
        id: 'test-interrupt',
        name: 'Test Interrupt',
        priority: 100,
        handler: async () => ({ executed: true, message: 'Executed!' }),
        enabled: true,
      };

      manager.registerCommon(definition);
      
      const disabled = manager.setEnabled('test-interrupt', false);
      expect(disabled).toBe(true);
    });

    it('存在しない割り込みの有効化は失敗する', () => {
      const result = manager.setEnabled('non-existent', true);
      expect(result).toBe(false);
    });
  });

  describe('executeInterrupts', () => {
    it('共通ルールの割り込みが実行される', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime', 'slime');

      let executionCount = 0;
      const definition: InterruptDefinition = {
        id: 'common-interrupt',
        name: 'Common Interrupt',
        priority: 100,
        handler: async () => {
          executionCount++;
          return { executed: true, message: 'Common interrupt executed' };
        },
        enabled: true,
      };

      manager.registerCommon(definition);

      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 10 },
      };

      const results = await manager.executeInterrupts(context);
      expect(executionCount).toBe(1);
      expect(results.length).toBe(1);
      expect(results[0].executed).toBe(true);
    });

    it('敵タイプが一致する場合のみ敵個別の割り込みが実行される', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Dragon', 'dragon');

      let executionCount = 0;
      const definition: InterruptDefinition = {
        id: 'dragon-interrupt',
        name: 'Dragon Interrupt',
        priority: 80,
        handler: async () => {
          executionCount++;
          return { executed: true, message: 'Dragon interrupt executed' };
        },
        enabled: true,
      };

      manager.registerEnemy('dragon', definition);

      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 10 },
      };

      const results = await manager.executeInterrupts(context);
      expect(executionCount).toBe(1);
      expect(results.length).toBe(1);
    });

    it('敵タイプが異なる場合は敵個別の割り込みは実行されない', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime', 'slime');

      let executionCount = 0;
      const definition: InterruptDefinition = {
        id: 'dragon-interrupt',
        name: 'Dragon Interrupt',
        priority: 80,
        handler: async () => {
          executionCount++;
          return { executed: true };
        },
        enabled: true,
      };

      manager.registerEnemy('dragon', definition);

      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 10 },
      };

      const results = await manager.executeInterrupts(context);
      expect(executionCount).toBe(0);
      expect(results.length).toBe(0);
    });

    it('キャラクターIDが一致する場合のみキャラクター個別の割り込みが実行される', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createCharacter('hero2', 'Warrior');

      let executionCount = 0;
      const definition: InterruptDefinition = {
        id: 'hero2-interrupt',
        name: 'Hero2 Interrupt',
        priority: 90,
        handler: async () => {
          executionCount++;
          return { executed: true };
        },
        enabled: true,
      };

      manager.registerCharacter('hero2', definition);

      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 10 },
      };

      const results = await manager.executeInterrupts(context);
      expect(executionCount).toBe(1);
      expect(results.length).toBe(1);
    });

    it('ジョブが一致する場合のみジョブ別の割り込みが実行される', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createCharacter('hero2', 'Warrior', 'warrior');

      let executionCount = 0;
      const definition: InterruptDefinition = {
        id: 'warrior-interrupt',
        name: 'Warrior Interrupt',
        priority: 70,
        handler: async () => {
          executionCount++;
          return { executed: true };
        },
        enabled: true,
      };

      manager.registerJob('warrior', definition);

      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 10 },
      };

      const results = await manager.executeInterrupts(context);
      expect(executionCount).toBe(1);
      expect(results.length).toBe(1);
    });

    it('装備IDが一致する場合のみ装備個別の割り込みが実行される', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createCharacter('hero2', 'Warrior');

      // 装備を追加
      target.equipment = {
        weapon: {
          id: 'flame-sword',
          name: 'Flame Sword',
          type: 'weapon',
          levelRequirement: 5,
          statModifiers: { attack: 20 },
        },
      };

      let executionCount = 0;
      const definition: InterruptDefinition = {
        id: 'flame-sword-interrupt',
        name: 'Flame Sword Interrupt',
        priority: 65,
        handler: async () => {
          executionCount++;
          return { executed: true };
        },
        enabled: true,
      };

      manager.registerEquipment('flame-sword', definition);

      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 10 },
      };

      const results = await manager.executeInterrupts(context);
      expect(executionCount).toBe(1);
      expect(results.length).toBe(1);
    });

    it('装備IDが異なる場合は装備個別の割り込みは実行されない', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createCharacter('hero2', 'Warrior');

      // 異なる装備を追加
      target.equipment = {
        weapon: {
          id: 'iron-sword',
          name: 'Iron Sword',
          type: 'weapon',
          levelRequirement: 1,
          statModifiers: { attack: 10 },
        },
      };

      let executionCount = 0;
      const definition: InterruptDefinition = {
        id: 'flame-sword-interrupt',
        name: 'Flame Sword Interrupt',
        priority: 65,
        handler: async () => {
          executionCount++;
          return { executed: true };
        },
        enabled: true,
      };

      manager.registerEquipment('flame-sword', definition);

      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 10 },
      };

      const results = await manager.executeInterrupts(context);
      expect(executionCount).toBe(0);
      expect(results.length).toBe(0);
    });

    it('優先度順に割り込みが実行される', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime', 'slime');

      const executionOrder: number[] = [];

      manager.registerCommon({
        id: 'low-priority',
        name: 'Low Priority',
        priority: 10,
        handler: async () => {
          executionOrder.push(10);
          return { executed: true };
        },
        enabled: true,
      });

      manager.registerCommon({
        id: 'high-priority',
        name: 'High Priority',
        priority: 100,
        handler: async () => {
          executionOrder.push(100);
          return { executed: true };
        },
        enabled: true,
      });

      manager.registerCommon({
        id: 'medium-priority',
        name: 'Medium Priority',
        priority: 50,
        handler: async () => {
          executionOrder.push(50);
          return { executed: true };
        },
        enabled: true,
      });

      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 10 },
      };

      await manager.executeInterrupts(context);
      expect(executionOrder).toEqual([100, 50, 10]);
    });

    it('無効な割り込みは実行されない', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime', 'slime');

      let executionCount = 0;
      const definition: InterruptDefinition = {
        id: 'disabled-interrupt',
        name: 'Disabled Interrupt',
        priority: 100,
        handler: async () => {
          executionCount++;
          return { executed: true };
        },
        enabled: false,
      };

      manager.registerCommon(definition);

      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 10 },
      };

      const results = await manager.executeInterrupts(context);
      expect(executionCount).toBe(0);
      expect(results.length).toBe(0);
    });

    it('割り込みハンドラーでエラーが発生しても他の割り込みは続行される', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime', 'slime');

      let successfulExecutionCount = 0;

      manager.registerCommon({
        id: 'error-interrupt',
        name: 'Error Interrupt',
        priority: 100,
        handler: async () => {
          throw new Error('Test error');
        },
        enabled: true,
      });

      manager.registerCommon({
        id: 'success-interrupt',
        name: 'Success Interrupt',
        priority: 50,
        handler: async () => {
          successfulExecutionCount++;
          return { executed: true };
        },
        enabled: true,
      });

      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 10 },
      };

      const results = await manager.executeInterrupts(context);
      expect(results.length).toBe(2);
      expect(results[0].executed).toBe(false); // エラーが発生した割り込み
      expect(results[0].message).toContain('Error');
      expect(results[1].executed).toBe(true); // 成功した割り込み
      expect(successfulExecutionCount).toBe(1);
    });

    it('条件付き割り込みは条件が満たされた場合のみ実行される', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime', 'slime');

      let executionCount = 0;
      const conditionalDefinition: any = {
        id: 'conditional-interrupt',
        name: 'Conditional Interrupt',
        priority: 100,
        handler: async () => {
          executionCount++;
          return { executed: true };
        },
        enabled: true,
        condition: (context: InterruptContext) => {
          // ダメージが20以上の場合のみ実行
          return context.result.damage !== undefined && context.result.damage >= 20;
        },
      };
      
      manager.registerCommon(conditionalDefinition);

      // ダメージが条件未満
      let context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 10 },
      };
      let results = await manager.executeInterrupts(context);
      expect(executionCount).toBe(0);
      expect(results.length).toBe(0);

      // ダメージが条件以上
      context = {
        actor,
        target,
        result: { success: true, damage: 20 },
      };
      results = await manager.executeInterrupts(context);
      expect(executionCount).toBe(1);
      expect(results.length).toBe(1);
    });
  });

  describe('clear', () => {
    it('全ての割り込みをクリアできる', () => {
      manager.registerCommon({
        id: 'interrupt1',
        name: 'Interrupt 1',
        priority: 100,
        handler: async () => ({ executed: false }),
        enabled: true,
      });

      manager.registerCommon({
        id: 'interrupt2',
        name: 'Interrupt 2',
        priority: 90,
        handler: async () => ({ executed: false }),
        enabled: true,
      });

      expect(manager.getCount()).toBe(2);

      manager.clear();
      expect(manager.getCount()).toBe(0);
    });
  });
});
