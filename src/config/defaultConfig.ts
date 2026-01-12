/**
 * デフォルトゲーム設定
 */

import { GameConfig, DefaultStats } from '../types';

/**
 * デフォルトゲーム設定
 * - 標準的なJRPGパラメータ
 */
export const defaultGameConfig: GameConfig<'exponential', DefaultStats> = {
  combat: {
    baseCriticalRate: 0.05,           // 基本クリティカル率5%
    criticalMultiplier: 2.0,          // クリティカル時2倍ダメージ
    damageVariance: 0.1,              // ダメージ分散±10%
    escapeBaseRate: 0.5,              // 基本逃走成功率50%
    escapeRateIncrement: 0.1,         // 逃走試行毎に+10%
    preemptiveStrikeThreshold: 50,    // 先制攻撃の速度差閾値
    speedVariance: 0.1,               // 行動順の速度分散±10%
  },
  growth: {
    expCurve: 'exponential',
    baseExpRequired: 100,             // レベル2までの基本経験値100
    expGrowthRate: 1.2,               // 成長率1.2倍
    statGrowthRates: {
      maxHp: 10,                      // レベル毎に+10 HP
      maxMp: 5,                       // レベル毎に+5 MP
      attack: 3,                      // レベル毎に+3 攻撃力
      defense: 2,                     // レベル毎に+2 防御力
      magic: 3,                       // レベル毎に+3 魔力
      magicDefense: 2,                // レベル毎に+2 魔法防御
      speed: 2,                       // レベル毎に+2 素早さ
      luck: 1,                        // レベル毎に+1 運
      accuracy: 1,                    // レベル毎に+1 命中補正
      evasion: 1,                     // レベル毎に+1 回避補正
      criticalRate: 0.01,             // レベル毎に+1% クリティカル率
    },
    maxLevel: 99,                     // 最大レベル99
  },
  balance: {
    maxPartySize: 4,                  // 最大パーティ人数4人
    dropRateModifier: 1.0,            // ドロップ率100%
  },
};
