/**
 * Tests for accuracy module
 */

import { calculateHitRate, checkHit, calculateCriticalRate, checkCritical } from '../../src/combat/accuracy';
import { Combatant, Skill, GameConfig } from '../../src/types';
import { defaultGameConfig } from '../../src/config';

describe('命中率モジュール', () => {
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

  describe('calculateHitRate（命中率計算）', () => {
    it('基本命中率を正しく計算する', () => {
      const hitRate = calculateHitRate(attacker, target, skill);
      expect(hitRate).toBeGreaterThan(0);
      expect(hitRate).toBeLessThanOrEqual(1);
    });

    it('必中スキルの場合1.0を返す', () => {
      const guaranteedSkill: Skill = { ...skill, isGuaranteedHit: true };
      const hitRate = calculateHitRate(attacker, target, guaranteedSkill);
      expect(hitRate).toBe(1.0);
    });

    it('攻撃側の命中と対象の回避を考慮する', () => {
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

    it('命中率を100%で上限する', () => {
      const superAccurateAttacker: Combatant = {
        ...attacker,
        stats: { ...attacker.stats, accuracy: 1000 },
      };
      const hitRate = calculateHitRate(superAccurateAttacker, target, skill);
      expect(hitRate).toBeLessThanOrEqual(1.0);
    });

    it('最低命中率を保証する', () => {
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

  describe('checkHit（命中判定）', () => {
    it('100%命中率の場合常に命中する', () => {
      const results = Array.from({ length: 100 }, () => checkHit(1.0));
      expect(results.every(hit => hit === true)).toBe(true);
    });

    it('0%命中率の場合決して命中しない', () => {
      const results = Array.from({ length: 100 }, () => checkHit(0));
      expect(results.every(hit => hit === false)).toBe(true);
    });

    it('50%命中率の場合約半分の確率で命中する', () => {
      const sampleSize = 1000;
      const results = Array.from({ length: sampleSize }, () => checkHit(0.5));
      const hitCount = results.filter(hit => hit).length;
      const hitPercentage = hitCount / sampleSize;
      
      // Allow 10% margin of error
      expect(hitPercentage).toBeGreaterThan(0.4);
      expect(hitPercentage).toBeLessThan(0.6);
    });
  });

  describe('calculateCriticalRate（クリティカル率計算）', () => {
    it('設定から基本クリティカル率を計算する', () => {
      const critRate = calculateCriticalRate(attacker, skill, defaultGameConfig);
      expect(critRate).toBeGreaterThanOrEqual(defaultGameConfig.combat.baseCriticalRate);
    });

    it('運ベースのクリティカル率を加算する', () => {
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

    it('スキルのクリティカルボーナスを加算する', () => {
      const normalSkill: Skill = { ...skill, criticalBonus: 0 };
      const bonusSkill: Skill = { ...skill, criticalBonus: 0.2 };

      const critRate1 = calculateCriticalRate(attacker, normalSkill, defaultGameConfig);
      const critRate2 = calculateCriticalRate(attacker, bonusSkill, defaultGameConfig);

      expect(critRate2).toBeGreaterThan(critRate1);
      expect(critRate2).toBeCloseTo(critRate1 + 0.2);
    });

    it('キャラクターのクリティカル率ステータスを加算する', () => {
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

    it('クリティカル率を100%で上限する', () => {
      const superCritAttacker: Combatant = {
        ...attacker,
        stats: { ...attacker.stats, luck: 1000, criticalRate: 1.0 },
      };
      const superCritSkill: Skill = { ...skill, criticalBonus: 1.0 };
      
      const critRate = calculateCriticalRate(superCritAttacker, superCritSkill, defaultGameConfig);
      expect(critRate).toBeLessThanOrEqual(1.0);
    });
  });

  describe('checkCritical（クリティカル判定）', () => {
    it('100%クリティカル率の場合常にクリティカルする', () => {
      const results = Array.from({ length: 100 }, () => checkCritical(1.0));
      expect(results.every(crit => crit === true)).toBe(true);
    });

    it('0%クリティカル率の場合決してクリティカルしない', () => {
      const results = Array.from({ length: 100 }, () => checkCritical(0));
      expect(results.every(crit => crit === false)).toBe(true);
    });

    it('5%クリティカル率の場合約5%の確率でクリティカルする', () => {
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
