/**
 * ダメージ計算モジュール
 */

import { Combatant, Skill, GameConfig, DamageResult, Element, ElementResistance } from '../types';
import { calculateHitRate, checkHit, calculateCriticalRate, checkCritical } from './accuracy';

/**
 * 物理ダメージを計算
 * @param attacker - 攻撃者
 * @param target - 対象
 * @param skill - 使用スキル
 * @param config - ゲーム設定
 * @returns ダメージ計算結果
 */
export function calculatePhysicalDamage(
  attacker: Combatant,
  target: Combatant,
  skill: Skill,
  config: GameConfig
): DamageResult {
  const appliedModifiers: Array<{ source: string; multiplier: number }> = [];

  // 攻撃が命中するか判定
  const hitRate = calculateHitRate(attacker, target, skill);
  const isHit = checkHit(hitRate);

  if (!isHit) {
    return {
      finalDamage: 0,
      baseDamage: 0,
      isCritical: false,
      isHit: false,
      elementalModifier: 1.0,
      variance: 0,
      appliedModifiers: [],
    };
  }

  // 基礎ダメージを計算：（攻撃力 × 威力）- 防御力
  const baseDamage = Math.max(1, attacker.stats.attack * skill.power - target.stats.defense);

  // クリティカルヒット判定
  const criticalRate = calculateCriticalRate(attacker, skill, config);
  const isCritical = checkCritical(criticalRate);
  
  let finalDamage = baseDamage;

  // クリティカル倍率を適用
  if (isCritical) {
    const critMultiplier = config.combat.criticalMultiplier;
    finalDamage *= critMultiplier;
    appliedModifiers.push({ source: 'Critical', multiplier: critMultiplier });
  }

  // 属性倍率を適用
  // Phase 1では戦闘者に属性耐性データがないため
  // 現時点では1.0を返す
  const elementalModifier = 1.0;
  finalDamage *= elementalModifier;

  // ダメージ分散を適用
  const variance = 1.0 + (Math.random() * 2 - 1) * config.combat.damageVariance;
  finalDamage *= variance;
  appliedModifiers.push({ source: 'Variance', multiplier: variance });

  // 最低ダメージを1に設定
  finalDamage = Math.max(1, Math.floor(finalDamage));

  return {
    finalDamage,
    baseDamage,
    isCritical,
    isHit: true,
    elementalModifier,
    variance,
    appliedModifiers,
  };
}

/**
 * 魔法ダメージを計算
 * @param attacker - 攻撃者
 * @param target - 対象
 * @param skill - 使用スキル
 * @param config - ゲーム設定
 * @returns ダメージ計算結果
 */
export function calculateMagicDamage(
  attacker: Combatant,
  target: Combatant,
  skill: Skill,
  config: GameConfig
): DamageResult {
  const appliedModifiers: Array<{ source: string; multiplier: number }> = [];

  // 攻撃が命中するか判定
  const hitRate = calculateHitRate(attacker, target, skill);
  const isHit = checkHit(hitRate);

  if (!isHit) {
    return {
      finalDamage: 0,
      baseDamage: 0,
      isCritical: false,
      isHit: false,
      elementalModifier: 1.0,
      variance: 0,
      appliedModifiers: [],
    };
  }

  // 基礎魔法ダメージを計算：（魔力 × 威力）- 魔法防御
  const baseDamage = Math.max(1, attacker.stats.magic * skill.power - target.stats.magicDefense);

  // クリティカルヒット判定
  const criticalRate = calculateCriticalRate(attacker, skill, config);
  const isCritical = checkCritical(criticalRate);
  
  let finalDamage = baseDamage;

  // クリティカル倍率を適用
  if (isCritical) {
    const critMultiplier = config.combat.criticalMultiplier;
    finalDamage *= critMultiplier;
    appliedModifiers.push({ source: 'Critical', multiplier: critMultiplier });
  }

  // 属性倍率を適用
  const elementalModifier = 1.0;
  finalDamage *= elementalModifier;

  // ダメージ分散を適用
  const variance = 1.0 + (Math.random() * 2 - 1) * config.combat.damageVariance;
  finalDamage *= variance;
  appliedModifiers.push({ source: 'Variance', multiplier: variance });

  // 最低ダメージを1に設定
  finalDamage = Math.max(1, Math.floor(finalDamage));

  return {
    finalDamage,
    baseDamage,
    isCritical,
    isHit: true,
    elementalModifier,
    variance,
    appliedModifiers,
  };
}

/**
 * 回復量を計算
 * @param caster - 術者
 * @param target - 対象
 * @param skill - 使用スキル
 * @param config - ゲーム設定
 * @returns 回復量
 */
export function calculateHealAmount(
  caster: Combatant,
  target: Combatant,
  skill: Skill,
  config: GameConfig
): number {
  // 基礎回復量：魔力 × 威力
  const baseHeal = caster.stats.magic * skill.power;

  // 回復量に小さな分散を適用
  const variance = 1.0 + (Math.random() * 2 - 1) * 0.05; // ±5%の分散

  // 最終回復量を計算
  const healAmount = Math.max(1, Math.floor(baseHeal * variance));

  return healAmount;
}

/**
 * 属性倍率を計算
 * @param attackElement - 攻撃属性
 * @param targetResistance - 対象の属性耐性
 * @returns 属性倍率（0.0〜2.0以上）
 */
export function calculateElementalModifier(
  attackElement: Element,
  targetResistance: ElementResistance
): number {
  // 無属性は倍率なし
  if (attackElement === 'none') {
    return 1.0;
  }

  // 攻撃属性に対する耐性値を返す
  return targetResistance[attackElement];
}
