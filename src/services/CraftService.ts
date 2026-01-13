/**
 * CraftService - アイテム合成サービス
 * アイテムのクラフト・合成を管理
 */

import type { 
  CraftRecipe, 
  CraftResult,
  MaterialRequirement,
  CraftedItemInfo 
} from '../types/craft';
import type { Character } from '../types/battle';
import type { UniqueId } from '../types/common';
import type { EventBus } from '../core/EventBus';
import type { DataChangeEvent } from '../types/events';
import * as synthesis from '../craft/synthesis';

/**
 * CraftService設定
 */
export interface CraftServiceConfig {
  /** 失敗時に素材を返却するか */
  returnMaterialsOnFailure?: boolean;
}

/**
 * レシピ情報
 */
export interface RecipeInfo {
  recipe: CraftRecipe;
  canCraft: boolean;
  reason?: string;
  missingMaterials?: MaterialRequirement[];
}

/**
 * CraftService
 * アイテムの合成を管理するサービスクラス
 * 
 * @example
 * const service = new CraftService();
 * const result = service.craft(recipe, inventory, character);
 */
export class CraftService {
  private config: CraftServiceConfig;
  private recipes: Map<UniqueId, CraftRecipe>;
  private eventBus?: EventBus;

  constructor(config: CraftServiceConfig = {}, eventBus?: EventBus) {
    this.config = {
      returnMaterialsOnFailure: false,
      ...config
    };
    this.recipes = new Map();
    this.eventBus = eventBus;
  }

  /**
   * レシピを登録する
   * 
   * @param recipe - 登録するレシピ
   */
  registerRecipe(recipe: CraftRecipe): void {
    this.recipes.set(recipe.id, recipe);
  }

  /**
   * レシピを取得する
   * 
   * @param recipeId - レシピID
   * @returns レシピ（存在しない場合はundefined）
   */
  getRecipe(recipeId: UniqueId): CraftRecipe | undefined {
    return this.recipes.get(recipeId);
  }

  /**
   * 全レシピを取得する
   * 
   * @returns 登録されているすべてのレシピ
   */
  getAllRecipes(): CraftRecipe[] {
    return Array.from(this.recipes.values());
  }

  /**
   * クラフト可能かチェックする
   * 
   * @param recipe - クラフトレシピ
   * @param inventory - インベントリ内のアイテム
   * @param character - キャラクター（要件チェック用）
   * @returns クラフト可否情報
   */
  canCraft(
    recipe: CraftRecipe,
    inventory: synthesis.InventoryItem[],
    character?: Character
  ): RecipeInfo {
    // キャラクター要件チェック
    if (!synthesis.meetsRequirements(recipe, character)) {
      return {
        recipe,
        canCraft: false,
        reason: 'Character does not meet requirements'
      };
    }

    // 素材チェック
    const validation = synthesis.validateRecipe(recipe, inventory);
    if (!validation.valid) {
      return {
        recipe,
        canCraft: false,
        reason: validation.reason,
        missingMaterials: validation.missingMaterials
      };
    }

    return {
      recipe,
      canCraft: true
    };
  }

  /**
   * アイテムをクラフトする
   * 
   * @param recipe - クラフトレシピ
   * @param inventory - インベントリ内のアイテム
   * @param character - キャラクター
   * @param random - ランダム値（テスト用）
   * @returns クラフト結果
   */
  craft(
    recipe: CraftRecipe,
    inventory: synthesis.InventoryItem[],
    character?: Character,
    random?: number
  ): CraftResult {
    // クラフト可能かチェック
    const checkResult = this.canCraft(recipe, inventory, character);
    if (!checkResult.canCraft) {
      return {
        success: false,
        materialsConsumed: [],
        message: checkResult.reason || 'Cannot craft this recipe'
      };
    }

    // 成功率計算
    const successRate = synthesis.calculateCraftSuccess(recipe, character);
    const success = synthesis.rollCraftSuccess(successRate, random);

    // 失敗時の処理
    if (!success) {
      const materialsConsumed = this.config.returnMaterialsOnFailure
        ? []
        : recipe.materials;

      return {
        success: false,
        materialsConsumed,
        message: `Crafting failed (${Math.round(successRate * 100)}% success rate)`
      };
    }

    // 成功時の処理
    const craftedItem = synthesis.generateCraftedItem(recipe);
    
    // データ変更イベントを発行
    if (this.eventBus) {
      this.eventBus.emit<DataChangeEvent>('data-changed', {
        type: 'craft-completed',
        timestamp: Date.now(),
        data: { 
          recipeId: recipe.id, 
          itemId: craftedItem.itemId,
          quantity: craftedItem.quantity 
        }
      });
    }
    
    return {
      success: true,
      item: {
        id: craftedItem.itemId,
        name: recipe.name,
        type: 'consumable', // デフォルト値
        quantity: craftedItem.quantity
      },
      materialsConsumed: recipe.materials,
      message: `Successfully crafted ${recipe.name}`
    };
  }

  /**
   * 利用可能なレシピを取得する
   * 
   * @param inventory - インベントリ内のアイテム
   * @param character - キャラクター
   * @returns クラフト可能なレシピのリスト
   */
  getAvailableRecipes(
    inventory: synthesis.InventoryItem[],
    character?: Character
  ): RecipeInfo[] {
    const recipes = this.getAllRecipes();
    return recipes.map(recipe => this.canCraft(recipe, inventory, character));
  }

  /**
   * クラフト可能なレシピを取得する
   * 
   * @param inventory - インベントリ内のアイテム
   * @param character - キャラクター
   * @returns クラフト可能なレシピのリスト
   */
  getCraftableRecipes(
    inventory: synthesis.InventoryItem[],
    character?: Character
  ): CraftRecipe[] {
    const available = this.getAvailableRecipes(inventory, character);
    return available
      .filter(info => info.canCraft)
      .map(info => info.recipe);
  }
}
