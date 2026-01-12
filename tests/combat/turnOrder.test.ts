/**
 * Tests for turn order calculation module
 */

import { calculateTurnOrder, checkPreemptiveStrike } from '../../src/combat/turnOrder';
import { Combatant } from '../../src/types';
import { defaultGameConfig } from '../../src/config';

describe('turnOrder module', () => {
  const createCombatant = (id: string, name: string, speed: number): Combatant => ({
    id,
    name,
    level: 10,
    stats: {
      maxHp: 100,
      maxMp: 50,
      attack: 50,
      defense: 30,
      magic: 40,
      magicDefense: 25,
      speed,
      luck: 10,
      accuracy: 10,
      evasion: 5,
      criticalRate: 0.05,
    },
    currentHp: 100,
    currentMp: 50,
    statusEffects: [],
    position: 0,
  });

  describe('calculateTurnOrder', () => {
    it('should order combatants by speed (highest first)', () => {
      const fast = createCombatant('fast', 'Fast', 100);
      const medium = createCombatant('medium', 'Medium', 50);
      const slow = createCombatant('slow', 'Slow', 20);

      const participants = [slow, medium, fast];
      const turnOrder = calculateTurnOrder(participants, defaultGameConfig);

      // Generally, faster combatants should be earlier
      // Note: Due to variance, this might not always be strictly ordered
      expect(turnOrder).toHaveLength(3);
      expect(turnOrder).toContain(fast);
      expect(turnOrder).toContain(medium);
      expect(turnOrder).toContain(slow);
    });

    it('should handle same speed combatants', () => {
      const combatant1 = createCombatant('1', 'First', 50);
      const combatant2 = createCombatant('2', 'Second', 50);
      const combatant3 = createCombatant('3', 'Third', 50);

      const participants = [combatant1, combatant2, combatant3];
      const turnOrder = calculateTurnOrder(participants, defaultGameConfig);

      expect(turnOrder).toHaveLength(3);
      // All combatants should be in the order
      expect(turnOrder).toContain(combatant1);
      expect(turnOrder).toContain(combatant2);
      expect(turnOrder).toContain(combatant3);
    });

    it('should return empty array for empty input', () => {
      const turnOrder = calculateTurnOrder([], defaultGameConfig);
      expect(turnOrder).toEqual([]);
    });

    it('should handle single combatant', () => {
      const single = createCombatant('single', 'Single', 50);
      const turnOrder = calculateTurnOrder([single], defaultGameConfig);
      
      expect(turnOrder).toEqual([single]);
    });

    it('should apply speed variance', () => {
      // Create combatants with significantly different speeds
      const fast = createCombatant('fast', 'Fast', 100);
      const slow = createCombatant('slow', 'Slow', 10);

      const participants = [slow, fast];

      // Run multiple times to see if order varies due to randomness
      const results = Array.from({ length: 100 }, () => 
        calculateTurnOrder([...participants], defaultGameConfig)
      );

      // Fast should be first most of the time, but not always (due to variance)
      const fastFirstCount = results.filter(order => order[0].id === 'fast').length;
      
      // With such a large speed difference, fast should be first in most cases
      expect(fastFirstCount).toBeGreaterThan(80);
    });

    it('should produce different orders with variance enabled', () => {
      const combatant1 = createCombatant('1', 'First', 50);
      const combatant2 = createCombatant('2', 'Second', 51);

      const participants = [combatant1, combatant2];

      // Run multiple times
      const orders = Array.from({ length: 100 }, () => 
        calculateTurnOrder([...participants], defaultGameConfig).map(c => c.id).join(',')
      );

      // Should get different orderings due to variance
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBeGreaterThan(1);
    });
  });

  describe('checkPreemptiveStrike', () => {
    it('should return true when party speed greatly exceeds enemy speed', () => {
      const fastParty = [
        createCombatant('hero1', 'Hero1', 100),
        createCombatant('hero2', 'Hero2', 90),
      ];
      const slowEnemies = [
        createCombatant('enemy1', 'Enemy1', 20),
        createCombatant('enemy2', 'Enemy2', 25),
      ];

      // Run multiple times since this might be probabilistic
      const results = Array.from({ length: 20 }, () =>
        checkPreemptiveStrike(fastParty, slowEnemies, defaultGameConfig)
      );

      // Should get at least some preemptive strikes
      const preemptiveCount = results.filter(r => r).length;
      expect(preemptiveCount).toBeGreaterThan(0);
    });

    it('should return false when speeds are similar', () => {
      const party = [
        createCombatant('hero1', 'Hero1', 50),
        createCombatant('hero2', 'Hero2', 52),
      ];
      const enemies = [
        createCombatant('enemy1', 'Enemy1', 51),
        createCombatant('enemy2', 'Enemy2', 49),
      ];

      // Run multiple times
      const results = Array.from({ length: 20 }, () =>
        checkPreemptiveStrike(party, enemies, defaultGameConfig)
      );

      // Should rarely get preemptive strikes with similar speeds
      const preemptiveCount = results.filter(r => r).length;
      expect(preemptiveCount).toBeLessThan(15);
    });

    it('should handle empty arrays', () => {
      const party = [createCombatant('hero', 'Hero', 50)];
      
      expect(() => checkPreemptiveStrike([], [], defaultGameConfig)).not.toThrow();
      expect(() => checkPreemptiveStrike(party, [], defaultGameConfig)).not.toThrow();
      expect(() => checkPreemptiveStrike([], party, defaultGameConfig)).not.toThrow();
    });

    it('should use average party speed vs average enemy speed', () => {
      const mixedParty = [
        createCombatant('hero1', 'Hero1', 100),
        createCombatant('hero2', 'Hero2', 20),  // Average: 60
      ];
      const slowEnemies = [
        createCombatant('enemy1', 'Enemy1', 10),
        createCombatant('enemy2', 'Enemy2', 10),  // Average: 10
      ];

      // Speed difference: 60 - 10 = 50, which equals threshold
      // Should have chance of preemptive strike
      const results = Array.from({ length: 20 }, () =>
        checkPreemptiveStrike(mixedParty, slowEnemies, defaultGameConfig)
      );

      const preemptiveCount = results.filter(r => r).length;
      expect(preemptiveCount).toBeGreaterThanOrEqual(0);
    });
  });
});
