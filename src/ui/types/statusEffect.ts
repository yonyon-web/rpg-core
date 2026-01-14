/**
 * 状態異常UI関連の型定義
 */

import type { Combatant } from '../../types/battle/combatant';
import type { StatusEffect } from '../../types/status/statusEffect';

/**
 * アクティブな状態異常（UI表示用）
 */
export interface ActiveStatusEffect extends StatusEffect {
  remainingDuration: number;
  stackCount: number;
}

/**
 * 状態異常フィルタタイプ
 */
export type StatusEffectFilterType = 'all' | 'buff' | 'debuff' | 'ailment' | null;

/**
 * 状態異常ソート基準
 */
export type StatusEffectSortBy = 'duration' | 'severity' | 'name';

/**
 * 状態異常UI状態
 */
export interface StatusEffectUIState {
  // 対象
  target: Combatant | null;
  
  // 状態異常リスト
  activeEffects: ActiveStatusEffect[];
  selectedEffect: ActiveStatusEffect | null;
  
  // フィルタ・ソート
  filterType: StatusEffectFilterType;
  sortBy: StatusEffectSortBy;
  
  // カーソル位置
  cursorIndex: number;
}

/**
 * 状態異常イベント
 */
export type StatusEffectEvents = {
  'effect-selected': { effect: ActiveStatusEffect };
  'effect-applied': { target: Combatant; effect: StatusEffect };
  'effect-removed': { target: Combatant; effectId: string };
  'filter-changed': { filterType: StatusEffectFilterType };
  'sort-changed': { sortBy: StatusEffectSortBy };
};
