/**
 * EnemyAppearanceService のテスト
 */

import { EnemyAppearanceService } from '../../../src/services/encounter/EnemyAppearanceService';
import { EnemyGroupService, EnemyGroupType } from '../../../src/services/enemy/EnemyGroupService';
import { UniqueId } from '../../../src/types/common';

describe('EnemyAppearanceService', () => {
  let enemyGroupService: EnemyGroupService;
  let appearanceService: EnemyAppearanceService;

  beforeEach(() => {
    enemyGroupService = new EnemyGroupService();
    appearanceService = new EnemyAppearanceService(enemyGroupService);

    // テスト用の敵タイプを登録
    enemyGroupService.registerEnemyType({
      id: 'slime' as UniqueId,
      name: 'スライム',
      baseStats: {
        maxHp: 30,
        maxMp: 10,
        attack: 10,
        defense: 5,
        magic: 5,
        magicDefense: 5,
        speed: 8,
        luck: 5,
        accuracy: 90,
        evasion: 5,
        criticalRate: 0.05
      },
      skills: [],
      aiStrategy: 'random',
      expReward: 10,
      moneyReward: 5
    });

    enemyGroupService.registerEnemyType({
      id: 'goblin' as UniqueId,
      name: 'ゴブリン',
      baseStats: {
        maxHp: 50,
        maxMp: 5,
        attack: 15,
        defense: 8,
        magic: 3,
        magicDefense: 5,
        speed: 10,
        luck: 7,
        accuracy: 85,
        evasion: 10,
        criticalRate: 0.1
      },
      skills: [],
      aiStrategy: 'aggressive',
      expReward: 20,
      moneyReward: 10
    });

    enemyGroupService.registerEnemyType({
      id: 'dragon' as UniqueId,
      name: 'ドラゴン',
      baseStats: {
        maxHp: 200,
        maxMp: 50,
        attack: 40,
        defense: 30,
        magic: 35,
        magicDefense: 25,
        speed: 15,
        luck: 10,
        accuracy: 95,
        evasion: 5,
        criticalRate: 0.15
      },
      skills: [],
      aiStrategy: 'balanced',
      expReward: 100,
      moneyReward: 50
    });
  });

  describe('プールの登録と管理', () => {
    test('プールを登録できる', () => {
      const groupType: EnemyGroupType = {
        id: 'slime-group' as UniqueId,
        name: 'スライムグループ',
        enemies: [
          { typeId: 'slime' as UniqueId, count: 3 }
        ],
        difficulty: 1.0
      };

      appearanceService.registerPool({
        id: 'forest-pool' as UniqueId,
        name: '森エリア',
        appearances: [
          { groupType, weight: 1.0 }
        ],
        defaultLevel: 5
      });

      const pool = appearanceService.getPool('forest-pool' as UniqueId);
      expect(pool).toBeDefined();
      expect(pool?.name).toBe('森エリア');
      expect(pool?.appearances).toHaveLength(1);
    });

    test('重みが0以下のプールを登録するとエラー', () => {
      const groupType: EnemyGroupType = {
        id: 'slime-group' as UniqueId,
        name: 'スライムグループ',
        enemies: [
          { typeId: 'slime' as UniqueId, count: 3 }
        ],
        difficulty: 1.0
      };

      expect(() => {
        appearanceService.registerPool({
          id: 'invalid-pool' as UniqueId,
          name: '無効プール',
          appearances: [
            { groupType, weight: 0 }
          ]
        });
      }).toThrow('has invalid total weight');
    });

    test('プールを削除できる', () => {
      const groupType: EnemyGroupType = {
        id: 'slime-group' as UniqueId,
        name: 'スライムグループ',
        enemies: [
          { typeId: 'slime' as UniqueId, count: 3 }
        ],
        difficulty: 1.0
      };

      appearanceService.registerPool({
        id: 'temp-pool' as UniqueId,
        name: '一時プール',
        appearances: [
          { groupType, weight: 1.0 }
        ]
      });

      expect(appearanceService.getPool('temp-pool' as UniqueId)).toBeDefined();
      
      const removed = appearanceService.removePool('temp-pool' as UniqueId);
      expect(removed).toBe(true);
      expect(appearanceService.getPool('temp-pool' as UniqueId)).toBeUndefined();
    });

    test('全てのプールを取得できる', () => {
      const groupType: EnemyGroupType = {
        id: 'slime-group' as UniqueId,
        name: 'スライムグループ',
        enemies: [
          { typeId: 'slime' as UniqueId, count: 3 }
        ],
        difficulty: 1.0
      };

      appearanceService.registerPool({
        id: 'pool1' as UniqueId,
        name: 'プール1',
        appearances: [{ groupType, weight: 1.0 }]
      });

      appearanceService.registerPool({
        id: 'pool2' as UniqueId,
        name: 'プール2',
        appearances: [{ groupType, weight: 1.0 }]
      });

      const allPools = appearanceService.getAllPools();
      expect(allPools).toHaveLength(2);
    });
  });

  describe('敵グループの抽選', () => {
    test('重みが1つの場合、そのグループが選択される', () => {
      const groupType: EnemyGroupType = {
        id: 'slime-group' as UniqueId,
        name: 'スライムグループ',
        enemies: [
          { typeId: 'slime' as UniqueId, count: 3 }
        ],
        difficulty: 1.0
      };

      appearanceService.registerPool({
        id: 'simple-pool' as UniqueId,
        name: 'シンプルプール',
        appearances: [
          { groupType, weight: 1.0 }
        ],
        defaultLevel: 5
      });

      const result = appearanceService.rollEnemyGroup('simple-pool' as UniqueId);
      
      expect(result.groupType.id).toBe('slime-group');
      expect(result.enemies).toHaveLength(3);
      expect(result.enemies[0].name).toBe('スライム');
      expect(result.enemies[0].level).toBe(5);
    });

    test('複数の敵グループから重み付き抽選される', () => {
      const slimeGroup: EnemyGroupType = {
        id: 'slime-group' as UniqueId,
        name: 'スライムグループ',
        enemies: [{ typeId: 'slime' as UniqueId, count: 3 }],
        difficulty: 1.0
      };

      const goblinGroup: EnemyGroupType = {
        id: 'goblin-group' as UniqueId,
        name: 'ゴブリングループ',
        enemies: [{ typeId: 'goblin' as UniqueId, count: 2 }],
        difficulty: 1.5
      };

      appearanceService.registerPool({
        id: 'mixed-pool' as UniqueId,
        name: 'ミックスプール',
        appearances: [
          { groupType: slimeGroup, weight: 7 },  // 70%
          { groupType: goblinGroup, weight: 3 }  // 30%
        ],
        defaultLevel: 5
      });

      // 複数回抽選して、両方のグループが出現することを確認
      const results = new Set<UniqueId>();
      for (let i = 0; i < 50; i++) {
        const result = appearanceService.rollEnemyGroup('mixed-pool' as UniqueId);
        results.add(result.groupType.id);
      }

      expect(results.has('slime-group' as UniqueId)).toBe(true);
      expect(results.has('goblin-group' as UniqueId)).toBe(true);
    });

    test('重みに応じて適切な確率で出現する', () => {
      const slimeGroup: EnemyGroupType = {
        id: 'slime-group' as UniqueId,
        name: 'スライムグループ',
        enemies: [{ typeId: 'slime' as UniqueId, count: 3 }],
        difficulty: 1.0
      };

      const dragonGroup: EnemyGroupType = {
        id: 'dragon-group' as UniqueId,
        name: 'ドラゴングループ',
        enemies: [{ typeId: 'dragon' as UniqueId, count: 1 }],
        difficulty: 5.0
      };

      appearanceService.registerPool({
        id: 'weighted-pool' as UniqueId,
        name: '重み付きプール',
        appearances: [
          { groupType: slimeGroup, weight: 9 },   // 90%
          { groupType: dragonGroup, weight: 1 }   // 10%
        ],
        defaultLevel: 10
      });

      let slimeCount = 0;
      let dragonCount = 0;
      const trials = 1000;

      for (let i = 0; i < trials; i++) {
        const result = appearanceService.rollEnemyGroup('weighted-pool' as UniqueId);
        if (result.groupType.id === 'slime-group') {
          slimeCount++;
        } else {
          dragonCount++;
        }
      }

      // スライムは約90%、ドラゴンは約10%で出現
      expect(slimeCount).toBeGreaterThan(trials * 0.85);
      expect(slimeCount).toBeLessThan(trials * 0.95);
      expect(dragonCount).toBeGreaterThan(trials * 0.05);
      expect(dragonCount).toBeLessThan(trials * 0.15);
    });

    test('レベル指定で敵グループが生成される', () => {
      const groupType: EnemyGroupType = {
        id: 'slime-group' as UniqueId,
        name: 'スライムグループ',
        enemies: [{ typeId: 'slime' as UniqueId, count: 2 }],
        difficulty: 1.0
      };

      appearanceService.registerPool({
        id: 'level-pool' as UniqueId,
        name: 'レベル指定プール',
        appearances: [{ groupType, weight: 1.0 }],
        defaultLevel: 5
      });

      // レベル10で生成
      const result = appearanceService.rollEnemyGroup('level-pool' as UniqueId, 10);
      
      expect(result.enemies).toHaveLength(2);
      expect(result.enemies[0].level).toBe(10);
      expect(result.enemies[1].level).toBe(10);
    });

    test('存在しないプールIDでエラー', () => {
      expect(() => {
        appearanceService.rollEnemyGroup('non-existent' as UniqueId);
      }).toThrow('Pool not found');
    });

    test('空のプールは登録時にエラー', () => {
      expect(() => {
        appearanceService.registerPool({
          id: 'empty-pool' as UniqueId,
          name: '空プール',
          appearances: []
        });
      }).toThrow('has invalid total weight');
    });
  });

  describe('プールの動的管理', () => {
    test('プールに敵グループを追加できる', () => {
      const slimeGroup: EnemyGroupType = {
        id: 'slime-group' as UniqueId,
        name: 'スライムグループ',
        enemies: [{ typeId: 'slime' as UniqueId, count: 3 }],
        difficulty: 1.0
      };

      appearanceService.registerPool({
        id: 'dynamic-pool' as UniqueId,
        name: '動的プール',
        appearances: [{ groupType: slimeGroup, weight: 1.0 }]
      });

      const goblinGroup: EnemyGroupType = {
        id: 'goblin-group' as UniqueId,
        name: 'ゴブリングループ',
        enemies: [{ typeId: 'goblin' as UniqueId, count: 2 }],
        difficulty: 1.5
      };

      appearanceService.addAppearanceToPool('dynamic-pool' as UniqueId, {
        groupType: goblinGroup,
        weight: 1.0
      });

      const pool = appearanceService.getPool('dynamic-pool' as UniqueId);
      expect(pool?.appearances).toHaveLength(2);
    });

    test('プールから敵グループを削除できる', () => {
      const slimeGroup: EnemyGroupType = {
        id: 'slime-group' as UniqueId,
        name: 'スライムグループ',
        enemies: [{ typeId: 'slime' as UniqueId, count: 3 }],
        difficulty: 1.0
      };

      const goblinGroup: EnemyGroupType = {
        id: 'goblin-group' as UniqueId,
        name: 'ゴブリングループ',
        enemies: [{ typeId: 'goblin' as UniqueId, count: 2 }],
        difficulty: 1.5
      };

      appearanceService.registerPool({
        id: 'removal-pool' as UniqueId,
        name: '削除テストプール',
        appearances: [
          { groupType: slimeGroup, weight: 1.0 },
          { groupType: goblinGroup, weight: 1.0 }
        ]
      });

      appearanceService.removeAppearanceFromPool('removal-pool' as UniqueId, 'goblin-group' as UniqueId);

      const pool = appearanceService.getPool('removal-pool' as UniqueId);
      expect(pool?.appearances).toHaveLength(1);
      expect(pool?.appearances[0].groupType.id).toBe('slime-group');
    });

    test('最後の敵グループは削除できない', () => {
      const slimeGroup: EnemyGroupType = {
        id: 'slime-group' as UniqueId,
        name: 'スライムグループ',
        enemies: [{ typeId: 'slime' as UniqueId, count: 3 }],
        difficulty: 1.0
      };

      appearanceService.registerPool({
        id: 'last-pool' as UniqueId,
        name: '最後のグループプール',
        appearances: [{ groupType: slimeGroup, weight: 1.0 }]
      });

      expect(() => {
        appearanceService.removeAppearanceFromPool('last-pool' as UniqueId, 'slime-group' as UniqueId);
      }).toThrow('Cannot remove last appearance');
    });

    test('出現率の重みを更新できる', () => {
      const slimeGroup: EnemyGroupType = {
        id: 'slime-group' as UniqueId,
        name: 'スライムグループ',
        enemies: [{ typeId: 'slime' as UniqueId, count: 3 }],
        difficulty: 1.0
      };

      appearanceService.registerPool({
        id: 'update-pool' as UniqueId,
        name: '更新プール',
        appearances: [{ groupType: slimeGroup, weight: 1.0 }]
      });

      appearanceService.updateAppearanceWeight('update-pool' as UniqueId, 'slime-group' as UniqueId, 5.0);

      const pool = appearanceService.getPool('update-pool' as UniqueId);
      expect(pool?.appearances[0].weight).toBe(5.0);
    });

    test('重みを0以下に更新するとエラー', () => {
      const slimeGroup: EnemyGroupType = {
        id: 'slime-group' as UniqueId,
        name: 'スライムグループ',
        enemies: [{ typeId: 'slime' as UniqueId, count: 3 }],
        difficulty: 1.0
      };

      appearanceService.registerPool({
        id: 'error-pool' as UniqueId,
        name: 'エラープール',
        appearances: [{ groupType: slimeGroup, weight: 1.0 }]
      });

      expect(() => {
        appearanceService.updateAppearanceWeight('error-pool' as UniqueId, 'slime-group' as UniqueId, 0);
      }).toThrow('Weight must be greater than 0');
    });
  });

  describe('実際のゲームシナリオ', () => {
    test('序盤エリア: 弱い敵が高確率で出現', () => {
      const slimeGroup: EnemyGroupType = {
        id: 'slime-group' as UniqueId,
        name: 'スライムグループ',
        enemies: [{ typeId: 'slime' as UniqueId, count: 3 }],
        difficulty: 1.0
      };

      const goblinGroup: EnemyGroupType = {
        id: 'goblin-group' as UniqueId,
        name: 'ゴブリングループ',
        enemies: [{ typeId: 'goblin' as UniqueId, count: 1 }],
        difficulty: 1.2
      };

      appearanceService.registerPool({
        id: 'beginner-area' as UniqueId,
        name: '初心者エリア',
        appearances: [
          { groupType: slimeGroup, weight: 8 },   // 80%
          { groupType: goblinGroup, weight: 2 }   // 20%
        ],
        defaultLevel: 3
      });

      const result = appearanceService.rollEnemyGroup('beginner-area' as UniqueId);
      expect(result.enemies.length).toBeGreaterThan(0);
      expect(result.enemies[0].level).toBe(3);
    });

    test('ダンジョン最深部: レアな強敵が出現', () => {
      const goblinGroup: EnemyGroupType = {
        id: 'goblin-group' as UniqueId,
        name: 'ゴブリングループ',
        enemies: [{ typeId: 'goblin' as UniqueId, count: 3 }],
        difficulty: 1.5
      };

      const dragonGroup: EnemyGroupType = {
        id: 'dragon-group' as UniqueId,
        name: 'ドラゴングループ',
        enemies: [{ typeId: 'dragon' as UniqueId, count: 1 }],
        difficulty: 5.0
      };

      appearanceService.registerPool({
        id: 'deep-dungeon' as UniqueId,
        name: 'ダンジョン最深部',
        appearances: [
          { groupType: goblinGroup, weight: 7 },   // 70%
          { groupType: dragonGroup, weight: 3 }    // 30%
        ],
        defaultLevel: 20
      });

      const result = appearanceService.rollEnemyGroup('deep-dungeon' as UniqueId);
      expect(result.enemies[0].level).toBe(20);
    });
  });
});
