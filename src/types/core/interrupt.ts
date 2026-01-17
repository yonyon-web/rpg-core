/**
 * アクション結果割り込みシステムの型定義
 * 
 * 攻撃の結果に割り込んで追加処理を行う仕組み
 * 例：ドラクエの眠り状態が一定ダメージで解除される処理
 */

import { UniqueId } from '../common';
import { Combatant } from '../battle/combatant';
import { ActionResult } from '../battle/battle';
import { Skill } from '../character/skill';

/**
 * 割り込みコンテキスト
 * 割り込み処理に渡される情報
 */
export interface InterruptContext {
  /** 行動者 */
  actor: Combatant;
  /** 対象者 */
  target: Combatant;
  /** アクション結果 */
  result: ActionResult;
  /** 使用されたスキル（存在する場合） */
  skill?: Skill;
  /** カスタムデータ（拡張用） */
  customData?: Record<string, any>;
}

/**
 * 割り込み実行結果
 */
export interface InterruptResult {
  /** 割り込み処理が実行されたか */
  executed: boolean;
  /** メッセージ（オプション） */
  message?: string;
  /** 状態変更があったか */
  stateChanged?: boolean;
  /** カスタムデータ（拡張用） */
  customData?: Record<string, any>;
}

/**
 * 割り込みハンドラー関数の型
 * コンテキストを受け取り、割り込み結果を返す
 * 
 * @param context - 割り込みコンテキスト
 * @returns 割り込み実行結果のPromise
 */
export type InterruptHandler = (context: InterruptContext) => Promise<InterruptResult> | InterruptResult;

/**
 * 割り込み定義
 */
export interface InterruptDefinition {
  /** 割り込みID */
  id: UniqueId;
  /** 割り込み名 */
  name: string;
  /** 説明 */
  description?: string;
  /** 優先度（高いほど先に実行） */
  priority: number;
  /** 割り込みハンドラー */
  handler: InterruptHandler;
  /** 有効フラグ */
  enabled: boolean;
}

/**
 * 割り込みタイプ
 * - common: 共通ルール（全キャラ・全敵に適用）
 * - enemy: 敵個別ルール
 * - character: キャラクター個別ルール
 * - job: ジョブ別ルール
 */
export type InterruptType = 'common' | 'enemy' | 'character' | 'job';

/**
 * 割り込み登録情報
 */
export interface InterruptRegistration {
  /** 割り込みタイプ */
  type: InterruptType;
  /** 対象ID（enemy/character/jobタイプの場合） */
  targetId?: string;
  /** 割り込み定義 */
  definition: InterruptDefinition;
}

/**
 * 割り込み条件チェック関数
 * 割り込みを実行するかどうかの条件判定
 */
export type InterruptCondition = (context: InterruptContext) => boolean;

/**
 * 条件付き割り込み定義
 */
export interface ConditionalInterruptDefinition extends InterruptDefinition {
  /** 実行条件 */
  condition: InterruptCondition;
}
