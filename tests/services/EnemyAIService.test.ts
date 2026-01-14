/**
 * Tests for EnemyAIService
 */

import { EnemyAIService } from '../../src/services/enemy/EnemyAIService';
import { Enemy, Character, BattleState } from '../../src/types';
import { Skill } from '../../src/types/character/skill';

describe('EnemyAIService', () => {
  let aiService: EnemyAIService;

  const createCharacter = (id: string, name: string, hp: number = 100, defense: number = 30): Character => ({
    id,
    name,
    level: 10,
    stats: {
      maxHp: hp,
      maxMp: 50,
      attack: 50,
      defense,
      magic: 40,
      magicDefense: 25,
      speed: 60,
      luck: 15,
      accuracy: 10,
      evasion: 5,
      criticalRate: 0.05,
    },
    currentHp: hp,
    currentMp: 50,
    statusEffects: [],
    position: 0,
    learnedSkills: [],
  });

  const createEnemy = (id: string, name: string, hp: number = 50, mp: number = 20, attack: number = 30): Enemy => ({
    id,
    name,
    level: 5,
    stats: {
      maxHp: hp,
      maxMp: mp,
      attack,
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

  const createSkill = (id: string, name: string, type: 'physical' | 'magic' | 'heal', power: number, mpCost: number = 10): Skill => ({
    id,
    name,
    type,
    targetType: type === 'heal' ? 'single-ally' : 'single-enemy',
    power,
    accuracy: 0.95,
    criticalBonus: 0,
    isGuaranteedHit: false,
    cost: { mp: mpCost },
    element: 'none',
    description: `${name} skill`,
  });

  const createBattleState = (party: Character[], enemies: Enemy[]): BattleState => ({
    phase: 'enemy-turn',
    turnNumber: 1,
    playerParty: party,
    enemyGroup: enemies,
    turnOrder: [...party, ...enemies],
    currentActorIndex: 0,
    actionHistory: [],
  });

  beforeEach(() => {
    aiService = new EnemyAIService();
  });

  describe('decideAction（行動決定）', () => {
    it('スキルがない場合は通常攻撃を選択する', async () => {
      const enemy = createEnemy('enemy1', 'Slime');
      const battleState = createBattleState([createCharacter('hero1', 'Hero')], [enemy]);

      const action = await aiService.decideAction(enemy, battleState);

      expect(action.type).toBe('attack');
      expect(action.actor).toBe(enemy);
      expect(action.targets.length).toBe(1);
    });

    it('スキルがある場合はスキルを使用する', async () => {
      const skill = createSkill('skill1', 'Fire', 'magic', 2.0);
      const enemy = createEnemy('enemy1', 'Slime');
      enemy.skills = [skill];
      const battleState = createBattleState([createCharacter('hero1', 'Hero')], [enemy]);

      const action = await aiService.decideAction(enemy, battleState);

      expect(action.type).toBe('skill');
      expect(action.skill).toBeDefined();
      expect(action.targets.length).toBeGreaterThan(0);
    });

    it('MPが不足している場合は通常攻撃を選択する', async () => {
      const skill = createSkill('skill1', 'Fire', 'magic', 2.0, 100);
      const enemy = createEnemy('enemy1', 'Slime', 50, 20);
      enemy.skills = [skill];
      const battleState = createBattleState([createCharacter('hero1', 'Hero')], [enemy]);

      const action = await aiService.decideAction(enemy, battleState);

      expect(action.type).toBe('attack');
    });

    it('全体攻撃スキルの場合は全員をターゲットにする', async () => {
      const skill: Skill = {
        id: 'skill1',
        name: 'Meteor',
        type: 'magic',
        targetType: 'all-enemies',
        power: 2.0,
        accuracy: 0.95,
        criticalBonus: 0,
        isGuaranteedHit: false,
        cost: { mp: 20 },
        element: 'fire',
        description: 'Fire all enemies',
      };

      const enemy = createEnemy('enemy1', 'Slime', 50, 50);
      enemy.skills = [skill];
      const party = [createCharacter('hero1', 'Hero1'), createCharacter('hero2', 'Hero2')];
      const battleState = createBattleState(party, [enemy]);

      const action = await aiService.decideAction(enemy, battleState);

      expect(action.type).toBe('skill');
      expect(action.targets.length).toBe(party.length);
    });
  });

  describe('evaluateSkills（スキル評価）', () => {
    it('スキルに評価スコアを付ける', () => {
      const skill1 = createSkill('skill1', 'Weak Attack', 'physical', 1.0);
      const skill2 = createSkill('skill2', 'Strong Attack', 'physical', 3.0);
      const enemy = createEnemy('enemy1', 'Slime');
      const battleState = createBattleState([createCharacter('hero1', 'Hero')], [enemy]);

      const situation = {
        turn: 1,
        allyParty: [enemy],
        enemyParty: [createCharacter('hero1', 'Hero')],
        averageAllyHpRate: 1.0,
        averageEnemyHpRate: 1.0,
        defeatedAllies: 0,
        defeatedEnemies: 0,
      };

      const evaluations = aiService.evaluateSkills(enemy, [skill1, skill2], situation);

      expect(evaluations).toHaveLength(2);
      expect(evaluations[0].skill).toBe(skill1);
      expect(evaluations[1].skill).toBe(skill2);
      expect(evaluations[0].score).toBeDefined();
      expect(evaluations[1].score).toBeDefined();
      // 強力なスキルの方が高スコアになるはず
      expect(evaluations[1].score).toBeGreaterThan(evaluations[0].score);
    });

    it('回復スキルはHPが低い時に高評価', () => {
      const attackSkill = createSkill('skill1', 'Attack', 'physical', 2.0);
      const healSkill = createSkill('heal1', 'Heal', 'heal', 2.0);
      const enemy = createEnemy('enemy1', 'Slime');
      const situation = {
        turn: 1,
        allyParty: [enemy],
        enemyParty: [createCharacter('hero1', 'Hero')],
        averageAllyHpRate: 0.3, // HP低い
        averageEnemyHpRate: 1.0,
        defeatedAllies: 0,
        defeatedEnemies: 0,
      };

      const evaluations = aiService.evaluateSkills(enemy, [attackSkill, healSkill], situation);

      const healEval = evaluations.find(e => e.skill.id === 'heal1');
      const attackEval = evaluations.find(e => e.skill.id === 'skill1');

      expect(healEval).toBeDefined();
      expect(attackEval).toBeDefined();
      // HPが低い時は回復スキルの方が高評価
      expect(healEval!.score).toBeGreaterThan(attackEval!.score);
    });
  });

  describe('evaluateTargets（ターゲット評価）', () => {
    it('ターゲットに評価スコアを付ける', () => {
      const enemy = createEnemy('enemy1', 'Slime');
      const skill = createSkill('skill1', 'Attack', 'physical', 2.0);
      const target1 = createCharacter('hero1', 'Hero1', 100, 50);
      const target2 = createCharacter('hero2', 'Hero2', 100, 10); // 防御力が低い

      const evaluations = aiService.evaluateTargets(enemy, skill, [target1, target2]);

      expect(evaluations).toHaveLength(2);
      expect(evaluations[0].target).toBe(target1);
      expect(evaluations[1].target).toBe(target2);
      expect(evaluations[0].score).toBeDefined();
      expect(evaluations[1].score).toBeDefined();
    });

    it('HPが低いターゲットを高評価する', () => {
      const enemy = createEnemy('enemy1', 'Slime');
      const skill = createSkill('skill1', 'Attack', 'physical', 2.0);
      const healthyTarget = createCharacter('hero1', 'Hero1', 100);
      const weakTarget = createCharacter('hero2', 'Hero2', 100);
      weakTarget.currentHp = 20; // HP低い

      const evaluations = aiService.evaluateTargets(enemy, skill, [healthyTarget, weakTarget]);

      const healthyEval = evaluations.find(e => e.target.id === 'hero1');
      const weakEval = evaluations.find(e => e.target.id === 'hero2');

      expect(healthyEval).toBeDefined();
      expect(weakEval).toBeDefined();
      // HPが低いターゲットの方が高評価
      expect(weakEval!.score).toBeGreaterThan(healthyEval!.score);
    });

    it('予想ダメージを計算する', () => {
      const enemy = createEnemy('enemy1', 'Slime', 50, 20, 50);
      const skill = createSkill('skill1', 'Attack', 'physical', 2.0);
      const target = createCharacter('hero1', 'Hero', 100, 20);

      const evaluations = aiService.evaluateTargets(enemy, skill, [target]);

      expect(evaluations[0].expectedDamage).toBeDefined();
      expect(evaluations[0].expectedDamage).toBeGreaterThan(0);
    });
  });

  describe('selectBestSkill（最適スキル選択）', () => {
    it('最もスコアが高いスキルを選択する（balanced戦略）', () => {
      const skill1 = createSkill('skill1', 'Weak', 'physical', 1.0);
      const skill2 = createSkill('skill2', 'Strong', 'physical', 3.0);
      const evaluations = [
        { skill: skill1, score: 10, reason: 'weak' },
        { skill: skill2, score: 30, reason: 'strong' },
      ];

      const bestSkill = aiService.selectBestSkill(evaluations, 'balanced');

      expect(bestSkill).toBe(skill2);
    });

    it('ランダムにスキルを選択する（random戦略）', () => {
      const skill1 = createSkill('skill1', 'Skill1', 'physical', 1.0);
      const skill2 = createSkill('skill2', 'Skill2', 'physical', 2.0);
      const evaluations = [
        { skill: skill1, score: 10, reason: 'test' },
        { skill: skill2, score: 30, reason: 'test' },
      ];

      // ランダム戦略では両方のスキルが選ばれうる
      const results = new Set();
      for (let i = 0; i < 20; i++) {
        const selected = aiService.selectBestSkill(evaluations, 'random');
        results.add(selected.id);
      }

      // 20回試行すれば両方選ばれる可能性が高い
      expect(results.size).toBeGreaterThan(0);
    });

    it('スキルがない場合はエラーを投げる', () => {
      expect(() => aiService.selectBestSkill([], 'balanced')).toThrow('No skills available');
    });
  });

  describe('selectBestTarget（最適ターゲット選択）', () => {
    it('最もスコアが高いターゲットを選択する（balanced戦略）', () => {
      const target1 = createCharacter('hero1', 'Hero1');
      const target2 = createCharacter('hero2', 'Hero2');
      const evaluations = [
        { target: target1, score: 10, expectedDamage: 20, reason: 'low' },
        { target: target2, score: 30, expectedDamage: 40, reason: 'high' },
      ];

      const bestTarget = aiService.selectBestTarget(evaluations, 'balanced');

      expect(bestTarget).toBe(target2);
    });

    it('ランダムにターゲットを選択する（random戦略）', () => {
      const target1 = createCharacter('hero1', 'Hero1');
      const target2 = createCharacter('hero2', 'Hero2');
      const evaluations = [
        { target: target1, score: 10, expectedDamage: 20, reason: 'test' },
        { target: target2, score: 30, expectedDamage: 40, reason: 'test' },
      ];

      // ランダム戦略では両方のターゲットが選ばれうる
      const results = new Set();
      for (let i = 0; i < 20; i++) {
        const selected = aiService.selectBestTarget(evaluations, 'random');
        results.add(selected.id);
      }

      // 20回試行すれば両方選ばれる可能性が高い
      expect(results.size).toBeGreaterThan(0);
    });

    it('ターゲットがない場合はエラーを投げる', () => {
      expect(() => aiService.selectBestTarget([], 'balanced')).toThrow('No targets available');
    });
  });

  describe('AI戦略', () => {
    it('aggressive戦略で行動を決定する', async () => {
      const skill = createSkill('skill1', 'Attack', 'physical', 2.0);
      const enemy = createEnemy('enemy1', 'Slime');
      enemy.aiStrategy = 'aggressive';
      enemy.skills = [skill];
      const battleState = createBattleState([createCharacter('hero1', 'Hero')], [enemy]);

      const action = await aiService.decideAction(enemy, battleState);

      expect(action).toBeDefined();
      expect(action.actor).toBe(enemy);
    });

    it('defensive戦略で行動を決定する', async () => {
      const skill = createSkill('skill1', 'Attack', 'physical', 2.0);
      const enemy = createEnemy('enemy1', 'Slime');
      enemy.aiStrategy = 'defensive';
      enemy.skills = [skill];
      const battleState = createBattleState([createCharacter('hero1', 'Hero')], [enemy]);

      const action = await aiService.decideAction(enemy, battleState);

      expect(action).toBeDefined();
      expect(action.actor).toBe(enemy);
    });

    it('support戦略で行動を決定する', async () => {
      const skill = createSkill('skill1', 'Attack', 'physical', 2.0);
      const enemy = createEnemy('enemy1', 'Slime');
      enemy.aiStrategy = 'support';
      enemy.skills = [skill];
      const battleState = createBattleState([createCharacter('hero1', 'Hero')], [enemy]);

      const action = await aiService.decideAction(enemy, battleState);

      expect(action).toBeDefined();
      expect(action.actor).toBe(enemy);
    });
  });
});
