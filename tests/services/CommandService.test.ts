/**
 * Tests for CommandService
 */

import { CommandService } from '../../src/services/CommandService';
import { Character, Enemy, BattleState } from '../../src/types';
import { Skill } from '../../src/types/skill';

describe('CommandService', () => {
  let commandService: CommandService;

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

  const createBattleState = (party: Character[], enemies: Enemy[]): BattleState => ({
    phase: 'player-turn',
    turnNumber: 1,
    playerParty: party,
    enemyGroup: enemies,
    turnOrder: [...party, ...enemies],
    currentActorIndex: 0,
    actionHistory: [],
  });

  beforeEach(() => {
    commandService = new CommandService();
  });

  describe('startCommandSelection（コマンド選択開始）', () => {
    it('コマンド選択を開始し、初期状態を設定する', () => {
      const character = createCharacter('hero1', 'Hero');
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      const state = commandService.startCommandSelection(character, battleState);

      expect(state).toBeDefined();
      expect(state.stage).toBe('selecting-action');
      expect(state.actor).toBe(character);
      expect(state.selectedCommand).toBeNull();
      expect(state.availableCommands.length).toBeGreaterThan(0);
    });

    it('利用可能なコマンドを設定する', () => {
      const character = createCharacter('hero1', 'Hero');
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      const state = commandService.startCommandSelection(character, battleState);

      expect(state.availableCommands).toContainEqual(
        expect.objectContaining({ type: 'attack' })
      );
      expect(state.availableCommands).toContainEqual(
        expect.objectContaining({ type: 'defend' })
      );
      expect(state.availableCommands).toContainEqual(
        expect.objectContaining({ type: 'escape' })
      );
    });
  });

  describe('getAvailableCommands（利用可能なコマンド取得）', () => {
    it('攻撃コマンドは常に利用可能', () => {
      const character = createCharacter('hero1', 'Hero');

      const commands = commandService.getAvailableCommands(character);

      const attackCommand = commands.find(c => c.type === 'attack');
      expect(attackCommand).toBeDefined();
      expect(attackCommand?.enabled).toBe(true);
    });

    it('防御コマンドは常に利用可能', () => {
      const character = createCharacter('hero1', 'Hero');

      const commands = commandService.getAvailableCommands(character);

      const defendCommand = commands.find(c => c.type === 'defend');
      expect(defendCommand).toBeDefined();
      expect(defendCommand?.enabled).toBe(true);
    });

    it('逃走コマンドは常に利用可能', () => {
      const character = createCharacter('hero1', 'Hero');

      const commands = commandService.getAvailableCommands(character);

      const escapeCommand = commands.find(c => c.type === 'escape');
      expect(escapeCommand).toBeDefined();
      expect(escapeCommand?.enabled).toBe(true);
    });

    it('使用可能なスキルがある場合スキルコマンドが表示される', () => {
      const skill: Skill = {
        id: 'skill1',
        name: 'Fire',
        type: 'magic',
        targetType: 'single-enemy',
        power: 2.0,
        accuracy: 1.0,
        isGuaranteedHit: false,
        cost: { mp: 10 },
        element: 'fire',
        criticalBonus: 0,
        description: 'Fire magic attack',
      };

      const character = createCharacter('hero1', 'Hero');
      character.learnedSkills = [{ skill, level: 1, learnedAt: Date.now() }];

      const commands = commandService.getAvailableCommands(character);

      const skillCommand = commands.find(c => c.type === 'skill');
      expect(skillCommand).toBeDefined();
      expect(skillCommand?.enabled).toBe(true);
    });

    it('使用可能なスキルがない場合スキルコマンドが表示されない', () => {
      const character = createCharacter('hero1', 'Hero', 100, 50);
      character.learnedSkills = [];

      const commands = commandService.getAvailableCommands(character);

      const skillCommand = commands.find(c => c.type === 'skill');
      expect(skillCommand).toBeUndefined();
    });
  });

  describe('selectCommand（コマンド選択）', () => {
    it('攻撃コマンドを選択するとターゲット選択に進む', () => {
      const character = createCharacter('hero1', 'Hero');
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      commandService.startCommandSelection(character, battleState);
      commandService.selectCommand('attack');

      const state = commandService.getState();
      expect(state?.stage).toBe('selecting-target');
      expect(state?.selectedCommand).toBe('attack');
      expect(state?.availableTargets.length).toBeGreaterThan(0);
    });

    it('スキルコマンドを選択するとスキル選択に進む', () => {
      const skill: Skill = {
        id: 'skill1',
        name: 'Fire',
        type: 'magic',
        targetType: 'single-enemy',
        power: 2.0,
        accuracy: 1.0,
        isGuaranteedHit: false,
        cost: { mp: 10 },
        element: 'fire',
        criticalBonus: 0,
        description: 'Fire magic attack',
      };

      const character = createCharacter('hero1', 'Hero');
      character.learnedSkills = [{ skill, level: 1, learnedAt: Date.now() }];
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      commandService.startCommandSelection(character, battleState);
      commandService.selectCommand('skill');

      const state = commandService.getState();
      expect(state?.stage).toBe('selecting-skill');
      expect(state?.selectedCommand).toBe('skill');
      expect(state?.availableSkills.length).toBeGreaterThan(0);
    });

    it('防御コマンドを選択する', () => {
      const character = createCharacter('hero1', 'Hero');
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      commandService.startCommandSelection(character, battleState);
      commandService.selectCommand('defend');

      const state = commandService.getState();
      expect(state?.selectedCommand).toBe('defend');
    });

    it('逃走コマンドを選択する', () => {
      const character = createCharacter('hero1', 'Hero');
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      commandService.startCommandSelection(character, battleState);
      commandService.selectCommand('escape');

      const state = commandService.getState();
      expect(state?.selectedCommand).toBe('escape');
    });
  });

  describe('selectSkill（スキル選択）', () => {
    it('スキルを選択するとターゲット選択に進む', () => {
      const skill: Skill = {
        id: 'skill1',
        name: 'Fire',
        type: 'magic',
        targetType: 'single-enemy',
        power: 2.0,
        accuracy: 1.0,
        isGuaranteedHit: false,
        cost: { mp: 10 },
        element: 'fire',
        criticalBonus: 0,
        description: 'Fire magic attack',
      };

      const character = createCharacter('hero1', 'Hero');
      character.learnedSkills = [{ skill, level: 1, learnedAt: Date.now() }];
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      commandService.startCommandSelection(character, battleState);
      commandService.selectCommand('skill');
      commandService.selectSkill(skill);

      const state = commandService.getState();
      expect(state?.stage).toBe('selecting-target');
      expect(state?.selectedSkill).toBe(skill);
      expect(state?.availableTargets.length).toBeGreaterThan(0);
    });

    it('敵対象スキルの場合敵をターゲットリストに設定する', () => {
      const skill: Skill = {
        id: 'skill1',
        name: 'Fire',
        type: 'magic',
        targetType: 'single-enemy',
        power: 2.0,
        accuracy: 1.0,
        isGuaranteedHit: false,
        cost: { mp: 10 },
        element: 'fire',
        criticalBonus: 0,
        description: 'Fire magic attack',
      };

      const character = createCharacter('hero1', 'Hero');
      character.learnedSkills = [{ skill, level: 1, learnedAt: Date.now() }];
      const enemy = createEnemy('enemy1', 'Slime');
      const battleState = createBattleState([character], [enemy]);

      commandService.startCommandSelection(character, battleState);
      commandService.selectCommand('skill');
      commandService.selectSkill(skill);

      const state = commandService.getState();
      expect(state?.availableTargets).toContainEqual(enemy);
    });

    it('味方対象スキルの場合味方をターゲットリストに設定する', () => {
      const healSkill: Skill = {
        id: 'heal1',
        name: 'Heal',
        type: 'heal',
        targetType: 'single-ally',
        power: 2.0,
        accuracy: 1.0,
        isGuaranteedHit: true,
        cost: { mp: 15 },
        element: 'none',
        criticalBonus: 0,
        description: 'Restores HP',
      };

      const character = createCharacter('hero1', 'Hero');
      character.learnedSkills = [{ skill: healSkill, level: 1, learnedAt: Date.now() }];
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      commandService.startCommandSelection(character, battleState);
      commandService.selectCommand('skill');
      commandService.selectSkill(healSkill);

      const state = commandService.getState();
      expect(state?.availableTargets).toContainEqual(character);
    });
  });

  describe('selectTarget（ターゲット選択）', () => {
    it('ターゲットを選択する', () => {
      const character = createCharacter('hero1', 'Hero');
      const enemy = createEnemy('enemy1', 'Slime');
      const battleState = createBattleState([character], [enemy]);

      commandService.startCommandSelection(character, battleState);
      commandService.selectCommand('attack');
      commandService.selectTarget(enemy);

      const state = commandService.getState();
      expect(state?.selectedTargets).toContainEqual(enemy);
    });
  });

  describe('selectTargets（複数ターゲット選択）', () => {
    it('複数のターゲットを選択する', () => {
      const character = createCharacter('hero1', 'Hero');
      const enemy1 = createEnemy('enemy1', 'Slime1');
      const enemy2 = createEnemy('enemy2', 'Slime2');
      const battleState = createBattleState([character], [enemy1, enemy2]);

      commandService.startCommandSelection(character, battleState);
      commandService.selectCommand('attack');
      commandService.selectTargets([enemy1, enemy2]);

      const state = commandService.getState();
      expect(state?.selectedTargets).toEqual([enemy1, enemy2]);
    });
  });

  describe('confirm（コマンド確定）', () => {
    it('攻撃アクションを確定する', () => {
      const character = createCharacter('hero1', 'Hero');
      const enemy = createEnemy('enemy1', 'Slime');
      const battleState = createBattleState([character], [enemy]);

      commandService.startCommandSelection(character, battleState);
      commandService.selectCommand('attack');
      commandService.selectTarget(enemy);

      const action = commandService.confirm();

      expect(action.actor).toBe(character);
      expect(action.type).toBe('attack');
      expect(action.targets).toContainEqual(enemy);
    });

    it('スキルアクションを確定する', () => {
      const skill: Skill = {
        id: 'skill1',
        name: 'Fire',
        type: 'magic',
        targetType: 'single-enemy',
        power: 2.0,
        accuracy: 1.0,
        isGuaranteedHit: false,
        cost: { mp: 10 },
        element: 'fire',
        criticalBonus: 0,
        description: 'Fire magic attack',
      };

      const character = createCharacter('hero1', 'Hero');
      character.learnedSkills = [{ skill, level: 1, learnedAt: Date.now() }];
      const enemy = createEnemy('enemy1', 'Slime');
      const battleState = createBattleState([character], [enemy]);

      commandService.startCommandSelection(character, battleState);
      commandService.selectCommand('skill');
      commandService.selectSkill(skill);
      commandService.selectTarget(enemy);

      const action = commandService.confirm();

      expect(action.actor).toBe(character);
      expect(action.type).toBe('skill');
      expect(action.skill).toBe(skill);
      expect(action.targets).toContainEqual(enemy);
    });
  });

  describe('cancel（キャンセル）', () => {
    it('スキル選択からコマンド選択に戻る', () => {
      const skill: Skill = {
        id: 'skill1',
        name: 'Fire',
        type: 'magic',
        targetType: 'single-enemy',
        power: 2.0,
        accuracy: 1.0,
        isGuaranteedHit: false,
        cost: { mp: 10 },
        element: 'fire',
        criticalBonus: 0,
        description: 'Fire magic attack',
      };

      const character = createCharacter('hero1', 'Hero');
      character.learnedSkills = [{ skill, level: 1, learnedAt: Date.now() }];
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      commandService.startCommandSelection(character, battleState);
      commandService.selectCommand('skill');
      commandService.cancel();

      const state = commandService.getState();
      expect(state?.stage).toBe('selecting-action');
      expect(state?.selectedCommand).toBeNull();
    });

    it('ターゲット選択からスキル選択に戻る', () => {
      const skill: Skill = {
        id: 'skill1',
        name: 'Fire',
        type: 'magic',
        targetType: 'single-enemy',
        power: 2.0,
        accuracy: 1.0,
        isGuaranteedHit: false,
        cost: { mp: 10 },
        element: 'fire',
        criticalBonus: 0,
        description: 'Fire magic attack',
      };

      const character = createCharacter('hero1', 'Hero');
      character.learnedSkills = [{ skill, level: 1, learnedAt: Date.now() }];
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      commandService.startCommandSelection(character, battleState);
      commandService.selectCommand('skill');
      commandService.selectSkill(skill);
      commandService.cancel();

      const state = commandService.getState();
      expect(state?.stage).toBe('selecting-skill');
      expect(state?.selectedSkill).toBeNull();
    });

    it('攻撃のターゲット選択からコマンド選択に戻る', () => {
      const character = createCharacter('hero1', 'Hero');
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      commandService.startCommandSelection(character, battleState);
      commandService.selectCommand('attack');
      commandService.cancel();

      const state = commandService.getState();
      expect(state?.stage).toBe('selecting-action');
      expect(state?.selectedCommand).toBeNull();
    });
  });

  describe('previewTarget（ターゲットプレビュー）', () => {
    it('enemy-X形式のターゲット文字列から敵を取得する', () => {
      const character = createCharacter('hero1', 'Hero');
      const enemy = createEnemy('enemy1', 'Slime');
      const battleState = createBattleState([character], [enemy]);

      commandService.startCommandSelection(character, battleState);

      const target = commandService.previewTarget('enemy-0');

      expect(target).toBe(enemy);
    });

    it('ally-X形式のターゲット文字列から味方を取得する', () => {
      const character = createCharacter('hero1', 'Hero');
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      commandService.startCommandSelection(character, battleState);

      const target = commandService.previewTarget('ally-0');

      expect(target).toBe(character);
    });

    it('self形式のターゲット文字列から自分を取得する', () => {
      const character = createCharacter('hero1', 'Hero');
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      commandService.startCommandSelection(character, battleState);

      const target = commandService.previewTarget('self');

      expect(target).toBe(character);
    });

    it('無効なターゲット文字列の場合nullを返す', () => {
      const character = createCharacter('hero1', 'Hero');
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      commandService.startCommandSelection(character, battleState);

      const target = commandService.previewTarget('invalid');

      expect(target).toBeNull();
    });
  });

  describe('getState（状態取得）', () => {
    it('現在の状態を返す', () => {
      const character = createCharacter('hero1', 'Hero');
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      commandService.startCommandSelection(character, battleState);

      const state = commandService.getState();

      expect(state).toBeDefined();
      expect(state?.stage).toBe('selecting-action');
    });

    it('コマンド選択開始前はnullを返す', () => {
      const state = commandService.getState();

      expect(state).toBeNull();
    });
  });

  describe('MPコストチェック', () => {
    it('MPが不足しているスキルは使用可能リストに含まれない', () => {
      const skill: Skill = {
        id: 'skill1',
        name: 'Fire',
        type: 'magic',
        targetType: 'single-enemy',
        power: 2.0,
        accuracy: 1.0,
        isGuaranteedHit: false,
        cost: { mp: 100 },
        element: 'fire',
        criticalBonus: 0,
        description: 'Fire magic attack',
      };

      const character = createCharacter('hero1', 'Hero', 100, 50);
      character.learnedSkills = [{ skill, level: 1, learnedAt: Date.now() }];
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      commandService.startCommandSelection(character, battleState);
      commandService.selectCommand('skill');

      const state = commandService.getState();
      expect(state?.availableSkills).not.toContainEqual(skill);
    });

    it('MPが十分なスキルは使用可能リストに含まれる', () => {
      const skill: Skill = {
        id: 'skill1',
        name: 'Fire',
        type: 'magic',
        targetType: 'single-enemy',
        power: 2.0,
        accuracy: 1.0,
        isGuaranteedHit: false,
        cost: { mp: 10 },
        element: 'fire',
        criticalBonus: 0,
        description: 'Fire magic attack',
      };

      const character = createCharacter('hero1', 'Hero', 100, 50);
      character.learnedSkills = [{ skill, level: 1, learnedAt: Date.now() }];
      const battleState = createBattleState([character], [createEnemy('enemy1', 'Slime')]);

      commandService.startCommandSelection(character, battleState);
      commandService.selectCommand('skill');

      const state = commandService.getState();
      expect(state?.availableSkills).toContainEqual(skill);
    });
  });
});
