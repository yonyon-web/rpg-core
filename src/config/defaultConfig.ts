/**
 * Default game configuration
 */

import { GameConfig } from '../types';

/**
 * Default game configuration
 * - Standard JRPG parameters
 */
export const defaultGameConfig: GameConfig = {
  combat: {
    baseCriticalRate: 0.05,           // 5% base critical rate
    criticalMultiplier: 2.0,          // 2x damage on critical
    damageVariance: 0.1,              // ±10% damage variance
    escapeBaseRate: 0.5,              // 50% base escape rate
    escapeRateIncrement: 0.1,         // +10% per escape attempt
    preemptiveStrikeThreshold: 50,    // Speed difference for preemptive strike
    speedVariance: 0.1,               // ±10% speed variance for turn order
  },
  growth: {
    expCurve: 'exponential',
    baseExpRequired: 100,             // Base 100 exp for level 2
    expGrowthRate: 1.2,               // 1.2x growth rate
    statGrowthRates: {
      maxHp: 10,                      // +10 HP per level
      maxMp: 5,                       // +5 MP per level
      attack: 3,                      // +3 Attack per level
      defense: 2,                     // +2 Defense per level
      magic: 3,                       // +3 Magic per level
      magicDefense: 2,                // +2 Magic Defense per level
      speed: 2,                       // +2 Speed per level
      luck: 1,                        // +1 Luck per level
    },
    maxLevel: 99,                     // Maximum level 99
  },
  balance: {
    maxPartySize: 4,                  // Maximum 4 party members
    dropRateModifier: 1.0,            // 100% drop rate
  },
};
