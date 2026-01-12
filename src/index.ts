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

// 戦闘モジュールのエクスポート
export * from './combat';

// キャラクターモジュールのエクスポート
export * from './character';

// Serviceモジュールのエクスポート
export * from './services';

export const version = '1.0.0';
