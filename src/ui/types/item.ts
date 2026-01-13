/**
 * Item UI Types
 * アイテム使用UI用の型定義
 */

import type { Combatant, ConsumableItem, ItemUseConditions } from '../../types';

/**
 * アイテム使用のステージ
 */
export type ItemUseUIStage = 
  | 'selecting-item'   // アイテム選択中
  | 'selecting-target' // ターゲット選択中
  | 'confirming'       // 確認中
  | 'executing'        // 実行中
  | 'completed';       // 完了

/**
 * アイテム使用のコンテキスト
 */
export type ItemUseContext = 'battle' | 'field';

/**
 * アイテム効果プレビュー
 */
export interface ItemEffectPreview {
  item: ConsumableItem;
  target: Combatant;
  canUse: boolean;
  reason?: string;
  estimatedEffect?: {
    hpRestore?: number;
    mpRestore?: number;
    statusEffects?: string[];
  };
}

/**
 * アイテム使用UIの状態
 */
export interface ItemUseUIState {
  // フロー管理
  stage: ItemUseUIStage;
  context: ItemUseContext;
  
  // アイテム選択
  availableItems: ConsumableItem[];
  selectedItem: ConsumableItem | null;
  
  // ターゲット選択
  availableTargets: Combatant[];
  selectedTarget: Combatant | null;
  
  // プレビュー
  effectPreview: ItemEffectPreview | null;
  
  // カーソル
  cursorIndex: number;
  
  // 実行結果
  lastResult: {
    success: boolean;
    message: string;
  } | null;
}

/**
 * アイテム使用UIのイベント
 */
export interface ItemUseEvents {
  'item-selected': { item: ConsumableItem };
  'target-selected': { target: Combatant };
  'item-used': { 
    item: ConsumableItem; 
    target: Combatant; 
    success: boolean; 
    message: string 
  };
  'stage-changed': { stage: ItemUseUIStage };
  'context-changed': { context: ItemUseContext };
}
