/**
 * Tests for character stats module
 */

import { calculateFinalStats, applyStatModifiers } from '../../src/character/stats';
import { Stats } from '../../src/types';

describe('character stats module', () => {
  const baseStats: Stats = {
    maxHp: 100,
    maxMp: 50,
    attack: 50,
    defense: 30,
    magic: 40,
    magicDefense: 25,
    speed: 60,
    luck: 15,
    accuracy: 10,
    evasion: 5,
    criticalRate: 0.05,
  };

  describe('calculateFinalStats', () => {
    it('should return base stats when no modifiers', () => {
      const finalStats = calculateFinalStats(baseStats, []);
      
      expect(finalStats).toEqual(baseStats);
    });

    it('should apply single stat modifier', () => {
      const modifier: Partial<Stats> = {
        attack: 10,
        defense: 5,
      };

      const finalStats = calculateFinalStats(baseStats, [modifier]);
      
      expect(finalStats.attack).toBe(60); // 50 + 10
      expect(finalStats.defense).toBe(35); // 30 + 5
      expect(finalStats.maxHp).toBe(100); // unchanged
    });

    it('should apply multiple stat modifiers', () => {
      const modifier1: Partial<Stats> = {
        attack: 10,
        defense: 5,
      };
      const modifier2: Partial<Stats> = {
        attack: 5,
        speed: 10,
      };

      const finalStats = calculateFinalStats(baseStats, [modifier1, modifier2]);
      
      expect(finalStats.attack).toBe(65); // 50 + 10 + 5
      expect(finalStats.defense).toBe(35); // 30 + 5
      expect(finalStats.speed).toBe(70); // 60 + 10
    });

    it('should handle negative modifiers', () => {
      const modifier: Partial<Stats> = {
        attack: -20,
        defense: -10,
      };

      const finalStats = calculateFinalStats(baseStats, [modifier]);
      
      expect(finalStats.attack).toBe(30); // 50 - 20
      expect(finalStats.defense).toBe(20); // 30 - 10
    });

    it('should not allow stats to go below 0', () => {
      const modifier: Partial<Stats> = {
        attack: -100,
        defense: -100,
      };

      const finalStats = calculateFinalStats(baseStats, [modifier]);
      
      expect(finalStats.attack).toBeGreaterThanOrEqual(0);
      expect(finalStats.defense).toBeGreaterThanOrEqual(0);
    });

    it('should handle all stat types', () => {
      const modifier: Partial<Stats> = {
        maxHp: 50,
        maxMp: 20,
        attack: 10,
        defense: 5,
        magic: 15,
        magicDefense: 8,
        speed: 12,
        luck: 3,
        accuracy: 5,
        evasion: 2,
        criticalRate: 0.05,
      };

      const finalStats = calculateFinalStats(baseStats, [modifier]);
      
      expect(finalStats.maxHp).toBe(150);
      expect(finalStats.maxMp).toBe(70);
      expect(finalStats.attack).toBe(60);
      expect(finalStats.defense).toBe(35);
      expect(finalStats.magic).toBe(55);
      expect(finalStats.magicDefense).toBe(33);
      expect(finalStats.speed).toBe(72);
      expect(finalStats.luck).toBe(18);
      expect(finalStats.accuracy).toBe(15);
      expect(finalStats.evasion).toBe(7);
      expect(finalStats.criticalRate).toBeCloseTo(0.10);
    });
  });

  describe('applyStatModifiers', () => {
    it('should add modifier to base stat', () => {
      expect(applyStatModifiers(50, 10)).toBe(60);
      expect(applyStatModifiers(30, 5)).toBe(35);
    });

    it('should handle negative modifiers', () => {
      expect(applyStatModifiers(50, -20)).toBe(30);
      expect(applyStatModifiers(30, -10)).toBe(20);
    });

    it('should not allow result below 0', () => {
      expect(applyStatModifiers(50, -100)).toBeGreaterThanOrEqual(0);
      expect(applyStatModifiers(10, -20)).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero modifier', () => {
      expect(applyStatModifiers(50, 0)).toBe(50);
    });

    it('should handle decimal values for rates', () => {
      expect(applyStatModifiers(0.05, 0.1)).toBeCloseTo(0.15);
      expect(applyStatModifiers(0.2, -0.05)).toBeCloseTo(0.15);
    });
  });
});
