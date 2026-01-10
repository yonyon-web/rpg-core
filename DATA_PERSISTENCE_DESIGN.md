# データ永続化設計

rpg-coreライブラリにおけるデータ永続化の包括的な設計ドキュメント

## 概要

このドキュメントでは、ゲーム状態の保存・読み込みに関する詳細な設計を定義します。

### 設計原則

1. **ストレージ非依存**: LocalStorage、IndexedDB、サーバーなど、任意のストレージに対応
2. **バージョン管理**: データフォーマットの変更に対応可能なバージョニング
3. **部分保存対応**: 全体保存と差分保存の両方をサポート
4. **検証機能**: 破損データの検出と復旧
5. **暗号化対応**: セーブデータの改ざん防止（オプション）

---

## アーキテクチャ

### レイヤー構成

```text
┌─────────────────────────────────────┐
│ SaveLoadService                      │ ← フロー管理
│ (セーブ/ロードの操作を管理)           │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│ PersistenceManager                   │ ← 永続化ロジック
│ (シリアライズ、バージョニング)        │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│ StorageAdapter (Interface)           │ ← ストレージ抽象化
│ (LocalStorage, IndexedDB, Cloud...)  │
└─────────────────────────────────────┘
```

### 責任分担

| コンポーネント | 責任 |
|--------------|------|
| **SaveLoadService** | セーブ/ロードのフロー管理、UIとの連携 |
| **PersistenceManager** | シリアライズ/デシリアライズ、バージョン管理、検証 |
| **StorageAdapter** | 実際のストレージへの読み書き（実装者が選択） |
| **Core Engine** | データ構造の定義、シリアライズルール |

---

## データスキーマ

### GameState 構造

```typescript
/**
 * 永続化するゲーム状態の完全な定義
 */
interface GameState {
  // メタデータ
  version: string;              // データバージョン (例: "1.0.0")
  saveDate: number;             // 保存日時 (Unix timestamp)
  playTime: number;             // プレイ時間（秒）
  gameVersion: string;          // ゲームバージョン
  
  // プレイヤーデータ
  player: {
    name: string;
    playerId: string;
    flags: Record<string, boolean>;  // ストーリーフラグなど
  };
  
  // パーティ
  party: {
    members: Character[];        // パーティメンバー
    formation: number;           // 隊形
    inventory: Inventory;        // 所持アイテム
    money: number;              // 所持金
  };
  
  // 進行状況
  progress: {
    currentMap: string;          // 現在のマップID
    currentPosition: Position;   // プレイヤー座標
    clearedQuests: string[];     // クリア済みクエスト
    unlockedAreas: string[];     // 解放済みエリア
    storyFlags: Record<string, any>;  // ストーリー進行フラグ
  };
  
  // 戦闘状態（戦闘中の場合）
  battle?: BattleState;
  
  // カスタムデータ（ゲーム固有）
  custom?: Record<string, any>;
}

/**
 * セーブスロットのメタ情報
 */
interface SaveMetadata {
  slot: number;                 // スロット番号
  exists: boolean;              // データの有無
  thumbnail?: string;           // サムネイル画像 (Base64)
  saveDate: number;             // 保存日時
  playTime: number;             // プレイ時間
  location: string;             // セーブ地点
  partyLevel: number;           // パーティ平均レベル
}
```

### シリアライズ形式

```typescript
/**
 * 実際にストレージに保存される形式
 */
interface SerializedSaveData {
  // ヘッダー
  header: {
    magic: string;               // "RPGCORE" (識別子)
    version: string;             // データフォーマットバージョン
    compressed: boolean;         // 圧縮の有無
    encrypted: boolean;          // 暗号化の有無
    checksum: string;            // チェックサム (データ検証用)
  };
  
  // メタデータ
  metadata: SaveMetadata;
  
  // ゲームデータ（圧縮・暗号化される可能性あり）
  data: string;                  // JSON.stringify(gameState)
}
```

---

## PersistenceManager 実装

### インターフェース定義

