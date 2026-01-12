/**
 * system/persistence - データ永続化の計算ロジック
 * 
 * このモジュールは純粋関数として実装され、ゲーム状態のシリアライズ/
 * デシリアライズに関するロジックを提供します。
 */

import type { GameState } from '../types/save';

/**
 * 検証結果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * ゲーム状態をシリアライズする
 * 
 * @param state - ゲーム状態
 * @returns JSON文字列
 */
export function serializeGameState(state: GameState): string {
  return JSON.stringify(state);
}

/**
 * JSON文字列をゲーム状態にデシリアライズする
 * 
 * @param data - JSON文字列
 * @returns ゲーム状態
 * @throws JSON parse error
 */
export function deserializeGameState(data: string): GameState {
  return JSON.parse(data);
}

/**
 * セーブデータを検証する
 * 
 * @param state - ゲーム状態
 * @returns 検証結果
 */
export function validateSaveData(state: GameState): ValidationResult {
  const errors: string[] = [];

  // バージョンチェック
  if (!state.version || typeof state.version !== 'string') {
    errors.push('Invalid version format');
  }

  // タイムスタンプチェック
  if (!state.timestamp || typeof state.timestamp !== 'number') {
    errors.push('Invalid timestamp');
  }

  // プレイヤーデータチェック
  if (!state.player) {
    errors.push('Missing player data');
  } else {
    if (!Array.isArray(state.player.party)) {
      errors.push('Invalid party data');
    }
    if (!Array.isArray(state.player.inventory)) {
      errors.push('Invalid inventory data');
    }
    if (typeof state.player.gold !== 'number' || state.player.gold < 0) {
      errors.push('Invalid gold amount');
    }
  }

  // 進行状況チェック
  if (!state.progress) {
    errors.push('Missing progress data');
  } else {
    if (!Array.isArray(state.progress.completedQuests)) {
      errors.push('Invalid completed quests data');
    }
    if (!Array.isArray(state.progress.unlockedAreas)) {
      errors.push('Invalid unlocked areas data');
    }
    if (typeof state.progress.flags !== 'object') {
      errors.push('Invalid flags data');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * セーブデータをマイグレーションする
 * 
 * @param state - ゲーム状態
 * @param currentVersion - 現在のゲームバージョン
 * @returns マイグレーション後のゲーム状態
 */
export function migrateSaveData(
  state: GameState,
  currentVersion: string
): GameState {
  // 簡易的なバージョン比較（実際にはsemverライブラリを使用すべき）
  const saveVersion = state.version;
  
  if (saveVersion === currentVersion) {
    return state;
  }

  // バージョンが古い場合はマイグレーション処理を実行
  // ここでは例として、バージョンを更新するだけ
  const migratedState: GameState = {
    ...state,
    version: currentVersion
  };

  // 実際のゲームでは、バージョンごとのマイグレーション処理を実装
  // 例: v1.0.0 -> v1.1.0で新しいフィールドを追加する場合など

  return migratedState;
}

/**
 * セーブデータを圧縮する（オプション）
 * 
 * @param data - JSON文字列
 * @returns 圧縮された文字列
 */
export function compressSaveData(data: string): string {
  // 実際のゲームではLZ圧縮などを使用
  // ここでは簡易的に実装（実装なし）
  return data;
}

/**
 * 圧縮されたセーブデータを展開する（オプション）
 * 
 * @param data - 圧縮された文字列
 * @returns 展開された文字列
 */
export function decompressSaveData(data: string): string {
  // 実際のゲームではLZ圧縮などを使用
  // ここでは簡易的に実装（実装なし）
  return data;
}
