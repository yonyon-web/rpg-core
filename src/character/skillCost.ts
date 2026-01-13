/**
 * スキルコスト管理ユーティリティ
 * BattleServiceとCommandServiceで重複していたコスト検証・消費ロジックを共通化
 */

import type { Skill } from '../types/skill';
import type { Combatant } from '../types/combatant';

/**
 * スキルコストチェック結果
 */
export interface SkillCostCheckResult {
  canUse: boolean;
  message?: string;
}

/**
 * スキルコストをチェックする
 * @param actor - 行動者
 * @param skill - スキル
 * @returns チェック結果
 */
export function checkSkillCost(actor: Combatant, skill: Skill): SkillCostCheckResult {
  // cost形式をチェック
  if (skill.cost) {
    if (skill.cost.mp !== undefined && actor.currentMp < skill.cost.mp) {
      return { canUse: false, message: 'Not enough MP' };
    }
    if (skill.cost.hp !== undefined && actor.currentHp <= skill.cost.hp) {
      return { canUse: false, message: 'Not enough HP' };
    }
    // カスタムコストのチェック
    for (const [key, value] of Object.entries(skill.cost)) {
      if (key !== 'mp' && key !== 'hp' && value !== undefined && value !== null) {
        const actorResource = (actor as any)[`current${key.charAt(0).toUpperCase()}${key.slice(1)}`];
        if (actorResource !== undefined && actorResource < (value as number)) {
          return { canUse: false, message: `Not enough ${key}` };
        }
      }
    }
  }
  
  return { canUse: true };
}

/**
 * スキルコストを消費する
 * @param actor - 行動者
 * @param skill - スキル
 */
export function consumeSkillCost(actor: Combatant, skill: Skill): void {
  // cost形式を消費
  if (skill.cost) {
    if (skill.cost.mp !== undefined) {
      actor.currentMp -= skill.cost.mp;
    }
    if (skill.cost.hp !== undefined) {
      actor.currentHp -= skill.cost.hp;
    }
    // カスタムコストの消費
    for (const [key, value] of Object.entries(skill.cost)) {
      if (key !== 'mp' && key !== 'hp' && value !== undefined && value !== null) {
        const resourceKey = `current${key.charAt(0).toUpperCase()}${key.slice(1)}`;
        if ((actor as any)[resourceKey] !== undefined) {
          (actor as any)[resourceKey] -= (value as number);
        }
      }
    }
  }
}

/**
 * スキルが使用可能かフィルタリングする
 * @param actor - 行動者
 * @param skill - スキル
 * @returns 使用可能な場合true
 */
export function canUseSkill(actor: Combatant, skill: Skill): boolean {
  return checkSkillCost(actor, skill).canUse;
}
