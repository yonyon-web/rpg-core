/**
 * RewardService のテスト
 * TDD アプローチで実装
 */

import { RewardService } from '../../src/services/RewardService';
import type { Combatant } from '../../src/types/combatant';
import type { DefaultStats } from '../../src/types/stats';
import type { BattleRewards } from '../../src/types/battle';

// テスト用キャラクター作成ヘルパー
function createCharacter(
  id: string, 
  level: number = 1, 
  currentExp: number = 0,
  currentHp?: number
): Combatant<DefaultStats> {
  const stats: DefaultStats = {
    maxHp: 100,
    maxMp: 50,
    attack: 10,
    defense: 5,
    magic: 8,
    magicDefense: 6,
    speed: 7,
    luck: 5,
    accuracy: 0,
    evasion: 0,
    criticalRate: 0
  };
  
  return {
    id,
    name: `Character ${id}`,
    level,
    stats,
    currentHp: currentHp !== undefined ? currentHp : stats.maxHp,
    currentMp: stats.maxMp,
    currentExp,
    statusEffects: [],
    position: 0
  };
}

describe('RewardService', () => {
  describe('初期化', () => {
    test('サービスを作成できる', () => {
      const service = new RewardService();
      expect(service).toBeDefined();
    });
  });

  describe('経験値配分', () => {
    test('パーティメンバーに経験値を均等に配分できる', () => {
      const service = new RewardService();
      const char1 = createCharacter('char1');
      const char2 = createCharacter('char2');
      const party = [char1, char2];
      
      const result = service.distributeExp(party, 100);
      
      expect(result.length).toBe(2);
      expect(result[0].exp).toBe(50);
      expect(result[1].exp).toBe(50);
      expect(char1.currentExp).toBe(50);
      expect(char2.currentExp).toBe(50);
    });

    test('死亡しているメンバーは経験値を受け取らない', () => {
      const service = new RewardService();
      const char1 = createCharacter('char1', 1, 0, 50); // 生存
      const char2 = createCharacter('char2', 1, 0, 0);  // 死亡
      const party = [char1, char2];
      
      const result = service.distributeExp(party, 100);
      
      expect(result.length).toBe(1);
      expect(result[0].characterId).toBe('char1');
      expect(result[0].exp).toBe(100);
      expect(char1.currentExp).toBe(100);
      expect(char2.currentExp).toBe(0);
    });

    test('経験値配分後、各キャラクターのcurrentExpが更新される', () => {
      const service = new RewardService();
      const char1 = createCharacter('char1', 1, 30);
      const char2 = createCharacter('char2', 1, 20);
      const party = [char1, char2];
      
      service.distributeExp(party, 50);
      
      expect(char1.currentExp).toBe(55); // 30 + 25
      expect(char2.currentExp).toBe(45); // 20 + 25
    });
  });

  describe('レベルアップ処理', () => {
    test('経験値が足りている場合、レベルアップする', () => {
      const service = new RewardService();
      const char = createCharacter('char1', 1, 0);
      
      // レベル2に必要な累積経験値: 200
      char.currentExp = 200;
      
      const results = service.processLevelUps(char);
      
      expect(results.length).toBe(1);
      expect(results[0].newLevel).toBe(2);
      expect(char.level).toBe(2);
      // 累積経験値なのでそのまま保持
      expect(char.currentExp).toBe(200);
    });

    test('複数レベル分の経験値がある場合、連続してレベルアップする', () => {
      const service = new RewardService();
      const char = createCharacter('char1', 1, 0);
      
      // レベル3に必要な累積経験値: 500
      char.currentExp = 500;
      
      const results = service.processLevelUps(char);
      
      expect(results.length).toBe(2);
      expect(results[0].newLevel).toBe(2);
      expect(results[1].newLevel).toBe(3);
      expect(char.level).toBe(3);
      expect(char.currentExp).toBe(500);
    });

    test('レベルアップ時にステータスが成長する', () => {
      const service = new RewardService();
      const char = createCharacter('char1', 1, 200);
      
      const prevMaxHp = char.stats.maxHp;
      const prevAttack = char.stats.attack;
      
      const results = service.processLevelUps(char);
      
      expect(results.length).toBe(1);
      expect(char.stats.maxHp).toBeGreaterThan(prevMaxHp);
      expect(char.stats.attack).toBeGreaterThan(prevAttack);
    });

    test('レベルアップ時にHP/MPが全回復する', () => {
      const service = new RewardService();
      const char = createCharacter('char1', 1, 200);
      char.currentHp = 50; // ダメージを受けている
      char.currentMp = 25; // MPを消費している
      
      service.processLevelUps(char);
      
      expect(char.currentHp).toBe(char.stats.maxHp);
      expect(char.currentMp).toBe(char.stats.maxMp);
    });

    test('経験値が足りない場合、レベルアップしない', () => {
      const service = new RewardService();
      const char = createCharacter('char1', 1, 50);
      
      const results = service.processLevelUps(char);
      
      expect(results.length).toBe(0);
      expect(char.level).toBe(1);
    });
  });

  describe('報酬統合処理', () => {
    test('経験値、ゴールド、アイテムをまとめて処理できる', () => {
      const service = new RewardService();
      const char1 = createCharacter('char1');
      const char2 = createCharacter('char2');
      const party = [char1, char2];
      
      const rewards: BattleRewards = {
        exp: 100,
        money: 50,
        items: [
          { itemId: 'potion', probability: 1.0, quantity: 2 },
          { itemId: 'elixir', probability: 1.0, quantity: 1 }
        ]
      };
      
      const result = service.distributeRewards(party, rewards);
      
      expect(result.expDistribution.length).toBe(2);
      expect(result.goldTotal).toBe(50);
      expect(result.itemsReceived.length).toBe(2);
    });

    test('報酬処理後、レベルアップ結果が含まれる', () => {
      const service = new RewardService();
      const char = createCharacter('char1', 1, 0);
      const party = [char];
      
      const rewards: BattleRewards = {
        exp: 200, // これでレベルアップに達する (0 + 200 = 200)
        money: 30,
        items: []
      };
      
      const result = service.distributeRewards(party, rewards);
      
      expect(result.levelUpResults.size).toBeGreaterThan(0);
      const charLevelUps = result.levelUpResults.get('char1');
      expect(charLevelUps).toBeDefined();
      expect(charLevelUps!.length).toBeGreaterThan(0);
    });
  });
});
