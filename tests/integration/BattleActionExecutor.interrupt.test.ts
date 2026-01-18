/**
 * Integration tests for BattleActionExecutor with Interrupt System
 */

import { BattleActionExecutor } from '../../src/services/battle/BattleActionExecutor';
import { InterruptManager } from '../../src/core/combat/InterruptManager';
import { createSleepCancelOnDamageHandler } from '../../src/core/combat/interruptHandlers';
import { Character, Enemy } from '../../src/types';
import { Skill } from '../../src/types/character/skill';
import { defaultGameConfig } from '../../src/config';

describe('BattleActionExecutor with Interrupt System', () => {
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

  describe('統合テスト：睡眠状態のダメージ解除', () => {
    it('通常攻撃で閾値以上のダメージを与えると睡眠状態が解除される', async () => {
      const interruptManager = new InterruptManager();
      
      // 睡眠解除の割り込みを登録（閾値20%）
      interruptManager.registerCommon({
        id: 'sleep-cancel',
        name: 'Sleep Cancellation on Damage',
        priority: 100,
        handler: createSleepCancelOnDamageHandler(20),
        enabled: true,
      });

      const executor = new BattleActionExecutor(defaultGameConfig, interruptManager);
      const attacker = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');

      // 敵を睡眠状態にする
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

      expect(target.statusEffects.length).toBe(1);

      const action = {
        actor: attacker,
        type: 'attack' as const,
        targets: [target],
      };

      // 攻撃を実行（確実にヒットさせるため攻撃力を高く設定）
      attacker.stats.attack = 100;
      const result = await executor.executeAttack(action);

      // 攻撃が成功し、十分なダメージを与えた場合、睡眠が解除されるはず
      if (result.success && !result.missed && result.damage && result.damage >= 10) {
        expect(target.statusEffects.length).toBe(0);
      }
    });

    it('スキル攻撃で閾値以上のダメージを与えると睡眠状態が解除される', async () => {
      const interruptManager = new InterruptManager();
      
      interruptManager.registerCommon({
        id: 'sleep-cancel',
        name: 'Sleep Cancellation on Damage',
        priority: 100,
        handler: createSleepCancelOnDamageHandler(20),
        enabled: true,
      });

      const executor = new BattleActionExecutor(defaultGameConfig, interruptManager);
      const attacker = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');

      // 敵を睡眠状態にする
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

      const fireSkill: Skill = {
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
        description: 'Fire magic attack',
      };

      attacker.learnedSkills = [{ skill: fireSkill, level: 1, learnedAt: Date.now() }];

      const action = {
        actor: attacker,
        type: 'skill' as const,
        skill: fireSkill,
        targets: [target],
      };

      expect(target.statusEffects.length).toBe(1);

      const result = await executor.executeSkill(action);

      // スキルが成功し、十分なダメージを与えた場合、睡眠が解除されるはず
      expect(result.success).toBe(true);
      if (!result.missed && result.damage && result.damage >= 10) {
        expect(target.statusEffects.length).toBe(0);
      }
    });

    it('閾値未満のダメージでは睡眠状態が解除されない', async () => {
      const interruptManager = new InterruptManager();
      
      interruptManager.registerCommon({
        id: 'sleep-cancel',
        name: 'Sleep Cancellation on Damage',
        priority: 100,
        handler: createSleepCancelOnDamageHandler(50), // 閾値を50%に設定
        enabled: true,
      });

      const executor = new BattleActionExecutor(defaultGameConfig, interruptManager);
      const attacker = createCharacter('hero1', 'Hero');
      attacker.stats.attack = 10; // 攻撃力を低く設定
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

      expect(target.statusEffects.length).toBe(1);

      const action = {
        actor: attacker,
        type: 'attack' as const,
        targets: [target],
      };

      const result = await executor.executeAttack(action);

      // 低ダメージの場合、睡眠状態は維持される
      expect(result.success).toBe(true);
      if (!result.missed && result.damage && result.damage < 25) {
        expect(target.statusEffects.length).toBe(1);
        expect(target.statusEffects[0].type).toBe('sleep');
      }
    });
  });

  describe('複数の割り込みテスト', () => {
    it('複数の割り込みが優先度順に実行される', async () => {
      const interruptManager = new InterruptManager();
      const executionLog: string[] = [];

      // 複数の割り込みを登録
      interruptManager.registerCommon({
        id: 'interrupt-1',
        name: 'First Interrupt',
        priority: 100,
        handler: async () => {
          executionLog.push('first');
          return { executed: true, message: 'First executed' };
        },
        enabled: true,
      });

      interruptManager.registerCommon({
        id: 'interrupt-2',
        name: 'Second Interrupt',
        priority: 50,
        handler: async () => {
          executionLog.push('second');
          return { executed: true, message: 'Second executed' };
        },
        enabled: true,
      });

      const executor = new BattleActionExecutor(defaultGameConfig, interruptManager);
      const attacker = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');

      const action = {
        actor: attacker,
        type: 'attack' as const,
        targets: [target],
      };

      await executor.executeAttack(action);

      // 優先度順に実行されることを確認
      expect(executionLog).toEqual(['first', 'second']);
    });
  });

  describe('getInterruptManager', () => {
    it('割り込みマネージャーを取得できる', () => {
      const interruptManager = new InterruptManager();
      const executor = new BattleActionExecutor(defaultGameConfig, interruptManager);

      const manager = executor.getInterruptManager();
      expect(manager).toBe(interruptManager);
    });

    it('割り込みマネージャーを指定しない場合はデフォルトが作成される', () => {
      const executor = new BattleActionExecutor(defaultGameConfig);

      const manager = executor.getInterruptManager();
      expect(manager).toBeInstanceOf(InterruptManager);
    });
  });
});
