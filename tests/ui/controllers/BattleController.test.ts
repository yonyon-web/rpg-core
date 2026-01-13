/**
 * BattleController のテスト
 */

import { BattleController } from '../../../src/ui/controllers/BattleController';
import { BattleService } from '../../../src/services/BattleService';
import type { Character, Enemy } from '../../../src/types/battle';

describe('BattleController', () => {
  let service: BattleService;
  let controller: BattleController;

  beforeEach(() => {
    service = new BattleService();
    controller = new BattleController(service);
  });

  describe('constructor', () => {
    it('初期状態を正しく設定する', () => {
      const state = controller.getState();
      
      expect(state.phase).toBe('initializing');
      expect(state.turnNumber).toBe(0);
      expect(state.playerParty).toEqual([]);
      expect(state.enemyGroup).toEqual([]);
      expect(state.currentActor).toBeNull();
      expect(state.result).toBeNull();
    });
  });

  describe('subscribe', () => {
    it('状態変更を購読できる', () => {
      const listener = jest.fn();
      
      controller.subscribe(listener);
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        phase: 'initializing'
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
      
      const unsubscribe = controller.on('battle-started', listener);
      
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('addMessage', () => {
    it('メッセージを追加する', () => {
      controller.addMessage('battle-started', { actorName: 'Hero' });
      
      const state = controller.getState();
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].messageType).toBe('battle-started');
      expect(state.messages[0].data.actorName).toBe('Hero');
    });

    it('メッセージIDが一意である', () => {
      controller.addMessage('action-attack', { actorName: 'Player1' });
      controller.addMessage('action-attack', { actorName: 'Player2' });
      
      const state = controller.getState();
      expect(state.messages[0].id).not.toBe(state.messages[1].id);
    });

    it('message-addedイベントが発火される', () => {
      const listener = jest.fn();
      controller.on('message-added', listener);
      
      controller.addMessage('battle-ended-victory', {}, 'success');
      
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        messageType: 'battle-ended-victory',
        severity: 'success'
      }));
    });
  });

  describe('getState', () => {
    it('現在の状態を返す', () => {
      const state = controller.getState();
      
      expect(state).toHaveProperty('phase');
      expect(state).toHaveProperty('turnNumber');
      expect(state).toHaveProperty('playerParty');
      expect(state).toHaveProperty('enemyGroup');
    });
  });
});
