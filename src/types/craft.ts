/**
 * クラフト・合成関連の型定義
 */

import type { UniqueId, Probability } from './common';
import type { ConsumableItem, BaseItemType, DefaultItemType } from './item';

/**
 * クラフトレシピ
 * アイテム合成のためのレシピ情報
 */
export interface CraftRecipe {
  /** レシピID */
  id: UniqueId;
  /** レシピ名 */
  name: string;
  /** 必要素材 */
  materials: MaterialRequirement[];
  /** 生成されるアイテム */
  result: {
    itemId: UniqueId;
    quantity: number;
  };
  /** 基本成功率 (0.0 - 1.0) */
  baseSuccessRate: Probability;
  /** レシピの必要条件 */
  requirements?: CraftRequirements;
}

/**
 * 素材要件
 */
export interface MaterialRequirement {
  /** アイテムID */
  itemId: UniqueId;
  /** 必要数量 */
  quantity: number;
}

/**
 * クラフト要件
 */
export interface CraftRequirements {
  /** 必要レベル */
  level?: number;
  /** 必要スキルID */
  skillId?: UniqueId;
  /** 必要ジョブID */
  jobId?: string;
}

/**
 * クラフトされたアイテム情報
 * @template TItemType - アイテムタイプ
 */
export interface CraftedItemInfo<
  TItemType extends BaseItemType = DefaultItemType
> {
  id: UniqueId;
  name: string;
  type: TItemType;
  quantity: number;
}

/**
 * クラフト結果
 * @template TItemType - アイテムタイプ
 */
export interface CraftResult<
  TItemType extends BaseItemType = DefaultItemType
> {
  /** 成功したか */
  success: boolean;
  /** 生成されたアイテム（成功時） */
  item?: CraftedItemInfo<TItemType>;
  /** 消費された素材 */
  materialsConsumed: MaterialRequirement[];
  /** 結果メッセージ */
  message: string;
}

/**
 * 強化設定
 */
export interface EnhanceConfig {
  /** 最大強化レベル */
  maxLevel: number;
  /** 基本成功率 */
  baseSuccessRate: Probability;
  /** レベルごとの成功率減少 */
  successRateDecay: number;
  /** 失敗時のペナルティ */
  failurePenalty: 'none' | 'downgrade' | 'destroy';
}

/**
 * 強化結果
 */
export interface EnhanceResult {
  /** 成功したか */
  success: boolean;
  /** 新しい強化レベル */
  newLevel: number;
  /** 以前の強化レベル */
  previousLevel: number;
  /** 変化したステータス（成功時） */
  stats?: Record<string, number>;
  /** 結果メッセージ */
  message: string;
  /** 装備が破壊されたか */
  destroyed?: boolean;
}

/**
 * 強化可能な装備
 */
export interface EnhancableEquipment {
  /** 装備ID */
  id: UniqueId;
  /** 現在の強化レベル */
  enhanceLevel: number;
  /** 基本ステータス */
  baseStats: Record<string, number>;
}
