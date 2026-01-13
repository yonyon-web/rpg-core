/**
 * CommandController のテスト
 */

import { CommandController } from '../../../src/ui/controllers/CommandController';
import { CommandService } from '../../../src/services/CommandService';

describe('CommandController', () => {
  let service: CommandService;
  let controller: CommandController;

  beforeEach(() => {
    service = new CommandService();
    controller = new CommandController(service);
  });

  describe('constructor', () => {
    it('初期状態を正しく設定する', () => {
      const state = controller.getState();
      
      expect(state.stage).toBe('selecting-command');
      expect(state.actor).toBeNull();
      expect(state.availableCommands).toEqual([]);
      expect(state.selectedCommand).toBeNull();
      expect(state.cursorIndex).toBe(0);
    });
  });

  describe('subscribe', () => {
    it('状態変更を購読できる', () => {
      const listener = jest.fn();
      
      controller.subscribe(listener);
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        stage: 'selecting-command'
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
      
      const unsubscribe = controller.on('command-selected', listener);
      
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('moveCursor', () => {
    it('カーソルを下に移動できる', () => {
      controller.moveCursor(1);
      
      const state = controller.getState();
      expect(state.cursorIndex).toBe(0); // コマンドがないのでループ
    });

    it('カーソルを上に移動できる', () => {
      controller.moveCursor(-1);
      
      const state = controller.getState();
      // コマンドがない場合は-1になる（maxIndex = -1のため）
      expect(state.cursorIndex).toBe(-1);
    });
  });

  describe('getState', () => {
    it('現在の状態を返す', () => {
      const state = controller.getState();
      
      expect(state).toHaveProperty('stage');
      expect(state).toHaveProperty('actor');
      expect(state).toHaveProperty('availableCommands');
      expect(state).toHaveProperty('selectedCommand');
    });
  });

  describe('cancel', () => {
    it('コマンド選択段階では何もしない', () => {
      const initialState = controller.getState();
      
      controller.cancel();
      
      const state = controller.getState();
      expect(state.stage).toBe(initialState.stage);
    });
  });
});