```typescript
/**
 * 永続化管理クラス
 */
class PersistenceManager {
  constructor(
    private adapter: StorageAdapter,
    private options: PersistenceOptions = {}
  ) {}
  
  /**
   * ゲーム状態を保存
   */
  async save(slot: number, gameState: GameState): Promise<SaveResult> {
    // 1. バリデーション
    this.validateGameState(gameState);
    
    // 2. シリアライズ
    const serialized = this.serialize(gameState);
    
    // 3. 圧縮（オプション）
    const compressed = this.options.compress 
      ? await this.compress(serialized)
      : serialized;
    
    // 4. 暗号化（オプション）
    const encrypted = this.options.encrypt
      ? await this.encrypt(compressed)
      : compressed;
    
    // 5. チェックサム計算
    const checksum = this.calculateChecksum(encrypted);
    
    // 6. 保存データの構築
    const saveData: SerializedSaveData = {
      header: {
        magic: 'RPGCORE',
        version: this.options.dataVersion || '1.0.0',
        compressed: this.options.compress || false,
        encrypted: this.options.encrypt || false,
        checksum
      },
      metadata: this.createMetadata(slot, gameState),
      data: encrypted
    };
    
    // 7. ストレージに保存
    await this.adapter.write(`save_${slot}`, saveData);
    
    return { success: true, slot };
  }
  
  /**
   * ゲーム状態を読み込み
   */
  async load(slot: number): Promise<GameState> {
    // 1. ストレージから読み込み
    const saveData = await this.adapter.read<SerializedSaveData>(`save_${slot}`);
    
    if (!saveData) {
      throw new Error(`Save slot ${slot} not found`);
    }
    
    // 2. ヘッダー検証
    this.validateHeader(saveData.header);
    
    // 3. チェックサム検証
    const checksum = this.calculateChecksum(saveData.data);
    if (checksum !== saveData.header.checksum) {
      throw new Error('Save data corrupted: checksum mismatch');
    }
    
    // 4. 復号化（必要な場合）
    const decrypted = saveData.header.encrypted
      ? await this.decrypt(saveData.data)
      : saveData.data;
    
    // 5. 解凍（必要な場合）
    const decompressed = saveData.header.compressed
      ? await this.decompress(decrypted)
      : decrypted;
    
    // 6. デシリアライズ
    const gameState = this.deserialize(decompressed);
    
    // 7. マイグレーション（バージョンが古い場合）
    const migrated = await this.migrate(gameState, saveData.header.version);
    
    // 8. バリデーション
    this.validateGameState(migrated);
    
    return migrated;
  }
  
  /**
   * セーブデータ一覧を取得
   */
  async listSaves(): Promise<SaveMetadata[]> {
    const keys = await this.adapter.list();
    const saves: SaveMetadata[] = [];
    
    for (const key of keys) {
      if (key.startsWith('save_')) {
        const slot = parseInt(key.replace('save_', ''), 10);
        const metadata = await this.getMetadata(slot);
        if (metadata) {
          saves.push(metadata);
        }
      }
    }
    
    return saves.sort((a, b) => a.slot - b.slot);
  }
  
  /**
   * セーブデータを削除
   */
  async deleteSave(slot: number): Promise<void> {
    await this.adapter.delete(`save_${slot}`);
  }
  
  // --- Private メソッド ---
  
  private serialize(gameState: GameState): string {
    return JSON.stringify(gameState);
  }
  
  private deserialize(data: string): GameState {
    return JSON.parse(data);
  }
  
  private validateGameState(gameState: GameState): void {
    if (!gameState.version) {
      throw new Error('Invalid game state: missing version');
    }
    if (!gameState.party || !Array.isArray(gameState.party.members)) {
      throw new Error('Invalid game state: invalid party data');
    }
    // その他の検証...
  }
  
  private validateHeader(header: SerializedSaveData['header']): void {
    if (header.magic !== 'RPGCORE') {
      throw new Error('Invalid save data: wrong magic number');
    }
  }
  
  private calculateChecksum(data: string): string {
    // 簡易的なチェックサム（実装例）
    // 本番環境では SHA-256 などを使用
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
  
  private createMetadata(slot: number, gameState: GameState): SaveMetadata {
    return {
      slot,
      exists: true,
      saveDate: Date.now(),
      playTime: gameState.playTime,
      location: gameState.progress.currentMap,
      partyLevel: Math.floor(
        gameState.party.members.reduce((sum, m) => sum + m.level, 0) / 
        gameState.party.members.length
      )
    };
  }
  
  private async getMetadata(slot: number): Promise<SaveMetadata | null> {
    try {
      const saveData = await this.adapter.read<SerializedSaveData>(`save_${slot}`);
      return saveData ? saveData.metadata : null;
    } catch {
      return null;
    }
  }
  
  private async compress(data: string): Promise<string> {
    // 圧縮実装（例: pako, lz-string など）
    // ここでは単純化のため未実装
    return data;
  }
  
  private async decompress(data: string): Promise<string> {
    // 解凍実装
    return data;
  }
  
  private async encrypt(data: string): Promise<string> {
    // 暗号化実装（例: crypto-js など）
    // ここでは単純化のため未実装
    return data;
  }
  
  private async decrypt(data: string): Promise<string> {
    // 復号化実装
    return data;
  }
  
  private async migrate(
    gameState: GameState, 
    fromVersion: string
  ): Promise<GameState> {
    // バージョンマイグレーション
    // 例: v1.0.0 → v1.1.0 の場合、新しいフィールドを追加
    return gameState;
  }
}

/**
 * 永続化オプション
 */
interface PersistenceOptions {
  dataVersion?: string;         // データバージョン
  compress?: boolean;           // 圧縮を有効化
  encrypt?: boolean;            // 暗号化を有効化
  encryptionKey?: string;       // 暗号化キー
}

/**
 * セーブ結果
 */
interface SaveResult {
  success: boolean;
  slot: number;
  error?: string;
}
```

