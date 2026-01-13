/**
 * CommandController のテスト
 */

import { CommandController } from '../../../src/ui/controllers/CommandController';
import { CommandService } from '../../../src/services/CommandService';
import type { Character, BattleState } from '../../../src/types/battle';
import type { Enemy } from '../../../src/types/battle';
import type { Skill } from '../../../src/types/skill';
import type { DefaultStats } from '../../../src/types/stats';

describe('CommandController', () => {
  let service: CommandService;
  let controller: CommandController;

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

  beforeEach(() => {
    service = new CommandService();
    controller = new CommandController(service);
  });

  describe('constructor', () => {
    it('初期状態を正しく設定する', () => {
      const state = controller.getState();
      
      expect(state.stage).toBe('selecting-command');
      expect(state.actor).toBeNull();
      expect(state.availableCommands).toEqual([]);
      expect(state.selectedCommand).toBeNull();
      expect(state.cursorIndex).toBe(0);
    });
  });

  describe('subscribe', () => {
    it('状態変更を購読できる', () => {
      const listener = jest.fn();
      
      controller.subscribe(listener);
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        stage: 'selecting-command'
      }));
    });

    it('unsubscribe関数を返す', () => {
      const listener = jest.fn();
      
      const unsubscribe = controller.subscribe(listener);
      
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('on', () => {
    it('イベントを購読できる', () => {
      const listener = jest.fn();
      
      const unsubscribe = controller.on('command-selected', listener);
      
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('moveCursor', () => {
    it('カーソルを下に移動できる', () => {
      controller.moveCursor(1);
      
      const state = controller.getState();
      expect(state.cursorIndex).toBe(0); // コマンドがないのでループ
    });

    it('カーソルを上に移動できる', () => {
      controller.moveCursor(-1);
      
      const state = controller.getState();
      // コマンドがない場合は-1になる（maxIndex = -1のため）
      expect(state.cursorIndex).toBe(-1);
    });
  });

  describe('getState', () => {
    it('現在の状態を返す', () => {
      const state = controller.getState();
      
      expect(state).toHaveProperty('stage');
      expect(state).toHaveProperty('actor');
      expect(state).toHaveProperty('availableCommands');
      expect(state).toHaveProperty('selectedCommand');
    });
  });

  describe('cancel', () => {
    it('コマンド選択段階では何もしない', () => {
      const initialState = controller.getState();
      
      controller.cancel();
      
      const state = controller.getState();
      expect(state.stage).toBe(initialState.stage);
    });
  });

  describe('calculateDamagePreview', () => {
    it('actorがnullの場合は何もしない', () => {
      const target = createEnemy('enemy1', 'Slime');
      
      controller.calculateDamagePreview(target);
      
      const state = controller.getState();
      expect(state.damagePreview).toBeNull();
      expect(state.targetPreview).toBeNull();
    });

    it('通常攻撃が選択されている場合、実際のダメージ計算を使用する', () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');
      
      const battleState: BattleState = {
        phase: 'player-turn',
        turnNumber: 1,
        playerParty: [actor],
        enemyGroup: [target],
        turnOrder: [actor, target],
        currentActorIndex: 0,
        actionHistory: [],
      };
      
      controller.startCommandSelection(actor, battleState);
      controller.selectCommand('attack');
      controller.calculateDamagePreview(target);
      
      const state = controller.getState();
      expect(state.damagePreview).toBeGreaterThan(0);
      expect(state.targetPreview).toBe(target);
    });

    it('スキルが選択されている場合、スキルのダメージ計算を使用する', () => {
      const actor = createCharacter('hero1', 'Hero');
      const target = createEnemy('enemy1', 'Slime');
      
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
      
      const battleState: BattleState = {
        phase: 'player-turn',
        turnNumber: 1,
        playerParty: [actor],
        enemyGroup: [target],
        turnOrder: [actor, target],
        currentActorIndex: 0,
        actionHistory: [],
      };
      
      // 正規のフローで状態を設定
      controller.startCommandSelection(actor, battleState);
      controller.selectCommand('skill');
      controller.selectSkill(skill);
      
      controller.calculateDamagePreview(target);
      
      const state = controller.getState();
      expect(state.damagePreview).toBeGreaterThan(0);
      expect(state.targetPreview).toBe(target);
    });
  });
});

