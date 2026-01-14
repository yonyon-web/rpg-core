/**
 * StatusEffectController のテスト
 */

import { StatusEffectController } from '../../../src/ui/controllers/status/StatusEffectController';
import { StatusEffectService } from '../../../src/services/status/StatusEffectService';
import type { Combatant } from '../../../src/types/battle/combatant';
import type { StatusEffect } from '../../../src/types/status/statusEffect';

describe('StatusEffectController', () => {
  let service: StatusEffectService;
  let controller: StatusEffectController;
  let mockCombatant: Combatant;

  beforeEach(() => {
    service = new StatusEffectService();
    controller = new StatusEffectController(service);
    
    // モックのキャラクターを作成
    mockCombatant = {
      id: 'char-1',
      name: 'Test Character',
      statusEffects: [
        {
          id: 'effect-1',
          name: 'Poison',
          category: 'dot',
          duration: 3,
          stackCount: 1
        } as StatusEffect,
        {
          id: 'effect-2',
          name: 'Shield',
          category: 'buff',
          duration: 5,
          stackCount: 1
        } as StatusEffect,
        {
          id: 'effect-3',
          name: 'Slow',
          category: 'debuff',
          duration: 2,
          stackCount: 1
        } as StatusEffect
      ]
    } as Combatant;
  });

  describe('on', () => {
    it('イベントを購読できる', () => {
      const listener = jest.fn();
      
      const unsubscribe = controller.on('effect-applied', listener);
      
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('getActiveEffects', () => {
    it('すべての状態異常を取得できる', () => {
      const effects = controller.getActiveEffects(mockCombatant);
      
      expect(effects).toHaveLength(3);
      expect(effects[0].name).toBe('Poison');
      expect(effects[1].name).toBe('Shield');
      expect(effects[2].name).toBe('Slow');
    });

    it('状態異常がない場合は空配列を返す', () => {
      const emptyTarget = {
        id: 'char-2',
        name: 'Empty',
        statusEffects: []
      } as unknown as Combatant;
      
      const effects = controller.getActiveEffects(emptyTarget);
      
      expect(effects).toEqual([]);
    });

    it('フィルタを適用できる（buff）', () => {
      const effects = controller.getActiveEffects(mockCombatant, { 
        filterType: 'buff' 
      });
      
      expect(effects).toHaveLength(1);
      expect(effects[0].name).toBe('Shield');
      expect(effects[0].category).toBe('buff');
    });

    it('フィルタを適用できる（debuff）', () => {
      const effects = controller.getActiveEffects(mockCombatant, { 
        filterType: 'debuff' 
      });
      
      expect(effects).toHaveLength(2); // dot と debuff
      expect(effects.some(e => e.name === 'Poison')).toBe(true);
      expect(effects.some(e => e.name === 'Slow')).toBe(true);
    });

    it('ソートを適用できる（duration）', () => {
      const effects = controller.getActiveEffects(mockCombatant, { 
        sortBy: 'duration' 
      });
      
      expect(effects[0].name).toBe('Shield'); // duration: 5
      expect(effects[1].name).toBe('Poison');  // duration: 3
      expect(effects[2].name).toBe('Slow');    // duration: 2
    });

    it('ソートを適用できる（name）', () => {
      const effects = controller.getActiveEffects(mockCombatant, { 
        sortBy: 'name' 
      });
      
      expect(effects[0].name).toBe('Poison');
      expect(effects[1].name).toBe('Shield');
      expect(effects[2].name).toBe('Slow');
    });

    it('フィルタとソートを同時に適用できる', () => {
      const effects = controller.getActiveEffects(mockCombatant, { 
        filterType: 'debuff',
        sortBy: 'duration' 
      });
      
      expect(effects).toHaveLength(2);
      expect(effects[0].name).toBe('Poison'); // duration: 3
      expect(effects[1].name).toBe('Slow');   // duration: 2
    });
  });

  describe('getEffectCount', () => {
    it('すべての状態異常の数を返す', () => {
      const count = controller.getEffectCount(mockCombatant);
      
      expect(count).toBe(3);
    });

    it('フィルタを適用して数を返す', () => {
      const buffCount = controller.getEffectCount(mockCombatant, 'buff');
      
      expect(buffCount).toBe(1);
    });

    it('状態異常がない場合は0を返す', () => {
      const emptyTarget = {
        id: 'char-2',
        name: 'Empty',
        statusEffects: []
      } as unknown as Combatant;
      
      const count = controller.getEffectCount(emptyTarget);
      
      expect(count).toBe(0);
    });
  });

  describe('hasEffect', () => {
    it('特定の状態異常が付与されているか確認できる', () => {
      const hasPoison = controller.hasEffect(mockCombatant, 'effect-1');
      const hasNonExistent = controller.hasEffect(mockCombatant, 'effect-999');
      
      expect(hasPoison).toBe(true);
      expect(hasNonExistent).toBe(false);
    });

    it('状態異常がない場合はfalseを返す', () => {
      const emptyTarget = {
        id: 'char-2',
        name: 'Empty'
      } as unknown as Combatant;
      
      const hasEffect = controller.hasEffect(emptyTarget, 'effect-1');
      
      expect(hasEffect).toBe(false);
    });
  });
});
