/**
 * rpg-core - ターン制RPGゲームを作成するためのTypeScriptライブラリ
 * 
 * このライブラリは、JRPGスタイルのゲームにおける数値計算と
 * ルール判定を行うCore Engineを提供します。
 */

// 型定義のエクスポート
export * from './types';

// 設定のエクスポート
export * from './config';

// コアモジュールのエクスポート（DIコンテナ、RPGCoreクラスなど）
export * from './core';

// 戦闘モジュールのエクスポート
export * from './combat';

// キャラクターモジュールのエクスポート
export * from './character';

// Serviceモジュールのエクスポート
export * from './services';

// Headless UIモジュールのエクスポート
export * from './ui';

export const version = '1.0.0';
