/**
 * ゲーム型の一元管理
 * - すべてのカスタム型を1箇所で定義し、プロジェクト全体で再利用可能にする
 */

import { BaseStats, DefaultStats } from './stats';
import { 
  BaseStatusEffectType, 
  DefaultStatusEffectType,
  BaseStatusEffectCategory,
  DefaultStatusEffectCategory 
} from './statusEffect';
import { BaseElement, DefaultElement } from './common';
import { BaseSkillType, DefaultSkillType, BaseTargetType, DefaultTargetType } from './skill';
import { BaseExpCurveType, DefaultExpCurveType } from './config';
import type { Combatant as BaseCombatant } from './combatant';
import type { Skill as BaseSkill } from './skill';
import type { GameConfig as BaseGameConfig } from './config';

/**
 * ゲーム型設定インターフェース
 * - プロジェクト全体で使用する型を一元的に定義
 * - この設定を使用することで、各所で個別に型パラメータを指定する必要がなくなる
 * 
 * @template TStats - ステータスの型（例: HP、攻撃力など）
 * @template TStatusEffectType - 状態異常タイプ（例: 'poison', 'paralysis'など）
 * @template TStatusEffectCategory - 状態異常カテゴリ（例: 'debuff', 'buff'など）
 * @template TElement - 属性タイプ（例: 'fire', 'water'など）
 * @template TSkillType - スキルタイプ（例: 'physical', 'magic'など）
 * @template TTargetType - 対象タイプ（例: 'single-enemy', 'all-enemies'など）
 * @template TExpCurveType - 経験値曲線タイプ（例: 'linear', 'exponential'など）
 * 
 * @example
 * // デフォルトのJRPG設定
 * interface MyGameTypes extends GameTypeConfig {}
 * 
 * @example
 * // SF戦略ゲーム設定
 * interface SciFiGameTypes extends GameTypeConfig<
 *   MechStats,
 *   SciFiEffectType,
 *   SciFiEffectCategory,
 *   SciFiElement,
 *   TacticsSkillType,
 *   TacticsTargetType,
 *   MechExpCurve
 * > {}
 */
export interface GameTypeConfig<
  TStats extends BaseStats = DefaultStats,
  TStatusEffectType extends BaseStatusEffectType = DefaultStatusEffectType,
  TStatusEffectCategory extends BaseStatusEffectCategory = DefaultStatusEffectCategory,
  TElement extends BaseElement = DefaultElement,
  TSkillType extends BaseSkillType = DefaultSkillType,
  TTargetType extends BaseTargetType = DefaultTargetType,
  TExpCurveType extends BaseExpCurveType = DefaultExpCurveType
> {
  Stats: TStats;
  StatusEffectType: TStatusEffectType;
  StatusEffectCategory: TStatusEffectCategory;
  Element: TElement;
  SkillType: TSkillType;
  TargetType: TTargetType;
  ExpCurveType: TExpCurveType;
}

/**
 * デフォルトのゲーム型設定
 * - 標準的なJRPG向けの型設定
 */
export interface DefaultGameTypes extends GameTypeConfig {}

/**
 * 型付きCombatant
 * - GameTypeConfigから自動的に型パラメータを取得
 * 
 * @template TGameTypes - ゲーム型設定
 */
export type TypedCombatant<TGameTypes extends GameTypeConfig> = BaseCombatant<
  TGameTypes['Stats'],
  TGameTypes['StatusEffectType'],
  TGameTypes['StatusEffectCategory']
>;

/**
 * 型付きSkill
 * - GameTypeConfigから自動的に型パラメータを取得
 * 
 * @template TGameTypes - ゲーム型設定
 */
export type TypedSkill<TGameTypes extends GameTypeConfig> = BaseSkill<
  TGameTypes['Element'],
  TGameTypes['SkillType'],
  TGameTypes['TargetType'],
  TGameTypes['StatusEffectType']
>;

/**
 * 型付きGameConfig
 * - GameTypeConfigから自動的に型パラメータを取得
 * 
 * @template TGameTypes - ゲーム型設定
 */
export type TypedGameConfig<TGameTypes extends GameTypeConfig> = BaseGameConfig<
  TGameTypes['ExpCurveType']
>;

/**
 * 型ヘルパー
 * - GameTypeConfigから各種型付き定義を簡単に取得
 * 
 * @example
 * // デフォルト型を使用
 * type MyCombatant = GameTypes.Combatant;
 * type MySkill = GameTypes.Skill;
 * type MyConfig = GameTypes.GameConfig;
 * 
 * @example
 * // カスタム型設定を使用
 * interface MyGameTypes extends GameTypeConfig<MyStats, MyEffect, ...> {}
 * type MyCombatant = GameTypes<MyGameTypes>.Combatant;
 * type MySkill = GameTypes<MyGameTypes>.Skill;
 */
export type GameTypes<TGameTypes extends GameTypeConfig = DefaultGameTypes> = {
  Combatant: TypedCombatant<TGameTypes>;
  Skill: TypedSkill<TGameTypes>;
  GameConfig: TypedGameConfig<TGameTypes>;
};
