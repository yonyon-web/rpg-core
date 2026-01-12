/**
 * CommandService - 戦闘中のコマンド選択
 * 
 * 戦闘中のコマンド（攻撃・スキル・アイテム・防御・逃走）の選択肢提示と決定処理を管理
 */

import {
  CommandState,
  CommandOption,
  Character,
  BattleAction,
  BattleState,
  Combatant
} from '../types';
import { Skill } from '../types/skill';
import { UniqueId } from '../types/common';

/**
 * CommandServiceクラス
 */
export class CommandService {
  private state: CommandState | null = null;
  private battleState: BattleState | null = null;

  /**
   * コマンド選択を開始する
   * @param actor 行動するキャラクター
   * @param battleState 戦闘状態
   */
  startCommandSelection(actor: Character, battleState: BattleState): CommandState {
    this.battleState = battleState;
    this.state = {
      stage: 'selecting-action',
      actor,
      selectedCommand: null,
      selectedSkill: null,
      selectedItemId: null,
      selectedTargets: [],
      availableCommands: this.getAvailableCommands(actor),
      availableSkills: [],
      availableItems: [],
      availableTargets: []
    };

    return this.state;
  }

  /**
   * 利用可能なコマンドを取得する
   * @param actor キャラクター
   */
  getAvailableCommands(actor: Character): CommandOption[] {
    const commands: CommandOption[] = [];

    // 攻撃は常に可能
    commands.push({
      type: 'attack',
      label: '攻撃',
      enabled: true,
      description: '通常攻撃を行う'
    });

    // スキルチェック
    const usableSkills = this.getUsableSkills(actor);
    if (usableSkills.length > 0) {
      commands.push({
        type: 'skill',
        label: 'スキル',
        enabled: true,
        description: 'スキルを使用する'
      });
    }

    // 防御は常に可能
    commands.push({
      type: 'defend',
      label: '防御',
      enabled: true,
      description: 'ダメージを軽減する'
    });

    // 逃走は常に試行可能
    commands.push({
      type: 'escape',
      label: '逃げる',
      enabled: true,
      description: '戦闘から逃走する'
    });

    return commands;
  }

  /**
   * コマンドを選択する
   * @param command コマンドタイプ
   */
  selectCommand(command: string): void {
    if (!this.state) {
      throw new Error('Command selection not started');
    }

    this.state.selectedCommand = command;

    switch (command) {
      case 'attack':
        this.state.stage = 'selecting-target';
        this.state.availableTargets = this.getAttackTargets();
        break;

      case 'skill':
        this.state.stage = 'selecting-skill';
        this.state.availableSkills = this.getUsableSkills(this.state.actor!);
        break;

      case 'item':
        this.state.stage = 'selecting-item';
        this.state.availableItems = [];
        break;

      case 'defend':
      case 'escape':
        // これらはターゲット選択不要
        break;
    }
  }

  /**
   * スキルを選択する
   * @param skill スキル
   */
  selectSkill(skill: Skill): void {
    if (!this.state) {
      throw new Error('Command selection not started');
    }

    this.state.selectedSkill = skill;
    this.state.stage = 'selecting-target';
    this.state.availableTargets = this.getSkillTargets(skill);
  }

  /**
   * アイテムを選択する
   * @param itemId アイテムID
   */
  selectItem(itemId: UniqueId): void {
    if (!this.state) {
      throw new Error('Command selection not started');
    }

    this.state.selectedItemId = itemId;
    this.state.stage = 'selecting-target';
    this.state.availableTargets = [];
  }

  /**
   * ターゲットを選択する
   * @param target ターゲット
   */
  selectTarget(target: Combatant): void {
    if (!this.state) {
      throw new Error('Command selection not started');
    }

    this.state.selectedTargets = [target];
  }

  /**
   * 複数ターゲットを選択する
   * @param targets ターゲットリスト
   */
  selectTargets(targets: Combatant[]): void {
    if (!this.state) {
      throw new Error('Command selection not started');
    }

    this.state.selectedTargets = targets;
  }

  /**
   * コマンドを確定する
   */
  confirm(): BattleAction {
    if (!this.state || !this.state.actor) {
      throw new Error('Command selection not started');
    }

    const action: BattleAction = {
      actor: this.state.actor,
      type: this.state.selectedCommand as any,
      skill: this.state.selectedSkill || undefined,
      itemId: this.state.selectedItemId || undefined,
      targets: this.state.selectedTargets
    };

    return action;
  }

  /**
   * コマンドをキャンセルする
   */
  cancel(): void {
    if (!this.state) {
      throw new Error('Command selection not started');
    }

    // ステージを1つ戻す
    switch (this.state.stage) {
      case 'selecting-skill':
      case 'selecting-item':
        this.state.stage = 'selecting-action';
        this.state.selectedCommand = null;
        this.state.selectedSkill = null;
        this.state.selectedItemId = null;
        break;

      case 'selecting-target':
        if (this.state.selectedSkill) {
          this.state.stage = 'selecting-skill';
          this.state.selectedSkill = null;
          this.state.selectedTargets = [];
        } else if (this.state.selectedItemId) {
          this.state.stage = 'selecting-item';
          this.state.selectedItemId = null;
          this.state.selectedTargets = [];
        } else {
          this.state.stage = 'selecting-action';
          this.state.selectedCommand = null;
          this.state.selectedTargets = [];
        }
        break;
    }
  }

  /**
   * 現在の状態を取得する
   */
  getState(): CommandState | null {
    return this.state;
  }

  /**
   * 使用可能なスキルを取得する
   * @param actor キャラクター
   */
  private getUsableSkills(actor: Character): Skill[] {
    return actor.skills.filter(skill => actor.currentMp >= skill.mpCost);
  }

  /**
   * 攻撃対象を取得する
   */
  private getAttackTargets(): Combatant[] {
    if (!this.battleState) {
      return [];
    }

    return this.battleState.enemyGroup.filter(e => e.currentHp > 0);
  }

  /**
   * スキルの対象を取得する
   * @param skill スキル
   */
  private getSkillTargets(skill: Skill): Combatant[] {
    if (!this.battleState) {
      return [];
    }

    switch (skill.targetType) {
      case 'single-enemy':
        return this.battleState.enemyGroup.filter(e => e.currentHp > 0);
      case 'all-enemies':
        return this.battleState.enemyGroup.filter(e => e.currentHp > 0);
      case 'single-ally':
        return this.battleState.playerParty.filter(c => c.currentHp > 0);
      case 'all-allies':
        return this.battleState.playerParty.filter(c => c.currentHp > 0);
      case 'self':
        return this.state?.actor ? [this.state.actor] : [];
      default:
        return [];
    }
  }
}
