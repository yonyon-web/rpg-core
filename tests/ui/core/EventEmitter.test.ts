/**
 * EventEmitter のテスト
 */

import { EventEmitter } from '../../../src/ui/core/EventEmitter';

// テスト用のイベント型定義
type TestEvents = {
  'user-logged-in': { userId: string; username: string };
  'data-updated': { timestamp: number };
  'error-occurred': { message: string; code: number };
  'simple-event': void;
};

describe('EventEmitter', () => {
  describe('on', () => {
    it('イベントリスナーを登録できる', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener = jest.fn();
      
      emitter.on('user-logged-in', listener);
      emitter.emit('user-logged-in', { userId: '123', username: 'Alice' });
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ userId: '123', username: 'Alice' });
    });

    it('複数のリスナーを登録できる', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      emitter.on('user-logged-in', listener1);
      emitter.on('user-logged-in', listener2);
      
      emitter.emit('user-logged-in', { userId: '123', username: 'Alice' });
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('異なるイベントにリスナーを登録できる', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      emitter.on('user-logged-in', listener1);
      emitter.on('data-updated', listener2);
      
      emitter.emit('user-logged-in', { userId: '123', username: 'Alice' });
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).not.toHaveBeenCalled();
    });

    it('unsubscribe関数を返す', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener = jest.fn();
      
      const unsubscribe = emitter.on('user-logged-in', listener);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('unsubscribe後はリスナーが呼ばれない', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener = jest.fn();
      
      const unsubscribe = emitter.on('user-logged-in', listener);
      unsubscribe();
      
      emitter.emit('user-logged-in', { userId: '123', username: 'Alice' });
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('複数のリスナーを個別にunsubscribeできる', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      const unsubscribe1 = emitter.on('user-logged-in', listener1);
      emitter.on('user-logged-in', listener2);
      
      unsubscribe1();
      emitter.emit('user-logged-in', { userId: '123', username: 'Alice' });
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('emit', () => {
    it('登録されたすべてのリスナーを呼び出す', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();
      
      emitter.on('user-logged-in', listener1);
      emitter.on('user-logged-in', listener2);
      emitter.on('user-logged-in', listener3);
      
      emitter.emit('user-logged-in', { userId: '123', username: 'Alice' });
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);
    });

    it('リスナーが登録されていない場合でもエラーにならない', () => {
      const emitter = new EventEmitter<TestEvents>();
      
      expect(() => {
        emitter.emit('user-logged-in', { userId: '123', username: 'Alice' });
      }).not.toThrow();
    });

    it('正しいデータをリスナーに渡す', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener = jest.fn();
      
      emitter.on('error-occurred', listener);
      emitter.emit('error-occurred', { message: 'Test error', code: 500 });
      
      expect(listener).toHaveBeenCalledWith({ message: 'Test error', code: 500 });
    });

    it('void型のイベントを発火できる', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener = jest.fn();
      
      emitter.on('simple-event', listener);
      emitter.emit('simple-event', undefined);
      
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeAllListeners', () => {
    it('指定されたイベントのすべてのリスナーを削除する', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      emitter.on('user-logged-in', listener1);
      emitter.on('user-logged-in', listener2);
      
      emitter.removeAllListeners('user-logged-in');
      emitter.emit('user-logged-in', { userId: '123', username: 'Alice' });
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('他のイベントのリスナーには影響しない', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      emitter.on('user-logged-in', listener1);
      emitter.on('data-updated', listener2);
      
      emitter.removeAllListeners('user-logged-in');
      
      emitter.emit('user-logged-in', { userId: '123', username: 'Alice' });
      emitter.emit('data-updated', { timestamp: Date.now() });
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeAllListenersForAllEvents', () => {
    it('すべてのイベントのすべてのリスナーを削除する', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();
      
      emitter.on('user-logged-in', listener1);
      emitter.on('data-updated', listener2);
      emitter.on('error-occurred', listener3);
      
      emitter.removeAllListenersForAllEvents();
      
      emitter.emit('user-logged-in', { userId: '123', username: 'Alice' });
      emitter.emit('data-updated', { timestamp: Date.now() });
      emitter.emit('error-occurred', { message: 'Test', code: 500 });
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).not.toHaveBeenCalled();
    });
  });

  describe('実用例', () => {
    it('複数のイベントを連続して発火できる', () => {
      const emitter = new EventEmitter<TestEvents>();
      const loginListener = jest.fn();
      const updateListener = jest.fn();
      
      emitter.on('user-logged-in', loginListener);
      emitter.on('data-updated', updateListener);
      
      emitter.emit('user-logged-in', { userId: '123', username: 'Alice' });
      emitter.emit('data-updated', { timestamp: Date.now() });
      emitter.emit('user-logged-in', { userId: '456', username: 'Bob' });
      
      expect(loginListener).toHaveBeenCalledTimes(2);
      expect(updateListener).toHaveBeenCalledTimes(1);
    });

    it('同じリスナーを複数回登録できる', () => {
      const emitter = new EventEmitter<TestEvents>();
      const listener = jest.fn();
      
      emitter.on('user-logged-in', listener);
      emitter.on('user-logged-in', listener);
      
      emitter.emit('user-logged-in', { userId: '123', username: 'Alice' });
      
      // Setを使っているため、同じリスナーは1回のみ登録される
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
