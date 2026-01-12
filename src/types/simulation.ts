/**
 * シミュレーション関連の型定義
 */

import type { Combatant } from './combatant';

/**
 * シミュレーション設定
 */
export interface SimulationConfig {
  /** シミュレーション回数 */
  iterations: number;
  /** パーティ1 */
  party1: Combatant[];
  /** パーティ2 */
  party2: Combatant[];
}

/**
 * シミュレーション結果
 */
export interface SimulationResult {
  /** 総戦闘回数 */
  totalBattles: number;
  /** パーティ1の勝利数 */
  party1Wins: number;
  /** パーティ2の勝利数 */
  party2Wins: number;
  /** 引き分け数 */
  draws: number;
  /** 平均ターン数 */
  averageTurns: number;
  /** 平均ダメージ */
  averageDamage: {
    party1: number;
    party2: number;
  };
  /** ターン数の分布 */
  turnDistribution: Map<number, number>;
  /** ターン別勝利数 */
  winsByTurn: Map<number, { party1: number; party2: number }>;
}

/**
 * 単一戦闘の結果
 */
export interface BattleSimulationResult {
  /** 勝者 ('party1' | 'party2' | 'draw') */
  winner: 'party1' | 'party2' | 'draw';
  /** ターン数 */
  turns: number;
  /** 与えたダメージ */
  damageDealt: {
    party1: number;
    party2: number;
  };
}
