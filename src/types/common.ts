/**
 * rpg-coreの共通型定義
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
 * 属性タイプ
 * - ゲーム内の各種属性を表現
 */
export type Element = 
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
 * 属性耐性マップ
 * - 各属性に対する耐性値（0.0〜2.0）
 * - 1.0 = 通常、0.5 = 半減、2.0 = 2倍ダメージ、0 = 無効
 */
export interface ElementResistance {
  fire: number;
  water: number;
  earth: number;
  wind: number;
  lightning: number;
  ice: number;
  light: number;
  dark: number;
}
