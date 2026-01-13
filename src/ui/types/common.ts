/**
 * 共通型定義
 * 
 * すべてのコントローラーで共通して使用する型定義
 */

/**
 * カーソル位置
 */
export type CursorIndex = number;

/**
 * ページング情報
 */
export interface Pagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

/**
 * UI用ソート順序
 * Note: src/types/item.ts にも SortOrder が定義されているため、
 * こちらは UISortOrder として定義
 */
export type UISortOrder = 'asc' | 'desc';

/**
 * フィルタ条件の基底インターフェース
 */
export interface BaseFilter {
  [key: string]: any;
}

/**
 * 操作結果の基底インターフェース
 */
export interface OperationResult {
  success: boolean;
  message?: string;
  error?: Error;
}

/**
 * ローディング状態
 */
export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
}

/**
 * エラー状態
 */
export interface ErrorState {
  hasError: boolean;
  errorMessage?: string;
  errorCode?: string;
}
