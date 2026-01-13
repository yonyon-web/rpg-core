/**
 * BattleMessageFormatter
 * 
 * 構造化されたBattleMessageを人間が読めるテキストに変換するユーティリティ
 * UIフレームワーク側でこれを参考に独自のフォーマッターを実装できる
 */

import type { BattleMessage } from '../types/battle';

/**
 * メッセージフォーマッター関数の型
 */
export type MessageFormatter = (message: BattleMessage) => string;

/**
 * デフォルトの日本語メッセージフォーマッター
 * 
 * @param message - 構造化されたバトルメッセージ
 * @returns フォーマット済みのメッセージテキスト
 * 
 * @example
 * ```typescript
 * const message: BattleMessage = {
 *   id: 'msg-1',
 *   messageType: 'action-attack',
 *   data: { actorName: 'Hero', damage: 50 },
 *   timestamp: Date.now()
 * };
 * 
 * const text = formatBattleMessage(message);
 * console.log(text); // "Heroの攻撃！"
 * ```
 */
export function formatBattleMessage(message: BattleMessage): string {
  const { messageType, data } = message;

  switch (messageType) {
    case 'battle-started':
      return '戦闘開始！';

    case 'battle-ended-victory':
      return '戦闘に勝利した！';

    case 'battle-ended-defeat':
      return '敗北した...';

    case 'battle-ended-escaped':
      return '逃走に成功した！';

    case 'turn-started':
      if (data.turnNumber) {
        return `ターン${data.turnNumber}`;
      }
      return 'ターン開始';

    case 'action-attack':
      if (data.actorName) {
        return `${data.actorName}の攻撃！`;
      }
      return '攻撃！';

    case 'action-skill':
      if (data.actorName && data.skillName) {
        return `${data.actorName}は${data.skillName}を使った！`;
      } else if (data.actorName) {
        return `${data.actorName}のスキル！`;
      }
      return 'スキル発動！';

    case 'action-item':
      if (data.actorName && data.itemName) {
        return `${data.actorName}は${data.itemName}を使った！`;
      } else if (data.actorName) {
        return `${data.actorName}はアイテムを使った！`;
      }
      return 'アイテム使用！';

    case 'action-defend':
      if (data.actorName) {
        return `${data.actorName}は身を守っている！`;
      }
      return '防御！';

    case 'damage-dealt':
      if (data.targetName && data.damage) {
        return `${data.targetName}に${data.damage}のダメージ！`;
      } else if (data.damage) {
        return `${data.damage}のダメージ！`;
      }
      return 'ダメージ！';

    case 'custom':
      return data.text || 'カスタムメッセージ';

    default:
      return 'メッセージ';
  }
}
