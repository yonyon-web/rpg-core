/**
 * craft/synthesis - アイテム合成の計算ロジック
 * 
 * このモジュールは純粋関数として実装され、アイテムの合成に関する
 * すべての計算ロジックを提供します。
 */

import type { 
  CraftRecipe, 
  MaterialRequirement,
  CraftRequirements 
} from '../types/craft';
import type { UniqueId, Probability } from '../types/common';
import type { Character } from '../types/battle';

/**
 * インベントリ内のアイテム情報
 */
export interface InventoryItem {
  itemId: UniqueId;
  quantity: number;
}

/**
 * レシピ検証結果
 */
export interface RecipeValidationResult {
  valid: boolean;
  reason?: string;
  missingMaterials?: MaterialRequirement[];
}

/**
 * レシピと素材を検証する
 * 
 * @param recipe - クラフトレシピ
 * @param inventory - インベントリ内のアイテム
 * @returns 検証結果
 */
export function validateRecipe(
  recipe: CraftRecipe,
  inventory: InventoryItem[]
): RecipeValidationResult {
  const missingMaterials: MaterialRequirement[] = [];
  
  // 各素材の数量チェック
  for (const material of recipe.materials) {
    const inventoryItem = inventory.find(item => item.itemId === material.itemId);
    const availableQuantity = inventoryItem?.quantity ?? 0;
    
    if (availableQuantity < material.quantity) {
      missingMaterials.push({
        itemId: material.itemId,
        quantity: material.quantity - availableQuantity
      });
    }
  }
  
  if (missingMaterials.length > 0) {
    return {
      valid: false,
      reason: 'Insufficient materials',
      missingMaterials
    };
  }
  
  return { valid: true };
}

/**
 * キャラクターがレシピの要件を満たしているか確認
 * 
 * @param recipe - クラフトレシピ
 * @param character - キャラクター
 * @returns 要件を満たしているか
 */
export function meetsRequirements(
  recipe: CraftRecipe,
  character?: Character
): boolean {
  if (!recipe.requirements) {
    return true;
  }
  
  if (!character) {
    return false;
  }
  
  const reqs = recipe.requirements;
  
  // レベル要件チェック
  if (reqs.level !== undefined && character.level < reqs.level) {
    return false;
  }
  
  // ジョブ要件チェック
  if (reqs.jobId !== undefined && character.job !== reqs.jobId) {
    return false;
  }
  
  // スキル要件チェック
  if (reqs.skillId !== undefined) {
    const hasSkill = character.skills?.some(skill => skill.id === reqs.skillId);
    if (!hasSkill) {
      return false;
    }
  }
  
  return true;
}

/**
 * 合成成功率を計算する
 * 
 * @param recipe - クラフトレシピ
 * @param character - キャラクター（オプション、スキルボーナス等に影響）
 * @returns 成功率 (0.0 - 1.0)
 */
export function calculateCraftSuccess(
  recipe: CraftRecipe,
  character?: Character
): Probability {
  let successRate = recipe.baseSuccessRate;
  
  // キャラクターのスキルレベルによるボーナス（今後の拡張用）
  // 現在はベース成功率をそのまま返す
  
  // 成功率は0.0〜1.0の範囲に制限
  return Math.max(0, Math.min(1, successRate)) as Probability;
}

/**
 * 素材を消費する（インベントリから素材を減らす計算）
 * 
 * @param inventory - 現在のインベントリ
 * @param materials - 消費する素材
 * @returns 更新後のインベントリ
 */
export function consumeMaterials(
  inventory: InventoryItem[],
  materials: MaterialRequirement[]
): InventoryItem[] {
  // インベントリのコピーを作成
  const newInventory = inventory.map(item => ({ ...item }));
  
  // 各素材を消費
  for (const material of materials) {
    const item = newInventory.find(i => i.itemId === material.itemId);
    if (item) {
      item.quantity -= material.quantity;
    }
  }
  
  // 数量が0以下のアイテムを除外
  return newInventory.filter(item => item.quantity > 0);
}

/**
 * クラフトされたアイテムを生成する
 * 
 * @param recipe - クラフトレシピ
 * @returns 生成されたアイテム情報
 */
export function generateCraftedItem(
  recipe: CraftRecipe
): { itemId: UniqueId; quantity: number } {
  return {
    itemId: recipe.result.itemId,
    quantity: recipe.result.quantity
  };
}

/**
 * 合成が成功するか判定する（確率計算）
 * 
 * @param successRate - 成功率 (0.0 - 1.0)
 * @param random - ランダム値 (0.0 - 1.0)、テスト用に外部から注入可能
 * @returns 成功したか
 */
export function rollCraftSuccess(
  successRate: Probability,
  random: number = Math.random()
): boolean {
  return random < successRate;
}
