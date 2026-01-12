/**
 * コマンド関連の型定義
 */

import { UniqueId } from './common';
import { Character, BattleAction } from './battle';
import { Combatant } from './combatant';
import { Skill } from './skill';
import { GameTypeConfig } from './gameTypes';

/**
 * コマンド選択段階
 */
export type CommandStage = 
  | 'selecting-action'   // コマンド選択中
  | 'selecting-skill'    // スキル選択中
  | 'selecting-item'     // アイテム選択中
  | 'selecting-target';  // ターゲット選択中

/**
 * コマンド状態
 */
export interface CommandState<TConfig extends GameTypeConfig = GameTypeConfig> {
  stage: CommandStage;                         // 現在の段階
  actor: Character<TConfig> | null;            // 行動中のキャラクター
  selectedCommand: string | null;              // 選択されたコマンド
  selectedSkill: Skill<TConfig['TElement'], TConfig['TSkillType'], TConfig['TTargetType'], TConfig['TEffectType']> | null; // 選択されたスキル
  selectedItemId: UniqueId | null;             // 選択されたアイテムID
  selectedTargets: Combatant<TConfig['TStats'], TConfig['TEffectType'], TConfig['TEffectCategory']>[]; // 選択されたターゲット
  availableCommands: CommandOption[];          // 利用可能なコマンド
  availableSkills: Skill<TConfig['TElement'], TConfig['TSkillType'], TConfig['TTargetType'], TConfig['TEffectType']>[]; // 利用可能なスキル
  availableItems: UniqueId[];                  // 利用可能なアイテム
  availableTargets: Combatant<TConfig['TStats'], TConfig['TEffectType'], TConfig['TEffectCategory']>[]; // 利用可能なターゲット
}

/**
 * コマンドオプション
 */
export interface CommandOption {
  type: string;          // コマンドタイプ
  label: string;         // 表示ラベル
  enabled: boolean;      // 有効かどうか
  description?: string;  // 説明
}
