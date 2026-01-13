/**
 * EquipmentService のテスト
 * TDD アプローチで実装
 */

import { EquipmentService } from '../../src/services/EquipmentService';
import type { Combatant } from '../../src/types/combatant';
import type { DefaultStats } from '../../src/types/stats';
import type { Equipment } from '../../src/types/equipment';

// テスト用キャラクター作成ヘルパー
function createCharacter(id: string, level: number = 1): Combatant<DefaultStats> {
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
    level,
    stats,
    currentHp: stats.maxHp,
    currentMp: stats.maxMp,
    currentExp: 0,
    equipment: {},
    statusEffects: [],
    position: 0
  };
}

// テスト用装備作成ヘルパー
function createWeapon(id: string, levelReq: number = 1, attackBonus: number = 5): Equipment<DefaultStats> {
  return {
    id,
    name: `Weapon ${id}`,
    type: 'weapon',
    levelRequirement: levelReq,
    statModifiers: {
      attack: attackBonus
    }
  };
}

function createArmor(id: string, levelReq: number = 1, defenseBonus: number = 3): Equipment<DefaultStats> {
  return {
    id,
    name: `Armor ${id}`,
    type: 'armor',
    levelRequirement: levelReq,
    statModifiers: {
      defense: defenseBonus,
      maxHp: 10
    }
  };
}

