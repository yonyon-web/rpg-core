/**
 * ダメージ計算モジュール
 */

import { Combatant, Skill, GameConfig, DamageResult, DefaultElement, DefaultElementResistance, DefaultStats } from '../types';
import { calculateHitRate, checkHit, calculateCriticalRate, checkCritical } from './accuracy';

/**
 * 命中判定とクリティカル判定を実行
 * @param attacker - 攻撃者
 * @param target - 対象
 * @param skill - 使用スキル
 * @param config - ゲーム設定
 * @returns 判定結果 { isHit, isCritical, hitRate, criticalRate }
 */
function performHitAndCriticalChecks(
  attacker: Combatant,
  target: Combatant,
  skill: Skill,
  config: GameConfig
): { isHit: boolean; isCritical: boolean; hitRate: number; criticalRate: number } {
  const hitRate = calculateHitRate(attacker, target, skill, config);
  const isHit = checkHit(hitRate);
  
  if (!isHit) {
    return { isHit: false, isCritical: false, hitRate, criticalRate: 0 };
  }
  
  const criticalRate = calculateCriticalRate(attacker, skill, config);
  const isCritical = checkCritical(criticalRate);
  
  return { isHit, isCritical, hitRate, criticalRate };
}

/**
 * 基礎ダメージに修飾子を適用して最終ダメージを計算
 * @param baseDamage - 基礎ダメージ
 * @param isCritical - クリティカルヒットかどうか
 * @param config - ゲーム設定
 * @param skill - 使用スキル
 * @param target - 対象
 * @returns { finalDamage, elementalModifier, variance, appliedModifiers }
 */
