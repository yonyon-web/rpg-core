/**
 * SkillLearnService - スキル習得サービス
 * スキルの習得・忘却・レベルアップを管理
 */

import type { Character } from '../types/battle';
import type { Skill, LearnedSkill } from '../types/skill';
import type { UniqueId } from '../types/common';
import type { InventoryService } from './InventoryService';
import * as skillModule from '../character/skill';

/**
 * スキル習得結果
 */
export interface SkillLearnResult {
  success: boolean;
  message: string;
  skill?: Skill;
  level?: number;  // 習得後またはレベルアップ後のレベル
}

/**
 * 習得可能スキル情報
 */
export interface LearnableSkillInfo {
  skill: Skill;
  canLearn: boolean;
  reason?: string;
  requirements?: skillModule.SkillLearnRequirements;
  cost?: SkillLearnCost;  // 習得コスト
}

/**
 * スキル習得コスト
 */
export interface SkillLearnCost {
  resourceId?: string;  // リソースID（例: 'sp', 'craft-points'）
  amount?: number;      // 必要量
}

/**
 * SkillLearnService
 * スキル習得を管理するサービスクラス
 * 
 * @example
 * const service = new SkillLearnService();
 * const result = service.learnSkill(character, skill, { levelRequirement: 10 });
 * 
 * @example
 * // リソース管理を使用
 * const service = new SkillLearnService(inventoryService);
 * const result = service.learnSkill(character, skill, undefined, { resourceId: 'sp', amount: 30 });
 */
export class SkillLearnService {
  private inventoryService?: InventoryService;
  
  /**
   * コンストラクタ
   * 
   * @param inventoryService - インベントリサービス（オプション、リソースコスト管理用）
   */
  constructor(inventoryService?: InventoryService) {
    this.inventoryService = inventoryService;
  }
  
  /**
   * スキルを習得する
   * 
   * @param character - キャラクター
   * @param skill - 習得するスキル
   * @param requirements - 習得要件（オプション）
   * @param cost - 習得コスト（オプション）
   * @param useLearnedSkills - LearnedSkill形式で管理するか（デフォルト: false、後方互換性のため）
   * @returns 習得結果
   * 
   * @example
   * const result = service.learnSkill(character, skill);
   * if (result.success) {
   *   console.log('Skill learned!');
   * }
   * 
   * @example
   * // レベルシステムありで習得
   * const result = service.learnSkill(character, skill, undefined, undefined, true);
   * 
   * @example
   * // リソースコストあり
   * const result = service.learnSkill(character, skill, { levelRequirement: 10 }, { resourceId: 'sp', amount: 30 });
   */
  learnSkill(
    character: Character,
    skill: Skill,
    requirements?: skillModule.SkillLearnRequirements,
    cost?: SkillLearnCost,
    useLearnedSkills: boolean = false
  ): SkillLearnResult {
    // 習得可否を検証
    const validation = skillModule.validateSkillLearnConditions(character, skill, requirements);
    
    if (!validation.canLearn) {
      return {
        success: false,
        message: validation.reason || 'Cannot learn skill',
      };
    }

    // コストチェック
    if (cost && this.inventoryService) {
      if (cost.resourceId && cost.amount) {
        if (!this.inventoryService.hasResource(cost.resourceId, cost.amount)) {
          return {
            success: false,
            message: `Insufficient ${cost.resourceId} (need ${cost.amount})`,
          };
        }
      }
    }

    // コスト消費
    if (cost && this.inventoryService) {
      if (cost.resourceId && cost.amount) {
        if (!this.inventoryService.removeResource(cost.resourceId, cost.amount)) {
          return {
            success: false,
            message: `Failed to consume ${cost.resourceId}`,
          };
        }
      }
    }

    // スキルを追加
    if (useLearnedSkills || character.learnedSkills !== undefined) {
      // LearnedSkill形式で管理
      if (!character.learnedSkills) {
        character.learnedSkills = [];
      }
      
      const learnedSkill: LearnedSkill = {
        skill,
        level: 1,
        learnedAt: Date.now()
      };
      
      character.learnedSkills.push(learnedSkill);
      
      return {
        success: true,
        message: `${character.name} learned ${skill.name}!`,
        skill,
        level: 1
      };
    } else {
      // 従来のSkill[]形式（後方互換性）
      character.skills.push(skill);

      return {
        success: true,
        message: `${character.name} learned ${skill.name}!`,
        skill,
      };
    }
  }
  
  /**
   * スキルをレベルアップする
   * 
   * @param character - キャラクター
   * @param skillId - レベルアップするスキルID
   * @param cost - レベルアップコスト（オプション）
   * @returns レベルアップ結果
   * 
   * @example
   * const result = service.levelUpSkill(character, 'skill-1');
   * 
   * @example
   * // リソースコストあり
   * const result = service.levelUpSkill(character, 'skill-1', { resourceId: 'sp', amount: 50 });
   */
  levelUpSkill(
    character: Character,
    skillId: UniqueId,
    cost?: SkillLearnCost
  ): SkillLearnResult {
    // learnedSkillsがない場合はレベルアップ不可
    if (!character.learnedSkills) {
      return {
        success: false,
        message: 'Character does not use learned skills system',
      };
    }
    
    // レベルアップ可能かチェック
    if (!skillModule.canLevelUpSkill(character, skillId)) {
      const learned = skillModule.getLearnedSkill(character, skillId);
      if (!learned) {
        return {
          success: false,
          message: 'Skill not learned',
        };
      }
      
      const maxLevel = learned.skill.maxLevel || 1;
      return {
        success: false,
        message: `Skill is already at max level (${maxLevel})`,
      };
    }
    
    // コストチェック
    if (cost && this.inventoryService) {
      if (cost.resourceId && cost.amount) {
        if (!this.inventoryService.hasResource(cost.resourceId, cost.amount)) {
          return {
            success: false,
            message: `Insufficient ${cost.resourceId} (need ${cost.amount})`,
          };
        }
      }
    }
    
    // コスト消費
    if (cost && this.inventoryService) {
      if (cost.resourceId && cost.amount) {
        if (!this.inventoryService.removeResource(cost.resourceId, cost.amount)) {
          return {
            success: false,
            message: `Failed to consume ${cost.resourceId}`,
          };
        }
      }
    }
    
    // レベルアップ実行
    if (skillModule.levelUpSkill(character, skillId)) {
      // レベルアップ後の状態を取得
      const learned = skillModule.getLearnedSkill(character, skillId);
      if (learned) {
        return {
          success: true,
          message: `${learned.skill.name} leveled up to ${learned.level}!`,
          skill: learned.skill,
          level: learned.level
        };
      }
    }
    
    return {
      success: false,
      message: 'Failed to level up skill',
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
    // learnedSkillsから削除を試みる
    if (character.learnedSkills) {
      const learnedIndex = character.learnedSkills.findIndex(ls => ls.skill.id === skillId);
      if (learnedIndex !== -1) {
        const learned = character.learnedSkills[learnedIndex];
        character.learnedSkills.splice(learnedIndex, 1);
        
        return {
          success: true,
          message: `${character.name} has forgotten ${learned.skill.name}`,
          skill: learned.skill,
        };
      }
    }
    
    // 従来のskillsから削除
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
