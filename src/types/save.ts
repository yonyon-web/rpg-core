/**
 * セーブ/ロード関連の型定義
 */

import type { Combatant } from './combatant';
import type { ConsumableItem } from './item';

/**
 * ゲーム状態
 * セーブ/ロードの対象となるゲーム全体の状態
 */
export interface GameState {
  /** セーブデータのバージョン (semantic version: "1.0.0") */
  version: string;
  /** セーブ日時 (Unix timestamp in milliseconds) */
  timestamp: number;
  /** プレイヤーデータ */
  player: {
    /** パーティメンバー (最大4人) */
    party: Combatant[];
    /** インベントリ */
    inventory: ConsumableItem[];
    /** 所持金 (非負整数) */
    gold: number;
  };
  /** ゲーム進行状況 */
  progress: {
    /** 完了したクエストID */
    completedQuests: string[];
    /** 解放済みエリア */
    unlockedAreas: string[];
    /** その他のフラグ */
    flags: Record<string, boolean | number | string>;
  };
}

/**
 * セーブスロット
 */
export interface SaveSlot {
  /** スロットID (1-N) */
  id: number;
  /** セーブ名 (ユーザー定義) */
  name: string;
  /** ゲーム状態 */
  gameState: GameState;
  /** メタデータ */
  metadata: {
    /** プレイ時間 (秒) */
    playtime: number;
    /** セーブ日時 */
    saveDate: Date;
    /** 現在位置/エリア名 */
    location: string;
  };
}

/**
 * セーブ結果
 */
export interface SaveResult {
  /** 成功したか */
  success: boolean;
  /** セーブスロットID（成功時） */
  slotId?: number;
  /** メッセージ */
  message: string;
}

/**
 * ロード結果
 */
export interface LoadResult {
  /** 成功したか */
  success: boolean;
  /** ロードしたゲーム状態（成功時） */
  gameState?: GameState;
  /** メッセージ */
  message: string;
}
