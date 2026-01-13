/**
 * 戦闘UI関連の型定義
 */

import type { Character, Enemy, BattleAction, BattleResult, BattleRewards } from '../../types/battle';
import type { Combatant } from '../../types/combatant';
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
 * 戦闘メッセージ
 */
export interface BattleMessage {
  id: string;
  text: string;
  timestamp: number;
  type?: 'info' | 'success' | 'warning' | 'error';
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
