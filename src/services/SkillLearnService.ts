/**
 * SkillLearnService - スキル習得サービス
 * スキルの習得・忘却を管理
 */

import type { Character } from '../types/battle';
import type { Skill } from '../types/skill';
import type { UniqueId } from '../types/common';
import * as skillModule from '../character/skill';

/**
 * スキル習得結果
 */
export interface SkillLearnResult {
  success: boolean;
  message: string;
  skill?: Skill;
}

/**
 * 習得可能スキル情報
 */
export interface LearnableSkillInfo {
  skill: Skill;
  canLearn: boolean;
  reason?: string;
  requirements?: skillModule.SkillLearnRequirements;
}

/**
 * SkillLearnService
 * スキル習得を管理するサービスクラス
 * 
 * @example
 * const service = new SkillLearnService();
 * const result = service.learnSkill(character, skill, { levelRequirement: 10 });
 */
export class SkillLearnService {
  /**
   * スキルを習得する
   * 
   * @param character - キャラクター
   * @param skill - 習得するスキル
   * @param requirements - 習得要件（オプション）
   * @returns 習得結果
   * 
   * @example
   * const result = service.learnSkill(character, skill);
   * if (result.success) {
   *   console.log('Skill learned!');
   * }
   * 
   * @example
   * const result = service.learnSkill(character, skill, { 
   *   levelRequirement: 10,
   *   requiredJob: 'warrior'
   * });
   */
  learnSkill(
    character: Character,
    skill: Skill,
    requirements?: skillModule.SkillLearnRequirements
  ): SkillLearnResult {
    // 習得可否を検証
    const validation = skillModule.validateSkillLearnConditions(character, skill, requirements);
    
    if (!validation.canLearn) {
      return {
        success: false,
        message: validation.reason || 'Cannot learn skill',
      };
    }

    // スキルを追加
    character.skills.push(skill);

    return {
      success: true,
      message: `${character.name} learned ${skill.name}!`,
      skill,
    };
  }

  /**
   * スキルを忘れる
   * 
   * @param character - キャラクター
   * @param skillId - 忘れるスキルID
   * @returns 忘却結果
   * 
   * @example
   * const result = service.forgetSkill(character, 'skill-1');
   */
  forgetSkill(character: Character, skillId: UniqueId): SkillLearnResult {
    const skillIndex = character.skills.findIndex(s => s.id === skillId);

    if (skillIndex === -1) {
      return {
        success: false,
        message: 'Skill not found',
      };
    }

    const skill = character.skills[skillIndex];
    character.skills.splice(skillIndex, 1);

    return {
      success: true,
      message: `${character.name} has forgotten ${skill.name}`,
      skill,
    };
  }

  /**
   * 習得可能なスキル一覧を取得
   * 
   * @param character - キャラクター
   * @param availableSkills - 利用可能なスキル一覧
   * @param requirementsMap - スキルIDごとの習得要件（オプション）
   * @returns 習得可能なスキル情報の配列
   * 
   * @example
   * const requirements = new Map([
   *   ['skill-1', { levelRequirement: 5 }],
   *   ['skill-2', { levelRequirement: 10, requiredJob: 'mage' }]
   * ]);
   * const learnableSkills = service.getLearnableSkills(character, allSkills, requirements);
   */
  getLearnableSkills(
    character: Character,
    availableSkills: Skill[],
    requirementsMap?: Map<UniqueId, skillModule.SkillLearnRequirements>
  ): LearnableSkillInfo[] {
    return availableSkills
      .filter(skill => !skillModule.hasSkill(character, skill.id))
      .map(skill => {
        const requirements = requirementsMap?.get(skill.id);
        const validation = skillModule.validateSkillLearnConditions(character, skill, requirements);

        return {
          skill,
          canLearn: validation.canLearn,
          reason: validation.reason,
          requirements,
        };
      });
  }

  /**
   * キャラクターがスキルを習得しているかチェック
   * 
   * @param character - キャラクター
   * @param skillId - スキルID
   * @returns 習得している場合true
   * 
   * @example
   * if (service.hasSkill(character, 'fireball')) {
   *   console.log('Character knows Fireball');
   * }
   */
  hasSkill(character: Character, skillId: UniqueId): boolean {
    return skillModule.hasSkill(character, skillId);
  }
}
