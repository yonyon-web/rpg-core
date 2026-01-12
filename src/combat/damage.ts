/**
 * ダメージ計算モジュール
 */

import { Combatant, Skill, GameConfig, DamageResult, DefaultElement, DefaultElementResistance, DefaultStats } from '../types';
import { calculateHitRate, checkHit, calculateCriticalRate, checkCritical } from './accuracy';

/**
 * デフォルトの物理ダメージ計算式
 * @param attacker - 攻撃者
 * @param target - 対象
 * @param skill - 使用スキル
 * @param isCritical - クリティカルヒットかどうか
 * @param config - ゲーム設定
 * @returns 基礎ダメージ値
 */
function defaultPhysicalDamageFormula(
  attacker: Combatant<DefaultStats, any, any>,
  target: Combatant<DefaultStats, any, any>,
  skill: Skill,
  isCritical: boolean,
  config: GameConfig
): number {
  // 基礎ダメージを計算：（攻撃力 × 威力）- 防御力
  return Math.max(1, attacker.stats.attack * skill.power - target.stats.defense);
}

/**
 * 物理ダメージを計算
 * - GameConfigでカスタム計算式が指定されている場合はそれを使用
 * - 指定されていない場合はデフォルトの計算式を使用
 * 
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
  const hitRate = calculateHitRate(attacker, target, skill, config);
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

  // クリティカルヒット判定
  const criticalRate = calculateCriticalRate(attacker, skill, config);
  const isCritical = checkCritical(criticalRate);

  // 基礎ダメージを計算
  let baseDamage: number;
  if (config.customFormulas?.physicalDamage) {
    // カスタム計算式を使用
    baseDamage = config.customFormulas.physicalDamage(attacker, target, skill, isCritical, config);
  } else {
    // デフォルトの計算式を使用
    baseDamage = defaultPhysicalDamageFormula(
      attacker as Combatant<DefaultStats, any, any>,
      target as Combatant<DefaultStats, any, any>,
      skill,
      isCritical,
      config
    );
  }
  
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
 * デフォルトの魔法ダメージ計算式
 * @param attacker - 攻撃者
 * @param target - 対象
 * @param skill - 使用スキル
 * @param isCritical - クリティカルヒットかどうか
 * @param config - ゲーム設定
 * @returns 基礎ダメージ値
 */
function defaultMagicDamageFormula(
  attacker: Combatant<DefaultStats, any, any>,
  target: Combatant<DefaultStats, any, any>,
  skill: Skill,
  isCritical: boolean,
  config: GameConfig
): number {
  // 基礎魔法ダメージを計算：（魔力 × 威力）- 魔法防御
  return Math.max(1, attacker.stats.magic * skill.power - target.stats.magicDefense);
}

/**
 * 魔法ダメージを計算
 * - GameConfigでカスタム計算式が指定されている場合はそれを使用
 * - 指定されていない場合はデフォルトの計算式を使用
 * 
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
  const hitRate = calculateHitRate(attacker, target, skill, config);
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

  // クリティカルヒット判定
  const criticalRate = calculateCriticalRate(attacker, skill, config);
  const isCritical = checkCritical(criticalRate);

  // 基礎ダメージを計算
  let baseDamage: number;
  if (config.customFormulas?.magicDamage) {
    // カスタム計算式を使用
    baseDamage = config.customFormulas.magicDamage(attacker, target, skill, isCritical, config);
  } else {
    // デフォルトの計算式を使用
    baseDamage = defaultMagicDamageFormula(
      attacker as Combatant<DefaultStats, any, any>,
      target as Combatant<DefaultStats, any, any>,
      skill,
      isCritical,
      config
    );
  }
  
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
 * デフォルトの回復量計算式
 * @param caster - 術者
 * @param target - 対象
 * @param skill - 使用スキル
 * @param config - ゲーム設定
 * @returns 基礎回復量
 */
function defaultHealFormula(
  caster: Combatant<DefaultStats, any, any>,
  target: Combatant<DefaultStats, any, any>,
  skill: Skill,
  config: GameConfig
): number {
  // 基礎回復量：魔力 × 威力
  return caster.stats.magic * skill.power;
}

/**
 * 回復量を計算
 * - GameConfigでカスタム計算式が指定されている場合はそれを使用
 * - 指定されていない場合はデフォルトの計算式を使用
 * 
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
  // 基礎回復量を計算
  let baseHeal: number;
  if (config.customFormulas?.heal) {
    // カスタム計算式を使用
    baseHeal = config.customFormulas.heal(caster, target, skill, config);
  } else {
    // デフォルトの計算式を使用
    baseHeal = defaultHealFormula(
      caster as Combatant<DefaultStats, any, any>,
      target as Combatant<DefaultStats, any, any>,
      skill,
      config
    );
  }

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
  attackElement: DefaultElement,
  targetResistance: DefaultElementResistance
): number {
  // 無属性は倍率なし
  if (attackElement === 'none') {
    return 1.0;
  }

  // 攻撃属性に対する耐性値を返す
  return targetResistance[attackElement];
}