function applyDamageModifiers(
  baseDamage: number,
  isCritical: boolean,
  config: GameConfig,
  skill: Skill,
  target: Combatant
): { finalDamage: number; elementalModifier: number; variance: number; appliedModifiers: Array<{ source: string; multiplier: number }> } {
  const appliedModifiers: Array<{ source: string; multiplier: number }> = [];
  let finalDamage = baseDamage;
  
  // クリティカル倍率を適用
  if (isCritical) {
    const critMultiplier = config.combat.criticalMultiplier;
    finalDamage *= critMultiplier;
    appliedModifiers.push({ source: 'Critical', multiplier: critMultiplier });
  }
  
  // 属性倍率を適用
  let elementalModifier = 1.0;
  if (skill.element && skill.element !== 'none' && (target.stats as any).elementalResistance) {
    elementalModifier = calculateElementalModifier(
      skill.element as DefaultElement,
      (target.stats as any).elementalResistance as DefaultElementResistance
    );
    finalDamage *= elementalModifier;
    appliedModifiers.push({ source: 'elemental', multiplier: elementalModifier });
  }
  
  // ダメージ分散を適用
  const variance = 1.0 + (Math.random() * 2 - 1) * config.combat.damageVariance;
  finalDamage *= variance;
  appliedModifiers.push({ source: 'Variance', multiplier: variance });
  
  // 最低ダメージを1に設定
  finalDamage = Math.max(1, Math.floor(finalDamage));
  
  return { finalDamage, elementalModifier, variance, appliedModifiers };
}

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
  // 命中判定とクリティカル判定
  const checks = performHitAndCriticalChecks(attacker, target, skill, config);
  
  if (!checks.isHit) {
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

  // 基礎ダメージを計算
  let baseDamage: number;
  if (config.customFormulas?.damageFormulas?.['physical']) {
    baseDamage = config.customFormulas.damageFormulas['physical'](attacker, target, skill, checks.isCritical, config);
  } else {
    baseDamage = defaultPhysicalDamageFormula(
      attacker as Combatant<DefaultStats, any, any>,
      target as Combatant<DefaultStats, any, any>,
      skill,
      checks.isCritical,
      config
    );
  }
  
  // 修飾子を適用
  const modifiers = applyDamageModifiers(baseDamage, checks.isCritical, config, skill, target);

  return {
    finalDamage: modifiers.finalDamage,
    baseDamage,
    isCritical: checks.isCritical,
    isHit: true,
    elementalModifier: modifiers.elementalModifier,
    variance: modifiers.variance,
    appliedModifiers: modifiers.appliedModifiers,
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
  // 命中判定とクリティカル判定
  const checks = performHitAndCriticalChecks(attacker, target, skill, config);
  
  if (!checks.isHit) {
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

  // 基礎ダメージを計算
  let baseDamage: number;
  if (config.customFormulas?.damageFormulas?.['magic']) {
    baseDamage = config.customFormulas.damageFormulas['magic'](attacker, target, skill, checks.isCritical, config);
  } else {
    baseDamage = defaultMagicDamageFormula(
      attacker as Combatant<DefaultStats, any, any>,
      target as Combatant<DefaultStats, any, any>,
      skill,
      checks.isCritical,
      config
    );
  }
  
  // 修飾子を適用
  const modifiers = applyDamageModifiers(baseDamage, checks.isCritical, config, skill, target);

  return {
    finalDamage: modifiers.finalDamage,
    baseDamage,
    isCritical: checks.isCritical,
    isHit: true,
    elementalModifier: modifiers.elementalModifier,
    variance: modifiers.variance,
    appliedModifiers: modifiers.appliedModifiers,
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

/**
 * 汎用ダメージ計算
 * - スキルタイプに基づいて適切なダメージ計算式を選択
 * - カスタム計算式が定義されている場合はそれを使用
 * - 未定義のスキルタイプにはデフォルト計算式を使用
 * 
 * @param attacker - 攻撃者
 * @param target - 対象
 * @param skill - 使用スキル
 * @param config - ゲーム設定
 * @returns ダメージ計算結果
 * 
 * @example
 * // デフォルトスキルタイプ（physical, magic）
 * const damage = calculateDamage(hero, enemy, physicalSkill, config);
 * 
 * @example
 * // カスタムスキルタイプ（laser, plasma等）
 * const damage = calculateDamage(robot, alien, laserSkill, sciFiConfig);
 */
export function calculateDamage(
  attacker: Combatant,
  target: Combatant,
  skill: Skill,
  config: GameConfig
): DamageResult {
  // 命中判定とクリティカル判定
  const checks = performHitAndCriticalChecks(attacker, target, skill, config);
  
  if (!checks.isHit) {
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

  // スキルタイプに基づいてダメージ計算式を選択
  let baseDamage: number;
  const skillType = skill.type as string;

  // 1. スキルタイプごとのカスタム計算式を確認
  if (config.customFormulas?.damageFormulas?.[skillType]) {
    baseDamage = config.customFormulas.damageFormulas[skillType]!(attacker, target, skill, checks.isCritical, config);
  }
  // 2. デフォルト計算式を使用
  else {
    if (skillType === 'physical') {
      baseDamage = defaultPhysicalDamageFormula(
        attacker as Combatant<DefaultStats, any, any>,
        target as Combatant<DefaultStats, any, any>,
        skill,
        checks.isCritical,
        config
      );
    } else if (skillType === 'magic') {
      baseDamage = defaultMagicDamageFormula(
        attacker as Combatant<DefaultStats, any, any>,
        target as Combatant<DefaultStats, any, any>,
        skill,
        checks.isCritical,
        config
      );
    } else {
      // 未定義のスキルタイプには汎用計算式を使用（攻撃力ベース）
      baseDamage = Math.max(1, (attacker.stats as any).attack * skill.power - (target.stats as any).defense);
    }
  }

  // 修飾子を適用
  const modifiers = applyDamageModifiers(baseDamage, checks.isCritical, config, skill, target);

  return {
    finalDamage: modifiers.finalDamage,
    baseDamage,
    isCritical: checks.isCritical,
    isHit: true,
    elementalModifier: modifiers.elementalModifier,
    variance: modifiers.variance,
    appliedModifiers: modifiers.appliedModifiers,
  };
}
