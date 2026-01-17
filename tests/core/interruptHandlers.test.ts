/**
 * Tests for interrupt handlers
 */

import {
  createSleepCancelOnDamageHandler,
  createConfusionCancelOnDamageHandler,
  createCounterAttackHandler,
  createHPDrainHandler,
  createCriticalHealthPowerUpHandler,
} from '../../src/core/combat/interruptHandlers';
import { InterruptContext } from '../../src/types/core/interrupt';
import { Character, Enemy } from '../../src/types';
import { Skill } from '../../src/types/character/skill';

describe('Interrupt Handlers', () => {
  const createCharacter = (id: string, name: string): Character => ({
    id,
    name,
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

  const createEnemy = (id: string, name: string): Enemy => ({
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
    enemyType: 'slime',
    skills: [],
    aiStrategy: 'balanced',
    expReward: 50,
    moneyReward: 20,
  });

  describe('createSleepCancelOnDamageHandler', () => {
    it('閾値以上のダメージで睡眠状態が解除される', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');

      // 睡眠状態を付与
      target.statusEffects.push({
        id: 'sleep-1',
        type: 'sleep',
        category: 'disable',
        name: 'Sleep',
        description: 'Cannot act',
        power: 1,
        duration: 3,
        maxDuration: 3,
        stackCount: 1,
        maxStack: 1,
        canBeDispelled: true,
        appliedAt: Date.now(),
      });

      const handler = createSleepCancelOnDamageHandler(20);
      
      // 最大HPの20%のダメージ（50の20% = 10）
      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 10 },
      };

      const result = await handler(context);

      expect(result.executed).toBe(true);
      expect(result.stateChanged).toBe(true);
      expect(result.message).toContain('woke up');
      expect(target.statusEffects.length).toBe(0);
    });

    it('閾値未満のダメージでは睡眠状態が解除されない', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');

      target.statusEffects.push({
        id: 'sleep-1',
        type: 'sleep',
        category: 'disable',
        name: 'Sleep',
        description: 'Cannot act',
        power: 1,
        duration: 3,
        maxDuration: 3,
        stackCount: 1,
        maxStack: 1,
        canBeDispelled: true,
        appliedAt: Date.now(),
      });

      const handler = createSleepCancelOnDamageHandler(20);
      
      // 最大HPの20%未満のダメージ（50の10% = 5）
      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 5 },
      };

      const result = await handler(context);

      expect(result.executed).toBe(false);
      expect(target.statusEffects.length).toBe(1);
    });

    it('睡眠状態でない場合は何もしない', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');

      const handler = createSleepCancelOnDamageHandler(20);
      
      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 20 },
      };

      const result = await handler(context);

      expect(result.executed).toBe(false);
    });

    it('ダメージがない場合は何もしない', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');

      target.statusEffects.push({
        id: 'sleep-1',
        type: 'sleep',
        category: 'disable',
        name: 'Sleep',
        description: 'Cannot act',
        power: 1,
        duration: 3,
        maxDuration: 3,
        stackCount: 1,
        maxStack: 1,
        canBeDispelled: true,
        appliedAt: Date.now(),
      });

      const handler = createSleepCancelOnDamageHandler(20);
      
      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, missed: true },
      };

      const result = await handler(context);

      expect(result.executed).toBe(false);
      expect(target.statusEffects.length).toBe(1);
    });
  });

  describe('createConfusionCancelOnDamageHandler', () => {
    it('閾値以上のダメージで混乱状態が解除される', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');

      target.statusEffects.push({
        id: 'confusion-1',
        type: 'confusion',
        category: 'disable',
        name: 'Confusion',
        description: 'May attack allies',
        power: 1,
        duration: 3,
        maxDuration: 3,
        stackCount: 1,
        maxStack: 1,
        canBeDispelled: true,
        appliedAt: Date.now(),
      });

      const handler = createConfusionCancelOnDamageHandler(25);
      
      // 最大HPの25%のダメージ
      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 13 },
      };

      const result = await handler(context);

      expect(result.executed).toBe(true);
      expect(result.stateChanged).toBe(true);
      expect(result.message).toContain('snapped out');
      expect(target.statusEffects.length).toBe(0);
    });
  });

  describe('createCounterAttackHandler', () => {
    it('カウンターが発動してダメージを与える', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');

      // カウンター率100%に設定
      const handler = createCounterAttackHandler(1.0, 0.5);

      const physicalSkill: Skill = {
        id: 'sword-slash',
        name: 'Sword Slash',
        type: 'physical',
        targetType: 'single-enemy',
        power: 1.5,
        accuracy: 0.95,
        criticalBonus: 0.1,
        isGuaranteedHit: false,
        cost: {},
        element: 'none',
        description: 'Physical attack',
      };
      
      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 20 },
        skill: physicalSkill,
      };

      const initialHp = actor.currentHp;
      const result = await handler(context);

      expect(result.executed).toBe(true);
      expect(result.stateChanged).toBe(true);
      expect(result.message).toContain('countered');
      expect(actor.currentHp).toBeLessThan(initialHp);
    });

    it('魔法攻撃ではカウンターが発動しない', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');

      const handler = createCounterAttackHandler(1.0, 0.5);

      const magicSkill: Skill = {
        id: 'fire',
        name: 'Fire',
        type: 'magic',
        targetType: 'single-enemy',
        power: 2.0,
        accuracy: 1.0,
        criticalBonus: 0,
        isGuaranteedHit: true,
        cost: { mp: 10 },
        element: 'fire',
        description: 'Fire magic',
      };
      
      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 20 },
        skill: magicSkill,
      };

      const result = await handler(context);

      expect(result.executed).toBe(false);
    });

    it('ミスした攻撃ではカウンターが発動しない', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');

      const handler = createCounterAttackHandler(1.0, 0.5);
      
      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, missed: true },
      };

      const result = await handler(context);

      expect(result.executed).toBe(false);
    });
  });

  describe('createHPDrainHandler', () => {
    it('ダメージの一定割合のHPを吸収する', async () => {
      const actor = createCharacter('hero1', 'Hero');
      actor.currentHp = 50; // HPを減らしておく
      const target = createEnemy('enemy1', 'Slime');

      const handler = createHPDrainHandler(0.5); // 50%吸収
      
      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 20 },
      };

      const initialHp = actor.currentHp;
      const result = await handler(context);

      expect(result.executed).toBe(true);
      expect(result.stateChanged).toBe(true);
      expect(result.message).toContain('drained');
      expect(actor.currentHp).toBeGreaterThan(initialHp);
      expect(actor.currentHp).toBe(initialHp + 10); // 20 * 0.5 = 10
    });

    it('最大HPを超えて回復しない', async () => {
      const actor = createCharacter('hero1', 'Hero');
      actor.currentHp = 95; // ほぼ満タン
      const target = createEnemy('enemy1', 'Slime');

      const handler = createHPDrainHandler(0.5);
      
      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 20 },
      };

      const result = await handler(context);

      expect(result.executed).toBe(true);
      expect(actor.currentHp).toBe(100); // 最大HPで止まる
    });

    it('ダメージがない場合は何もしない', async () => {
      const actor = createCharacter('hero1', 'Hero');
      actor.currentHp = 50;
      const target = createEnemy('enemy1', 'Slime');

      const handler = createHPDrainHandler(0.5);
      
      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, missed: true },
      };

      const result = await handler(context);

      expect(result.executed).toBe(false);
      expect(actor.currentHp).toBe(50);
    });
  });

  describe('createCriticalHealthPowerUpHandler', () => {
    it('HP閾値以下で攻撃力アップの状態異常が付与される', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');
      target.currentHp = 10; // 最大HPの20%

      const handler = createCriticalHealthPowerUpHandler(25, 1.5);
      
      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 10 },
      };

      const result = await handler(context);

      expect(result.executed).toBe(true);
      expect(result.stateChanged).toBe(true);
      expect(result.message).toContain('power increased');
      expect(target.statusEffects.length).toBe(1);
      expect(target.statusEffects[0].type).toBe('attack-up');
    });

    it('HP閾値以上では何もしない', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');
      target.currentHp = 30; // 最大HPの60%

      const handler = createCriticalHealthPowerUpHandler(25, 1.5);
      
      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 10 },
      };

      const result = await handler(context);

      expect(result.executed).toBe(false);
      expect(target.statusEffects.length).toBe(0);
    });

    it('既に攻撃力アップ状態の場合は重複しない', async () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');
      target.currentHp = 10;

      // 既に攻撃力アップ状態
      target.statusEffects.push({
        id: 'existing-attack-up',
        type: 'attack-up',
        category: 'buff',
        name: 'Existing Power',
        description: 'Existing power up',
        power: 1.5,
        duration: 5,
        maxDuration: 5,
        stackCount: 1,
        maxStack: 1,
        canBeDispelled: true,
        appliedAt: Date.now(),
        source: 'critical-health',
      });

      const handler = createCriticalHealthPowerUpHandler(25, 1.5);
      
      const context: InterruptContext = {
        actor,
        target,
        result: { success: true, damage: 10 },
      };

      const result = await handler(context);

      expect(result.executed).toBe(false);
      expect(target.statusEffects.length).toBe(1); // 重複しない
    });
  });
});