---

## StorageAdapter インターフェース

### 抽象インターフェース

```typescript
/**
 * ストレージアダプターのインターフェース
 * 実装者がこのインターフェースに従って具体的なストレージを実装する
 */
interface StorageAdapter {
  /**
   * データを書き込む
   */
  write<T>(key: string, data: T): Promise<void>;
  
  /**
   * データを読み込む
   */
  read<T>(key: string): Promise<T | null>;
  
  /**
   * データを削除
   */
  delete(key: string): Promise<void>;
  
  /**
   * すべてのキーを取得
   */
  list(): Promise<string[]>;
  
  /**
   * ストレージをクリア
   */
  clear(): Promise<void>;
  
  /**
   * 使用可能なストレージ容量を取得（バイト）
   */
  getAvailableSpace?(): Promise<number>;
}
```

### LocalStorage アダプター実装例

```typescript
/**
 * LocalStorage を使用したアダプター
 */
class LocalStorageAdapter implements StorageAdapter {
  constructor(private prefix: string = 'rpgcore_') {}
  
  async write<T>(key: string, data: T): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded');
      }
      throw error;
    }
  }
  
  async read<T>(key: string): Promise<T | null> {
    const item = localStorage.getItem(this.prefix + key);
    return item ? JSON.parse(item) : null;
  }
  
  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }
  
  async list(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.replace(this.prefix, ''));
      }
    }
    return keys;
  }
  
  async clear(): Promise<void> {
    const keys = await this.list();
    for (const key of keys) {
      await this.delete(key);
    }
  }
  
  async getAvailableSpace(): Promise<number> {
    // LocalStorage の制限は通常 5-10MB
    // 正確な残容量の取得は難しいため、概算値を返す
    const used = new Blob(
      Object.values(localStorage)
    ).size;
    const limit = 5 * 1024 * 1024; // 5MB と仮定
    return limit - used;
  }
}
```

### IndexedDB アダプター実装例

```typescript
/**
 * IndexedDB を使用したアダプター（大容量データ向け）
 */
class IndexedDBAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;
  private readonly dbName: string;
  private readonly storeName: string;
  
  constructor(dbName: string = 'rpgcore_db', storeName: string = 'saves') {
    this.dbName = dbName;
    this.storeName = storeName;
  }
  
  private async init(): Promise<void> {
    if (this.db) return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }
  
  async write<T>(key: string, data: T): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(data, key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async read<T>(key: string): Promise<T | null> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }
  
  async delete(key: string): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async list(): Promise<string[]> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }
  
  async clear(): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async getAvailableSpace(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      return quota - usage;
    }
    return Infinity; // 不明な場合は無制限と仮定
  }
}
```

