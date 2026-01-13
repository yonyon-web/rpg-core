/**
 * 戦闘関連の定数
 */

import type { Skill } from '../types/skill';

/**
 * 基本攻撃スキル
 * - 通常攻撃時に使用されるデフォルトスキル設定
 */
export const BASIC_ATTACK_SKILL: Skill = {
  id: 'basic-attack',
  name: 'Attack',
  description: 'Basic physical attack',
  type: 'physical',
  targetType: 'single-enemy',
  power: 1.0,
  accuracy: 0.95,
  criticalBonus: 0,
  isGuaranteedHit: false,
  element: 'none',
  cost: {}
};

/**
 * 防御関連の定数
 */
export const DEFEND_POWER_MULTIPLIER = 2.0;
export const DEFEND_DURATION = 1;
export const DEFEND_MAX_STACK = 1;

/**
 * 逃走関連の定数
 */
export const MAX_ESCAPE_RATE = 0.95;
export const MIN_ESCAPE_RATE = 0.05;
export const BASE_ESCAPE_RATE = 0.5;
export const ESCAPE_SPEED_FACTOR = 100;

/**
 * ダメージ・回復関連の定数
 */
export const HEAL_VARIANCE = 0.05;
export const MIN_DAMAGE = 1;

/**
 * シミュレーション関連の定数
 */
export const MAX_SIMULATION_TURNS = 100;
