/**
 * PartyService - パーティ管理サービス
 * パーティ構成とフォーメーション管理
 */

import type { Combatant } from '../types/combatant';
import type { BaseStats, DefaultStats } from '../types/stats';
import * as partyCore from '../party/formation';

/**
 * パーティ操作結果
 */
export interface PartyOperationResult<TStats extends BaseStats = DefaultStats> {
  success: boolean;
  reason?: string;
  removedMember?: Combatant<TStats>;
}

/**
 * PartyService設定
 */
export interface PartyServiceConfig {
  minSize?: number;  // 最小パーティサイズ（デフォルト: 1）
  maxSize?: number;  // 最大パーティサイズ（デフォルト: 4）
}

/**
 * PartyService
 * パーティ管理を行うサービスクラス
 * 
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 * 
 * @example
 * const service = new PartyService();
 * const result = service.addMember(party, character);
 * 
 * @example
 * // カスタム設定
 * const service = new PartyService({ minSize: 1, maxSize: 6 });
 */
export class PartyService<TStats extends BaseStats = DefaultStats> {
  private config: Required<PartyServiceConfig>;

  constructor(config?: PartyServiceConfig) {
    this.config = {
      minSize: config?.minSize ?? 1,
      maxSize: config?.maxSize ?? 4
    };
  }

  /**
   * パーティにメンバーを追加
   * 
   * @param party - パーティ
   * @param member - 追加するメンバー
   * @returns 操作結果
   */
  addMember(
    party: Combatant<TStats>[], 
    member: Combatant<TStats>
  ): PartyOperationResult<TStats> {
    // サイズ制限チェック
    if (!partyCore.canAddMember(party, this.config.maxSize)) {
      return {
        success: false,
        reason: `パーティは最大${this.config.maxSize}人までです`
      };
    }

    // 重複チェック
    if (partyCore.hasMember(party, member.id)) {
      return {
        success: false,
        reason: 'このメンバーは既にパーティに参加しています'
      };
    }

    // メンバー追加
    party.push(member);

    return {
      success: true
    };
  }

  /**
   * パーティからメンバーを削除
   * 
   * @param party - パーティ
   * @param memberId - 削除するメンバーのID
   * @returns 操作結果
   */
  removeMember(
    party: Combatant<TStats>[], 
    memberId: string
  ): PartyOperationResult<TStats> {
    // メンバー検索
    const index = party.findIndex(m => m.id === memberId);
    
    if (index === -1) {
      return {
        success: false,
        reason: 'メンバーが見つかりません'
      };
    }

    // 最小サイズチェック
    if (!partyCore.canRemoveMember(party, this.config.minSize)) {
      return {
        success: false,
        reason: `パーティは最低${this.config.minSize}人必要です`
      };
    }

    // メンバー削除
    const [removed] = party.splice(index, 1);

    return {
      success: true,
      removedMember: removed
    };
  }

  /**
   * パーティ内でメンバーを入れ替え
   * 
   * @param party - パーティ
   * @param index1 - 1つ目のインデックス
   * @param index2 - 2つ目のインデックス
   * @returns 操作結果
   */
  swapMembers(
    party: Combatant<TStats>[], 
    index1: number, 
    index2: number
  ): PartyOperationResult<TStats> {
    // インデックス検証
    if (!partyCore.isValidIndex(party, index1) || !partyCore.isValidIndex(party, index2)) {
      return {
        success: false,
        reason: '無効なインデックスです'
      };
    }

    // 入れ替え
    [party[index1], party[index2]] = [party[index2], party[index1]];

    return {
      success: true
    };
  }

  /**
   * メンバーのポジションを変更
   * 
   * @param member - メンバー
   * @param position - 新しいポジション（0=前列、1=後列）
   * @returns 操作結果
   */
  changePosition(
    member: Combatant<TStats>, 
    position: number
  ): PartyOperationResult<TStats> {
    member.position = position;

    return {
      success: true
    };
  }

  /**
   * パーティ全体のフォーメーションを設定
   * 
   * @param party - パーティ
   * @param positions - 各メンバーのポジション配列
   * @returns 操作結果
   */
  setFormation(
    party: Combatant<TStats>[], 
    positions: number[]
  ): PartyOperationResult<TStats> {
    // 配列長チェック
    if (positions.length !== party.length) {
      return {
        success: false,
        reason: 'ポジション配列の長さがパーティサイズと一致しません'
      };
    }

    // ポジション設定
    party.forEach((member, index) => {
      member.position = positions[index];
    });

    return {
      success: true
    };
  }

  /**
   * パーティサイズが有効かチェック
   * 
   * @param party - パーティ
   * @returns 有効な場合true
   */
  isValidPartySize(party: Combatant<TStats>[]): boolean {
    return partyCore.isValidPartySize(party, this.config.minSize, this.config.maxSize);
  }
}