---

## SaveLoadService との統合

### SaveLoadService の実装

```typescript
/**
 * セーブ/ロード操作を管理するService
 */
class SaveLoadService {
  private persistenceManager: PersistenceManager;
  
  constructor(adapter: StorageAdapter, options?: PersistenceOptions) {
    this.persistenceManager = new PersistenceManager(adapter, options);
  }
  
  /**
   * ゲーム状態を保存
   */
  async save(slot: number, gameState: GameState): Promise<SaveResult> {
    try {
      // ゲーム状態の最終検証
      this.validateForSave(gameState);
      
      // メタデータの更新
      gameState.saveDate = Date.now();
      
      // 保存
      const result = await this.persistenceManager.save(slot, gameState);
      
      // 成功イベントの発行
      this.emitSaveSuccess(slot);
      
      return result;
    } catch (error) {
      // エラーイベントの発行
      this.emitSaveError(slot, error);
      throw error;
    }
  }
  
  /**
   * ゲーム状態を読み込み
   */
  async load(slot: number): Promise<GameState> {
    try {
      const gameState = await this.persistenceManager.load(slot);
      
      // 読み込み後の初期化処理
      this.initializeAfterLoad(gameState);
      
      // 成功イベントの発行
      this.emitLoadSuccess(slot);
      
      return gameState;
    } catch (error) {
      // エラーイベントの発行
      this.emitLoadError(slot, error);
      throw error;
    }
  }
  
  /**
   * セーブデータ一覧を取得
   */
  async listSaves(): Promise<SaveMetadata[]> {
    return this.persistenceManager.listSaves();
  }
  
  /**
   * セーブデータを削除
   */
  async deleteSave(slot: number): Promise<void> {
    await this.persistenceManager.deleteSave(slot);
    this.emitDeleteSuccess(slot);
  }
  
  /**
   * オートセーブ
   */
  async autoSave(gameState: GameState): Promise<void> {
    const autoSaveSlot = 0; // スロット0をオートセーブ用とする
    await this.save(autoSaveSlot, gameState);
  }
  
  /**
   * クイックセーブ
   */
  async quickSave(gameState: GameState): Promise<void> {
    const quickSaveSlot = -1; // スロット-1をクイックセーブ用とする
    await this.save(quickSaveSlot, gameState);
  }
  
  /**
   * クイックロード
   */
  async quickLoad(): Promise<GameState> {
    const quickSaveSlot = -1;
    return this.load(quickSaveSlot);
  }
  
  // --- Private メソッド ---
  
  private validateForSave(gameState: GameState): void {
    // セーブ可能な状態かチェック
    // 例: 戦闘中はセーブ不可
    if (gameState.battle && gameState.battle.phase !== 'ended') {
      throw new Error('Cannot save during battle');
    }
  }
  
  private initializeAfterLoad(gameState: GameState): void {
    // ロード後に必要な初期化処理
    // 例: 一時的なバフ・デバフのクリア
    if (gameState.party) {
      for (const member of gameState.party.members) {
        // 戦闘外では一時的な状態異常を解除
        member.statusEffects = member.statusEffects?.filter(
          effect => effect.persistOutsideBattle
        ) || [];
      }
    }
  }
  
  private emitSaveSuccess(slot: number): void {
    // イベント発行（実装は省略）
    console.log(`Save successful: slot ${slot}`);
  }
  
  private emitSaveError(slot: number, error: unknown): void {
    console.error(`Save failed: slot ${slot}`, error);
  }
  
  private emitLoadSuccess(slot: number): void {
    console.log(`Load successful: slot ${slot}`);
  }
  
  private emitLoadError(slot: number, error: unknown): void {
    console.error(`Load failed: slot ${slot}`, error);
  }
  
  private emitDeleteSuccess(slot: number): void {
    console.log(`Delete successful: slot ${slot}`);
  }
}
```

