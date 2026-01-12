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
});
