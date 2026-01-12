/**
 * 戦闘者関連の型定義
 */

import { UniqueId } from './common';
import { BaseStats, DefaultStats } from './stats';
import { 
  StatusEffect, 
  BaseStatusEffectType, 
  DefaultStatusEffectType,
  BaseStatusEffectCategory,
  DefaultStatusEffectCategory 
} from './statusEffect';

/**
 * 戦闘者基本インターフェース
 * - キャラクターと敵の共通属性
 * - ジェネリック型TStatsでカスタムステータスをサポート
 * - ジェネリック型TEffectType, TEffectCategoryでカスタム状態異常をサポート
 * 
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 * @template TEffectType - 状態異常タイプ（デフォルト: DefaultStatusEffectType）
 * @template TEffectCategory - 状態異常カテゴリ（デフォルト: DefaultStatusEffectCategory）
 * 
 * @example
 * // デフォルトのステータスと状態異常を使用
 * const combatant: Combatant = { ... };
 * 
 * @example
 * // カスタムステータスを使用
 * interface MyStats extends BaseStats {
 *   strength: number;
 *   intelligence: number;
 * }
 * const combatant: Combatant<MyStats> = { ... };
 * 
 * @example
 * // カスタム状態異常を使用
 * type MyEffectType = 'freeze' | 'shock';
 * type MyEffectCategory = 'elemental' | 'physical';
 * const combatant: Combatant<DefaultStats, MyEffectType, MyEffectCategory> = { ... };
 */
export interface Combatant<
  TStats extends BaseStats = DefaultStats,
  TEffectType extends BaseStatusEffectType = DefaultStatusEffectType,
  TEffectCategory extends BaseStatusEffectCategory = DefaultStatusEffectCategory
> {
  id: UniqueId;              // ユニークID
  name: string;              // 名前
  level: number;             // レベル
  stats: TStats;             // ステータス
  currentHp: number;         // 現在のHP
  currentMp: number;         // 現在のMP
  currentExp?: number;       // 現在の経験値（オプショナル）
  statusEffects: StatusEffect<TEffectType, TEffectCategory>[]; // 現在の状態異常
  position: number;          // 隊列位置（0=前列、1=後列）
}
