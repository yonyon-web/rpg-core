/**
 * Game configuration type definitions
 */

import { Probability } from './common';

/**
 * Combat configuration
 */
export interface CombatConfig {
  baseCriticalRate: Probability;    // Base critical rate (0.05 = 5%)
  criticalMultiplier: number;       // Critical multiplier (2.0 = 2x)
  damageVariance: number;           // Damage variance (0.1 = ±10%)
  escapeBaseRate: Probability;      // Base escape rate (0.5 = 50%)
  escapeRateIncrement: number;      // Escape rate increment per attempt (0.1 = +10%)
  preemptiveStrikeThreshold: number; // Speed difference threshold for preemptive strike
  speedVariance: number;            // Turn order random variance
}

/**
 * Experience curve type
 */
export type ExpCurveType = 
  | 'linear'        // Linear (level × base)
  | 'exponential'   // Exponential (base × level ^ growth rate)
  | 'custom';       // Custom

/**
 * Stat growth rates
 */
export interface StatGrowthRates {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  magic: number;
  magicDefense: number;
  speed: number;
  luck: number;
}

/**
 * Growth configuration
 */
export interface GrowthConfig {
  expCurve: ExpCurveType;           // Experience curve type
  baseExpRequired: number;          // Base experience required (100)
  expGrowthRate: number;            // Experience growth rate (1.2)
  statGrowthRates: StatGrowthRates; // Stat growth rates
  maxLevel: number;                 // Maximum level (99)
}

/**
 * Balance configuration
 */
export interface BalanceConfig {
  maxPartySize: number;             // Maximum party size
  dropRateModifier: number;         // Drop rate modifier (1.0 = 100%)
}

/**
 * Game configuration
 * - Overall game parameters and settings
 */
export interface GameConfig {
  combat: CombatConfig;     // Combat parameters
  growth: GrowthConfig;     // Growth parameters
  balance: BalanceConfig;   // Balance adjustments
}
