/**
 * Party UI Types
 * パーティUI用の型定義
 */

import type { Combatant, BaseStats, DefaultStats } from '../../types';

/**
 * パーティ編成のステージ
 */
export type PartyUIStage = 
  | 'viewing'          // パーティ閲覧
  | 'selecting-member' // メンバー選択中
  | 'selecting-slot'   // スロット選択中（並び替え用）
  | 'confirming'       // 確認中
  | 'completed';       // 完了

/**
 * パーティUIの状態
 */
export interface PartyUIState<TStats extends BaseStats = DefaultStats> {
  // フロー管理
  stage: PartyUIStage;
  
  // パーティデータ
  party: Combatant<TStats>[];
  availableMembers: Combatant<TStats>[];
  
  // 選択状態
  selectedMember: Combatant<TStats> | null;
  selectedSlotIndex: number;
  cursorIndex: number;
  
  // パーティ設定
  minSize: number;
  maxSize: number;
  
  // 検証
  isValid: boolean;
  validationReasons: string[];
}

/**
 * パーティUIのイベント
 */
export interface PartyEvents<TStats extends BaseStats = DefaultStats> {
  'member-added': { member: Combatant<TStats>; index: number };
  'member-removed': { member: Combatant<TStats>; index: number };
  'member-swapped': { 
    member1: Combatant<TStats>; 
    index1: number; 
    member2: Combatant<TStats>; 
    index2: number 
  };
  'formation-changed': { party: Combatant<TStats>[] };
  'stage-changed': { stage: PartyUIStage };
}
