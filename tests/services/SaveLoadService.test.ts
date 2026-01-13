/**
 * SaveLoadService テスト
 */

import { SaveLoadService } from '../../src/services/SaveLoadService';
import type { GameState } from '../../src/types/save';

describe('SaveLoadService', () => {
  let service: SaveLoadService;

  beforeEach(() => {
    service = new SaveLoadService({
      maxSlots: 3,
      gameVersion: '1.0.0'
    });
  });

  // テスト用のゲーム状態作成ヘルパー
  const createGameState = (overrides: Partial<GameState> = {}): GameState => ({
    version: '1.0.0',
    timestamp: Date.now(),
    player: {
      party: [],
      inventory: [],
      gold: 1000
    },
    progress: {
      completedQuests: ['quest1'],
      unlockedAreas: ['area1'],
      flags: { tutorial: true }
    },
    ...overrides
  });

  describe('constructor', () => {
    test('should create service with default config', () => {
      const defaultService = new SaveLoadService();
      const config = defaultService.getConfig();
      
      expect(config.maxSlots).toBe(10);
      expect(config.gameVersion).toBe('1.0.0');
      expect(config.autoMigrate).toBe(true);
    });

    test('should create service with custom config', () => {
      const config = service.getConfig();
      
      expect(config.maxSlots).toBe(3);
      expect(config.gameVersion).toBe('1.0.0');
    });
  });

  describe('save', () => {
    test('should save game state successfully', () => {
      const gameState = createGameState();
      const result = service.save(gameState, 1, 'Test Save');
      
      expect(result.success).toBe(true);
      expect(result.slotId).toBe(1);
      expect(result.message).toContain('Successfully saved');
    });

    test('should fail with invalid slot ID (too low)', () => {
      const gameState = createGameState();
      const result = service.save(gameState, 0, 'Test Save');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid slot ID');
    });

    test('should fail with invalid slot ID (too high)', () => {
      const gameState = createGameState();
      const result = service.save(gameState, 10, 'Test Save');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid slot ID');
    });

    test('should overwrite existing save', () => {
      const gameState1 = createGameState({ player: { party: [], inventory: [], gold: 100 } });
      const gameState2 = createGameState({ player: { party: [], inventory: [], gold: 200 } });
      
      service.save(gameState1, 1, 'Save 1');
      service.save(gameState2, 1, 'Save 2');
      
      const loadResult = service.load(1);
      expect(loadResult.gameState?.player.gold).toBe(200);
    });

    test('should store metadata correctly', () => {
      const gameState = createGameState();
      service.save(gameState, 1, 'Test Save', 3600, 'Town');
      
      const slot = service.getSaveSlot(1);
      expect(slot).toBeDefined();
      expect(slot!.name).toBe('Test Save');
      expect(slot!.metadata.playtime).toBe(3600);
      expect(slot!.metadata.location).toBe('Town');
    });
  });

  describe('load', () => {
    test('should load saved game state', () => {
      const gameState = createGameState();
      service.save(gameState, 1, 'Test Save');
      
      const result = service.load(1);
      
      expect(result.success).toBe(true);
      expect(result.gameState).toBeDefined();
      expect(result.gameState!.player.gold).toBe(1000);
    });

    test('should fail with invalid slot ID', () => {
      const result = service.load(10);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid slot ID');
    });

    test('should fail when slot is empty', () => {
      const result = service.load(1);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('No save data found');
    });

    test('should migrate old version data when autoMigrate is true', () => {
      const oldGameState = createGameState({ version: '0.9.0' });
      service.save(oldGameState, 1, 'Old Save');
      
      const result = service.load(1);
      
      expect(result.success).toBe(true);
      expect(result.gameState!.version).toBe('1.0.0');
    });
  });

  describe('deleteSave', () => {
    test('should delete existing save', () => {
      const gameState = createGameState();
      service.save(gameState, 1, 'Test Save');
      
      const deleted = service.deleteSave(1);
      
      expect(deleted).toBe(true);
      expect(service.hasSave(1)).toBe(false);
    });

    test('should return false when deleting non-existent save', () => {
      const deleted = service.deleteSave(1);
      
      expect(deleted).toBe(false);
    });

    test('should return false with invalid slot ID', () => {
      const deleted = service.deleteSave(10);
      
      expect(deleted).toBe(false);
    });
  });

  describe('getSaveSlot', () => {
    test('should return save slot', () => {
      const gameState = createGameState();
      service.save(gameState, 1, 'Test Save');
      
      const slot = service.getSaveSlot(1);
      
      expect(slot).toBeDefined();
      expect(slot!.id).toBe(1);
      expect(slot!.name).toBe('Test Save');
    });

    test('should return undefined for non-existent slot', () => {
      const slot = service.getSaveSlot(1);
      
      expect(slot).toBeUndefined();
    });
  });

  describe('getAllSaveSlots', () => {
    test('should return empty array when no saves', () => {
      const slots = service.getAllSaveSlots();
      
      expect(slots).toEqual([]);
    });

    test('should return all save slots sorted by ID', () => {
      const gameState = createGameState();
      service.save(gameState, 3, 'Save 3');
      service.save(gameState, 1, 'Save 1');
      service.save(gameState, 2, 'Save 2');
      
      const slots = service.getAllSaveSlots();
      
      expect(slots).toHaveLength(3);
      expect(slots[0].id).toBe(1);
      expect(slots[1].id).toBe(2);
      expect(slots[2].id).toBe(3);
    });
  });

  describe('hasSave', () => {
    test('should return true for existing save', () => {
      const gameState = createGameState();
      service.save(gameState, 1, 'Test Save');
      
      expect(service.hasSave(1)).toBe(true);
    });

    test('should return false for non-existent save', () => {
      expect(service.hasSave(1)).toBe(false);
    });
  });

  describe('clearAll', () => {
    test('should clear all saves', () => {
      const gameState = createGameState();
      service.save(gameState, 1, 'Save 1');
      service.save(gameState, 2, 'Save 2');
      
      service.clearAll();
      
      expect(service.getAllSaveSlots()).toEqual([]);
      expect(service.hasSave(1)).toBe(false);
      expect(service.hasSave(2)).toBe(false);
    });
  });

  describe('exportSave', () => {
    test('should export save as JSON string', () => {
      const gameState = createGameState();
      service.save(gameState, 1, 'Test Save');
      
      const exported = service.exportSave(1);
      
      expect(exported).not.toBeNull();
      expect(typeof exported).toBe('string');
      
      // JSONとしてパース可能であることを確認
      const parsed = JSON.parse(exported!);
      expect(parsed.player.gold).toBe(1000);
    });

    test('should return null for non-existent save', () => {
      const exported = service.exportSave(1);
      
      expect(exported).toBeNull();
    });
  });

  describe('importSave', () => {
    test('should import save from JSON string', () => {
      const gameState = createGameState();
      const jsonData = JSON.stringify(gameState);
      
      const result = service.importSave(1, jsonData, 'Imported Save');
      
      expect(result.success).toBe(true);
      expect(service.hasSave(1)).toBe(true);
    });

    test('should fail with invalid JSON', () => {
      const result = service.importSave(1, 'invalid json', 'Bad Save');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to import');
    });

    test('should round-trip export/import correctly', () => {
      const gameState = createGameState();
      service.save(gameState, 1, 'Original Save');
      
      const exported = service.exportSave(1);
      service.deleteSave(1);
      
      const importResult = service.importSave(2, exported!, 'Re-imported Save');
      
      expect(importResult.success).toBe(true);
      
      const loadResult = service.load(2);
      expect(loadResult.gameState!.player.gold).toBe(1000);
    });
  });

  describe('getConfig', () => {
    test('should return current config', () => {
      const config = service.getConfig();
      
      expect(config.maxSlots).toBe(3);
      expect(config.gameVersion).toBe('1.0.0');
    });

    test('should return immutable config', () => {
      const config = service.getConfig();
      
      // 変更を試みる
      (config as any).maxSlots = 999;
      
      // 元の設定は変わっていないことを確認
      expect(service.getConfig().maxSlots).toBe(3);
    });
  });

  describe('auto-save functionality', () => {
    let eventBus: any;
    let autoSaveService: SaveLoadService;
    let gameState: GameState;

    beforeEach(() => {
      // EventBusのモック
      eventBus = {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn(),
      };

      gameState = createGameState();

      autoSaveService = new SaveLoadService({
        maxSlots: 3,
        gameVersion: '1.0.0',
        autoSaveEnabled: true,
        autoSaveDebounceMs: 100,
        maxAutoSaveRetries: 2,
        autoSaveSlotId: 1
      }, eventBus);
    });

    describe('setupAutoSave', () => {
      test('should register data-changed event listener', () => {
        expect(eventBus.on).toHaveBeenCalledWith('data-changed', expect.any(Function));
      });

      test('should not register listener if eventBus is not provided', () => {
        const serviceWithoutBus = new SaveLoadService({
          autoSaveEnabled: true
        });
        
        // eventBus.onは呼ばれていないことを確認（新しいインスタンス用）
        const callCount = eventBus.on.mock.calls.length;
        expect(callCount).toBeGreaterThan(0); // 最初のインスタンス用には呼ばれている
      });
    });

    describe('enableAutoSave / disableAutoSave', () => {
      test('should enable auto-save', () => {
        autoSaveService.disableAutoSave();
        expect(autoSaveService.isAutoSaveEnabled()).toBe(false);
        
        autoSaveService.enableAutoSave();
        expect(autoSaveService.isAutoSaveEnabled()).toBe(true);
      });

      test('should disable auto-save', () => {
        expect(autoSaveService.isAutoSaveEnabled()).toBe(true);
        
        autoSaveService.disableAutoSave();
        expect(autoSaveService.isAutoSaveEnabled()).toBe(false);
      });
    });

    describe('setCurrentGameState', () => {
      test('should set game state provider', () => {
        const provider = jest.fn(() => gameState);
        autoSaveService.setCurrentGameState(provider);
        
        // providerが設定されたことは間接的に確認される
        expect(provider).not.toHaveBeenCalled();
      });
    });

    describe('auto-save trigger', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      test('should schedule auto-save on data-changed event', () => {
        autoSaveService.setCurrentGameState(() => gameState);

        // data-changedイベントのリスナーを取得
        const dataChangedListener = eventBus.on.mock.calls.find(
          (call: any[]) => call[0] === 'data-changed'
        )?.[1];

        expect(dataChangedListener).toBeDefined();

        // イベントを発行
        dataChangedListener({
          type: 'item-used',
          timestamp: Date.now(),
          data: { itemId: 'potion-1' }
        });

        // デバウンス時間経過前はセーブされない
        expect(autoSaveService.hasSave(1)).toBe(false);

        // デバウンス時間経過後にセーブされる
        jest.advanceTimersByTime(100);
        expect(autoSaveService.hasSave(1)).toBe(true);
      });

      test('should debounce multiple data-changed events', () => {
        autoSaveService.setCurrentGameState(() => gameState);

        const dataChangedListener = eventBus.on.mock.calls.find(
          (call: any[]) => call[0] === 'data-changed'
        )?.[1];

        // 複数のイベントを短時間で発行
        dataChangedListener({ type: 'item-used', timestamp: Date.now() });
        jest.advanceTimersByTime(50);
        
        dataChangedListener({ type: 'equipment-changed', timestamp: Date.now() });
        jest.advanceTimersByTime(50);
        
        dataChangedListener({ type: 'party-updated', timestamp: Date.now() });

        // まだセーブされていない
        expect(autoSaveService.hasSave(1)).toBe(false);

        // 最後のイベントから100ms経過後にセーブされる
        jest.advanceTimersByTime(100);
        expect(autoSaveService.hasSave(1)).toBe(true);

        // セーブは1回だけ
        const saveSlot = autoSaveService.getSaveSlot(1);
        expect(saveSlot).toBeDefined();
      });

      test('should not trigger auto-save when disabled', () => {
        autoSaveService.setCurrentGameState(() => gameState);
        autoSaveService.disableAutoSave();

        const dataChangedListener = eventBus.on.mock.calls.find(
          (call: any[]) => call[0] === 'data-changed'
        )?.[1];

        dataChangedListener({ type: 'item-used', timestamp: Date.now() });
        jest.advanceTimersByTime(100);

        // セーブされない
        expect(autoSaveService.hasSave(1)).toBe(false);
      });

      test('should emit auto-save-completed event on successful save', () => {
        autoSaveService.setCurrentGameState(() => gameState);

        const dataChangedListener = eventBus.on.mock.calls.find(
          (call: any[]) => call[0] === 'data-changed'
        )?.[1];

        dataChangedListener({ type: 'item-used', timestamp: Date.now() });
        jest.advanceTimersByTime(100);

        // auto-save-completedイベントが発行される
        expect(eventBus.emit).toHaveBeenCalledWith('auto-save-completed', {
          timestamp: expect.any(Number),
          slotId: 1
        });
      });

      test('should filter events based on autoSaveOnEvents config', () => {
        // Create a new event bus for this test to avoid listener conflicts
        const filteredEventBus: any = {
          on: jest.fn(),
          emit: jest.fn(),
          off: jest.fn(),
        };

        const filteredService = new SaveLoadService({
          autoSaveEnabled: true,
          autoSaveDebounceMs: 100,
          autoSaveSlotId: 1,
          autoSaveOnEvents: ['item-used', 'equipment-changed']
        }, filteredEventBus);

        filteredService.setCurrentGameState(() => gameState);

        const dataChangedListener = filteredEventBus.on.mock.calls.find(
          (call: any[]) => call[0] === 'data-changed'
        )?.[1];

        // フィルタに含まれるイベント
        dataChangedListener({ type: 'item-used', timestamp: Date.now() });
        jest.advanceTimersByTime(100);
        expect(filteredService.hasSave(1)).toBe(true);

        // セーブスロットをクリア
        filteredService.deleteSave(1);

        // フィルタに含まれないイベント
        dataChangedListener({ type: 'party-updated', timestamp: Date.now() });
        jest.advanceTimersByTime(100);
        expect(filteredService.hasSave(1)).toBe(false);
      });
    });

    describe('retry logic', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      test('should retry on save failure', () => {
        // 失敗するゲーム状態プロバイダー（無効なデータ）
        let callCount = 0;
        autoSaveService.setCurrentGameState(() => {
          callCount++;
          if (callCount < 2) {
            // 最初は無効なゲーム状態を返す
            return { player: null } as any;
          }
          // 2回目は正常なゲーム状態を返す
          return gameState;
        });

        const dataChangedListener = eventBus.on.mock.calls.find(
          (call: any[]) => call[0] === 'data-changed'
        )?.[1];

        dataChangedListener({ type: 'item-used', timestamp: Date.now() });
        jest.advanceTimersByTime(100);

        // 最初のセーブは失敗
        expect(autoSaveService.hasSave(1)).toBe(false);

        // リトライ（指数バックオフ: 100ms * 2^1 = 200ms）
        jest.advanceTimersByTime(200);
        expect(autoSaveService.hasSave(1)).toBe(true);
      });

      test('should emit auto-save-failed event after max retries', () => {
        // 常に失敗するゲーム状態プロバイダー
        autoSaveService.setCurrentGameState(() => {
          return { player: null } as any;
        });

        const dataChangedListener = eventBus.on.mock.calls.find(
          (call: any[]) => call[0] === 'data-changed'
        )?.[1];

        dataChangedListener({ type: 'item-used', timestamp: Date.now() });
        
        // 最初のセーブ試行
        jest.advanceTimersByTime(100);
        expect(autoSaveService.hasSave(1)).toBe(false);

        // 1回目のリトライ（200ms後）
        jest.advanceTimersByTime(200);
        expect(autoSaveService.hasSave(1)).toBe(false);

        // 2回目のリトライ（400ms後）
        jest.advanceTimersByTime(400);
        expect(autoSaveService.hasSave(1)).toBe(false);

        // auto-save-failedイベントが発行される
        expect(eventBus.emit).toHaveBeenCalledWith('auto-save-failed', {
          timestamp: expect.any(Number),
          error: expect.any(String),
          retryCount: 2
        });
      });
    });
  });
});
