/**
 * 汎用ダメージ計算のテスト
 * - カスタムスキルタイプに対応したダメージ計算をテスト
 */

import { calculateDamage } from '../../src/core/combat/damage';
import { Combatant, Skill, GameConfig, DefaultStats, CustomFormulas } from '../../src/types';

describe('Generic Damage Calculation', () => {
  // テスト用キャラクター
  const createTestCombatant = (stats: Partial<DefaultStats>): Combatant => ({
    id: 'test-1',
    name: 'Test Character',
    level: 10,
    stats: {
      maxHp: 100,
      maxMp: 50,
      attack: 50,
      defense: 20,
      magic: 40,
      magicDefense: 15,
      speed: 30,
      luck: 10,
      accuracy: 0,
      evasion: 0,
      criticalRate: 0,
      ...stats
    } as DefaultStats,
    currentHp: 100,
    currentMp: 50,
    statusEffects: [],
    position: 0
  });

  // 基本的なゲーム設定
  const basicConfig: GameConfig = {
    combat: {
      baseCriticalRate: 0.05,
      criticalMultiplier: 2.0,
      damageVariance: 0.1,
      escapeBaseRate: 0.5,
      escapeRateIncrement: 0.1,
      preemptiveStrikeThreshold: 50,
      speedVariance: 0.1
    },
    growth: {
      expCurve: 'exponential',
      baseExpRequired: 100,
      expGrowthRate: 1.2,
      statGrowthRates: {} as any,
      maxLevel: 99
    },
    balance: {
      maxPartySize: 4,
      dropRateModifier: 1.0
    }
  };

  describe('Default skill types', () => {
    it('should calculate physical damage correctly', () => {
      const attacker = createTestCombatant({ attack: 50 });
      const target = createTestCombatant({ defense: 20 });
      
      const skill: Skill = {
        id: 'physical-attack',
        name: 'Physical Attack',
        type: 'physical',
        targetType: 'single-enemy',
        element: 'none',
        power: 2.0,
        accuracy: 1.0,
        criticalBonus: 0,
        isGuaranteedHit: true,
        description: 'Test physical attack'
      };

      const result = calculateDamage(attacker, target, skill, basicConfig);
      
      expect(result.isHit).toBe(true);
      expect(result.finalDamage).toBeGreaterThan(0);
      // (50 * 2.0 - 20) = 80 base damage
      expect(result.baseDamage).toBeCloseTo(80, 0);
    });

    it('should calculate magic damage correctly', () => {
      const attacker = createTestCombatant({ magic: 60 });
      const target = createTestCombatant({ magicDefense: 15 });
      
      const skill: Skill = {
        id: 'magic-attack',
        name: 'Magic Attack',
        type: 'magic',
        targetType: 'single-enemy',
        element: 'fire',
        power: 1.5,
        cost: { mp: 10 },
        accuracy: 1.0,
        criticalBonus: 0,
        isGuaranteedHit: true,
        description: 'Test magic attack'
      };

      const result = calculateDamage(attacker, target, skill, basicConfig);
      
      expect(result.isHit).toBe(true);
      expect(result.finalDamage).toBeGreaterThan(0);
      // (60 * 1.5 - 15) = 75 base damage
      expect(result.baseDamage).toBeCloseTo(75, 0);
    });
  });

  describe('Custom skill types with damageFormulas', () => {
    it('should use custom damage formula for laser skill type', () => {
      const attacker = createTestCombatant({ 
        attack: 50
      });
      (attacker.stats as any).energyWeapons = 80;
      
      const target = createTestCombatant({ 
        defense: 20
      });
      (target.stats as any).shielding = 30;

      // カスタム計算式を定義
      const customFormulas: CustomFormulas<DefaultStats, 'laser' | 'plasma' | 'kinetic'> = {
        damageFormulas: {
          laser: (attacker, target, skill, isCritical, config) => {
            const energyDamage = (attacker.stats as any).energyWeapons * skill.power;
            const shieldReduction = (target.stats as any).shielding * 0.5;
            return Math.max(1, energyDamage - shieldReduction);
          },
          plasma: (attacker, target, skill, isCritical, config) => {
            return (attacker.stats as any).energyWeapons * skill.power * 1.5;
          }
        }
      };

      const configWithCustom: GameConfig = {
        ...basicConfig,
        customFormulas
      };

      const laserSkill: Skill = {
        id: 'laser-beam',
        name: 'Laser Beam',
        type: 'laser' as any,
        targetType: 'single-enemy',
        element: 'none',
        power: 2.0,
        cost: { mp: 15 },
        accuracy: 1.0,
        criticalBonus: 0,
        isGuaranteedHit: true,
        description: 'High-energy laser beam'
      };

      const result = calculateDamage(attacker, target, laserSkill, configWithCustom);
      
      expect(result.isHit).toBe(true);
      expect(result.finalDamage).toBeGreaterThan(0);
      // (80 * 2.0 - 30 * 0.5) = 160 - 15 = 145 base damage
      expect(result.baseDamage).toBeCloseTo(145, 0);
    });

    it('should use custom damage formula for plasma skill type', () => {
      const attacker = createTestCombatant({ 
        attack: 50
      });
      (attacker.stats as any).energyWeapons = 80;
      
      const target = createTestCombatant({});

      const customFormulas: CustomFormulas<DefaultStats, 'laser' | 'plasma'> = {
        damageFormulas: {
          plasma: (attacker, target, skill, isCritical, config) => {
            return (attacker.stats as any).energyWeapons * skill.power * 1.5;
          }
        }
      };

      const configWithCustom: GameConfig = {
        ...basicConfig,
        customFormulas
      };

      const plasmaSkill: Skill = {
        id: 'plasma-burst',
        name: 'Plasma Burst',
        type: 'plasma' as any,
        targetType: 'single-enemy',
        element: 'none',
        power: 1.0,
        cost: { mp: 20 },
        accuracy: 1.0,
        criticalBonus: 0,
        isGuaranteedHit: true,
        description: 'Devastating plasma burst'
      };

      const result = calculateDamage(attacker, target, plasmaSkill, configWithCustom);
      
      expect(result.isHit).toBe(true);
      // 80 * 1.0 * 1.5 = 120 base damage
      expect(result.baseDamage).toBeCloseTo(120, 0);
    });
  });

  describe('Fallback for undefined skill types', () => {
    it('should use generic formula for undefined skill type', () => {
      const attacker = createTestCombatant({ attack: 50 });
      const target = createTestCombatant({ defense: 20 });
      
      // 未定義のスキルタイプ
      const customSkill: Skill = {
        id: 'custom-attack',
        name: 'Custom Attack',
        type: 'custom-type' as any,
        targetType: 'single-enemy',
        element: 'none',
        power: 2.0,
        accuracy: 1.0,
        criticalBonus: 0,
        isGuaranteedHit: true,
        description: 'Custom skill type'
      };

      const result = calculateDamage(attacker, target, customSkill, basicConfig);
      
      expect(result.isHit).toBe(true);
      expect(result.finalDamage).toBeGreaterThan(0);
      // 汎用計算式: (50 * 2.0 - 20) = 80
      expect(result.baseDamage).toBeCloseTo(80, 0);
    });
  });
});
