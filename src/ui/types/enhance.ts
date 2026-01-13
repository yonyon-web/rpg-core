import type { Equipment } from '../../types/equipment';
import type { LoadingState, ErrorState } from './common';

/**
 * 強化UIの状態
 */
export interface EnhanceUIState<TStats> {
  /** 現在のステージ */
  stage: EnhanceUIStage;
  /** 強化可能な装備一覧 */
  availableEquipment: Equipment<TStats>[];
  /** 選択された装備 */
  selectedEquipment: Equipment<TStats> | null;
  /** 強化に使用する素材 */
  selectedMaterials: Array<{ itemId: string; quantity: number }>;
  /** 強化レベル */
  enhanceLevel: number;
  /** 最大強化レベル */
  maxEnhanceLevel: number;
  /** 強化成功率 */
  successRate: number;
  /** 強化コスト */
  cost: { resourceId: string; amount: number } | null;
  /** 強化可能か */
  canEnhance: boolean;
  /** 強化後のステータスプレビュー */
  statsPreview: EnhanceStatsPreview<TStats> | null;
  /** フィルタタイプ */
  filterType: EnhanceFilterType;
  /** ソート基準 */
  sortBy: EnhanceSortBy;
  /** ソート順 */
  sortOrder: 'asc' | 'desc';
  /** ローディング状態 */
  loading: LoadingState;
  /** エラー状態 */
  error: ErrorState;
}

/**
 * 強化UIのステージ
 */
export type EnhanceUIStage = 'browsing' | 'selected' | 'material-selection' | 'confirming' | 'enhancing' | 'completed';

/**
 * 強化フィルタタイプ
 */
export type EnhanceFilterType = 'all' | 'enhanceable' | 'max-level';

/**
 * 強化ソート基準
 */
export type EnhanceSortBy = 'name' | 'level' | 'enhance-level';

/**
 * 強化後のステータスプレビュー
 */
export interface EnhanceStatsPreview<TStats> {
  /** 現在のステータス */
  current: Partial<TStats>;
  /** 強化後のステータス */
  after: Partial<TStats>;
  /** 差分 */
  differences: Partial<Record<keyof TStats, number>>;
}

/**
 * 強化UIのイベント
 */
export interface EnhanceEvents<TStats> {
  /** 強化開始 */
  'enhance-started': { equipment: Equipment<TStats>[] };
  /** 装備選択 */
  'equipment-selected': { equipment: Equipment<TStats> };
  /** 素材選択 */
  'material-selected': { itemId: string; quantity: number };
  /** 強化実行 */
  'enhance-executed': { equipment: Equipment<TStats>; success: boolean; newLevel: number };
  /** 強化成功 */
  'enhance-succeeded': { equipment: Equipment<TStats>; newLevel: number; stats: Partial<TStats> };
  /** 強化失敗 */
  'enhance-failed': { equipment: Equipment<TStats>; reason: string };
  /** ステータスプレビュー */
  'stats-previewed': { preview: EnhanceStatsPreview<TStats> };
  /** フィルタ変更 */
  'filter-changed': { filterType: EnhanceFilterType };
  /** ソート変更 */
  'sort-changed': { sortBy: EnhanceSortBy; order: 'asc' | 'desc' };
  /** ステージ変更 */
  'stage-changed': { stage: EnhanceUIStage };
}
