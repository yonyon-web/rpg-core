/**
 * PartySelection UI型定義
 */

import type { Combatant } from '../../types/combatant';
import type { BaseStats, DefaultStats } from '../../types/stats';

/**
 * パーティ情報
 */
export interface PartyInfo<TStats extends BaseStats = DefaultStats> {
  /** パーティID */
  id: string;
  /** パーティ名 */
  name: string;
  /** パーティメンバー */
  members: Combatant<TStats>[];
}

/**
 * PartySelection UI状態
 */
export interface PartySelectionUIState<TStats extends BaseStats = DefaultStats> {
  /** 登録されているパーティ一覧 */
  parties: PartyInfo<TStats>[];
  /** 選択中のパーティID */
  selectedPartyId: string | null;
  /** 選択中のパーティ情報 */
  selectedParty: PartyInfo<TStats> | null;
}

/**
 * PartySelection イベント
 */
export interface PartySelectionEvents<TStats extends BaseStats = DefaultStats> {
  /** パーティが選択された */
  'party-selected': { party: PartyInfo<TStats> };
  /** 選択がクリアされた */
  'selection-cleared': Record<string, never>;
  /** 選択に失敗した */
  'selection-failed': { reason: string; partyId: string };
  /** パーティが追加された */
  'party-added': { party: PartyInfo<TStats> };
  /** パーティが削除された */
  'party-removed': { party: PartyInfo<TStats> };
  /** パーティが更新された */
  'party-updated': { party: PartyInfo<TStats> };
  /** パーティ一覧が更新された */
  'parties-updated': { parties: PartyInfo<TStats>[] };
}
