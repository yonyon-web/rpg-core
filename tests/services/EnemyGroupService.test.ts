/**
 * Tests for EnemyGroupService
 */

import { EnemyGroupService, EnemyType, EnemyGroupType } from '../../src/services/enemy/EnemyGroupService';
import { Skill } from '../../src/types/character/skill';

describe('EnemyGroupService', () => {
  let enemyGroupService: EnemyGroupService;

  const createSkill = (id: string, name: string): Skill => ({
    id,
    name,
    type: 'physical',
    targetType: 'single-enemy',
    power: 1.5,
    accuracy: 0.9,
    criticalBonus: 0,
    isGuaranteedHit: false,
    cost: { mp: 0 },
    element: 'none',
    description: `${name} skill`,
  });

  const basicEnemyType: EnemyType = {
    id: 'slime',
    name: 'Slime',
    baseStats: {
      maxHp: 50,
      maxMp: 20,
      attack: 20,
      defense: 15,
      magic: 10,
      magicDefense: 10,
      speed: 30,
      luck: 5,
      accuracy: 8,
      evasion: 3,
      criticalRate: 0.03,
    },
    skills: [],
    aiStrategy: 'balanced',
    expReward: 50,
    moneyReward: 20,
  };

  beforeEach(() => {
    enemyGroupService = new EnemyGroupService();
  });

  describe('registerEnemyType（敵タイプ登録）', () => {
    it('敵タイプを登録できる', () => {
      enemyGroupService.registerEnemyType(basicEnemyType);

      const retrieved = enemyGroupService.getEnemyType('slime');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Slime');
    });

    it('複数の敵タイプを登録できる', () => {
      const goblinType: EnemyType = {
        ...basicEnemyType,
        id: 'goblin',
        name: 'Goblin',
      };

      enemyGroupService.registerEnemyType(basicEnemyType);
      enemyGroupService.registerEnemyType(goblinType);

      expect(enemyGroupService.getEnemyType('slime')).toBeDefined();
      expect(enemyGroupService.getEnemyType('goblin')).toBeDefined();
    });
  });

  describe('generateEnemyGroup（敵グループ生成）', () => {
    it('単一の敵グループを生成する', () => {
      enemyGroupService.registerEnemyType(basicEnemyType);

      const groupType: EnemyGroupType = {
        id: 'group1',
        name: 'Slime Group',
        enemies: [
          { typeId: 'slime', count: 1 },
        ],
        difficulty: 1.0,
      };

      const enemies = enemyGroupService.generateEnemyGroup(groupType, 5);

      expect(enemies).toHaveLength(1);
      expect(enemies[0].name).toBe('Slime');
      expect(enemies[0].level).toBe(5);
    });

    it('複数の敵を含むグループを生成する', () => {
      enemyGroupService.registerEnemyType(basicEnemyType);

      const groupType: EnemyGroupType = {
        id: 'group1',
        name: 'Slime Group',
        enemies: [
          { typeId: 'slime', count: 3 },
        ],
        difficulty: 1.0,
      };

      const enemies = enemyGroupService.generateEnemyGroup(groupType, 5);

      expect(enemies).toHaveLength(3);
      enemies.forEach(enemy => {
        expect(enemy.name).toBe('Slime');
        expect(enemy.level).toBe(5);
      });
    });

    it('異なる種類の敵を含むグループを生成する', () => {
      const goblinType: EnemyType = {
        ...basicEnemyType,
        id: 'goblin',
        name: 'Goblin',
      };

      enemyGroupService.registerEnemyType(basicEnemyType);
      enemyGroupService.registerEnemyType(goblinType);

      const groupType: EnemyGroupType = {
        id: 'group1',
        name: 'Mixed Group',
        enemies: [
          { typeId: 'slime', count: 2 },
          { typeId: 'goblin', count: 1 },
        ],
        difficulty: 1.0,
      };

      const enemies = enemyGroupService.generateEnemyGroup(groupType, 5);

      expect(enemies).toHaveLength(3);
      expect(enemies.filter(e => e.name === 'Slime')).toHaveLength(2);
      expect(enemies.filter(e => e.name === 'Goblin')).toHaveLength(1);
    });

    it('個別レベル指定を尊重する', () => {
      enemyGroupService.registerEnemyType(basicEnemyType);

      const groupType: EnemyGroupType = {
        id: 'group1',
        name: 'Mixed Level Group',
        enemies: [
          { typeId: 'slime', count: 1, level: 10 },
          { typeId: 'slime', count: 1, level: 5 },
        ],
        difficulty: 1.0,
      };

      const enemies = enemyGroupService.generateEnemyGroup(groupType, 1);

      expect(enemies).toHaveLength(2);
      expect(enemies[0].level).toBe(10);
      expect(enemies[1].level).toBe(5);
    });

    it('存在しない敵タイプを参照した場合エラーを投げる', () => {
      const groupType: EnemyGroupType = {
        id: 'group1',
        name: 'Invalid Group',
        enemies: [
          { typeId: 'invalid', count: 1 },
        ],
        difficulty: 1.0,
      };

      expect(() => enemyGroupService.generateEnemyGroup(groupType, 5)).toThrow('Enemy type not found');
    });
  });

  describe('initializeEnemy（敵初期化）', () => {
    it('敵を初期化する', () => {
      const enemy = enemyGroupService.initializeEnemy(basicEnemyType, 5);

      expect(enemy.name).toBe('Slime');
      expect(enemy.level).toBe(5);
      expect(enemy.currentHp).toBe(enemy.stats.maxHp);
      expect(enemy.currentMp).toBe(enemy.stats.maxMp);
      expect(enemy.aiStrategy).toBe('balanced');
      expect(enemy.expReward).toBeGreaterThan(0);
      expect(enemy.moneyReward).toBeGreaterThan(0);
    });

    it('レベルに応じてステータスがスケーリングされる', () => {
      const level1Enemy = enemyGroupService.initializeEnemy(basicEnemyType, 1);
      const level10Enemy = enemyGroupService.initializeEnemy(basicEnemyType, 10);

      expect(level10Enemy.stats.maxHp).toBeGreaterThan(level1Enemy.stats.maxHp);
      expect(level10Enemy.stats.attack).toBeGreaterThan(level1Enemy.stats.attack);
    });

    it('レベルに応じて報酬が増加する', () => {
      const level1Enemy = enemyGroupService.initializeEnemy(basicEnemyType, 1);
      const level10Enemy = enemyGroupService.initializeEnemy(basicEnemyType, 10);

      expect(level10Enemy.expReward).toBeGreaterThan(level1Enemy.expReward || 0);
      expect(level10Enemy.moneyReward).toBeGreaterThan(level1Enemy.moneyReward || 0);
    });

    it('スキルをコピーする', () => {
      const skill = createSkill('skill1', 'Attack');
      const enemyTypeWithSkills = {
        ...basicEnemyType,
        skills: [skill],
      };

      const enemy = enemyGroupService.initializeEnemy(enemyTypeWithSkills, 5);

      expect(enemy.skills).toHaveLength(1);
      expect(enemy.skills[0].name).toBe('Attack');
    });

    it('ドロップアイテムを設定する', () => {
      const enemyTypeWithDrops = {
        ...basicEnemyType,
        dropItems: [
          { itemId: 'potion', probability: 0.5, quantity: 1 },
        ],
      };

      const enemy = enemyGroupService.initializeEnemy(enemyTypeWithDrops, 5);

      expect(enemy.dropItems).toBeDefined();
      expect(enemy.dropItems).toHaveLength(1);
      expect(enemy.dropItems![0].itemId).toBe('potion');
    });

    it('ユニークなIDを生成する', () => {
      const enemy1 = enemyGroupService.initializeEnemy(basicEnemyType, 5);
      const enemy2 = enemyGroupService.initializeEnemy(basicEnemyType, 5);

      expect(enemy1.id).not.toBe(enemy2.id);
    });
  });

  describe('rollDrops（ドロップ判定）', () => {
    it('ドロップアイテムを判定する', () => {
      const enemyTypeWithDrops = {
        ...basicEnemyType,
        dropItems: [
          { itemId: 'potion', probability: 1.0, quantity: 1 }, // 必ずドロップ
        ],
      };

      const enemy = enemyGroupService.initializeEnemy(enemyTypeWithDrops, 5);
      const drops = enemyGroupService.rollDrops([enemy]);

      expect(drops.length).toBeGreaterThan(0);
      expect(drops[0].itemId).toBe('potion');
    });

    it('複数の敵からのドロップを集計する', () => {
      const enemyTypeWithDrops = {
        ...basicEnemyType,
        dropItems: [
          { itemId: 'potion', probability: 1.0, quantity: 1 },
        ],
      };

      const enemy1 = enemyGroupService.initializeEnemy(enemyTypeWithDrops, 5);
      const enemy2 = enemyGroupService.initializeEnemy(enemyTypeWithDrops, 5);
      const drops = enemyGroupService.rollDrops([enemy1, enemy2]);

      expect(drops.length).toBe(2);
    });

    it('ドロップアイテムがない敵を処理する', () => {
      const enemy = enemyGroupService.initializeEnemy(basicEnemyType, 5);
      const drops = enemyGroupService.rollDrops([enemy]);

      expect(drops).toEqual([]);
    });

    it('ドロップ確率を尊重する（統計的テスト）', () => {
      const enemyTypeWithDrops = {
        ...basicEnemyType,
        dropItems: [
          { itemId: 'rare-item', probability: 0.5, quantity: 1 },
        ],
      };

      const enemy = enemyGroupService.initializeEnemy(enemyTypeWithDrops, 5);

      // 100回試行して統計的に検証
      let dropCount = 0;
      for (let i = 0; i < 100; i++) {
        const drops = enemyGroupService.rollDrops([enemy]);
        if (drops.length > 0) {
          dropCount++;
        }
      }

      // 確率0.5なので、30～70回の範囲でドロップするはず
      expect(dropCount).toBeGreaterThan(30);
      expect(dropCount).toBeLessThan(70);
    });
  });

  describe('calculateRewards（報酬計算）', () => {
    it('単一の敵の報酬を計算する', () => {
      const enemy = enemyGroupService.initializeEnemy(basicEnemyType, 5);
      enemy.expReward = 100;
      enemy.moneyReward = 50;

      const rewards = enemyGroupService.calculateRewards([enemy]);

      expect(rewards.exp).toBe(100);
      expect(rewards.money).toBe(50);
    });

    it('複数の敵の報酬を合計する', () => {
      const enemy1 = enemyGroupService.initializeEnemy(basicEnemyType, 5);
      enemy1.expReward = 100;
      enemy1.moneyReward = 50;

      const enemy2 = enemyGroupService.initializeEnemy(basicEnemyType, 5);
      enemy2.expReward = 150;
      enemy2.moneyReward = 75;

      const rewards = enemyGroupService.calculateRewards([enemy1, enemy2]);

      expect(rewards.exp).toBe(250);
      expect(rewards.money).toBe(125);
    });

    it('報酬が未定義の敵を処理する', () => {
      const enemy = enemyGroupService.initializeEnemy(basicEnemyType, 5);
      enemy.expReward = undefined;
      enemy.moneyReward = undefined;

      const rewards = enemyGroupService.calculateRewards([enemy]);

      expect(rewards.exp).toBe(0);
      expect(rewards.money).toBe(0);
    });
  });

  describe('getEnemyType（敵タイプ取得）', () => {
    it('登録済みの敵タイプを取得する', () => {
      enemyGroupService.registerEnemyType(basicEnemyType);

      const retrieved = enemyGroupService.getEnemyType('slime');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Slime');
    });

    it('未登録の敵タイプはundefinedを返す', () => {
      const retrieved = enemyGroupService.getEnemyType('unknown');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAllEnemyTypes（全敵タイプ取得）', () => {
    it('全ての登録済み敵タイプを取得する', () => {
      const goblinType: EnemyType = {
        ...basicEnemyType,
        id: 'goblin',
        name: 'Goblin',
      };

      enemyGroupService.registerEnemyType(basicEnemyType);
      enemyGroupService.registerEnemyType(goblinType);

      const allTypes = enemyGroupService.getAllEnemyTypes();

      expect(allTypes).toHaveLength(2);
      expect(allTypes.map(t => t.id)).toContain('slime');
      expect(allTypes.map(t => t.id)).toContain('goblin');
    });

    it('登録がない場合は空配列を返す', () => {
      const allTypes = enemyGroupService.getAllEnemyTypes();

      expect(allTypes).toEqual([]);
    });
  });

  describe('ステータススケーリング', () => {
    it('カスタム倍率を使用する', () => {
      const enemyTypeWithMultipliers: EnemyType = {
        ...basicEnemyType,
        statMultipliers: {
          maxHp: 0.2, // レベルごとに20%増加
          attack: 0.15, // レベルごとに15%増加
        },
      };

      const level1Enemy = enemyGroupService.initializeEnemy(enemyTypeWithMultipliers, 1);
      const level10Enemy = enemyGroupService.initializeEnemy(enemyTypeWithMultipliers, 10);

      // レベル10は基本値の (1 + 9 * 0.2) = 2.8倍
      const expectedHp = Math.floor(basicEnemyType.baseStats.maxHp * (1 + 9 * 0.2));
      expect(level10Enemy.stats.maxHp).toBe(expectedHp);

      // レベル10は基本値の (1 + 9 * 0.15) = 2.35倍
      const expectedAttack = Math.floor(basicEnemyType.baseStats.attack * (1 + 9 * 0.15));
      expect(level10Enemy.stats.attack).toBe(expectedAttack);
    });

    it('倍率が指定されていないステータスはデフォルト倍率を使用する', () => {
      const enemyTypeWithPartialMultipliers: EnemyType = {
        ...basicEnemyType,
        statMultipliers: {
          maxHp: 0.2,
          // 他のステータスは指定なし -> デフォルト0.1を使用
        },
      };

      const level1Enemy = enemyGroupService.initializeEnemy(enemyTypeWithPartialMultipliers, 1);
      const level10Enemy = enemyGroupService.initializeEnemy(enemyTypeWithPartialMultipliers, 10);

      // HPはカスタム倍率
      const expectedHp = Math.floor(basicEnemyType.baseStats.maxHp * (1 + 9 * 0.2));
      expect(level10Enemy.stats.maxHp).toBe(expectedHp);

      // 攻撃力はデフォルト倍率 (1 + 9 * 0.1) = 1.9倍
      const expectedAttack = Math.floor(basicEnemyType.baseStats.attack * (1 + 9 * 0.1));
      expect(level10Enemy.stats.attack).toBe(expectedAttack);
    });
  });
});
