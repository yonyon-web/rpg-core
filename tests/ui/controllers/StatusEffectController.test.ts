/**
 * StatusEffectController のテスト
 */

import { StatusEffectController } from '../../../src/ui/controllers/StatusEffectController';
import { StatusEffectService } from '../../../src/services/StatusEffectService';

describe('StatusEffectController', () => {
  let service: StatusEffectService;
  let controller: StatusEffectController;

  beforeEach(() => {
    service = new StatusEffectService();
    controller = new StatusEffectController(service);
  });

  describe('constructor', () => {
    it('初期状態を正しく設定する', () => {
      const state = controller.getState();
      
      expect(state.target).toBeNull();
      expect(state.activeEffects).toEqual([]);
      expect(state.selectedEffect).toBeNull();
      expect(state.filterType).toBe('all');
      expect(state.sortBy).toBe('duration');
      expect(state.cursorIndex).toBe(0);
    });
  });

  describe('subscribe', () => {
    it('状態変更を購読できる', () => {
      const listener = jest.fn();
      
      controller.subscribe(listener);
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        target: null
      }));
    });

    it('unsubscribe関数を返す', () => {
      const listener = jest.fn();
      
      const unsubscribe = controller.subscribe(listener);
      
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('on', () => {
    it('イベントを購読できる', () => {
      const listener = jest.fn();
      
      const unsubscribe = controller.on('effect-selected', listener);
      
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('setFilter', () => {
    it('フィルタを変更する', () => {
      controller.setFilter('buff');
      
      const state = controller.getState();
      expect(state.filterType).toBe('buff');
    });

    it('filter-changedイベントが発火される', () => {
      const listener = jest.fn();
      controller.on('filter-changed', listener);
      
      controller.setFilter('debuff');
      
      expect(listener).toHaveBeenCalledWith({ filterType: 'debuff' });
    });
  });

  describe('setSortBy', () => {
    it('ソート基準を変更する', () => {
      controller.setSortBy('name');
      
      const state = controller.getState();
      expect(state.sortBy).toBe('name');
    });

    it('sort-changedイベントが発火される', () => {
      const listener = jest.fn();
      controller.on('sort-changed', listener);
      
      controller.setSortBy('severity');
      
      expect(listener).toHaveBeenCalledWith({ sortBy: 'severity' });
    });
  });

  describe('moveCursor', () => {
    it('カーソルを下に移動できる', () => {
      controller.moveCursor(1);
      
      const state = controller.getState();
      expect(state.cursorIndex).toBe(0); // エフェクトがないのでそのまま
    });

    it('カーソルを上に移動できる', () => {
      controller.moveCursor(-1);
      
      const state = controller.getState();
      expect(state.cursorIndex).toBe(0); // エフェクトがないのでそのまま
    });
  });

  describe('getEffectCount', () => {
    it('状態異常の数を返す', () => {
      const count = controller.getEffectCount();
      
      expect(count).toBe(0);
    });
  });

  describe('getAllEffects', () => {
    it('全ての状態異常を返す', () => {
      const effects = controller.getAllEffects();
      
      expect(effects).toEqual([]);
    });
  });
});
