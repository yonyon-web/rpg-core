/**
 * コマンドUI関連の型定義
 */

import type { Character, BattleAction } from '../../types/battle';
import type { Combatant } from '../../types/combatant';
import type { Skill } from '../../types/skill';
import type { Item } from '../../types/item';
import type { CommandOption } from '../../types/command';

/**
 * コマンドUI段階
 */
export type CommandUIStage = 
  | 'selecting-command'
  | 'selecting-skill'
  | 'selecting-item'
  | 'selecting-target'
  | 'confirmed';

/**
 * コマンドUI状態
 */
export interface CommandUIState {
  // 段階
  stage: CommandUIStage;
  
  // 行動者
  actor: Character | null;
  
  // 選択可能な選択肢
  availableCommands: CommandOption[];
  availableSkills: Skill[];
  availableItems: Item[];
  availableTargets: Combatant[];
  
  // 選択された内容
  selectedCommand: string | null;
  selectedSkill: Skill | null;
  selectedItem: Item | null;
  selectedTargets: Combatant[];
  
  // カーソル位置
  cursorIndex: number;
  
  // プレビュー
  damagePreview: number | null;
  targetPreview: Combatant | null;
}

/**
 * コマンドイベント
 */
export type CommandEvents = {
  'command-selected': { command: string };
  'skill-selected': { skill: Skill };
  'item-selected': { item: Item };
  'target-selected': { target: Combatant };
  'action-confirmed': { action: BattleAction };
  'action-cancelled': {};
};
