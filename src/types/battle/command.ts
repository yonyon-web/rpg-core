/**
 * コマンド関連の型定義
 */

import { UniqueId } from '../common';
import { Character, BattleAction } from './battle';
import { Combatant } from './combatant';
import { Skill } from '../character/skill';

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
export interface CommandState {
  stage: CommandStage;                         // 現在の段階
  actor: Character | null;                     // 行動中のキャラクター
  selectedCommand: string | null;              // 選択されたコマンド
  selectedSkill: Skill | null;                 // 選択されたスキル
  selectedItemId: UniqueId | null;             // 選択されたアイテムID
  selectedTargets: Combatant[];                // 選択されたターゲット
  availableCommands: CommandOption[];          // 利用可能なコマンド
  availableSkills: Skill[];                    // 利用可能なスキル
  availableItems: UniqueId[];                  // 利用可能なアイテム
  availableTargets: Combatant[];               // 利用可能なターゲット
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
