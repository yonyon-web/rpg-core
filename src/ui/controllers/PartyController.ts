/**
 * PartyController
 * パーティ編成のヘッドレスUIコントローラー
 */

import { ObservableState } from '../core/ObservableState';
import { EventEmitter } from '../core/EventEmitter';
import type { PartyService } from '../../services/party/PartyService';
import type { PartyUIState, PartyEvents, PartyUIStage } from '../types/party';
import type { Combatant, BaseStats, DefaultStats } from '../../types';

/**
 * PartyController
 * パーティの編成と管理を行う
 * 
 * @example
 * ```typescript
 * const controller = new PartyController(partyService);
 * 
 * // パーティ編成を開始
 * controller.startPartyManagement(currentParty, availableMembers);
 * 
 * // メンバーを追加
 * controller.addMember(newCharacter);
 * 
 * // メンバーを削除
 * controller.removeMember(character);
 * 
 * // 隊列を変更
 * controller.swapMembers(0, 2);
 * ```
 */
export class PartyController<TStats extends BaseStats = DefaultStats> {
  private state: ObservableState<PartyUIState<TStats>>;
  private events: EventEmitter<PartyEvents<TStats>>;
  private service: PartyService<TStats>;

  constructor(service: PartyService<TStats>) {
    this.service = service;
    
    this.state = new ObservableState<PartyUIState<TStats>>({
      stage: 'viewing',
      party: [],
      availableMembers: [],
      selectedMember: null,
      selectedSlotIndex: -1,
      cursorIndex: 0,
      minSize: 1,
      maxSize: 4,
      isValid: false,
      validationReasons: []
    });

    this.events = new EventEmitter<PartyEvents<TStats>>();
  }

  /**
   * 状態を購読
   */
  subscribe(listener: (state: PartyUIState<TStats>) => void): () => void {
    return this.state.subscribe(listener);
  }

  /**
   * イベントを購読
   */
  on<K extends keyof PartyEvents<TStats>>(
    event: K,
    listener: (data: PartyEvents<TStats>[K]) => void
  ): () => void {
    return this.events.on(event, listener);
  }

  /**
   * 現在の状態を取得
   */
  getState(): PartyUIState<TStats> {
    return this.state.getState();
  }

  /**
   * パーティ管理を開始
   */
  startPartyManagement(
    currentParty: Combatant<TStats>[],
    availableMembers: Combatant<TStats>[],
    minSize: number = 1,
    maxSize: number = 4
  ): void {
    const validation = this.validateParty(currentParty, minSize, maxSize);
    
    this.state.setState({
      stage: 'viewing',
      party: [...currentParty],
      availableMembers: [...availableMembers],
      selectedMember: null,
      selectedSlotIndex: -1,
      cursorIndex: 0,
      minSize,
      maxSize,
      isValid: validation.isValid,
      validationReasons: validation.reasons
    });
  }

  /**
   * メンバーを追加
   */
  addMember(member: Combatant<TStats>): boolean {
    const currentState = this.state.getState();
    
    const result = this.service.addMember(currentState.party, member);
    
    if (result.success) {
      const newParty = [...currentState.party];
      const validation = this.validateParty(newParty, currentState.minSize, currentState.maxSize);
      
      this.state.setState({
        party: newParty,
        isValid: validation.isValid,
        validationReasons: validation.reasons
      });
      
      this.events.emit('member-added', { 
        member, 
        index: newParty.length - 1 
      });
      this.events.emit('formation-changed', { party: newParty });
      
      return true;
    }
    
    return false;
  }

  /**
   * メンバーを削除
   */
  removeMember(member: Combatant<TStats>): boolean {
    const currentState = this.state.getState();
    
    const result = this.service.removeMember(currentState.party, member.id);
    
    if (result.success) {
      const newParty = [...currentState.party];
      const index = newParty.findIndex(m => m.id === member.id);
      
      if (index !== -1) {
        newParty.splice(index, 1);
      }
      
      const validation = this.validateParty(newParty, currentState.minSize, currentState.maxSize);
      
      this.state.setState({
        party: newParty,
        isValid: validation.isValid,
        validationReasons: validation.reasons
      });
      
      this.events.emit('member-removed', { member, index });
      this.events.emit('formation-changed', { party: newParty });
      
      return true;
    }
    
    return false;
  }

  /**
   * メンバーの位置を入れ替え
   */
  swapMembers(index1: number, index2: number): boolean {
    const currentState = this.state.getState();
    
    if (index1 < 0 || index1 >= currentState.party.length ||
        index2 < 0 || index2 >= currentState.party.length) {
      return false;
    }
    
    // Swap positions manually
    const newParty = [...currentState.party];
    const temp = newParty[index1];
    newParty[index1] = newParty[index2];
    newParty[index2] = temp;
    
    this.state.setState({ party: newParty });
    
    this.events.emit('member-swapped', {
      member1: newParty[index1],
      index1,
      member2: newParty[index2],
      index2
    });
    this.events.emit('formation-changed', { party: newParty });
    
    return true;
  }

  /**
   * メンバーを選択
   */
  selectMember(member: Combatant<TStats> | null): void {
    this.state.setState({ 
      selectedMember: member,
      stage: member ? 'selecting-member' : 'viewing'
    });
    
    if (member) {
      this.events.emit('stage-changed', { stage: 'selecting-member' });
    }
  }

  /**
   * スロットを選択（並び替え用）
   */
  selectSlot(index: number): void {
    this.state.setState({ 
      selectedSlotIndex: index,
      stage: 'selecting-slot'
    });
    
    this.events.emit('stage-changed', { stage: 'selecting-slot' });
  }

  /**
   * カーソルを移動
   */
  moveCursor(direction: 'up' | 'down'): void {
    const currentState = this.state.getState();
    const maxIndex = Math.max(
      currentState.party.length - 1,
      currentState.availableMembers.length - 1
    );
    
    let newIndex = currentState.cursorIndex;
    if (direction === 'up') {
      newIndex = Math.max(0, newIndex - 1);
    } else {
      newIndex = Math.min(maxIndex, newIndex + 1);
    }
    
    this.state.setState({ cursorIndex: newIndex });
  }

  /**
   * パーティを検証
   */
  private validateParty(
    party: Combatant<TStats>[],
    minSize: number,
    maxSize: number
  ): { isValid: boolean; reasons: string[] } {
    const reasons: string[] = [];
    
    if (party.length < minSize) {
      reasons.push(`パーティは最低${minSize}人必要です`);
    }
    
    if (party.length > maxSize) {
      reasons.push(`パーティは最大${maxSize}人までです`);
    }
    
    // 重複チェック
    const ids = new Set(party.map(m => m.id));
    if (ids.size !== party.length) {
      reasons.push('同じキャラクターが重複しています');
    }
    
    return {
      isValid: reasons.length === 0,
      reasons
    };
  }

  /**
   * キャンセル
   */
  cancel(): void {
    this.state.setState({
      stage: 'viewing',
      selectedMember: null,
      selectedSlotIndex: -1
    });
    
    this.events.emit('stage-changed', { stage: 'viewing' });
  }

  /**
   * リセット
   */
  reset(): void {
    this.state.setState({
      stage: 'viewing',
      party: [],
      availableMembers: [],
      selectedMember: null,
      selectedSlotIndex: -1,
      cursorIndex: 0,
      minSize: 1,
      maxSize: 4,
      isValid: false,
      validationReasons: []
    });
  }

  /**
   * クリーンアップ
   */
  destroy(): void {
    this.events.clear();
  }
}
