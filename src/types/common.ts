/**
 * GEasy-Kitの共通型定義
 */

/**
 * ユニークID型
 * - すべてのエンティティの識別に使用
 */
export type UniqueId = string;

/**
 * タイムスタンプ型
 * - ミリ秒単位のUNIXタイムスタンプ
 */
export type Timestamp = number;

/**
 * 確率型
 * - 0.0（0%）から1.0（100%）の範囲
 */
export type Probability = number;

/**
 * パーセンテージ型
 * - 0から100の範囲
 */
export type Percentage = number;

/**
 * 属性タイプの基底型
 * - ゲームごとに独自の属性システムを定義可能
 * - string型を基底として、任意の属性名を使用できる
 * 
 * @example
 * // ファンタジーRPG向け
 * type FantasyElement = 'fire' | 'water' | 'earth' | 'wind';
 * 
 * @example
 * // SF向け
 * type SciFiElement = 'plasma' | 'laser' | 'emp' | 'radiation';
 */
export type BaseElement = string;

/**
 * デフォルト属性タイプ
 * - 標準的なJRPG向けの属性システム
 * - ゲーム内の各種属性を表現
 */
export type DefaultElement = 
  | 'none'      // 無属性
  | 'fire'      // 炎
  | 'water'     // 水
  | 'earth'     // 土
  | 'wind'      // 風
  | 'lightning' // 雷
  | 'ice'       // 氷
  | 'light'     // 光
  | 'dark';     // 闇



/**
 * 属性耐性マップの基底型
 * - ゲームごとに独自の属性耐性システムを定義可能
 * - 各属性に対する耐性値（0.0〜2.0）
 * - 1.0 = 通常、0.5 = 半減、2.0 = 2倍ダメージ、0 = 無効
 */
export type BaseElementResistance = Record<string, number>;

/**
 * デフォルト属性耐性マップ
 * - 標準的なJRPG向けの属性耐性
 * - 各属性に対する耐性値（0.0〜2.0）
 * - 1.0 = 通常、0.5 = 半減、2.0 = 2倍ダメージ、0 = 無効
 */
export interface DefaultElementResistance {
  fire: number;
  water: number;
  earth: number;
  wind: number;
  lightning: number;
  ice: number;
  light: number;
  dark: number;
}


