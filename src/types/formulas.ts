/**
 * カスタマイズ可能な計算式の型定義
 */

import type { Combatant, Skill, GameConfig } from './index';
import type { BaseStats } from './stats';

/**
 * 命中率計算式の型
 * - ゲームごとに独自の命中率計算ロジックを定義可能
 * 
 * @template TStats - カスタムステータス型
 * @param attacker - 攻撃者
 * @param target - 対象
 * @param skill - 使用スキル
 * @returns 命中率（0.0〜1.0）
 * 
 * @example
 * // デフォルトの計算式
 * const defaultHitRateFormula: HitRateFormula = (attacker, target, skill) => {
 *   let hitRate = skill.accuracy;
 *   hitRate += attacker.stats.accuracy / 100;
 *   hitRate -= target.stats.evasion / 100;
 *   return Math.max(0.05, Math.min(1.0, hitRate));
 * };
 * 
 * @example
 * // カスタム計算式（レベル差を考慮）
 * const customHitRateFormula: HitRateFormula = (attacker, target, skill) => {
 *   const levelDiff = attacker.level - target.level;
 *   const levelBonus = levelDiff * 0.02; // レベル差1で+2%
 *   let hitRate = skill.accuracy + levelBonus;
 *   return Math.max(0.1, Math.min(0.95, hitRate));
 * };
 */
export type HitRateFormula<
  TStats extends BaseStats = BaseStats
> = (
  attacker: Combatant<TStats, any, any>,
  target: Combatant<TStats, any, any>,
  skill: Skill<any, any, any, any>
) => number;

/**
 * クリティカル率計算式の型
 * - ゲームごとに独自のクリティカル率計算ロジックを定義可能
 * 
 * @template TStats - カスタムステータス型
 * @param attacker - 攻撃者
 * @param skill - 使用スキル
 * @param config - ゲーム設定
 * @returns クリティカル率（0.0〜1.0）
 * 
 * @example
 * // デフォルトの計算式
 * const defaultCritRateFormula: CriticalRateFormula = (attacker, skill, config) => {
 *   let critRate = config.combat.baseCriticalRate;
 *   critRate += attacker.stats.luck * 0.001;
 *   critRate += attacker.stats.criticalRate;
 *   critRate += skill.criticalBonus;
 *   return Math.min(1.0, critRate);
 * };
 * 
 * @example
 * // カスタム計算式（器用さベース）
 * const customCritRateFormula: CriticalRateFormula<MyStats> = (attacker, skill, config) => {
 *   const dexBonus = attacker.stats.dexterity * 0.002; // 器用さ50で+10%
 *   return Math.min(0.5, skill.criticalBonus + dexBonus);
 * };
 */
export type CriticalRateFormula<
  TStats extends BaseStats = BaseStats
> = (
  attacker: Combatant<TStats, any, any>,
  skill: Skill<any, any, any, any>,
  config: GameConfig<any>
) => number;

/**
 * ダメージ計算式の型
 * - ゲームごとに独自のダメージ計算ロジックを定義可能
 * 
 * @template TStats - カスタムステータス型
 * @param attacker - 攻撃者
 * @param target - 対象
 * @param skill - 使用スキル
 * @param isCritical - クリティカルヒットかどうか
 * @param config - ゲーム設定
 * @returns 基礎ダメージ値
 * 
 * @example
 * // デフォルトの物理ダメージ計算式
 * const defaultPhysicalDamageFormula: DamageFormula = (attacker, target, skill, isCritical, config) => {
 *   const baseDamage = attacker.stats.attack * skill.power - target.stats.defense;
 *   return Math.max(1, baseDamage);
 * };
 * 
 * @example
 * // カスタムダメージ計算式（防御力を割合で減算）
 * const customDamageFormula: DamageFormula<MyStats> = (attacker, target, skill, isCritical, config) => {
 *   const rawDamage = attacker.stats.strength * skill.power;
 *   const defenseReduction = 1 - (target.stats.armor / (target.stats.armor + 100));
 *   const finalDamage = rawDamage * defenseReduction;
 *   return Math.max(1, Math.floor(finalDamage));
 * };
 */
export type DamageFormula<
  TStats extends BaseStats = BaseStats
> = (
  attacker: Combatant<TStats, any, any>,
  target: Combatant<TStats, any, any>,
  skill: Skill<any, any, any, any>,
  isCritical: boolean,
  config: GameConfig<any>
) => number;

/**
 * 回復量計算式の型
 * - ゲームごとに独自の回復量計算ロジックを定義可能
 * 
 * @template TStats - カスタムステータス型
 * @param caster - 術者
 * @param target - 対象
 * @param skill - 使用スキル
 * @param config - ゲーム設定
 * @returns 回復量
 * 
 * @example
 * // デフォルトの回復量計算式
 * const defaultHealFormula: HealFormula = (caster, target, skill, config) => {
 *   return caster.stats.magic * skill.power;
 * };
 * 
 * @example
 * // カスタム回復量計算式（対象の最大HPに応じて調整）
 * const customHealFormula: HealFormula<MyStats> = (caster, target, skill, config) => {
 *   const baseHeal = caster.stats.wisdom * skill.power;
 *   const targetMaxHpBonus = target.stats.maxHp * 0.01; // 最大HPの1%
 *   return baseHeal + targetMaxHpBonus;
 * };
 */
export type HealFormula<
  TStats extends BaseStats = BaseStats
> = (
  caster: Combatant<TStats, any, any>,
  target: Combatant<TStats, any, any>,
  skill: Skill<any, any, any, any>,
  config: GameConfig<any>
) => number;

/**
 * カスタム計算式のコレクション
 * - ゲーム全体で使用する計算式をまとめて定義
 * 
 * @template TStats - カスタムステータス型
 * 
 * @example
 * // カスタム計算式を定義
 * const myFormulas: CustomFormulas<MyStats> = {
 *   hitRate: (attacker, target, skill) => { ... },
 *   criticalRate: (attacker, skill, config) => { ... },
 *   physicalDamage: (attacker, target, skill, isCritical, config) => { ... },
 *   magicDamage: (attacker, target, skill, isCritical, config) => { ... },
 *   heal: (caster, target, skill, config) => { ... },
 * };
 */
export interface CustomFormulas<
  TStats extends BaseStats = BaseStats
> {
  hitRate?: HitRateFormula<TStats>;
  criticalRate?: CriticalRateFormula<TStats>;
  physicalDamage?: DamageFormula<TStats>;
  magicDamage?: DamageFormula<TStats>;
  heal?: HealFormula<TStats>;
}