---

## バージョニングとマイグレーション

### マイグレーション戦略

```typescript
/**
 * データマイグレーションの管理
 */
class MigrationManager {
  private migrations: Map<string, Migration> = new Map();
  
  /**
   * マイグレーションを登録
   */
  registerMigration(fromVersion: string, toVersion: string, migrate: MigrateFn): void {
    const key = `${fromVersion}->${toVersion}`;
    this.migrations.set(key, { fromVersion, toVersion, migrate });
  }
  
  /**
   * データをマイグレート
   */
  async migrate(gameState: GameState, currentVersion: string): Promise<GameState> {
    let state = gameState;
    let version = state.version;
    
    // バージョンが一致するまでマイグレーションを繰り返す
    while (version !== currentVersion) {
      const migration = this.findMigration(version, currentVersion);
      
      if (!migration) {
        throw new Error(
          `No migration path found from ${version} to ${currentVersion}`
        );
      }
      
      state = await migration.migrate(state);
      state.version = migration.toVersion;
      version = migration.toVersion;
    }
    
    return state;
  }
  
  private findMigration(fromVersion: string, targetVersion: string): Migration | null {
    // 直接のマイグレーションパスを探す
    const directKey = `${fromVersion}->${targetVersion}`;
    if (this.migrations.has(directKey)) {
      return this.migrations.get(directKey)!;
    }
    
    // 段階的なマイグレーションパスを探す
    for (const [key, migration] of this.migrations) {
      if (migration.fromVersion === fromVersion) {
        return migration;
      }
    }
    
    return null;
  }
}

type MigrateFn = (gameState: GameState) => Promise<GameState> | GameState;

interface Migration {
  fromVersion: string;
  toVersion: string;
  migrate: MigrateFn;
}

// 使用例
const migrationManager = new MigrationManager();

// v1.0.0 → v1.1.0: 新しいフィールド追加
migrationManager.registerMigration('1.0.0', '1.1.0', (state) => {
  return {
    ...state,
    version: '1.1.0',
    progress: {
      ...state.progress,
      unlockedAreas: [] // 新しいフィールド
    }
  };
});

// v1.1.0 → v1.2.0: データ構造の変更
migrationManager.registerMigration('1.1.0', '1.2.0', (state) => {
  return {
    ...state,
    version: '1.2.0',
    party: {
      ...state.party,
      // 旧: inventory が配列
      // 新: inventory がオブジェクト
      inventory: {
        items: state.party.inventory as any, // 旧データを新形式に変換
        capacity: 100
      }
    }
  };
});
```

---

## 差分セーブ

### 差分保存の実装

```typescript
/**
 * 差分セーブをサポートする拡張
 */
class DeltaSaveManager {
  /**
   * 前回のセーブとの差分を計算
   */
  calculateDelta(current: GameState, previous: GameState): GameStateDelta {
    const delta: GameStateDelta = {
      version: current.version,
      timestamp: Date.now(),
      changes: {}
    };
    
    // パーティメンバーの変更
    if (JSON.stringify(current.party.members) !== JSON.stringify(previous.party.members)) {
      delta.changes.partyMembers = current.party.members;
    }
    
    // インベントリの変更
    if (JSON.stringify(current.party.inventory) !== JSON.stringify(previous.party.inventory)) {
      delta.changes.inventory = current.party.inventory;
    }
    
    // 進行状況の変更
    if (JSON.stringify(current.progress) !== JSON.stringify(previous.progress)) {
      delta.changes.progress = current.progress;
    }
    
    // その他の変更...
    
    return delta;
  }
  
  /**
   * 差分を適用してゲーム状態を復元
   */
  applyDelta(base: GameState, delta: GameStateDelta): GameState {
    const restored = { ...base };
    
    if (delta.changes.partyMembers) {
      restored.party.members = delta.changes.partyMembers;
    }
    
    if (delta.changes.inventory) {
      restored.party.inventory = delta.changes.inventory;
    }
    
    if (delta.changes.progress) {
      restored.progress = delta.changes.progress;
    }
    
    // その他の変更を適用...
    
    return restored;
  }
}

interface GameStateDelta {
  version: string;
  timestamp: number;
  changes: {
    partyMembers?: Character[];
    inventory?: Inventory;
    progress?: GameState['progress'];
    // その他の変更可能なフィールド
  };
}
```

