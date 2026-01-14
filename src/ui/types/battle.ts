/**
 * 戦闘UI関連の型定義
 */

import type { Character, Enemy, BattleAction, BattleResult, BattleRewards } from '../../types/battle';
import type { Combatant } from '../../types/battle/combatant';
import type { ActionResult } from '../../types/battle';

/**
 * 戦闘アニメーション
 */
export interface BattleAnimation {
  id: string;
  type: 'attack' | 'skill' | 'item' | 'damage' | 'heal' | 'status-effect' | 'ko';
  actor?: Combatant;
  targets?: Combatant[];
  value?: number;
  message?: string;
  duration?: number;
}

/**
 * 戦闘メッセージの種類
 */
export type BattleMessageType =
  | 'battle-started'
  | 'battle-ended-victory'
  | 'battle-ended-defeat'
  | 'battle-ended-escaped'
  | 'turn-started'
  | 'action-attack'
  | 'action-skill'
  | 'action-item'
  | 'action-defend'
  | 'damage-dealt'
  | 'damage-received'
  | 'healing'
  | 'status-effect-applied'
  | 'status-effect-removed'
  | 'character-ko'
  | 'enemy-ko'
  | 'custom';

/**
 * 戦闘メッセージデータ
 * メッセージの構築に必要な構造化データ
 */
export interface BattleMessageData {
  // アクター情報
  actorName?: string;
  actorId?: string;
  
  // ターゲット情報
  targetName?: string;
  targetId?: string;
  targets?: Array<{ name: string; id: string }>;
  
  // 数値情報
  damage?: number;
  healing?: number;
  turnNumber?: number;
  
  // スキル・アイテム情報
  skillName?: string;
  skillId?: string;
  itemName?: string;
  itemId?: string;
  
  // 状態異常情報
  statusEffectName?: string;
  statusEffectId?: string;
  
  // カスタムデータ
  [key: string]: any;
}

/**
 * 戦闘メッセージ
 */
export interface BattleMessage {
  id: string;
  messageType: BattleMessageType;
  data: BattleMessageData;
  timestamp: number;
  severity?: 'info' | 'success' | 'warning' | 'error';
}

/**
 * 戦闘UI状態
 */
export interface BattleUIState {
  // フェーズ
  phase: 'initializing' | 'selecting-command' | 'executing-action' | 'animating' | 'ended';
  
  // 戦闘情報
  turnNumber: number;
  playerParty: Character[];
  enemyGroup: Enemy[];
  
  // 現在の行動者
  currentActor: Combatant | null;
  
  // アニメーション
  currentAnimation: BattleAnimation | null;
  animationQueue: BattleAnimation[];
  
  // メッセージ
  messages: BattleMessage[];
  
  // 戦闘結果
  result: BattleResult | null;
  rewards: BattleRewards | null;
  
  // 入力待ち状態
  isWaitingForInput: boolean;
  canSkipAnimation: boolean;
}

/**
 * 戦闘イベント
 */
export type BattleEvents = {
  'battle-started': { party: Character[]; enemies: Enemy[] };
  'turn-started': { turnNumber: number; actor: Combatant };
  'action-executed': { action: BattleAction; result: ActionResult };
  'battle-ended': { result: BattleResult; rewards?: BattleRewards };
  'animation-started': BattleAnimation;
  'animation-completed': BattleAnimation;
  'message-added': BattleMessage;
};
