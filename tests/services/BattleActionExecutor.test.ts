/**
 * Tests for BattleActionExecutor
 */

import { BattleActionExecutor } from '../../src/services/battle/BattleActionExecutor';
import { Character, Enemy, BattleState } from '../../src/types';
import { Skill } from '../../src/types/character/skill';
import { defaultGameConfig } from '../../src/config';

describe('BattleActionExecutor', () => {
  let executor: BattleActionExecutor;

  const createCharacter = (id: string, name: string, hp: number = 100, mp: number = 50): Character => ({
    id,
    name,
    level: 10,
    stats: {
      maxHp: hp,
      maxMp: mp,
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
    currentHp: hp,
    currentMp: mp,
    statusEffects: [],
    position: 0,
    learnedSkills: [],
  });

  const createEnemy = (id: string, name: string, hp: number = 50, mp: number = 20): Enemy => ({
    id,
    name,
    level: 5,
    stats: {
      maxHp: hp,
      maxMp: mp,
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
    currentHp: hp,
    currentMp: mp,
    statusEffects: [],
    position: 0,
    enemyType: 'slime',
    skills: [],
    aiStrategy: 'balanced',
    expReward: 50,
    moneyReward: 20,
  });

  beforeEach(() => {
    executor = new BattleActionExecutor(defaultGameConfig);
  });

  describe('executeAttack（通常攻撃）', () => {
    it('通常攻撃を実行してダメージを与える', () => {
      const attacker = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');
      const initialHp = target.currentHp;

      const action = {
        actor: attacker,
        type: 'attack' as const,
        targets: [target],
      };

      const result = executor.executeAttack(action);

      expect(result.success).toBe(true);
      // ダメージまたはミスのどちらか
      if (!result.missed) {
        expect(result.damage).toBeGreaterThan(0);
        expect(target.currentHp).toBeLessThan(initialHp);
      }
    });

    it('ターゲットがない場合はエラーを返す', () => {
      const attacker = createCharacter('hero1', 'Hero');

      const action = {
        actor: attacker,
        type: 'attack' as const,
        targets: [],
      };

      const result = executor.executeAttack(action);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No target');
    });
  });

  describe('executeSkill（スキル実行）', () => {
    it('ダメージスキルを実行する', () => {
      const skill: Skill = {
        id: 'skill1',
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

      const attacker = createCharacter('hero1', 'Hero');
      attacker.learnedSkills = [{ skill, level: 1, learnedAt: Date.now() }];
      const target = createEnemy('enemy1', 'Slime');
      const initialHp = target.currentHp;
      const initialMp = attacker.currentMp;

      const action = {
        actor: attacker,
        type: 'skill' as const,
        skill,
        targets: [target],
      };

      const result = executor.executeSkill(action);

      expect(result.success).toBe(true);
      expect(attacker.currentMp).toBe(initialMp - 10);
      if (!result.missed) {
        expect(target.currentHp).toBeLessThan(initialHp);
      }
    });

    it('回復スキルを実行する', () => {
      const healSkill: Skill = {
        id: 'heal1',
        name: 'Heal',
        type: 'heal',
        targetType: 'single-ally',
        power: 2.0,
        accuracy: 1.0,
        criticalBonus: 0,
        isGuaranteedHit: true,
        cost: { mp: 15 },
        element: 'none',
        description: 'Restores HP',
      };

      const attacker = createCharacter('hero1', 'Hero');
      attacker.currentHp = 50; // ダメージを受けた状態
      attacker.learnedSkills = [{ skill: healSkill, level: 1, learnedAt: Date.now() }];

      const action = {
        actor: attacker,
        type: 'skill' as const,
        skill: healSkill,
        targets: [attacker],
      };

      const initialHp = attacker.currentHp;
      const result = executor.executeSkill(action);

      expect(result.success).toBe(true);
      expect(result.heal).toBeGreaterThan(0);
      expect(attacker.currentHp).toBeGreaterThan(initialHp);
    });

    it('MPが不足している場合スキルを使用できない', () => {
      const skill: Skill = {
        id: 'skill1',
        name: 'Fire',
        type: 'magic',
        targetType: 'single-enemy',
        power: 2.0,
        accuracy: 1.0,
        criticalBonus: 0,
        isGuaranteedHit: true,
        cost: { mp: 100 },
        element: 'fire',
        description: 'Fire magic attack',
      };

      const attacker = createCharacter('hero1', 'Hero', 100, 50);
      attacker.learnedSkills = [{ skill, level: 1, learnedAt: Date.now() }];
      const target = createEnemy('enemy1', 'Slime');

      const action = {
        actor: attacker,
        type: 'skill' as const,
        skill,
        targets: [target],
      };

      const result = executor.executeSkill(action);

      expect(result.success).toBe(false);
      expect(result.message).toContain('MP');
    });

    it('スキルまたはターゲットが無効な場合はエラーを返す', () => {
      const attacker = createCharacter('hero1', 'Hero');

      const action = {
        actor: attacker,
        type: 'skill' as const,
        skill: undefined,
        targets: [],
      };

      const result = executor.executeSkill(action);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid skill or target');
    });
  });

  describe('executeDefend（防御）', () => {
    it('防御アクションを実行する', () => {
      const actor = createCharacter('hero1', 'Hero');

      const action = {
        actor,
        type: 'defend' as const,
        targets: [],
      };

      const result = executor.executeDefend(action);

      expect(result.success).toBe(true);
      expect(result.message).toContain('defending');
    });

    it('防御時に defense-up 状態異常を付与する', () => {
      const actor = createCharacter('hero1', 'Hero');
      const initialEffectsCount = actor.statusEffects.length;

      const action = {
        actor,
        type: 'defend' as const,
        targets: [],
      };

      const result = executor.executeDefend(action);

      expect(result.success).toBe(true);
      expect(actor.statusEffects.length).toBe(initialEffectsCount + 1);
      
      const defendEffect = actor.statusEffects[actor.statusEffects.length - 1];
      expect(defendEffect.type).toBe('defense-up');
      expect(defendEffect.category).toBe('buff');
      expect(defendEffect.duration).toBe(1);
      expect(defendEffect.power).toBe(2.0);
    });
  });

  describe('attemptEscape（逃走）', () => {
    it('逃走を試みて成功または失敗する', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [createEnemy('enemy1', 'Slime')];
      
      // 速度を大幅に上げて逃走成功率を高める
      party[0].stats.speed = 200;
      enemies[0].stats.speed = 10;

      const battleState: BattleState = {
        phase: 'player-turn',
        turnNumber: 1,
        playerParty: party,
        enemyGroup: enemies,
        turnOrder: [...party, ...enemies],
        currentActorIndex: 0,
        actionHistory: [],
      };

      // 複数回試行して成功を確認
      let succeeded = false;
      for (let i = 0; i < 20; i++) {
        const result = await executor.attemptEscape(battleState);
        if (result.success) {
          succeeded = true;
          expect(result.message).toBe('Escaped successfully!');
          break;
        }
      }

      expect(succeeded).toBe(true);
    });

    it('逃走に失敗する可能性がある', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [createEnemy('enemy1', 'Slime')];
      
      // 速度を下げて逃走成功率を低くする
      party[0].stats.speed = 10;
      enemies[0].stats.speed = 200;

      const battleState: BattleState = {
        phase: 'player-turn',
        turnNumber: 1,
        playerParty: party,
        enemyGroup: enemies,
        turnOrder: [...party, ...enemies],
        currentActorIndex: 0,
        actionHistory: [],
      };

      // 複数回試行して失敗も確認
      let failed = false;
      for (let i = 0; i < 20; i++) {
        const result = await executor.attemptEscape(battleState);
        if (!result.success) {
          failed = true;
          expect(result.message).toBe('Failed to escape!');
          break;
        }
      }

      expect(failed).toBe(true);
    });
  });

  describe('executeAction（アクション実行）', () => {
    it('攻撃アクションを実行する', async () => {
      const attacker = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');

      const action = {
        actor: attacker,
        type: 'attack' as const,
        targets: [target],
      };

      const result = await executor.executeAction(action);

      expect(result.success).toBe(true);
    });

    it('スキルアクションを実行する', async () => {
      const skill: Skill = {
        id: 'skill1',
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

      const attacker = createCharacter('hero1', 'Hero');
      attacker.learnedSkills = [{ skill, level: 1, learnedAt: Date.now() }];
      const target = createEnemy('enemy1', 'Slime');

      const action = {
        actor: attacker,
        type: 'skill' as const,
        skill,
        targets: [target],
      };

      const result = await executor.executeAction(action);

      expect(result.success).toBe(true);
    });

    it('防御アクションを実行する', async () => {
      const actor = createCharacter('hero1', 'Hero');

      const action = {
        actor,
        type: 'defend' as const,
        targets: [],
      };

      const result = await executor.executeAction(action);

      expect(result.success).toBe(true);
    });

    it('逃走アクションを実行する（battleState必須）', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [createEnemy('enemy1', 'Slime')];

      const battleState: BattleState = {
        phase: 'player-turn',
        turnNumber: 1,
        playerParty: party,
        enemyGroup: enemies,
        turnOrder: [...party, ...enemies],
        currentActorIndex: 0,
        actionHistory: [],
      };

      const action = {
        actor: party[0],
        type: 'escape' as const,
        targets: [],
      };

      const result = await executor.executeAction(action, battleState);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('逃走アクションでbattleStateがない場合はエラーを返す', async () => {
      const actor = createCharacter('hero1', 'Hero');

      const action = {
        actor,
        type: 'escape' as const,
        targets: [],
      };

      const result = await executor.executeAction(action);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Battle state required for escape');
    });

    it('不明なアクションタイプの場合はエラーを返す', async () => {
      const actor = createCharacter('hero1', 'Hero');

      const action = {
        actor,
        type: 'unknown' as any,
        targets: [],
      };

      const result = await executor.executeAction(action);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unknown action type');
    });
  });
});
