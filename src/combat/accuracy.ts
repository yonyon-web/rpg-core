/**
 * 命中率とクリティカル判定モジュール
 */

import { Combatant, Skill, GameConfig, DefaultStats } from '../types';

/**
 * デフォルトの命中率計算式
 * @param attacker - 攻撃者
 * @param target - 対象
 * @param skill - 使用スキル
 * @returns 命中率（0.0〜1.0）
 */
function defaultHitRateFormula(
  attacker: Combatant<DefaultStats, any, any>,
  target: Combatant<DefaultStats, any, any>,
  skill: Skill
): number {
  // 必中スキルは常に命中
  if (skill.isGuaranteedHit) {
    return 1.0;
  }

  // スキルの基本命中率
  let hitRate = skill.accuracy;

  // 攻撃者の命中ステータスを加算（パーセンテージに変換）
  hitRate += attacker.stats.accuracy / 100;

  // 対象の回避ステータスを減算（パーセンテージに変換）
  hitRate -= target.stats.evasion / 100;

  // 最低5%の命中率を保証
  hitRate = Math.max(0.05, hitRate);

  // 100%を上限とする
  hitRate = Math.min(1.0, hitRate);

  return hitRate;
}

/**
 * 命中率を計算
 * - GameConfigでカスタム計算式が指定されている場合はそれを使用
 * - 指定されていない場合はデフォルトの計算式を使用
 * 
 * @param attacker - 攻撃者
 * @param target - 対象
 * @param skill - 使用スキル
 * @param config - ゲーム設定（オプション、カスタム計算式を使用する場合に指定）
 * @returns 命中率（0.0〜1.0）
 */
export function calculateHitRate(
  attacker: Combatant,
  target: Combatant,
  skill: Skill,
  config?: GameConfig
): number {
  // カスタム計算式が指定されている場合はそれを使用
  if (config?.customFormulas?.hitRate) {
    return config.customFormulas.hitRate(attacker, target, skill);
  }

  // デフォルトの計算式を使用
  return defaultHitRateFormula(
    attacker as Combatant<DefaultStats, any, any>,
    target as Combatant<DefaultStats, any, any>,
    skill
  );
}

/**
 * 攻撃が命中するか判定
 * @param hitRate - 命中率（0.0〜1.0）
 * @returns 命中した場合true、外れた場合false
 */
export function checkHit(hitRate: number): boolean {
  return Math.random() < hitRate;
}

/**
 * デフォルトのクリティカル率計算式
 * @param attacker - 攻撃者
 * @param skill - 使用スキル
 * @param config - ゲーム設定
 * @returns クリティカル率（0.0〜1.0）
 */
function defaultCriticalRateFormula(
  attacker: Combatant<DefaultStats, any, any>,
  skill: Skill,
  config: GameConfig
): number {
  // 設定の基本クリティカル率から開始
  let critRate = config.combat.baseCriticalRate;

  // 運によるクリティカル率を加算（運1 = 0.1%クリティカル）
  critRate += attacker.stats.luck * 0.001;

  // 戦闘者のクリティカル率ステータスを加算
  critRate += attacker.stats.criticalRate;

  // スキルのクリティカルボーナスを加算
  critRate += skill.criticalBonus;

  // 100%を上限とする
  critRate = Math.min(1.0, critRate);

  return critRate;
}

/**
 * クリティカル率を計算
 * - GameConfigでカスタム計算式が指定されている場合はそれを使用
 * - 指定されていない場合はデフォルトの計算式を使用
 * 
 * @param attacker - 攻撃者
 * @param skill - 使用スキル
 * @param config - ゲーム設定
 * @returns クリティカル率（0.0〜1.0）
 */
export function calculateCriticalRate(
  attacker: Combatant,
  skill: Skill,
  config: GameConfig
): number {
  // カスタム計算式が指定されている場合はそれを使用
  if (config.customFormulas?.criticalRate) {
    return config.customFormulas.criticalRate(attacker, skill, config);
  }

  // デフォルトの計算式を使用
  return defaultCriticalRateFormula(
    attacker as Combatant<DefaultStats, any, any>,
    skill,
    config
  );
}

/**
 * 攻撃がクリティカルになるか判定
 * @param criticalRate - クリティカル率（0.0〜1.0）
 * @returns クリティカルの場合true、それ以外false
 */
export function checkCritical(criticalRate: number): boolean {
  return Math.random() < criticalRate;
}
