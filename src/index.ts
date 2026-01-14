/**
 * GEasy-Kit - ターン制RPGゲームを作成するためのTypeScriptライブラリ
 * 
 * このライブラリは、JRPGスタイルのゲームにおける数値計算と
 * ルール判定を行うCore Engineを提供します。
 */

// 型定義のエクスポート
export * from './types';

// 設定のエクスポート
export * from './config';

// コアモジュールのエクスポート（Core Engine層を含む）
export * from './core';

// Serviceモジュールのエクスポート
export * from './services';

// Headless UIモジュールのエクスポート
export * from './ui';

// ユーティリティモジュールのエクスポート
export * from './utils';

export const version = '1.0.0';
