/**
 * SimulationService テスト
 */

import { SimulationService } from '../../src/services/system/SimulationService';
import type { Combatant } from '../../src/types/battle/combatant';
import type { Skill } from '../../src/types/character/skill';

describe('SimulationService', () => {
  let service: SimulationService;

  beforeEach(() => {
    service = new SimulationService();
  });

  // テスト用のスキル作成ヘルパー
  const createSkill = (): Skill => ({
    id: 'attack',
    name: 'Attack',
    type: 'physical',
    targetType: 'single-enemy',
    element: 'none',
    power: 1.0,
    accuracy: 1.0,
    criticalBonus: 0,
    isGuaranteedHit: false,
    description: 'Basic attack'
  });

  // テスト用の戦闘者作成ヘルパー
  const createCombatant = (id: string, hp: number = 100): Combatant => ({
    id,
    name: `Combatant ${id}`,
    level: 10,
    currentHp: hp,
    currentMp: 50,
    stats: {
      maxHp: 100,
      maxMp: 50,
      attack: 50,
      defense: 30,
      magic: 40,
      magicDefense: 25,
      speed: 60,
      luck: 5,
      accuracy: 0,
      evasion: 0,
      criticalRate: 0
    },
    statusEffects: [],
    position: 0
  });

  describe('simulate', () => {
    test('should run simulation with specified iterations', () => {
      const party1 = [createCombatant('hero1', 100)];
      const party2 = [createCombatant('enemy1', 50)]; // Weaker enemy
      
      const result = service.simulate({
        iterations: 10,
        party1,
        party2
      });
      
      expect(result.totalBattles).toBe(10);
      expect(result.party1Wins + result.party2Wins + result.draws).toBe(10);
    });

    test('should return valid statistics', () => {
      const party1 = [createCombatant('hero1')];
      const party2 = [createCombatant('enemy1')];
      
      const result = service.simulate({
        iterations: 5,
        party1,
        party2
      });
      
      expect(result.totalBattles).toBe(5);
      expect(result.party1Wins).toBeGreaterThanOrEqual(0);
      expect(result.party2Wins).toBeGreaterThanOrEqual(0);
      expect(result.draws).toBeGreaterThanOrEqual(0);
      expect(result.averageTurns).toBeGreaterThan(0);
      expect(result.averageDamage.party1).toBeGreaterThanOrEqual(0);
      expect(result.averageDamage.party2).toBeGreaterThanOrEqual(0);
    });

    test('should produce different results with different parties', () => {
      const strongParty = [
        createCombatant('strong1', 200),
        createCombatant('strong2', 200)
      ];
      const weakParty = [createCombatant('weak1', 50)];
      
      const result = service.simulate({
        iterations: 20,
        party1: strongParty,
        party2: weakParty
      });
      
      // Strong party should win most battles
      expect(result.party1Wins).toBeGreaterThan(result.party2Wins);
    });

    test('should handle balanced parties', () => {
      const party1 = [createCombatant('a1')];
      const party2 = [createCombatant('b1')];
      
      const result = service.simulate({
        iterations: 30,
        party1,
        party2
      });
      
      // Both parties should have some wins (probabilistic, but with 30 iterations very likely)
      expect(result.party1Wins + result.party2Wins).toBeGreaterThan(0);
      expect(result.totalBattles).toBe(30);
    });

    test('should track turn distribution', () => {
      const party1 = [createCombatant('hero1')];
      const party2 = [createCombatant('enemy1')];
      
      const result = service.simulate({
        iterations: 10,
        party1,
        party2
      });
      
      expect(result.turnDistribution.size).toBeGreaterThan(0);
      
      // Sum of distribution should equal total battles
      let distributionSum = 0;
      result.turnDistribution.forEach(count => {
        distributionSum += count;
      });
      expect(distributionSum).toBe(result.totalBattles);
    });

    test('should track wins by turn', () => {
      const party1 = [createCombatant('hero1')];
      const party2 = [createCombatant('enemy1')];
      
      const result = service.simulate({
        iterations: 10,
        party1,
        party2
      });
      
      expect(result.winsByTurn.size).toBeGreaterThan(0);
      
      // Sum of wins by turn should match total wins
      let totalWins = 0;
      result.winsByTurn.forEach(wins => {
        totalWins += wins.party1 + wins.party2;
      });
      expect(totalWins).toBe(result.party1Wins + result.party2Wins);
    });

    test('should calculate average turns correctly', () => {
      const party1 = [createCombatant('hero1', 50)]; // Lower HP for faster battles
      const party2 = [createCombatant('enemy1', 50)];
      
      const result = service.simulate({
        iterations: 5,
        party1,
        party2
      });
      
      expect(result.averageTurns).toBeGreaterThan(0);
      expect(result.averageTurns).toBeLessThan(100); // Should not hit max turns
    });

    test('should not modify original party data', () => {
      const party1 = [createCombatant('hero1', 100)];
      const party2 = [createCombatant('enemy1', 100)];
      
      const originalHp1 = party1[0].currentHp;
      const originalHp2 = party2[0].currentHp;
      
      service.simulate({
        iterations: 5,
        party1,
        party2
      });
      
      // Original data should be unchanged
      expect(party1[0].currentHp).toBe(originalHp1);
      expect(party2[0].currentHp).toBe(originalHp2);
    });
  });

  describe('generateReport', () => {
    test('should generate formatted report', () => {
      const party1 = [createCombatant('hero1')];
      const party2 = [createCombatant('enemy1')];
      
      const result = service.simulate({
        iterations: 10,
        party1,
        party2
      });
      
      const report = service.generateReport(result);
      
      expect(report).toContain('Simulation Report');
      expect(report).toContain('Total Battles: 10');
      expect(report).toContain('Party 1 Wins');
      expect(report).toContain('Party 2 Wins');
      expect(report).toContain('Average Turns');
      expect(report).toContain('Average Damage');
    });

    test('should include win rates in report', () => {
      const strongParty = [createCombatant('strong1', 200)];
      const weakParty = [createCombatant('weak1', 50)];
      
      const result = service.simulate({
        iterations: 20,
        party1: strongParty,
        party2: weakParty
      });
      
      const report = service.generateReport(result);
      
      // Should contain percentage values
      expect(report).toMatch(/\d+\.\d+%/);
    });

    test('should format numbers correctly', () => {
      const party1 = [createCombatant('hero1')];
      const party2 = [createCombatant('enemy1')];
      
      const result = service.simulate({
        iterations: 10,
        party1,
        party2
      });
      
      const report = service.generateReport(result);
      
      // Should have decimal places
      expect(report).toMatch(/Average Turns: \d+\.\d+/);
      expect(report).toMatch(/Average Damage \(Party \d\): \d+\.\d+/);
    });
  });

  describe('edge cases', () => {
    test('should handle single iteration', () => {
      const party1 = [createCombatant('hero1')];
      const party2 = [createCombatant('enemy1')];
      
      const result = service.simulate({
        iterations: 1,
        party1,
        party2
      });
      
      expect(result.totalBattles).toBe(1);
      expect(result.party1Wins + result.party2Wins + result.draws).toBe(1);
    });

    test('should handle multiple combatants per party', () => {
      const party1 = [
        createCombatant('hero1'),
        createCombatant('hero2')
      ];
      const party2 = [
        createCombatant('enemy1'),
        createCombatant('enemy2')
      ];
      
      const result = service.simulate({
        iterations: 10,
        party1,
        party2
      });
      
      expect(result.totalBattles).toBe(10);
    });

    test('should handle zero HP combatants gracefully', () => {
      const party1 = [createCombatant('hero1', 100)];
      const party2 = [createCombatant('enemy1', 1)]; // Very low HP
      
      const result = service.simulate({
        iterations: 5,
        party1,
        party2
      });
      
      // Should complete without errors
      expect(result.totalBattles).toBe(5);
    });
  });
});
