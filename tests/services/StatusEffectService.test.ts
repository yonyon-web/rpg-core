/**
 * StatusEffectService Tests
 * TDD implementation - tests written first
 */

import { StatusEffectService } from '../../src/services/status/StatusEffectService';
import type { Combatant } from '../../src/types/battle/combatant';
import type { StatusEffect } from '../../src/types/status/statusEffect';
import type { DefaultStats } from '../../src/types/character/stats';

describe('StatusEffectService', () => {
  function createCharacter(id: string): Combatant {
    const stats: DefaultStats = {
      maxHp: 100,
      maxMp: 50,
      attack: 10,
      defense: 5,
      magic: 8,
      magicDefense: 6,
      speed: 7,
      luck: 5,
      accuracy: 0,
      evasion: 0,
      criticalRate: 0
    };
    
    return {
      id,
      name: `Character ${id}`,
      level: 1,
      stats,
      currentHp: stats.maxHp,
      currentMp: stats.maxMp,
      statusEffects: [],
      position: 0
    };
  }

  function createStatusEffect(
    id: string,
    type: string = 'poison',
    duration: number = 3
  ): StatusEffect {
    return {
      id,
      type: type as any,
      category: 'dot' as any,
      name: type,
      description: `${type} effect`,
      power: 10,
      duration,
      maxDuration: duration,
      stackCount: 1,
      maxStack: 3,
      canBeDispelled: true,
      appliedAt: Date.now(),
      source: 'enemy1'
    };
  }

  describe('初期化', () => {
    test('サービスを作成できる', () => {
      const service = new StatusEffectService();
      expect(service).toBeDefined();
    });
  });

  describe('状態異常の付与', () => {
    test('状態異常を付与できる', () => {
      const service = new StatusEffectService();
      const character = createCharacter('char1');
      const effect = createStatusEffect('eff1', 'poison');
      
      const result = service.applyEffect(character, effect);
      
      expect(result.success).toBe(true);
      expect(character.statusEffects.length).toBe(1);
      expect(character.statusEffects[0]).toBe(effect);
    });

    test('同じ状態異常が重複しない場合はスタック数を増やす', () => {
      const service = new StatusEffectService();
      const character = createCharacter('char1');
      const effect1 = createStatusEffect('eff1', 'poison', 3);
      const effect2 = createStatusEffect('eff2', 'poison', 3);
      
      service.applyEffect(character, effect1);
      service.applyEffect(character, effect2);
      
      expect(character.statusEffects.length).toBe(1);
      expect(character.statusEffects[0].stackCount).toBe(2);
    });

    test('最大スタック数を超えない', () => {
      const service = new StatusEffectService();
      const character = createCharacter('char1');
      const effect1 = createStatusEffect('eff1', 'poison', 3);
      effect1.maxStack = 2;
      const effect2 = createStatusEffect('eff2', 'poison', 3);
      const effect3 = createStatusEffect('eff3', 'poison', 3);
      
      service.applyEffect(character, effect1);
      service.applyEffect(character, effect2);
      service.applyEffect(character, effect3);
      
      expect(character.statusEffects[0].stackCount).toBe(2);
    });

    test('異なる状態異常は共存できる', () => {
      const service = new StatusEffectService();
      const character = createCharacter('char1');
      const poison = createStatusEffect('eff1', 'poison');
      const burn = createStatusEffect('eff2', 'burn');
      
      service.applyEffect(character, poison);
      service.applyEffect(character, burn);
      
      expect(character.statusEffects.length).toBe(2);
    });
  });

  describe('状態異常の解除', () => {
    test('状態異常を解除できる', () => {
      const service = new StatusEffectService();
      const character = createCharacter('char1');
      const effect = createStatusEffect('eff1', 'poison');
      character.statusEffects.push(effect);
      
      const result = service.removeEffect(character, 'eff1');
      
      expect(result.success).toBe(true);
      expect(character.statusEffects.length).toBe(0);
    });

    test('存在しない状態異常は解除できない', () => {
      const service = new StatusEffectService();
      const character = createCharacter('char1');
      
      const result = service.removeEffect(character, 'nonexistent');
      
      expect(result.success).toBe(false);
    });

    test('解除不可能な状態異常は解除できない', () => {
      const service = new StatusEffectService();
      const character = createCharacter('char1');
      const effect = createStatusEffect('eff1', 'poison');
      effect.canBeDispelled = false;
      character.statusEffects.push(effect);
      
      const result = service.removeEffect(character, 'eff1');
      
      expect(result.success).toBe(false);
      expect(character.statusEffects.length).toBe(1);
    });
  });

  describe('状態異常の更新', () => {
    test('ターン終了時にdurationを減らす', () => {
      const service = new StatusEffectService();
      const character = createCharacter('char1');
      const effect = createStatusEffect('eff1', 'poison', 3);
      character.statusEffects.push(effect);
      
      service.decrementDurations(character);
      
      expect(character.statusEffects[0].duration).toBe(2);
    });

    test('durationが0になった状態異常を削除する', () => {
      const service = new StatusEffectService();
      const character = createCharacter('char1');
      const effect = createStatusEffect('eff1', 'poison', 1);
      character.statusEffects.push(effect);
      
      service.decrementDurations(character);
      
      expect(character.statusEffects.length).toBe(0);
    });

    test('複数の状態異常のdurationを同時に更新する', () => {
      const service = new StatusEffectService();
      const character = createCharacter('char1');
      const poison = createStatusEffect('eff1', 'poison', 3);
      const burn = createStatusEffect('eff2', 'burn', 2);
      character.statusEffects.push(poison, burn);
      
      service.decrementDurations(character);
      
      expect(character.statusEffects.length).toBe(2);
      expect(character.statusEffects[0].duration).toBe(2);
      expect(character.statusEffects[1].duration).toBe(1);
    });
  });

  describe('状態異常の確認', () => {
    test('特定の状態異常を持っているか確認できる', () => {
      const service = new StatusEffectService();
      const character = createCharacter('char1');
      const effect = createStatusEffect('eff1', 'poison');
      character.statusEffects.push(effect);
      
      expect(service.hasEffect(character, 'poison')).toBe(true);
      expect(service.hasEffect(character, 'burn')).toBe(false);
    });

    test('特定のカテゴリの状態異常を取得できる', () => {
      const service = new StatusEffectService();
      const character = createCharacter('char1');
      const poison = createStatusEffect('eff1', 'poison');
      poison.category = 'dot' as any;
      const attackUp = createStatusEffect('eff2', 'attack-up');
      attackUp.category = 'buff' as any;
      character.statusEffects.push(poison, attackUp);
      
      const dotEffects = service.getEffectsByCategory(character, 'dot' as any);
      
      expect(dotEffects.length).toBe(1);
      expect(dotEffects[0].type).toBe('poison');
    });

    test('すべての状態異常を取得できる', () => {
      const service = new StatusEffectService();
      const character = createCharacter('char1');
      const poison = createStatusEffect('eff1', 'poison');
      const burn = createStatusEffect('eff2', 'burn');
      character.statusEffects.push(poison, burn);
      
      const effects = service.getAllEffects(character);
      
      expect(effects.length).toBe(2);
    });
  });

  describe('状態異常のクリア', () => {
    test('すべての状態異常をクリアできる', () => {
      const service = new StatusEffectService();
      const character = createCharacter('char1');
      character.statusEffects.push(
        createStatusEffect('eff1', 'poison'),
        createStatusEffect('eff2', 'burn')
      );
      
      service.clearAllEffects(character);
      
      expect(character.statusEffects.length).toBe(0);
    });

    test('解除可能な状態異常のみクリアできる', () => {
      const service = new StatusEffectService();
      const character = createCharacter('char1');
      const dispellable = createStatusEffect('eff1', 'poison');
      const nonDispellable = createStatusEffect('eff2', 'burn');
      nonDispellable.canBeDispelled = false;
      character.statusEffects.push(dispellable, nonDispellable);
      
      service.clearDispellableEffects(character);
      
      expect(character.statusEffects.length).toBe(1);
      expect(character.statusEffects[0].id).toBe('eff2');
    });
  });
});
