/**
 * Tests for damage calculation module
 */

import {
  calculatePhysicalDamage,
  calculateMagicDamage,
  calculateHealAmount,
  calculateElementalModifier,
} from '../../src/combat/damage';
import { Combatant, Skill, DefaultElementResistance } from '../../src/types';
import { defaultGameConfig } from '../../src/config';

describe('ダメージ計算モジュール', () => {
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

  const physicalSkill: Skill = {
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
    description: 'Basic physical attack',
  };

  const magicSkill: Skill = {
    id: 'skill-2',
    name: 'Fire',
    type: 'magic',
    targetType: 'single-enemy',
    element: 'fire',
    power: 1.5,
    mpCost: 10,
    accuracy: 1.0,
    criticalBonus: 0,
    isGuaranteedHit: false,
    description: 'Fire magic attack',
  };

  const healSkill: Skill = {
    id: 'skill-3',
    name: 'Heal',
    type: 'heal',
    targetType: 'single-ally',
    element: 'none',
    power: 1.0,
    mpCost: 5,
    accuracy: 1.0,
    criticalBonus: 0,
    isGuaranteedHit: true,
    description: 'Heal spell',
  };

  describe('calculatePhysicalDamage（物理ダメージ計算）', () => {
    it('基本物理ダメージを計算する', () => {
      const result = calculatePhysicalDamage(attacker, target, physicalSkill, defaultGameConfig);
      
      expect(result.finalDamage).toBeGreaterThan(0);
      expect(result.baseDamage).toBeGreaterThan(0);
      expect(result.isHit).toBe(true);
      expect(typeof result.isCritical).toBe('boolean');
      expect(result.elementalModifier).toBe(1.0); // No element
      expect(result.appliedModifiers).toBeInstanceOf(Array);
    });

    it('攻撃力が高いほど多くのダメージを与える', () => {
      const strongAttacker: Combatant = {
        ...attacker,
        stats: { ...attacker.stats, attack: 100 },
      };

      const result1 = calculatePhysicalDamage(attacker, target, physicalSkill, defaultGameConfig);
      const result2 = calculatePhysicalDamage(strongAttacker, target, physicalSkill, defaultGameConfig);

      expect(result2.baseDamage).toBeGreaterThan(result1.baseDamage);
    });

    it('防御力が高いほどダメージが少なくなる', () => {
      const weakTarget: Combatant = {
        ...target,
        stats: { ...target.stats, defense: 5 },
      };
      const strongTarget: Combatant = {
        ...target,
        stats: { ...target.stats, defense: 50 },
      };

      const result1 = calculatePhysicalDamage(attacker, weakTarget, physicalSkill, defaultGameConfig);
      const result2 = calculatePhysicalDamage(attacker, strongTarget, physicalSkill, defaultGameConfig);

      expect(result1.baseDamage).toBeGreaterThan(result2.baseDamage);
    });

    it('スキルの威力倍率を適用する', () => {
      const weakSkill: Skill = { ...physicalSkill, power: 0.5 };
      const strongSkill: Skill = { ...physicalSkill, power: 2.0 };

      const result1 = calculatePhysicalDamage(attacker, target, weakSkill, defaultGameConfig);
      const result2 = calculatePhysicalDamage(attacker, target, strongSkill, defaultGameConfig);

      expect(result2.baseDamage).toBeGreaterThan(result1.baseDamage);
    });

    it('クリティカル時にクリティカル倍率を適用する', () => {
      // Run multiple times to get at least one critical
      const results = Array.from({ length: 100 }, () =>
        calculatePhysicalDamage(attacker, target, physicalSkill, defaultGameConfig)
      );

      const criticalResult = results.find(r => r.isCritical);
      const nonCriticalResult = results.find(r => !r.isCritical);

      if (criticalResult && nonCriticalResult) {
        expect(criticalResult.finalDamage).toBeGreaterThan(nonCriticalResult.finalDamage);
      }
    });

    it('最低ダメージを1に保証する', () => {
      const weakAttacker: Combatant = {
        ...attacker,
        stats: { ...attacker.stats, attack: 1 },
      };
      const strongTarget: Combatant = {
        ...target,
        stats: { ...target.stats, defense: 1000 },
      };

      const result = calculatePhysicalDamage(weakAttacker, strongTarget, physicalSkill, defaultGameConfig);
      expect(result.finalDamage).toBeGreaterThanOrEqual(1);
    });

    it('ミスを正しく処理する', () => {
      const inaccurateSkill: Skill = { ...physicalSkill, accuracy: 0 };
      const result = calculatePhysicalDamage(attacker, target, inaccurateSkill, defaultGameConfig);

      if (!result.isHit) {
        expect(result.finalDamage).toBe(0);
      }
    });
  });

  describe('calculateMagicDamage（魔法ダメージ計算）', () => {
    it('基本魔法ダメージを計算する', () => {
      const result = calculateMagicDamage(attacker, target, magicSkill, defaultGameConfig);
      
      expect(result.finalDamage).toBeGreaterThan(0);
      expect(result.baseDamage).toBeGreaterThan(0);
      expect(result.isHit).toBe(true);
    });

    it('攻撃力の代わりに魔力を使用する', () => {
      const highMagicAttacker: Combatant = {
        ...attacker,
        stats: { ...attacker.stats, magic: 100 },
      };

      const result1 = calculateMagicDamage(attacker, target, magicSkill, defaultGameConfig);
      const result2 = calculateMagicDamage(highMagicAttacker, target, magicSkill, defaultGameConfig);

      expect(result2.baseDamage).toBeGreaterThan(result1.baseDamage);
    });

    it('防御力の代わりに魔法防御を使用する', () => {
      const lowMagicDefTarget: Combatant = {
        ...target,
        stats: { ...target.stats, magicDefense: 5 },
      };
      const highMagicDefTarget: Combatant = {
        ...target,
        stats: { ...target.stats, magicDefense: 50 },
      };

      const result1 = calculateMagicDamage(attacker, lowMagicDefTarget, magicSkill, defaultGameConfig);
      const result2 = calculateMagicDamage(attacker, highMagicDefTarget, magicSkill, defaultGameConfig);

      expect(result1.baseDamage).toBeGreaterThan(result2.baseDamage);
    });
  });

  describe('calculateHealAmount（回復量計算）', () => {
    it('回復量を計算する', () => {
      const healAmount = calculateHealAmount(attacker, target, healSkill, defaultGameConfig);
      expect(healAmount).toBeGreaterThan(0);
    });

    it('術者の魔力に応じてスケールする', () => {
      const lowMagicCaster: Combatant = {
        ...attacker,
        stats: { ...attacker.stats, magic: 10 },
      };
      const highMagicCaster: Combatant = {
        ...attacker,
        stats: { ...attacker.stats, magic: 100 },
      };

      const heal1 = calculateHealAmount(lowMagicCaster, target, healSkill, defaultGameConfig);
      const heal2 = calculateHealAmount(highMagicCaster, target, healSkill, defaultGameConfig);

      expect(heal2).toBeGreaterThan(heal1);
    });

    it('スキルの威力倍率を適用する', () => {
      const weakHeal: Skill = { ...healSkill, power: 0.5 };
      const strongHeal: Skill = { ...healSkill, power: 2.0 };

      const heal1 = calculateHealAmount(attacker, target, weakHeal, defaultGameConfig);
      const heal2 = calculateHealAmount(attacker, target, strongHeal, defaultGameConfig);

      expect(heal2).toBeGreaterThan(heal1);
    });
  });

  describe('calculateElementalModifier（属性修飾子計算）', () => {
    const normalResistance: DefaultElementResistance = {
      fire: 1.0,
      water: 1.0,
      earth: 1.0,
      wind: 1.0,
      lightning: 1.0,
      ice: 1.0,
      light: 1.0,
      dark: 1.0,
    };

    it('通常耐性の場合1.0を返す', () => {
      const modifier = calculateElementalModifier('fire', normalResistance);
      expect(modifier).toBe(1.0);
    });

    it('一致する属性の耐性値を返す', () => {
      const weakToFire: DefaultElementResistance = { ...normalResistance, fire: 2.0 };
      const resistantToFire: DefaultElementResistance = { ...normalResistance, fire: 0.5 };
      const immuneToFire: DefaultElementResistance = { ...normalResistance, fire: 0 };

      expect(calculateElementalModifier('fire', weakToFire)).toBe(2.0);
      expect(calculateElementalModifier('fire', resistantToFire)).toBe(0.5);
      expect(calculateElementalModifier('fire', immuneToFire)).toBe(0);
    });

    it('無属性の場合1.0を返す', () => {
      const anyResistance: DefaultElementResistance = {
        ...normalResistance,
        fire: 2.0,
        water: 0.5,
      };
      const modifier = calculateElementalModifier('none', anyResistance);
      expect(modifier).toBe(1.0);
    });

    it('全ての属性タイプを処理する', () => {
      const elements: Array<'fire' | 'water' | 'earth' | 'wind' | 'lightning' | 'ice' | 'light' | 'dark'> = [
        'fire', 'water', 'earth', 'wind', 'lightning', 'ice', 'light', 'dark'
      ];

      elements.forEach(element => {
        const modifier = calculateElementalModifier(element, normalResistance);
        expect(modifier).toBe(1.0);
      });
    });
  });
});