---

## オートセーブ機能

### オートセーブの実装

```typescript
/**
 * オートセーブ機能
 */
class AutoSaveManager {
  private lastSaveTime: number = 0;
  private saveInterval: number;
  private saveLoadService: SaveLoadService;
  
  constructor(
    saveLoadService: SaveLoadService,
    intervalMinutes: number = 5
  ) {
    this.saveLoadService = saveLoadService;
    this.saveInterval = intervalMinutes * 60 * 1000;
  }
  
  /**
   * オートセーブが必要かチェック
   */
  shouldAutoSave(): boolean {
    const now = Date.now();
    return (now - this.lastSaveTime) >= this.saveInterval;
  }
  
  /**
   * オートセーブを実行
   */
  async tryAutoSave(gameState: GameState): Promise<boolean> {
    if (!this.shouldAutoSave()) {
      return false;
    }
    
    try {
      await this.saveLoadService.autoSave(gameState);
      this.lastSaveTime = Date.now();
      return true;
    } catch (error) {
      console.error('Auto-save failed:', error);
      return false;
    }
  }
  
  /**
   * 特定のイベントでオートセーブ
   */
  async autoSaveOnEvent(
    gameState: GameState,
    event: 'battle_end' | 'quest_complete' | 'level_up' | 'map_change'
  ): Promise<void> {
    console.log(`Auto-saving on event: ${event}`);
    await this.saveLoadService.autoSave(gameState);
    this.lastSaveTime = Date.now();
  }
}
```

---

## エラーハンドリング

### エラータイプの定義

```typescript
/**
 * 永続化に関するエラー
 */
class PersistenceError extends Error {
  constructor(
    message: string,
    public code: PersistenceErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'PersistenceError';
  }
}

type PersistenceErrorCode =
  | 'QUOTA_EXCEEDED'        // ストレージ容量不足
  | 'CORRUPTED_DATA'        // データ破損
  | 'VERSION_MISMATCH'      // バージョン不整合
  | 'INVALID_FORMAT'        // フォーマット不正
  | 'SLOT_NOT_FOUND'        // スロットが存在しない
  | 'PERMISSION_DENIED'     // アクセス権限なし
  | 'UNKNOWN_ERROR';        // その他のエラー

/**
 * エラーハンドリングの例
 */
async function handleSave(
  service: SaveLoadService,
  slot: number,
  gameState: GameState
): Promise<SaveResult> {
  try {
    return await service.save(slot, gameState);
  } catch (error) {
    if (error instanceof PersistenceError) {
      switch (error.code) {
        case 'QUOTA_EXCEEDED':
          // ユーザーに容量不足を通知
          alert('ストレージ容量が不足しています。古いセーブデータを削除してください。');
          break;
        case 'CORRUPTED_DATA':
          // データ破損を通知
          alert('セーブデータが破損しています。');
          break;
        default:
          alert('セーブに失敗しました。');
      }
    }
    throw error;
  }
}
```

---

## データ検証

### 検証ルールの実装

```typescript
/**
 * ゲーム状態のバリデーター
 */
class GameStateValidator {
  /**
   * ゲーム状態を検証
   */
  validate(gameState: GameState): ValidationResult {
    const errors: string[] = [];
    
    // バージョンチェック
    if (!gameState.version) {
      errors.push('Missing version');
    }
    
    // パーティチェック
    if (!gameState.party) {
      errors.push('Missing party data');
    } else {
      // メンバー数チェック
      if (gameState.party.members.length === 0) {
        errors.push('Party has no members');
      }
      
      // 各メンバーの検証
      for (let i = 0; i < gameState.party.members.length; i++) {
        const member = gameState.party.members[i];
        const memberErrors = this.validateCharacter(member);
        if (memberErrors.length > 0) {
          errors.push(`Party member ${i}: ${memberErrors.join(', ')}`);
        }
      }
    }
    
    // 進行状況チェック
    if (!gameState.progress) {
      errors.push('Missing progress data');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  private validateCharacter(character: Character): string[] {
    const errors: string[] = [];
    
    if (!character.id) {
      errors.push('Missing id');
    }
    if (!character.name) {
      errors.push('Missing name');
    }
    if (character.level < 1 || character.level > 99) {
      errors.push('Invalid level');
    }
    if (character.hp < 0 || character.hp > character.maxHp) {
      errors.push('Invalid HP');
    }
    
    return errors;
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

---

## 使用例

### 基本的な使用方法

```typescript
// 1. ストレージアダプターの選択
const adapter = new LocalStorageAdapter('mygame_');

