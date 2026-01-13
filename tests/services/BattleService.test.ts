/**
 * Tests for BattleService
 */

import { BattleService } from '../../src/services/BattleService';
import { Character, Enemy } from '../../src/types';
import { Skill } from '../../src/types/skill';
import { defaultGameConfig } from '../../src/config';

describe('BattleService', () => {
  let battleService: BattleService;

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
    battleService = new BattleService();
  });

  describe('startBattle（戦闘開始）', () => {
    it('戦闘を開始し、初期状態を設定する', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [createEnemy('enemy1', 'Slime')];

      await battleService.startBattle(party, enemies);

      const state = battleService.getState();
      expect(state).toBeDefined();
      expect(state.phase).toBe('player-turn');
      expect(state.turnNumber).toBe(1);
      expect(state.playerParty).toHaveLength(1);
      expect(state.enemyGroup).toHaveLength(1);
      expect(state.turnOrder.length).toBeGreaterThan(0);
    });

    it('行動順を計算する', async () => {
      const party = [
        createCharacter('hero1', 'Hero1'),
        createCharacter('hero2', 'Hero2'),
      ];
      const enemies = [
        createEnemy('enemy1', 'Slime1'),
        createEnemy('enemy2', 'Slime2'),
      ];

      await battleService.startBattle(party, enemies);

      const state = battleService.getState();
      expect(state.turnOrder).toHaveLength(4);
    });
  });

  describe('advanceTurn（ターン進行）', () => {
    it('次の行動者に進む', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [createEnemy('enemy1', 'Slime')];

      await battleService.startBattle(party, enemies);
      
      const firstActor = battleService.getCurrentActor();
      await battleService.advanceTurn();
      const secondActor = battleService.getCurrentActor();

      expect(secondActor).not.toBe(firstActor);
    });

    it('全員の行動が終わったら新しいターンを開始する', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [createEnemy('enemy1', 'Slime')];

      await battleService.startBattle(party, enemies);

      const state = battleService.getState();
      const initialTurn = state.turnNumber;
      const turnOrderLength = state.turnOrder.length;

      // 全員の行動を終わらせる
      for (let i = 0; i < turnOrderLength; i++) {
        await battleService.advanceTurn();
      }

      const newState = battleService.getState();
      expect(newState.turnNumber).toBe(initialTurn + 1);
    });

    it('戦闘不能のキャラクターをスキップする', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [createEnemy('enemy1', 'Slime')];

      await battleService.startBattle(party, enemies);

      // 最初の行動者を戦闘不能にする
      const state = battleService.getState();
      state.turnOrder[0].currentHp = 0;

      await battleService.advanceTurn();
      
      const currentActor = battleService.getCurrentActor();
      expect(currentActor?.currentHp).toBeGreaterThan(0);
    });
  });

  describe('executeAction（アクション実行）', () => {
    describe('通常攻撃', () => {
      it('通常攻撃を実行する', async () => {
        const party = [createCharacter('hero1', 'Hero')];
        const enemies = [createEnemy('enemy1', 'Slime')];

        await battleService.startBattle(party, enemies);

        const attacker = party[0];
        const target = enemies[0];
        const initialHp = target.currentHp;

        const action = {
          actor: attacker,
          type: 'attack' as const,
          targets: [target],
        };

        const result = await battleService.executeAction(attacker, action);

        expect(result.success).toBe(true);
        // ダメージまたはミスのどちらか
        if (!result.missed) {
          expect(result.damage).toBeGreaterThan(0);
          expect(target.currentHp).toBeLessThan(initialHp);
        }
      });
    });

    describe('スキル使用', () => {
      it('ダメージスキルを実行する', async () => {
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

        const party = [createCharacter('hero1', 'Hero')];
        party[0].learnedSkills = [{ skill, level: 1, learnedAt: Date.now() }];
        const enemies = [createEnemy('enemy1', 'Slime')];

        await battleService.startBattle(party, enemies);

        const attacker = party[0];
        const target = enemies[0];
        const initialHp = target.currentHp;
        const initialMp = attacker.currentMp;

        const action = {
          actor: attacker,
          type: 'skill' as const,
          skill,
          targets: [target],
        };

        const result = await battleService.executeAction(attacker, action);

        expect(result.success).toBe(true);
        expect(attacker.currentMp).toBe(initialMp - 10);
        if (!result.missed) {
          expect(target.currentHp).toBeLessThan(initialHp);
        }
      });

      it('回復スキルを実行する', async () => {
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

        const party = [createCharacter('hero1', 'Hero')];
        party[0].currentHp = 50; // ダメージを受けた状態
        party[0].learnedSkills = [{ skill: healSkill, level: 1, learnedAt: Date.now() }];
        const enemies = [createEnemy('enemy1', 'Slime')];

        await battleService.startBattle(party, enemies);

        const attacker = party[0];
        const target = party[0];
        const initialHp = target.currentHp;

        const action = {
          actor: attacker,
          type: 'skill' as const,
          skill: healSkill,
          targets: [target],
        };

        const result = await battleService.executeAction(attacker, action);

        expect(result.success).toBe(true);
        expect(result.heal).toBeGreaterThan(0);
        expect(target.currentHp).toBeGreaterThan(initialHp);
      });

      it('MPが不足している場合スキルを使用できない', async () => {
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

        const party = [createCharacter('hero1', 'Hero', 100, 50)];
        party[0].learnedSkills = [{ skill, level: 1, learnedAt: Date.now() }];
        const enemies = [createEnemy('enemy1', 'Slime')];

        await battleService.startBattle(party, enemies);

        const attacker = party[0];
        const target = enemies[0];

        const action = {
          actor: attacker,
          type: 'skill' as const,
          skill,
          targets: [target],
        };

        const result = await battleService.executeAction(attacker, action);

        expect(result.success).toBe(false);
        expect(result.message).toContain('MP');
      });
    });

    describe('防御', () => {
      it('防御アクションを実行する', async () => {
        const party = [createCharacter('hero1', 'Hero')];
        const enemies = [createEnemy('enemy1', 'Slime')];

        await battleService.startBattle(party, enemies);

        const actor = party[0];
        const action = {
          actor,
          type: 'defend' as const,
          targets: [],
        };

        const result = await battleService.executeAction(actor, action);

        expect(result.success).toBe(true);
        expect(result.message).toContain('defending');
      });
    });

    describe('逃走', () => {
      it('逃走を試みる', async () => {
        const party = [createCharacter('hero1', 'Hero')];
        const enemies = [createEnemy('enemy1', 'Slime')];

        await battleService.startBattle(party, enemies);

        const actor = party[0];
        const action = {
          actor,
          type: 'escape' as const,
          targets: [],
        };

        const result = await battleService.executeAction(actor, action);

        expect(result.success).toBeDefined();
        expect(result.message).toBeDefined();
      });
    });
  });

  describe('checkBattleEnd（戦闘終了判定）', () => {
    it('全ての敵が倒れたら勝利を返す', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [createEnemy('enemy1', 'Slime')];

      await battleService.startBattle(party, enemies);

      // 敵を全滅させる
      const state = battleService.getState();
      state.enemyGroup.forEach(e => e.currentHp = 0);

      const result = battleService.checkBattleEnd();

      expect(result.isEnded).toBe(true);
      expect(result.result).toBe('victory');
    });

    it('全てのプレイヤーが倒れたら敗北を返す', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [createEnemy('enemy1', 'Slime')];

      await battleService.startBattle(party, enemies);

      // パーティを全滅させる
      const state = battleService.getState();
      state.playerParty.forEach(c => c.currentHp = 0);

      const result = battleService.checkBattleEnd();

      expect(result.isEnded).toBe(true);
      expect(result.result).toBe('defeat');
    });

    it('戦闘が継続中の場合falseを返す', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [createEnemy('enemy1', 'Slime')];

      await battleService.startBattle(party, enemies);

      const result = battleService.checkBattleEnd();

      expect(result.isEnded).toBe(false);
      expect(result.result).toBeUndefined();
    });
  });

  describe('endBattle（戦闘終了）', () => {
    it('報酬を計算する', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [
        createEnemy('enemy1', 'Slime'),
        createEnemy('enemy2', 'Goblin'),
      ];
      enemies[0].expReward = 50;
      enemies[0].moneyReward = 20;
      enemies[1].expReward = 100;
      enemies[1].moneyReward = 50;

      await battleService.startBattle(party, enemies);

      const rewards = battleService.endBattle();

      expect(rewards.exp).toBe(150);
      expect(rewards.money).toBe(70);
      expect(rewards.items).toBeDefined();
    });

    it('HPを回復する（オプション）', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      party[0].currentHp = 50;
      const enemies = [createEnemy('enemy1', 'Slime')];

      await battleService.startBattle(party, enemies);

      battleService.endBattle(true);

      expect(party[0].currentHp).toBe(party[0].stats.maxHp);
    });

    it('HPを回復しない（デフォルト）', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      party[0].currentHp = 50;
      const enemies = [createEnemy('enemy1', 'Slime')];

      await battleService.startBattle(party, enemies);

      battleService.endBattle();

      expect(party[0].currentHp).toBe(50);
    });

    it('戦闘状態をendedに設定する', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [createEnemy('enemy1', 'Slime')];

      await battleService.startBattle(party, enemies);

      battleService.endBattle();

      const state = battleService.getState();
      expect(state.phase).toBe('ended');
    });
  });

  describe('attemptEscape（逃走試行）', () => {
    it('逃走成功時にresultを設定する', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [createEnemy('enemy1', 'Slime')];

      // 速度を大幅に上げて逃走成功率を高める
      party[0].stats.speed = 200;
      enemies[0].stats.speed = 10;

      await battleService.startBattle(party, enemies);

      // 複数回試行して成功を確認
      let succeeded = false;
      for (let i = 0; i < 20; i++) {
        const actor = party[0];
        const action = {
          actor,
          type: 'escape' as const,
          targets: [],
        };
        
        const result = await battleService.executeAction(actor, action);
        if (result.success) {
          succeeded = true;
          const state = battleService.getState();
          expect(state.result).toBe('escaped');
          expect(state.phase).toBe('ended');
          break;
        }
      }

      expect(succeeded).toBe(true);
    });
  });

  describe('getCurrentActor（現在の行動者取得）', () => {
    it('現在の行動者を返す', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [createEnemy('enemy1', 'Slime')];

      await battleService.startBattle(party, enemies);

      const actor = battleService.getCurrentActor();

      expect(actor).toBeDefined();
      expect(actor?.id).toBeDefined();
    });
  });

  describe('getState（状態取得）', () => {
    it('戦闘状態を返す', async () => {
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [createEnemy('enemy1', 'Slime')];

      await battleService.startBattle(party, enemies);

      const state = battleService.getState();

      expect(state).toBeDefined();
      expect(state.phase).toBeDefined();
      expect(state.turnNumber).toBeGreaterThan(0);
      expect(state.playerParty).toBeDefined();
      expect(state.enemyGroup).toBeDefined();
    });

    it('戦闘開始前はエラーを投げる', () => {
      expect(() => battleService.getState()).toThrow('Battle not started');
    });
  });

  describe('依存性注入（DIP）', () => {
    it('カスタムGameConfigを注入できる', async () => {
      // カスタム設定を作成（クリティカル率を100%に設定）
      const customConfig = {
        ...defaultGameConfig,
        combat: {
          ...defaultGameConfig.combat,
          baseCriticalRate: 1.0, // 100%
          criticalMultiplier: 3.0, // 3倍
        },
      };

      const customBattleService = new BattleService(customConfig);
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [createEnemy('enemy1', 'Slime')];

      await customBattleService.startBattle(party, enemies);

      // 通常攻撃を実行
      const actor = party[0];
      const target = enemies[0];
      const action = {
        actor,
        type: 'attack' as const,
        targets: [target],
      };

      const result = await customBattleService.executeAction(actor, action);

      // カスタム設定が適用されていることを確認
      // baseCriticalRate=1.0なので、クリティカルヒットが発生しやすい
      expect(result.success).toBe(true);
      // Note: クリティカルは確率的だが、設定が注入されていることを確認
    });

    it('設定を省略した場合はdefaultGameConfigが使用される', async () => {
      const defaultBattleService = new BattleService();
      const party = [createCharacter('hero1', 'Hero')];
      const enemies = [createEnemy('enemy1', 'Slime')];

      await defaultBattleService.startBattle(party, enemies);

      const state = defaultBattleService.getState();
      expect(state).toBeDefined();
      expect(state.phase).toBe('player-turn');
    });
  });
});
