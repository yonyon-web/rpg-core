/**
 * SaveLoadService - セーブ/ロードサービス
 * ゲーム状態の保存と読み込みを管理
 */

import type { 
  GameState, 
  SaveSlot, 
  SaveResult,
  LoadResult 
} from '../../types/save';
import type { DataChangeEvent, AutoSaveCompletedEvent, AutoSaveFailedEvent } from '../../types/events';
import type { EventBus } from '../../core/EventBus';
import * as persistence from '../../system/persistence';

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
  /** 自動セーブを有効にするか */
  autoSaveEnabled?: boolean;
  /** 自動セーブのデバウンス時間（ミリ秒） */
  autoSaveDebounceMs?: number;
  /** 自動セーブの失敗時リトライ回数 */
  maxAutoSaveRetries?: number;
  /** 自動セーブをトリガーするイベントタイプのフィルタ */
  autoSaveOnEvents?: string[];
  /** 自動セーブ用のスロットID */
  autoSaveSlotId?: number;
}

/**
 * SaveLoadService
 * ゲーム状態のセーブ/ロードを管理するサービスクラス
 * 
 * @example
 * const service = new SaveLoadService({ maxSlots: 10 });
 * const saveResult = service.save(gameState, 1, 'My Save');
 * const loadResult = service.load(1);
 * 
 * @example
 * // 自動セーブを有効にする
 * const eventBus = new EventBus();
 * const service = new SaveLoadService({ 
 *   autoSaveEnabled: true,
 *   autoSaveDebounceMs: 2000 
 * }, eventBus);
 * service.setCurrentGameState(() => gameState);
 */
export class SaveLoadService {
  private config: SaveLoadServiceConfig & {
    maxSlots: number;
    gameVersion: string;
    autoMigrate: boolean;
    autoSaveEnabled: boolean;
    autoSaveDebounceMs: number;
    maxAutoSaveRetries: number;
    autoSaveSlotId: number;
  };
  private saveSlots: Map<number, SaveSlot>;
  private eventBus?: EventBus;
  private autoSaveEnabled: boolean;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentGameStateProvider?: () => GameState;
  private autoSaveRetryCount: number = 0;

  constructor(config: SaveLoadServiceConfig = {}, eventBus?: EventBus) {
    this.config = {
      maxSlots: 10,
      gameVersion: '1.0.0',
      autoMigrate: true,
      autoSaveEnabled: false,
      autoSaveDebounceMs: 1000,
      maxAutoSaveRetries: 3,
      autoSaveSlotId: 1,
      ...config
    };
    this.saveSlots = new Map();
    this.eventBus = eventBus;
    this.autoSaveEnabled = this.config.autoSaveEnabled;

    // イベントバスが提供されている場合、自動セーブを設定
    if (this.eventBus && this.autoSaveEnabled) {
      this.setupAutoSave();
    }
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
  getConfig(): Readonly<SaveLoadServiceConfig> {
    return { ...this.config };
  }

  /**
   * 自動セーブを設定する
   * イベントリスナーを登録し、データ変更イベントを監視する
   * 
   * @private
   */
  private setupAutoSave(): void {
    if (!this.eventBus) {
      return;
    }

    this.eventBus.on<DataChangeEvent>('data-changed', (event: DataChangeEvent) => {
      // 自動セーブが有効かチェック
      if (!this.autoSaveEnabled) {
        return;
      }

      // イベントタイプフィルタが設定されている場合、フィルタに合致するかチェック
      if (this.config.autoSaveOnEvents && this.config.autoSaveOnEvents.length > 0) {
        if (!this.config.autoSaveOnEvents.includes(event.type)) {
          return;
        }
      }

      // 自動セーブをスケジュール
      this.scheduleAutoSave();
    });
  }

  /**
   * 自動セーブをスケジュールする
   * デバウンス処理: 連続した変更を1回のセーブにまとめる
   * 
   * @private
   */
  private scheduleAutoSave(): void {
    // 既存のタイマーをキャンセル
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // 新しいタイマーを設定
    this.saveTimeout = setTimeout(() => {
      this.autoSave();
    }, this.config.autoSaveDebounceMs);
  }

  /**
   * 自動セーブを実行する
   * 
   * @private
   */
  private autoSave(): void {
    // ゲーム状態プロバイダーが設定されていない場合は何もしない
    if (!this.currentGameStateProvider) {
      return;
    }

    try {
      // 現在のゲーム状態を取得
      const gameState = this.currentGameStateProvider();

      // セーブを実行
      const result = this.save(
        gameState,
        this.config.autoSaveSlotId,
        'Auto Save',
        0,
        'Auto'
      );

      if (result.success) {
        // セーブ成功時はリトライカウントをリセット
        this.autoSaveRetryCount = 0;

        // セーブ成功イベントを発行
        if (this.eventBus) {
          this.eventBus.emit<AutoSaveCompletedEvent>('auto-save-completed', {
            timestamp: Date.now(),
            slotId: this.config.autoSaveSlotId
          });
        }
      } else {
        // セーブ失敗時の処理
        this.handleAutoSaveFailure(result.message);
      }
    } catch (error) {
      // エラー発生時の処理
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.handleAutoSaveFailure(errorMessage);
    }
  }

  /**
   * 自動セーブの失敗を処理する
   * 
   * @param errorMessage - エラーメッセージ
   * @private
   */
  private handleAutoSaveFailure(errorMessage: string): void {
    this.autoSaveRetryCount++;

    // リトライ上限に達していない場合は再スケジュール
    if (this.autoSaveRetryCount < this.config.maxAutoSaveRetries) {
      // 指数バックオフでリトライ
      const retryDelay = this.config.autoSaveDebounceMs * Math.pow(2, this.autoSaveRetryCount);
      this.saveTimeout = setTimeout(() => {
        this.autoSave();
      }, retryDelay);
    } else {
      // リトライ上限に達した場合はセーブ失敗イベントを発行
      if (this.eventBus) {
        this.eventBus.emit<AutoSaveFailedEvent>('auto-save-failed', {
          timestamp: Date.now(),
          error: errorMessage,
          retryCount: this.autoSaveRetryCount
        });
      }

      // リトライカウントをリセット
      this.autoSaveRetryCount = 0;
    }
  }

  /**
   * 現在のゲーム状態プロバイダーを設定する
   * 自動セーブ時にこのプロバイダーが呼び出され、現在のゲーム状態が取得される
   * 
   * @param provider - ゲーム状態を返す関数
   * 
   * @example
   * service.setCurrentGameState(() => {
   *   return {
   *     version: '1.0.0',
   *     timestamp: Date.now(),
   *     player: { party, inventory, gold },
   *     progress: { completedQuests, unlockedAreas, flags }
   *   };
   * });
   */
  setCurrentGameState(provider: () => GameState): void {
    this.currentGameStateProvider = provider;
  }

  /**
   * 自動セーブを有効にする
   * 
   * @example
   * service.enableAutoSave();
   */
  enableAutoSave(): void {
    this.autoSaveEnabled = true;
  }

  /**
   * 自動セーブを無効にする
   * スケジュールされている自動セーブもキャンセルされる
   * 
   * @example
   * service.disableAutoSave();
   */
  disableAutoSave(): void {
    this.autoSaveEnabled = false;

    // スケジュールされているセーブをキャンセル
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }

  /**
   * 自動セーブが有効かどうかを取得する
   * 
   * @returns 自動セーブが有効な場合true
   */
  isAutoSaveEnabled(): boolean {
    return this.autoSaveEnabled;
  }
}
