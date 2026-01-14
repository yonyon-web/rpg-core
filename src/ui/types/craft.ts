import type { Item } from '../../types/item/item';
import type { CraftRecipe } from '../../types/craft/craft';
import type { LoadingState, ErrorState } from './common';

/**
 * クラフトUIの状態
 */
export interface CraftUIState {
  /** 現在のステージ */
  stage: CraftUIStage;
  /** 利用可能なレシピ一覧 */
  availableRecipes: CraftRecipe[];
  /** 選択されたレシピ */
  selectedRecipe: CraftRecipe | null;
  /** クラフト数量 */
  quantity: number;
  /** 必要な材料が揃っているか */
  canCraft: boolean;
  /** 不足している材料 */
  missingMaterials: Array<{ itemId: string; required: number; current: number }>;
  /** フィルタタイプ */
  filterType: CraftFilterType;
  /** ソート基準 */
  sortBy: CraftSortBy;
  /** ソート順 */
  sortOrder: 'asc' | 'desc';
  /** ローディング状態 */
  loading: LoadingState;
  /** エラー状態 */
  error: ErrorState;
}

/**
 * クラフトUIのステージ
 */
export type CraftUIStage = 'browsing' | 'selected' | 'confirming' | 'crafting' | 'completed';

/**
 * クラフトフィルタタイプ
 */
export type CraftFilterType = 'all' | 'craftable' | 'uncraftable';

/**
 * クラフトソート基準
 */
export type CraftSortBy = 'name' | 'level' | 'category';

/**
 * クラフトUIのイベント
 */
export interface CraftEvents {
  /** クラフト開始 */
  'craft-started': { recipes: CraftRecipe[] };
  /** レシピ選択 */
  'recipe-selected': { recipe: CraftRecipe };
  /** クラフト実行 */
  'craft-executed': { recipe: CraftRecipe; quantity: number; result: Item[] };
  /** クラフト失敗 */
  'craft-failed': { recipe: CraftRecipe; reason: string };
  /** フィルタ変更 */
  'filter-changed': { filterType: CraftFilterType };
  /** ソート変更 */
  'sort-changed': { sortBy: CraftSortBy; order: 'asc' | 'desc' };
  /** 数量変更 */
  'quantity-changed': { quantity: number };
  /** ステージ変更 */
  'stage-changed': { stage: CraftUIStage };
}
