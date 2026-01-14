/**
 * craft/enhance - 装備強化の計算ロジック
 * 
 * このモジュールは純粋関数として実装され、装備の強化に関する
 * すべての計算ロジックを提供します。
 */

import type { EnhanceConfig, EnhancableEquipment, EnhanceCost } from '../../types/craft/craft';
import type { Probability } from '../../types/common';

/**
 * 強化成功率を計算する
 * 
 * @param equipment - 装備
 * @param config - 強化設定
 * @returns 成功率 (0.0 - 1.0)
 */
export function calculateEnhanceSuccess(
  equipment: EnhancableEquipment,
  config: EnhanceConfig
): Probability {
  const currentLevel = equipment.enhanceLevel;
  
  // 最大レベルに達している場合は0
  if (currentLevel >= config.maxLevel) {
    return 0 as Probability;
  }
  
  // レベルが上がるごとに成功率が減少
  const successRate = config.baseSuccessRate - (currentLevel * config.successRateDecay);
  
  // 成功率は0.0〜1.0の範囲に制限
  return Math.max(0, Math.min(1, successRate)) as Probability;
}

/**
 * 強化コストを計算する
 * 
 * @param equipment - 装備
 * @param level - 強化レベル
 * @returns 強化に必要なコスト
 */
export function calculateEnhanceCost(
  equipment: EnhancableEquipment,
  level: number
): EnhanceCost {
  // 装備にカスタムコストが設定されている場合はそれを使用
  if (equipment.enhanceCost) {
    return equipment.enhanceCost;
  }
  
  // デフォルト: レベルの二乗に比例してゴールドコストが増加
  const baseCost = 100;
  return {
    gold: baseCost * Math.pow(level + 1, 2)
  };
}

/**
 * コストが十分かチェックする
 * 
 * @param required - 必要なコスト
 * @param available - 利用可能なリソース
 * @returns コストが足りるか
 */
export function canAffordCost(
  required: EnhanceCost,
  available: { gold?: number; resources?: Record<string, number> }
): boolean {
  // ゴールドチェック
  if (required.gold !== undefined) {
    const availableGold = available.gold ?? 0;
    if (availableGold < required.gold) {
      return false;
    }
  }
  
  // その他のリソースチェック
  if (required.resources) {
    for (const [resource, amount] of Object.entries(required.resources)) {
      const availableAmount = available.resources?.[resource] ?? 0;
      if (availableAmount < amount) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * 強化効果を適用する
 * 
 * @param equipment - 装備
 * @param level - 新しい強化レベル
 * @returns 更新後のステータス
 */
export function applyEnhancement(
  equipment: EnhancableEquipment,
  level: number
): Record<string, number> {
  const enhancedStats: Record<string, number> = {};
  
  // 装備ごとの強化ボーナス設定を取得
  const bonusConfig = equipment.enhancementBonus;
  
  // 各ステータスに強化ボーナスを適用
  for (const [stat, value] of Object.entries(equipment.baseStats)) {
    // ステータスごとのボーナス倍率を取得（設定がない場合はデフォルト10%）
    const bonusRate = bonusConfig?.statBonuses[stat] ?? 0.1;
    const bonus = Math.floor(value * level * bonusRate);
    enhancedStats[stat] = value + bonus;
  }
  
  return enhancedStats;
}

/**
 * 強化失敗時の処理
 * 
 * @param equipment - 装備
 * @param penalty - ペナルティ設定
 * @returns 更新後の強化レベル、破壊フラグ
 */
export function handleEnhanceFailure(
  equipment: EnhancableEquipment,
  penalty: 'none' | 'downgrade' | 'destroy'
): { newLevel: number; destroyed: boolean } {
  switch (penalty) {
    case 'none':
      return { newLevel: equipment.enhanceLevel, destroyed: false };
    
    case 'downgrade':
      // レベルを1下げる（最小0）
      return { 
        newLevel: Math.max(0, equipment.enhanceLevel - 1), 
        destroyed: false 
      };
    
    case 'destroy':
      // 装備が破壊される
      return { newLevel: 0, destroyed: true };
    
    default:
      return { newLevel: equipment.enhanceLevel, destroyed: false };
  }
}

/**
 * 強化が可能かチェックする
 * 
 * @param equipment - 装備
 * @param config - 強化設定
 * @returns 強化可能か
 */
export function canEnhance(
  equipment: EnhancableEquipment,
  config: EnhanceConfig
): boolean {
  return equipment.enhanceLevel < config.maxLevel;
}

/**
 * 強化が成功するか判定する（確率計算）
 * 
 * @param successRate - 成功率 (0.0 - 1.0)
 * @param random - ランダム値 (0.0 - 1.0)、テスト用に外部から注入可能
 * @returns 成功したか
 */
export function rollEnhanceSuccess(
  successRate: Probability,
  random: number = Math.random()
): boolean {
  return random < successRate;
}
