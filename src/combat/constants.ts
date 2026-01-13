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
