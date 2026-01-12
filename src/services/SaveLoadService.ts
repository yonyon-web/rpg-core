/**
 * SaveLoadService - セーブ/ロードサービス
 * ゲーム状態の保存と読み込みを管理
 */

import type { 
  GameState, 
  SaveSlot, 
  SaveResult,
  LoadResult 
} from '../types/save';
import * as persistence from '../system/persistence';

/**
 * SaveLoadService設定
 */
export interface SaveLoadServiceConfig {
  /** 最大セーブスロット数 */
  maxSlots?: number;
  /** 現在のゲームバージョン */
  gameVersion?: string;
  /** 自動バージョンマイグレーション */
  autoMigrate?: boolean;
}

/**
 * SaveLoadService
 * ゲーム状態のセーブ/ロードを管理するサービスクラス
 * 
 * @example
 * const service = new SaveLoadService({ maxSlots: 10 });
 * const saveResult = service.save(gameState, 1, 'My Save');
 * const loadResult = service.load(1);
 */
export class SaveLoadService {
  private config: Required<SaveLoadServiceConfig>;
  private saveSlots: Map<number, SaveSlot>;

  constructor(config: SaveLoadServiceConfig = {}) {
    this.config = {
      maxSlots: 10,
      gameVersion: '1.0.0',
      autoMigrate: true,
      ...config
    };
    this.saveSlots = new Map();
  }

  /**
   * ゲーム状態をセーブする
   * 
   * @param gameState - セーブするゲーム状態
   * @param slotId - セーブスロットID (1～maxSlots)
   * @param name - セーブ名
   * @param playtime - プレイ時間（秒）
   * @param location - 現在位置
   * @returns セーブ結果
   */
  save(
    gameState: GameState,
    slotId: number,
    name: string,
    playtime: number = 0,
    location: string = 'Unknown'
  ): SaveResult {
    // スロットIDの検証
    if (slotId < 1 || slotId > this.config.maxSlots) {
      return {
        success: false,
        message: `Invalid slot ID. Must be between 1 and ${this.config.maxSlots}.`
      };
    }

    // ゲーム状態の検証
    const validation = persistence.validateSaveData(gameState);
    if (!validation.valid) {
      return {
        success: false,
        message: `Invalid game state: ${validation.errors.join(', ')}`
      };
    }

    // セーブスロットを作成
    const saveSlot: SaveSlot = {
      id: slotId,
      name,
      gameState: {
        ...gameState,
        version: this.config.gameVersion,
        timestamp: Date.now()
      },
      metadata: {
        playtime,
        saveDate: new Date(),
        location
      }
    };

    // スロットに保存
    this.saveSlots.set(slotId, saveSlot);

    return {
      success: true,
      slotId,
      message: `Successfully saved to slot ${slotId}.`
    };
  }

  /**
   * セーブスロットからゲーム状態をロードする
   * 
   * @param slotId - ロードするスロットID
   * @returns ロード結果
   */
  load(slotId: number): LoadResult {
    // スロットIDの検証
    if (slotId < 1 || slotId > this.config.maxSlots) {
      return {
        success: false,
        message: `Invalid slot ID. Must be between 1 and ${this.config.maxSlots}.`
      };
    }

    // スロットの存在確認
    const saveSlot = this.saveSlots.get(slotId);
    if (!saveSlot) {
      return {
        success: false,
        message: `No save data found in slot ${slotId}.`
      };
    }

    let gameState = saveSlot.gameState;

    // バージョンマイグレーション
    if (this.config.autoMigrate && gameState.version !== this.config.gameVersion) {
      gameState = persistence.migrateSaveData(gameState, this.config.gameVersion);
    }

    // データの検証
    const validation = persistence.validateSaveData(gameState);
    if (!validation.valid) {
      return {
        success: false,
        message: `Corrupted save data: ${validation.errors.join(', ')}`
      };
    }

    return {
      success: true,
      gameState,
      message: `Successfully loaded from slot ${slotId}.`
    };
  }

  /**
   * セーブスロットを削除する
   * 
   * @param slotId - 削除するスロットID
   * @returns 削除に成功したか
   */
  deleteSave(slotId: number): boolean {
    if (slotId < 1 || slotId > this.config.maxSlots) {
      return false;
    }

    return this.saveSlots.delete(slotId);
  }

  /**
   * セーブスロット情報を取得する
   * 
   * @param slotId - スロットID
   * @returns セーブスロット（存在しない場合はundefined）
   */
  getSaveSlot(slotId: number): SaveSlot | undefined {
    return this.saveSlots.get(slotId);
  }

  /**
   * すべてのセーブスロット情報を取得する
   * 
   * @returns セーブスロットの配列
   */
  getAllSaveSlots(): SaveSlot[] {
    return Array.from(this.saveSlots.values()).sort((a, b) => a.id - b.id);
  }

  /**
   * セーブスロットが存在するかチェックする
   * 
   * @param slotId - スロットID
   * @returns 存在するか
   */
  hasSave(slotId: number): boolean {
    return this.saveSlots.has(slotId);
  }

  /**
   * すべてのセーブデータをクリアする
   */
  clearAll(): void {
    this.saveSlots.clear();
  }

  /**
   * セーブデータをエクスポートする（JSON文字列）
   * 
   * @param slotId - エクスポートするスロットID
   * @returns JSON文字列（失敗時はnull）
   */
  exportSave(slotId: number): string | null {
    const saveSlot = this.saveSlots.get(slotId);
    if (!saveSlot) {
      return null;
    }

    return persistence.serializeGameState(saveSlot.gameState);
  }

  /**
   * セーブデータをインポートする（JSON文字列から）
   * 
   * @param slotId - インポート先のスロットID
   * @param data - JSON文字列
   * @param name - セーブ名
   * @returns インポートに成功したか
   */
  importSave(slotId: number, data: string, name: string): SaveResult {
    try {
      // JSON文字列をパース
      const gameState = persistence.deserializeGameState(data);

      // 通常のsaveメソッドを使用
      return this.save(gameState, slotId, name);
    } catch (error) {
      return {
        success: false,
        message: `Failed to import save data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * 設定を取得する
   * 
   * @returns 現在の設定
   */
  getConfig(): Readonly<Required<SaveLoadServiceConfig>> {
    return { ...this.config };
  }
}