// 2. PersistenceManager の作成
const manager = new PersistenceManager(adapter, {
  dataVersion: '1.0.0',
  compress: true,
  encrypt: false
});

// 3. SaveLoadService の作成
const saveLoadService = new SaveLoadService(adapter, {
  dataVersion: '1.0.0',
  compress: true
});

// 4. セーブ
const gameState: GameState = {
  version: '1.0.0',
  saveDate: Date.now(),
  playTime: 3600,
  gameVersion: '1.0.0',
  player: {
    name: 'Hero',
    playerId: 'player_1',
    flags: {}
  },
  party: {
    members: [/* キャラクターデータ */],
    formation: 0,
    inventory: { items: [], capacity: 100 },
    money: 1000
  },
  progress: {
    currentMap: 'town_start',
    currentPosition: { x: 10, y: 20 },
    clearedQuests: [],
    unlockedAreas: ['town_start'],
    storyFlags: {}
  }
};

await saveLoadService.save(1, gameState);

// 5. ロード
const loadedState = await saveLoadService.load(1);

// 6. セーブデータ一覧
const saves = await saveLoadService.listSaves();
console.log('Available saves:', saves);

// 7. オートセーブ
const autoSaveManager = new AutoSaveManager(saveLoadService, 5);
if (autoSaveManager.shouldAutoSave()) {
  await autoSaveManager.tryAutoSave(gameState);
}
```

### Cloud ストレージアダプターの実装例

```typescript
/**
 * Cloud ストレージアダプター（例: Firebase, AWS S3など）
 */
class CloudStorageAdapter implements StorageAdapter {
  constructor(
    private apiEndpoint: string,
    private apiKey: string
  ) {}
  
  async write<T>(key: string, data: T): Promise<void> {
    const response = await fetch(`${this.apiEndpoint}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ key, data })
    });
    
    if (!response.ok) {
      throw new Error('Cloud save failed');
    }
  }
  
  async read<T>(key: string): Promise<T | null> {
    const response = await fetch(`${this.apiEndpoint}/save/${key}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Cloud load failed');
    }
    
    const result = await response.json();
    return result.data;
  }
  
  async delete(key: string): Promise<void> {
    await fetch(`${this.apiEndpoint}/save/${key}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
  }
  
  async list(): Promise<string[]> {
    const response = await fetch(`${this.apiEndpoint}/saves`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    const result = await response.json();
    return result.keys;
  }
  
  async clear(): Promise<void> {
    await fetch(`${this.apiEndpoint}/saves`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
  }
}
```

---

## まとめ

### 設計のポイント

1. **ストレージ非依存**: StorageAdapter パターンにより、任意のストレージに対応
2. **バージョン管理**: データフォーマットの変更に柔軟に対応
3. **エラーハンドリング**: 各種エラーに対する適切な処理
4. **拡張性**: 圧縮、暗号化、差分セーブなどの機能を追加可能
5. **オートセーブ**: プレイヤー体験を向上させる自動保存機能

### 実装の優先順位

1. **Phase 1**: 基本的なセーブ/ロード機能
   - LocalStorageAdapter の実装
   - PersistenceManager の基本機能
   - SaveLoadService の基本API

2. **Phase 2**: データ管理機能
   - バージョニング
   - マイグレーション
   - データ検証

3. **Phase 3**: 高度な機能
   - IndexedDB 対応
   - オートセーブ
   - 差分セーブ
   - Cloud ストレージ対応
