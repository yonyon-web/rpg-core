/**
 * ステータス関連の型定義
 */

/**
 * ステータスの基本型
 * - すべてのステータスはnumber型の値を持つ
 * - ゲームごとにカスタマイズ可能
 */
export type BaseStats = Record<string, number>;

/**
 * デフォルトステータス構造体
 * - 標準的なJRPGで使用されるステータス
 * - ライブラリの内部計算で使用
 * - ゲーム開発者は独自のステータス型を定義可能
 */
export interface DefaultStats extends BaseStats {
  maxHp: number;            // 最大HP
  maxMp: number;            // 最大MP
  attack: number;           // 攻撃力
  defense: number;          // 防御力
  magic: number;            // 魔力
  magicDefense: number;     // 魔法防御
  speed: number;            // 素早さ
  luck: number;             // 運
  accuracy: number;         // 命中率補正
  evasion: number;          // 回避率補正
  criticalRate: number;     // クリティカル率補正
}

/**
 * 後方互換性のためのエイリアス
 * @deprecated DefaultStatsを使用してください。将来のバージョンで削除される可能性があります。
 */
export type Stats = DefaultStats;
