/**
 * PartySelectionController - パーティ選択UIコントローラー
 * 複数のパーティから編成するパーティを選択する
 */

import type { Combatant } from '../../../types/combatant';
import type { BaseStats, DefaultStats } from '../../../types/stats';
import { ObservableState } from '../../core/ObservableState';
import { EventEmitter } from '../../core/EventEmitter';
import type { PartySelectionUIState, PartySelectionEvents, PartyInfo } from '../../types/partySelection';

/**
 * PartySelectionController
 * 
 * 複数パーティの管理とアクティブパーティの選択を行うUIコントローラー
 * PartyControllerと組み合わせて使用し、編成するパーティを選択する
 * 
 * @template TStats - ステータスの型
 * 
 * @example
 * ```typescript
 * // パーティ選択コントローラーの初期化
 * const partySelectionController = new PartySelectionController<MyStats>();
 * 
 * // パーティ情報を登録
 * const parties: PartyInfo<MyStats>[] = [
 *   { id: 'party-a', name: 'メインパーティ', members: [hero, warrior] },
 *   { id: 'party-b', name: 'サブパーティ', members: [mage, healer] },
 * ];
 * partySelectionController.setParties(parties);
 * 
 * // パーティを選択
 * partySelectionController.selectParty('party-a');
 * 
 * // 選択されたパーティでPartyControllerを使用
 * const selected = partySelectionController.getState().selectedParty;
 * if (selected) {
 *   partyController.startPartyManagement(selected.members, availableMembers);
 * }
 * ```
 */
export class PartySelectionController<TStats extends BaseStats = DefaultStats> {
  private state: ObservableState<PartySelectionUIState<TStats>>;
  private events: EventEmitter<PartySelectionEvents<TStats>>;

  constructor() {
    this.state = new ObservableState<PartySelectionUIState<TStats>>({
      parties: [],
      selectedPartyId: null,
      selectedParty: null,
    });
    this.events = new EventEmitter<PartySelectionEvents<TStats>>();
  }

  /**
   * 状態を購読
   */
  subscribe(listener: (state: PartySelectionUIState<TStats>) => void): () => void {
    return this.state.subscribe(listener);
  }

  /**
   * イベントを購読
   */
  on<K extends keyof PartySelectionEvents<TStats>>(
    event: K,
    listener: (data: PartySelectionEvents<TStats>[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }

  /**
   * 現在の状態を取得
   */
  getState(): PartySelectionUIState<TStats> {
    return this.state.getState();
  }

  /**
   * パーティ一覧を設定
   * 
   * @param parties - パーティ情報の配列
   */
  setParties(parties: PartyInfo<TStats>[]): void {
    this.state.setState({ parties });
    this.events.emit('parties-updated', { parties });
  }

  /**
   * パーティを選択
   * 
   * @param partyId - 選択するパーティのID
   * @returns 選択に成功した場合true
   */
  selectParty(partyId: string): boolean {
    const currentState = this.state.getState();
    const party = currentState.parties.find(p => p.id === partyId);

    if (!party) {
      this.events.emit('selection-failed', { 
        reason: 'パーティが見つかりません',
        partyId 
      });
      return false;
    }

    this.state.setState({
      selectedPartyId: partyId,
      selectedParty: party,
    });

    this.events.emit('party-selected', { party });
    return true;
  }

  /**
   * パーティ選択をクリア
   */
  clearSelection(): void {
    this.state.setState({
      selectedPartyId: null,
      selectedParty: null,
    });

    this.events.emit('selection-cleared', {});
  }

  /**
   * パーティを追加
   * 
   * @param party - 追加するパーティ情報
   */
  addParty(party: PartyInfo<TStats>): void {
    const currentState = this.state.getState();
    
    // 重複チェック
    if (currentState.parties.some(p => p.id === party.id)) {
      this.events.emit('selection-failed', { 
        reason: 'このIDのパーティは既に存在します',
        partyId: party.id 
      });
      return;
    }

    const updatedParties = [...currentState.parties, party];
    this.state.setState({ parties: updatedParties });
    this.events.emit('party-added', { party });
    this.events.emit('parties-updated', { parties: updatedParties });
  }

  /**
   * パーティを削除
   * 
   * @param partyId - 削除するパーティのID
   * @returns 削除に成功した場合true
   */
  removeParty(partyId: string): boolean {
    const currentState = this.state.getState();
    const index = currentState.parties.findIndex(p => p.id === partyId);

    if (index === -1) {
      this.events.emit('selection-failed', { 
        reason: 'パーティが見つかりません',
        partyId 
      });
      return false;
    }

    const removedParty = currentState.parties[index];
    const updatedParties = currentState.parties.filter(p => p.id !== partyId);
    
    this.state.setState({ parties: updatedParties });

    // 削除されたパーティが選択中だった場合、選択をクリア
    if (currentState.selectedPartyId === partyId) {
      this.state.setState({
        selectedPartyId: null,
        selectedParty: null,
      });
      this.events.emit('selection-cleared', {});
    }

    this.events.emit('party-removed', { party: removedParty });
    this.events.emit('parties-updated', { parties: updatedParties });
    return true;
  }

  /**
   * パーティ情報を更新
   * 
   * @param partyId - 更新するパーティのID
   * @param updates - 更新内容（名前、メンバー）
   * @returns 更新に成功した場合true
   */
  updateParty(
    partyId: string, 
    updates: Partial<Pick<PartyInfo<TStats>, 'name' | 'members'>>
  ): boolean {
    const currentState = this.state.getState();
    const index = currentState.parties.findIndex(p => p.id === partyId);

    if (index === -1) {
      this.events.emit('selection-failed', { 
        reason: 'パーティが見つかりません',
        partyId 
      });
      return false;
    }

    const updatedParties = [...currentState.parties];
    updatedParties[index] = {
      ...updatedParties[index],
      ...updates,
    };

    this.state.setState({ parties: updatedParties });

    // 選択中のパーティが更新された場合、選択状態も更新
    if (currentState.selectedPartyId === partyId) {
      this.state.setState({ selectedParty: updatedParties[index] });
    }

    this.events.emit('party-updated', { party: updatedParties[index] });
    this.events.emit('parties-updated', { parties: updatedParties });
    return true;
  }

  /**
   * パーティIDでパーティを取得
   * 
   * @param partyId - パーティID
   * @returns パーティ情報、見つからない場合null
   */
  getParty(partyId: string): PartyInfo<TStats> | null {
    const currentState = this.state.getState();
    return currentState.parties.find(p => p.id === partyId) || null;
  }

  /**
   * 選択中のパーティを取得
   * 
   * @returns 選択中のパーティ情報、選択されていない場合null
   */
  getSelectedParty(): PartyInfo<TStats> | null {
    return this.state.getState().selectedParty;
  }

  /**
   * クリーンアップ
   */
  cleanup(): void {
    this.events.clear();
  }
}
