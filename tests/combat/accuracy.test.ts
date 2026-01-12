/**
 * Tests for accuracy module
 */

import { calculateHitRate, checkHit, calculateCriticalRate, checkCritical } from '../../src/combat/accuracy';
import { Combatant, Skill, GameConfig } from '../../src/types';
import { defaultGameConfig } from '../../src/config';

describe('accuracy module', () => {
  // Test combatants
  const attacker: Combatant = {
    id: 'attacker-1',
    name: 'Hero',
    level: 10,
    stats: {
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
    },
    currentHp: 100,
    currentMp: 50,
    statusEffects: [],
    position: 0,
  };

  const target: Combatant = {
    id: 'target-1',
    name: 'Slime',
    level: 5,
    stats: {
      maxHp: 50,
      maxMp: 0,
      attack: 20,
      defense: 15,
      magic: 10,
      magicDefense: 10,
      speed: 30,
      luck: 5,
      accuracy: 0,
      evasion: 10,
      criticalRate: 0,
    },
    currentHp: 50,
    currentMp: 0,
    statusEffects: [],
    position: 0,
  };

  const skill: Skill = {
    id: 'skill-1',
    name: 'Attack',
    type: 'physical',
    targetType: 'single-enemy',
    element: 'none',
    power: 1.0,
    mpCost: 0,
    accuracy: 1.0,
    criticalBonus: 0,
    isGuaranteedHit: false,
    description: 'Basic attack',
  };

  describe('calculateHitRate', () => {
    it('should calculate base hit rate correctly', () => {
      const hitRate = calculateHitRate(attacker, target, skill);
      expect(hitRate).toBeGreaterThan(0);
      expect(hitRate).toBeLessThanOrEqual(1);
    });

    it('should return 1.0 for guaranteed hit skills', () => {
      const guaranteedSkill: Skill = { ...skill, isGuaranteedHit: true };
      const hitRate = calculateHitRate(attacker, target, guaranteedSkill);
      expect(hitRate).toBe(1.0);
    });

    it('should consider attacker accuracy and target evasion', () => {
      const highAccuracyAttacker: Combatant = {
        ...attacker,
        stats: { ...attacker.stats, accuracy: 50 },
      };
      const lowAccuracyAttacker: Combatant = {
        ...attacker,
        stats: { ...attacker.stats, accuracy: 0 },
      };

      const hitRate1 = calculateHitRate(highAccuracyAttacker, target, skill);
      const hitRate2 = calculateHitRate(lowAccuracyAttacker, target, skill);

      expect(hitRate1).toBeGreaterThan(hitRate2);
    });

    it('should cap hit rate at 100%', () => {
      const superAccurateAttacker: Combatant = {
        ...attacker,
        stats: { ...attacker.stats, accuracy: 1000 },
      };
      const hitRate = calculateHitRate(superAccurateAttacker, target, skill);
      expect(hitRate).toBeLessThanOrEqual(1.0);
    });

    it('should ensure minimum hit rate', () => {
      const lowAccuracyAttacker: Combatant = {
        ...attacker,
        stats: { ...attacker.stats, accuracy: -1000 },
      };
      const highEvasionTarget: Combatant = {
        ...target,
        stats: { ...target.stats, evasion: 1000 },
      };
      const hitRate = calculateHitRate(lowAccuracyAttacker, highEvasionTarget, skill);
      expect(hitRate).toBeGreaterThanOrEqual(0.05); // Minimum 5% hit rate
    });
  });

  describe('checkHit', () => {
    it('should always hit with 100% hit rate', () => {
      const results = Array.from({ length: 100 }, () => checkHit(1.0));
      expect(results.every(hit => hit === true)).toBe(true);
    });

    it('should never hit with 0% hit rate', () => {
      const results = Array.from({ length: 100 }, () => checkHit(0));
      expect(results.every(hit => hit === false)).toBe(true);
    });

    it('should hit approximately half the time with 50% hit rate', () => {
      const sampleSize = 1000;
      const results = Array.from({ length: sampleSize }, () => checkHit(0.5));
      const hitCount = results.filter(hit => hit).length;
      const hitPercentage = hitCount / sampleSize;
      
      // Allow 10% margin of error
      expect(hitPercentage).toBeGreaterThan(0.4);
      expect(hitPercentage).toBeLessThan(0.6);
    });
  });

  describe('calculateCriticalRate', () => {
    it('should calculate base critical rate from config', () => {
      const critRate = calculateCriticalRate(attacker, skill, defaultGameConfig);
      expect(critRate).toBeGreaterThanOrEqual(defaultGameConfig.combat.baseCriticalRate);
    });

    it('should add luck-based critical rate', () => {
      const lowLuckAttacker: Combatant = {
        ...attacker,
        stats: { ...attacker.stats, luck: 0 },
      };
      const highLuckAttacker: Combatant = {
        ...attacker,
        stats: { ...attacker.stats, luck: 100 },
      };

      const critRate1 = calculateCriticalRate(lowLuckAttacker, skill, defaultGameConfig);
      const critRate2 = calculateCriticalRate(highLuckAttacker, skill, defaultGameConfig);

      expect(critRate2).toBeGreaterThan(critRate1);
    });

    it('should add skill critical bonus', () => {
      const normalSkill: Skill = { ...skill, criticalBonus: 0 };
      const bonusSkill: Skill = { ...skill, criticalBonus: 0.2 };

      const critRate1 = calculateCriticalRate(attacker, normalSkill, defaultGameConfig);
      const critRate2 = calculateCriticalRate(attacker, bonusSkill, defaultGameConfig);

      expect(critRate2).toBeGreaterThan(critRate1);
      expect(critRate2).toBeCloseTo(critRate1 + 0.2);
    });

    it('should add combatant critical rate stat', () => {
      const noCritAttacker: Combatant = {
        ...attacker,
        stats: { ...attacker.stats, criticalRate: 0 },
      };
      const highCritAttacker: Combatant = {
        ...attacker,
        stats: { ...attacker.stats, criticalRate: 0.3 },
      };

      const critRate1 = calculateCriticalRate(noCritAttacker, skill, defaultGameConfig);
      const critRate2 = calculateCriticalRate(highCritAttacker, skill, defaultGameConfig);

      expect(critRate2).toBeGreaterThan(critRate1);
    });

    it('should cap critical rate at 100%', () => {
      const superCritAttacker: Combatant = {
        ...attacker,
        stats: { ...attacker.stats, luck: 1000, criticalRate: 1.0 },
      };
      const superCritSkill: Skill = { ...skill, criticalBonus: 1.0 };
      
      const critRate = calculateCriticalRate(superCritAttacker, superCritSkill, defaultGameConfig);
      expect(critRate).toBeLessThanOrEqual(1.0);
    });
  });

  describe('checkCritical', () => {
    it('should always crit with 100% crit rate', () => {
      const results = Array.from({ length: 100 }, () => checkCritical(1.0));
      expect(results.every(crit => crit === true)).toBe(true);
    });

    it('should never crit with 0% crit rate', () => {
      const results = Array.from({ length: 100 }, () => checkCritical(0));
      expect(results.every(crit => crit === false)).toBe(true);
    });

    it('should crit approximately 5% of the time with 5% crit rate', () => {
      const sampleSize = 1000;
      const results = Array.from({ length: sampleSize }, () => checkCritical(0.05));
      const critCount = results.filter(crit => crit).length;
      const critPercentage = critCount / sampleSize;
      
      // Allow reasonable margin of error for 5% rate
      expect(critPercentage).toBeGreaterThan(0.02);
      expect(critPercentage).toBeLessThan(0.08);
    });
  });
});