describe('EquipmentService', () => {
  describe('初期化', () => {
    test('サービスを作成できる', () => {
      const service = new EquipmentService();
      expect(service).toBeDefined();
    });
  });

  describe('装備装着', () => {
    test('有効な装備をキャラクターに装備できる', () => {
      const service = new EquipmentService();
      const character = createCharacter('char1', 5);
      const weapon = createWeapon('sword1', 1, 10);
      
      const result = service.equipItem(character, weapon, 'weapon');
      
      expect(result.success).toBe(true);
      expect(character.equipment?.weapon).toBe(weapon);
    });

    test('レベル要件を満たさない装備は装備できない', () => {
      const service = new EquipmentService();
      const character = createCharacter('char1', 1);
      const weapon = createWeapon('sword1', 5, 10);
      
      const result = service.equipItem(character, weapon, 'weapon');
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('レベル');
      expect(character.equipment?.weapon).toBeUndefined();
    });

    test('間違ったスロットには装備できない', () => {
      const service = new EquipmentService();
      const character = createCharacter('char1', 5);
      const weapon = createWeapon('sword1', 1, 10);
      
      // 武器をshieldスロットに装備しようとする
      const result = service.equipItem(character, weapon, 'shield');
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('スロット');
      expect(character.equipment?.shield).toBeUndefined();
    });

    test('既に装備がある場合、以前の装備を返す', () => {
      const service = new EquipmentService();
      const character = createCharacter('char1', 5);
      const weapon1 = createWeapon('sword1', 1, 5);
      const weapon2 = createWeapon('sword2', 1, 10);
      
      service.equipItem(character, weapon1, 'weapon');
      const result = service.equipItem(character, weapon2, 'weapon');
      
      expect(result.success).toBe(true);
      expect(result.previousEquipment).toBe(weapon1);
      expect(character.equipment?.weapon).toBe(weapon2);
    });
  });

  describe('装備解除', () => {
    test('装備を解除できる', () => {
      const service = new EquipmentService();
      const character = createCharacter('char1', 5);
      const weapon = createWeapon('sword1', 1, 10);
      
      service.equipItem(character, weapon, 'weapon');
      const result = service.unequipItem(character, 'weapon');
      
      expect(result.success).toBe(true);
      expect(result.equipment).toBe(weapon);
      expect(character.equipment?.weapon).toBeUndefined();
    });

    test('何も装備していないスロットを解除しようとしてもエラーにならない', () => {
      const service = new EquipmentService();
      const character = createCharacter('char1', 5);
      
      const result = service.unequipItem(character, 'weapon');
      
      expect(result.success).toBe(true);
      expect(result.equipment).toBeUndefined();
    });
  });

  describe('装備効果', () => {
    test('装備によるステータス補正を計算できる', () => {
      const service = new EquipmentService();
      const character = createCharacter('char1', 5);
      const weapon = createWeapon('sword1', 1, 10);
      
      service.equipItem(character, weapon, 'weapon');
      const effects = service.getEquipmentStats(character);
      
      expect(effects.attack).toBe(10);
    });

    test('複数の装備の効果を合算できる', () => {
      const service = new EquipmentService();
      const character = createCharacter('char1', 5);
      const weapon = createWeapon('sword1', 1, 10);
      const armor = createArmor('armor1', 1, 5);
      
      service.equipItem(character, weapon, 'weapon');
      service.equipItem(character, armor, 'body');
      
      const effects = service.getEquipmentStats(character);
      
      expect(effects.attack).toBe(10);
      expect(effects.defense).toBe(5);
      expect(effects.maxHp).toBe(10);
    });
  });

  describe('装備一覧', () => {
    test('キャラクターの装備一覧を取得できる', () => {
      const service = new EquipmentService();
      const character = createCharacter('char1', 5);
      const weapon = createWeapon('sword1', 1, 10);
      const armor = createArmor('armor1', 1, 5);
      
      service.equipItem(character, weapon, 'weapon');
      service.equipItem(character, armor, 'body');
      
      const equipped = service.getEquippedItems(character);
      
      expect(equipped.weapon).toBe(weapon);
      expect(equipped.body).toBe(armor);
      expect(Object.keys(equipped).length).toBe(2);
    });

    test('装備がない場合は空オブジェクトを返す', () => {
      const service = new EquipmentService();
      const character = createCharacter('char1', 5);
      
      const equipped = service.getEquippedItems(character);
      
      expect(equipped).toEqual({});
    });
  });

  describe('カスタム装備スロット', () => {
    type CustomSlot = 'mainHand' | 'offHand' | 'head';
    type CustomEquipType = 'sword' | 'dagger' | 'helmet';

    function createCustomCharacter(id: string, level: number = 1): Combatant<DefaultStats, any, any, CustomSlot, CustomEquipType> {
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
        level,
        stats,
        currentHp: stats.maxHp,
        currentMp: stats.maxMp,
        currentExp: 0,
        equipment: {},
        statusEffects: [],
        position: 0
      };
    }

    function createCustomWeapon(
      id: string, 
      type: CustomEquipType,
      attackBonus: number = 5
    ): Equipment<DefaultStats, CustomEquipType> {
      return {
        id,
        name: `Weapon ${id}`,
        type,
        levelRequirement: 1,
        statModifiers: {
          attack: attackBonus
        }
      };
    }

    test('カスタムスロットマッピングを使用できる', () => {
      const customMapping = {
        defaultSlot: {
          sword: 'mainHand' as CustomSlot,
          dagger: 'offHand' as CustomSlot,
          helmet: 'head' as CustomSlot
        },
        validSlots: {
          sword: ['mainHand' as CustomSlot],
          dagger: ['mainHand' as CustomSlot, 'offHand' as CustomSlot],
          helmet: ['head' as CustomSlot]
        }
      };

      const service = new EquipmentService<DefaultStats, CustomSlot, CustomEquipType>({ 
        slotMapping: customMapping 
      });
      const character = createCustomCharacter('char1', 5);
      const sword = createCustomWeapon('sword1', 'sword', 10);
      
      const result = service.equipItem(character, sword, 'mainHand');
      
      expect(result.success).toBe(true);
      expect(character.equipment?.mainHand).toBe(sword);
    });

    test('カスタムスロットで複数のスロットに装備可能', () => {
      const customMapping = {
        defaultSlot: {
          sword: 'mainHand' as CustomSlot,
          dagger: 'offHand' as CustomSlot,
          helmet: 'head' as CustomSlot
        },
        validSlots: {
          sword: ['mainHand' as CustomSlot],
          dagger: ['mainHand' as CustomSlot, 'offHand' as CustomSlot],
          helmet: ['head' as CustomSlot]
        }
      };

      const service = new EquipmentService<DefaultStats, CustomSlot, CustomEquipType>({ 
        slotMapping: customMapping 
      });
      const character = createCustomCharacter('char1', 5);
      const dagger = createCustomWeapon('dagger1', 'dagger', 5);
      
      // daggerはmainHandにもoffHandにも装備可能
      const result1 = service.equipItem(character, dagger, 'mainHand');
      expect(result1.success).toBe(true);
      
      service.unequipItem(character, 'mainHand');
      
      const result2 = service.equipItem(character, dagger, 'offHand');
      expect(result2.success).toBe(true);
    });

    test('カスタムスロットで無効なスロットには装備できない', () => {
      const customMapping = {
        defaultSlot: {
          sword: 'mainHand' as CustomSlot,
          dagger: 'offHand' as CustomSlot,
          helmet: 'head' as CustomSlot
        },
        validSlots: {
          sword: ['mainHand' as CustomSlot],
          dagger: ['mainHand' as CustomSlot, 'offHand' as CustomSlot],
          helmet: ['head' as CustomSlot]
        }
      };

      const service = new EquipmentService<DefaultStats, CustomSlot, CustomEquipType>({ 
        slotMapping: customMapping 
      });
      const character = createCustomCharacter('char1', 5);
      const sword = createCustomWeapon('sword1', 'sword', 10);
      
      // swordはoffHandには装備できない
      const result = service.equipItem(character, sword, 'offHand');
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('スロット');
    });
  });

  describe('event emission', () => {
    test('should emit data-changed event on successful equip', () => {
      const eventBus: any = {
        emit: jest.fn()
      };
      const serviceWithEvents = new EquipmentService({}, eventBus);
      const character = createCharacter('char1', 10);
      const weapon = createWeapon('sword1', 5);

      const result = serviceWithEvents.equipItem(character, weapon, 'weapon');

      expect(result.success).toBe(true);
      expect(eventBus.emit).toHaveBeenCalledWith('data-changed', {
        type: 'equipment-changed',
        timestamp: expect.any(Number),
        data: {
          characterId: character.id,
          equipmentId: weapon.id,
          slot: 'weapon',
          previousEquipmentId: undefined
        }
      });
    });

    test('should emit data-changed event on successful unequip', () => {
      const eventBus: any = {
        emit: jest.fn()
      };
      const serviceWithEvents = new EquipmentService({}, eventBus);
      const character = createCharacter('char1', 10);
      const weapon = createWeapon('sword1', 5);

      // First equip
      serviceWithEvents.equipItem(character, weapon, 'weapon');
      eventBus.emit.mockClear();

      // Then unequip
      const result = serviceWithEvents.unequipItem(character, 'weapon');

      expect(result.success).toBe(true);
      expect(eventBus.emit).toHaveBeenCalledWith('data-changed', {
        type: 'equipment-changed',
        timestamp: expect.any(Number),
        data: {
          characterId: character.id,
          equipmentId: weapon.id,
          slot: 'weapon',
          action: 'unequip'
        }
      });
    });

    test('should not emit event on failed equip', () => {
      const eventBus: any = {
        emit: jest.fn()
      };
      const serviceWithEvents = new EquipmentService({}, eventBus);
      const character = createCharacter('char1', 1);
      const weapon = createWeapon('sword1', 10); // Level requirement too high

      const result = serviceWithEvents.equipItem(character, weapon, 'weapon');

      expect(result.success).toBe(false);
      expect(eventBus.emit).not.toHaveBeenCalled();
    });
  });
});
