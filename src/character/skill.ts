/**
 * character/skill - スキル管理モジュール
 * スキル習得条件の検証に関する純粋な計算関数
 */

import type { Character } from '../types/battle';
import type { Skill } from '../types/skill';
import type { UniqueId } from '../types/common';

/**
 * スキル習得要件
 */
export interface SkillLearnRequirements {
  levelRequirement?: number;         // 必要レベル
  jobLevelRequirement?: number;      // 必要ジョブレベル
  requiredJob?: string;              // 必要なジョブ
  prerequisiteSkills?: UniqueId[];   // 前提スキル
  requiredStats?: {                  // 必要なステータス
    [key: string]: number;
  };
}

/**
 * スキルが習得可能かチェック
 * 
 * @param character - キャラクター
 * @param skill - スキル
 * @param requirements - 習得要件
 * @returns 習得可能な場合true
 */
export function canLearnSkill(
  character: Character,
  skill: Skill,
  requirements?: SkillLearnRequirements
): boolean {
  return validateSkillLearnConditions(character, skill, requirements).canLearn;
}

/**
 * スキル習得要件の取得
 * 
 * @param skill - スキル
 * @param requirements - 習得要件
 * @returns 習得要件
 */
export function getSkillLearnRequirements(
  skill: Skill,
  requirements?: SkillLearnRequirements
): SkillLearnRequirements {
  return requirements || {};
}

/**
 * スキル習得条件を検証し、失敗理由を返す
 * 
 * @param character - キャラクター
 * @param skill - スキル
 * @param requirements - 習得要件
 * @returns { canLearn: boolean, reason?: string }
 */
export function validateSkillLearnConditions(
  character: Character,
  skill: Skill,
  requirements?: SkillLearnRequirements
): { canLearn: boolean; reason?: string } {
  // すでに習得済み
  if (hasSkill(character, skill.id)) {
    return { canLearn: false, reason: 'Skill already learned' };
  }

  // レベル要件チェック
  if (requirements?.levelRequirement && character.level < requirements.levelRequirement) {
    return { 
      canLearn: false, 
      reason: `Requires level ${requirements.levelRequirement} (current: ${character.level})` 
    };
  }

  // ジョブレベル要件チェック
  if (requirements?.jobLevelRequirement) {
    const jobLevel = (character as any).jobLevel || 0;
    if (jobLevel < requirements.jobLevelRequirement) {
      return { 
        canLearn: false, 
        reason: `Requires job level ${requirements.jobLevelRequirement} (current: ${jobLevel})` 
      };
    }
  }

  // ジョブ要件チェック
  if (requirements?.requiredJob && character.job !== requirements.requiredJob) {
    return { 
      canLearn: false, 
      reason: `Requires job: ${requirements.requiredJob} (current: ${character.job})` 
    };
  }

  // 前提スキルチェック
  if (requirements?.prerequisiteSkills && requirements.prerequisiteSkills.length > 0) {
    for (const prereqId of requirements.prerequisiteSkills) {
      if (!hasSkill(character, prereqId)) {
        return { 
          canLearn: false, 
          reason: `Requires prerequisite skill: ${prereqId}` 
        };
      }
    }
  }

  // ステータス要件チェック
  if (requirements?.requiredStats) {
    for (const [statKey, requiredValue] of Object.entries(requirements.requiredStats)) {
      const characterStat = (character.stats as any)[statKey];
      if (characterStat === undefined || characterStat < requiredValue) {
        return { 
          canLearn: false, 
          reason: `Requires ${statKey}: ${requiredValue} (current: ${characterStat ?? 0})` 
        };
      }
    }
  }

  return { canLearn: true };
}

/**
 * キャラクターがスキルを習得しているかチェック
 * 
 * @param character - キャラクター
 * @param skillId - スキルID
 * @returns 習得している場合true
 */
export function hasSkill(character: Character, skillId: UniqueId): boolean {
  // learnedSkillsがある場合はそちらもチェック
  if (character.learnedSkills) {
    if (character.learnedSkills.some(ls => ls.skill.id === skillId)) {
      return true;
    }
  }
  return character.skills.some(s => s.id === skillId);
}

/**
 * 習得済みスキルを取得
 * 
 * @param character - キャラクター
 * @param skillId - スキルID
 * @returns 習得済みスキル（見つからない場合はnull）
 */
export function getLearnedSkill(
  character: Character,
  skillId: UniqueId
): import('../types/skill').LearnedSkill | null {
  if (!character.learnedSkills) {
    return null;
  }
  return character.learnedSkills.find(ls => ls.skill.id === skillId) || null;
}

/**
 * スキルの現在のレベルを取得
 * 
 * @param character - キャラクター
 * @param skillId - スキルID
 * @returns スキルレベル（習得していない場合は0）
 */
export function getSkillLevel(character: Character, skillId: UniqueId): number {
  const learned = getLearnedSkill(character, skillId);
  return learned ? learned.level : 0;
}

/**
 * スキルをレベルアップ可能かチェック
 * 
 * @param character - キャラクター
 * @param skillId - スキルID
 * @returns レベルアップ可能な場合true
 */
export function canLevelUpSkill(
  character: Character,
  skillId: UniqueId
): boolean {
  const learned = getLearnedSkill(character, skillId);
  if (!learned) {
    return false;
  }
  
  const maxLevel = learned.skill.maxLevel || 1;
  return learned.level < maxLevel;
}

/**
 * スキルをレベルアップ
 * 
 * @param character - キャラクター
 * @param skillId - スキルID
 * @returns レベルアップに成功した場合true
 */
export function levelUpSkill(
  character: Character,
  skillId: UniqueId
): boolean {
  if (!canLevelUpSkill(character, skillId)) {
    return false;
  }
  
  const learned = getLearnedSkill(character, skillId);
  if (learned) {
    learned.level++;
    if (learned.experience !== undefined) {
      learned.experience = 0; // 経験値リセット（オプション）
    }
    return true;
  }
  
  return false;
}
