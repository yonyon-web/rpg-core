/**
 * character/skill - スキル管理モジュール
 * スキル習得条件の検証に関する純粋な計算関数
 */

import type { Character } from '../types/battle';
import type { Skill, LearnedSkill, SkillCost, StatusEffectApplication, SkillLevelUpCost } from '../types/skill';
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
  return character.learnedSkills.some(ls => ls.skill.id === skillId);
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
): LearnedSkill | null {
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

/**
 * スキルレベルアップに必要なコストを取得
 * - levelDataに定義されたlevelUpCostを返す
 * - 定義されていない場合はnullを返す
 * 
 * @param skill - スキル
 * @param targetLevel - レベルアップ先のレベル
 * @returns レベルアップコスト（定義されていない場合はnull）
 * 
 * @example
 * const cost = getLevelUpCost(fireballSkill, 3);
 * if (cost && cost.resourceId && cost.amount) {
 *   console.log(`Level 3にするには${cost.resourceId}が${cost.amount}必要`);
 * }
 */
export function getLevelUpCost(
  skill: Skill,
  targetLevel: number
): SkillLevelUpCost | null {
  if (!skill.levelData || skill.levelData.length === 0) {
    return null;
  }
  
  // targetLevelに対応するlevelDataを探す
  const levelData = skill.levelData.find(ld => ld.level === targetLevel);
  
  if (!levelData || !levelData.levelUpCost) {
    return null;
  }
  
  return levelData.levelUpCost;
}

/**
 * スキルの現在レベルでの効果を取得
 * - levelDataが定義されている場合、現在レベルに応じた値を返す
 * - levelDataが定義されていない場合、ベーススキルの値を返す
 * 
 * @param skill - スキル
 * @param level - 現在のレベル
 * @returns レベルに応じたスキルデータ
 * 
 * @example
 * const effectiveSkill = getSkillDataAtLevel(fireball, 3);
 * console.log(effectiveSkill.power);  // レベル3の威力
 * console.log(effectiveSkill.description);  // レベル3の説明
 */
export function getSkillDataAtLevel(
  skill: Skill,
  level: number
): {
  name: string;
  power: number;
  cost?: SkillCost;
  accuracy: number;
  criticalBonus: number;
  statusEffects?: StatusEffectApplication[];
  description: string;
} {
  // レベル1または levelData がない場合はベーススキルの値を返す
  if (level === 1 || !skill.levelData || skill.levelData.length === 0) {
    return {
      name: skill.name,
      power: skill.power,
      cost: skill.cost,
      accuracy: skill.accuracy,
      criticalBonus: skill.criticalBonus,
      statusEffects: skill.statusEffects,
      description: skill.description
    };
  }
  
  // 現在レベルに対応する levelData を探す
  // NOTE: levelDataは昇順にソートされていることを想定
  // 指定レベル以下の最大レベルのデータを使用
  // ソートされていない場合は正しく動作しない可能性があるため、
  // スキル定義時にlevelDataをレベル順にソートして設定すること
  let applicableLevelData = null;
  for (const levelData of skill.levelData) {
    if (levelData.level <= level) {
      applicableLevelData = levelData;
    } else {
      break; // レベルを超えたら終了
    }
  }
  
  // levelData が見つからない場合はベーススキルの値を返す
  if (!applicableLevelData) {
    return {
      name: skill.name,
      power: skill.power,
      cost: skill.cost,
      accuracy: skill.accuracy,
      criticalBonus: skill.criticalBonus,
      statusEffects: skill.statusEffects,
      description: skill.description
    };
  }
  
  // levelData とベーススキルの値をマージ
  return {
    name: applicableLevelData.name ?? skill.name,
    power: applicableLevelData.power ?? skill.power,
    cost: applicableLevelData.cost ?? skill.cost,
    accuracy: applicableLevelData.accuracy ?? skill.accuracy,
    criticalBonus: applicableLevelData.criticalBonus ?? skill.criticalBonus,
    statusEffects: applicableLevelData.statusEffects ?? skill.statusEffects,
    description: applicableLevelData.description ?? skill.description
  };
}

/**
 * 習得済みスキルの現在レベルでの効果を取得
 * 
 * @param learnedSkill - 習得済みスキル
 * @returns レベルに応じたスキルデータ
 * 
 * @example
 * const effectiveSkill = getLearnedSkillEffectiveData(learnedSkill);
 * console.log(effectiveSkill.power);  // 現在レベルの威力
 */
export function getLearnedSkillEffectiveData(
  learnedSkill: LearnedSkill
): {
  name: string;
  power: number;
  cost?: SkillCost;
  accuracy: number;
  criticalBonus: number;
  statusEffects?: StatusEffectApplication[];
  description: string;
} {
  return getSkillDataAtLevel(learnedSkill.skill, learnedSkill.level);
}
