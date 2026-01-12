/**
 * PartyService Tests
 * TDD implementation - tests written first
 */

import { PartyService } from '../../src/services/PartyService';
import type { Combatant } from '../../src/types/combatant';
import type { DefaultStats } from '../../src/types/stats';

describe('PartyService', () => {
  function createCharacter(id: string, level: number = 1): Combatant {
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
      statusEffects: [],
      position: 0
    };
  }

  describe('初期化', () => {
    test('サービスを作成できる', () => {
      const service = new PartyService();
      expect(service).toBeDefined();
    });

    test('最大パーティサイズをカスタマイズできる', () => {
      const service = new PartyService({ maxSize: 5 });
      expect(service).toBeDefined();
    });
  });

  describe('メンバー追加', () => {
    test('パーティにメンバーを追加できる', () => {
      const service = new PartyService();
      const party: Combatant[] = [];
      const character = createCharacter('char1');
      
      const result = service.addMember(party, character);
      
      expect(result.success).toBe(true);
      expect(party.length).toBe(1);
      expect(party[0]).toBe(character);
    });

    test('最大サイズを超えて追加できない', () => {
      const service = new PartyService({ maxSize: 2 });
      const party: Combatant[] = [
        createCharacter('char1'),
        createCharacter('char2')
      ];
      const character = createCharacter('char3');
      
      const result = service.addMember(party, character);
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('最大');
      expect(party.length).toBe(2);
    });

    test('同じIDのメンバーは追加できない', () => {
      const service = new PartyService();
      const party: Combatant[] = [createCharacter('char1')];
      const duplicate = createCharacter('char1');
      
      const result = service.addMember(party, duplicate);
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('既に');
      expect(party.length).toBe(1);
    });
  });

  describe('メンバー削除', () => {
    test('パーティからメンバーを削除できる', () => {
      const service = new PartyService();
      const party: Combatant[] = [
        createCharacter('char1'),
        createCharacter('char2')
      ];
      
      const result = service.removeMember(party, 'char1');
      
      expect(result.success).toBe(true);
      expect(result.removedMember).toBeDefined();
      expect(result.removedMember?.id).toBe('char1');
      expect(party.length).toBe(1);
      expect(party[0].id).toBe('char2');
    });

    test('存在しないメンバーの削除は失敗する', () => {
      const service = new PartyService();
      const party: Combatant[] = [createCharacter('char1')];
      
      const result = service.removeMember(party, 'nonexistent');
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('見つかりません');
      expect(party.length).toBe(1);
    });

    test('最後のメンバーは削除できない', () => {
      const service = new PartyService({ minSize: 1 });
      const party: Combatant[] = [createCharacter('char1')];
      
      const result = service.removeMember(party, 'char1');
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('最低');
      expect(party.length).toBe(1);
    });
  });

  describe('メンバー入れ替え', () => {
    test('パーティ内でメンバーを入れ替えられる', () => {
      const service = new PartyService();
      const char1 = createCharacter('char1');
      const char2 = createCharacter('char2');
      const party: Combatant[] = [char1, char2];
      
      const result = service.swapMembers(party, 0, 1);
      
      expect(result.success).toBe(true);
      expect(party[0]).toBe(char2);
      expect(party[1]).toBe(char1);
    });

    test('無効なインデックスでは入れ替えできない', () => {
      const service = new PartyService();
      const party: Combatant[] = [createCharacter('char1')];
      
      const result = service.swapMembers(party, 0, 5);
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('無効');
    });
  });

  describe('フォーメーション', () => {
    test('メンバーのポジションを変更できる', () => {
      const service = new PartyService();
      const character = createCharacter('char1');
      character.position = 0;
      
      const result = service.changePosition(character, 1);
      
      expect(result.success).toBe(true);
      expect(character.position).toBe(1);
    });

    test('パーティ全体のフォーメーションを設定できる', () => {
      const service = new PartyService();
      const party: Combatant[] = [
        createCharacter('char1'),
        createCharacter('char2'),
        createCharacter('char3')
      ];
      const positions = [1, 0, 1]; // 後列、前列、後列
      
      const result = service.setFormation(party, positions);
      
      expect(result.success).toBe(true);
      expect(party[0].position).toBe(1);
      expect(party[1].position).toBe(0);
      expect(party[2].position).toBe(1);
    });

    test('フォーメーション配列の長さが一致しない場合は失敗する', () => {
      const service = new PartyService();
      const party: Combatant[] = [createCharacter('char1')];
      const positions = [0, 1]; // パーティより多い
      
      const result = service.setFormation(party, positions);
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('一致');
    });
  });

  describe('パーティ検証', () => {
    test('有効なパーティサイズかチェックできる', () => {
      const service = new PartyService({ minSize: 1, maxSize: 4 });
      const party: Combatant[] = [
        createCharacter('char1'),
        createCharacter('char2')
      ];
      
      const isValid = service.isValidPartySize(party);
      
      expect(isValid).toBe(true);
    });

    test('パーティが小さすぎる場合は無効', () => {
      const service = new PartyService({ minSize: 2, maxSize: 4 });
      const party: Combatant[] = [createCharacter('char1')];
      
      const isValid = service.isValidPartySize(party);
      
      expect(isValid).toBe(false);
    });

    test('パーティが大きすぎる場合は無効', () => {
      const service = new PartyService({ minSize: 1, maxSize: 2 });
      const party: Combatant[] = [
        createCharacter('char1'),
        createCharacter('char2'),
        createCharacter('char3')
      ];
      
      const isValid = service.isValidPartySize(party);
      
      expect(isValid).toBe(false);
    });
  });
});
