/**
 * ダメージと戦闘結果の型定義
 */

/**
 * ダメージ修飾子情報
 */
export interface DamageModifier {
  source: string;   // 修飾子の出所（例：「クリティカル」「属性」）
  multiplier: number; // 修飾子倍率
}

/**
 * ダメージ計算結果
 * - ダメージ計算の詳細情報を含む
 */
export interface DamageResult {
  finalDamage: number;          // 最終ダメージ
  baseDamage: number;           // 基礎ダメージ
  isCritical: boolean;          // クリティカルヒットフラグ
  isHit: boolean;               // 命中フラグ
  elementalModifier: number;    // 属性倍率
  variance: number;             // ダメージ分散値
  appliedModifiers: DamageModifier[]; // 適用された修飾子
}

/**
 * 回復結果
 */
export interface HealResult {
  healAmount: number;       // 回復量
  overheal: number;         // オーバーヒール量
  isCritical: boolean;      // クリティカル回復フラグ
}
