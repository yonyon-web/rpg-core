/**
 * Skill Learn UI Types
 * スキル習得UI関連の型定義
 */

import type { Character } from '../../types/battle';
import type { Skill } from '../../types/skill';
import type { UniqueId } from '../../types/common';
import type { UISortOrder, CursorIndex } from './common';
import type { LearnableSkillInfo, SkillLearnCost } from '../../services/SkillLearnService';

/**
 * スキル習得UIステージ
 */
export type SkillLearnUIStage =
  | 'browsing'      // スキル一覧表示
  | 'confirming'    // 習得確認
  | 'learning'      // 習得処理中
  | 'completed';    // 完了

/**
 * スキルフィルタタイプ
 */
export type SkillFilterType = 'all' | 'learnable' | 'unlearnable';

/**
 * スキルソート基準
 */
export type SkillSortBy = 'name' | 'level' | 'cost';

/**
 * スキル習得UI状態
 */
export interface SkillLearnUIState {
  stage: SkillLearnUIStage;
  character: Character | null;
  availableSkills: LearnableSkillInfo[];
  selectedSkill: Skill | null;
  cursorIndex: CursorIndex;
  filterType: SkillFilterType;
  sortBy: SkillSortBy;
  sortOrder: UISortOrder;
  error: string | null;
  isLearning: boolean;
}

/**
 * スキル習得イベント
 */
export interface SkillLearnEvents {
  'skill-selection-started': { character: Character; skills: LearnableSkillInfo[] };
  'skill-selected': { skill: Skill };
  'skill-learned': { character: Character; skill: Skill; level: number };
  'skill-leveled-up': { character: Character; skill: Skill; newLevel: number };
  'skill-forgotten': { character: Character; skill: Skill };
  'learn-failed': { reason: string };
  'filter-changed': { filterType: SkillFilterType };
  'sort-changed': { sortBy: SkillSortBy; order: UISortOrder };
  'selection-cancelled': {};
}

/**
 * スキルレベルアップUI状態
 */
export interface SkillLevelUpUIState {
  skill: Skill;
  currentLevel: number;
  canLevelUp: boolean;
  levelUpCost: SkillLearnCost | null;
  nextLevelPreview: any | null;  // 次レベルのスキルデータ
}
