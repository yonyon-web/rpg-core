/**
 * ObservableState のテスト
 */

import { ObservableState } from '../../../src/ui/core/ObservableState';

describe('ObservableState', () => {
  describe('constructor', () => {
    it('初期状態を正しく設定する', () => {
      const initialState = { count: 0, message: 'Hello' };
      const state = new ObservableState(initialState);
      
      expect(state.getState()).toEqual(initialState);
    });
  });

  describe('getState', () => {
    it('現在の状態を返す', () => {
      const state = new ObservableState({ value: 42 });
      
      expect(state.getState()).toEqual({ value: 42 });
    });
  });

  describe('setState', () => {
    it('新しい状態をセットする', () => {
      const state = new ObservableState({ count: 0 });
      
      state.setState({ count: 1 });
      
      expect(state.getState()).toEqual({ count: 1 });
    });

    it('関数を渡して状態を更新する', () => {
      const state = new ObservableState({ count: 0 });
      
      state.setState(prev => ({ count: prev.count + 1 }));
      
      expect(state.getState()).toEqual({ count: 1 });
    });

    it('状態変更時にリスナーが呼ばれる', () => {
      const state = new ObservableState({ count: 0 });
      const listener = jest.fn();
      
      state.subscribe(listener);
      listener.mockClear(); // 初回の購読時の呼び出しをクリア
      
      state.setState({ count: 1 });
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ count: 1 });
    });

    it('複数のリスナーに通知する', () => {
      const state = new ObservableState({ count: 0 });
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      state.subscribe(listener1);
      state.subscribe(listener2);
      listener1.mockClear();
      listener2.mockClear();
      
      state.setState({ count: 1 });
      
      expect(listener1).toHaveBeenCalledWith({ count: 1 });
      expect(listener2).toHaveBeenCalledWith({ count: 1 });
    });
  });

  describe('subscribe', () => {
    it('購読時に即座に現在の状態を通知する', () => {
      const state = new ObservableState({ count: 5 });
      const listener = jest.fn();
      
      state.subscribe(listener);
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ count: 5 });
    });

    it('unsubscribe関数を返す', () => {
      const state = new ObservableState({ count: 0 });
      const listener = jest.fn();
      
      const unsubscribe = state.subscribe(listener);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('unsubscribe後はリスナーが呼ばれない', () => {
      const state = new ObservableState({ count: 0 });
      const listener = jest.fn();
      
      const unsubscribe = state.subscribe(listener);
      listener.mockClear();
      
      unsubscribe();
      state.setState({ count: 1 });
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('複数のリスナーを個別にunsubscribeできる', () => {
      const state = new ObservableState({ count: 0 });
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      const unsubscribe1 = state.subscribe(listener1);
      state.subscribe(listener2);
      listener1.mockClear();
      listener2.mockClear();
      
      unsubscribe1();
      state.setState({ count: 1 });
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith({ count: 1 });
    });
  });

  describe('複雑な状態のテスト', () => {
    interface ComplexState {
      user: {
        id: string;
        name: string;
      };
      items: string[];
      count: number;
    }

    it('複雑な状態を正しく管理する', () => {
      const initialState: ComplexState = {
        user: { id: '1', name: 'Alice' },
        items: ['sword', 'shield'],
        count: 0
      };
      
      const state = new ObservableState(initialState);
      const listener = jest.fn();
      
      state.subscribe(listener);
      listener.mockClear();
      
      // オブジェクトの一部を更新
      state.setState(prev => ({
        ...prev,
        count: prev.count + 1,
        items: [...prev.items, 'potion']
      }));
      
      expect(state.getState()).toEqual({
        user: { id: '1', name: 'Alice' },
        items: ['sword', 'shield', 'potion'],
        count: 1
      });
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
