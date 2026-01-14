/**
 * EnhanceService - 装備強化サービス
 * 装備の強化を管理
 */

import type { 
  EnhanceConfig, 
  EnhanceResult,
  EnhancableEquipment,
  EnhanceCost 
} from '../../types/craft/craft';
import type { UniqueId } from '../../types/common';
import type { EventBus } from '../../core/EventBus';
import type { DataChangeEvent } from '../../types/system/events';
import * as enhance from '../../core/craft/enhance';

/**
 * リソース管理インターフェース
 */
export interface ResourceManager {
  /** ゴールド */
  gold: number;
  /** その他のリソース */
  resources?: Record<string, number>;
}

/**
 * EnhanceService設定
 */
export interface EnhanceServiceConfig extends EnhanceConfig {
  /** 強化コストを支払うか（デフォルト: true） */
  requirePayment?: boolean;
}

/**
 * 強化可能情報
 */
export interface EnhanceInfo {
  equipment: EnhancableEquipment;
  canEnhance: boolean;
  reason?: string;
  successRate?: number;
  cost?: EnhanceCost;
}

/**
 * EnhanceService
 * 装備の強化を管理するサービスクラス
 * 
 * @example
 * const service = new EnhanceService({
 *   maxLevel: 10,
 *   baseSuccessRate: 0.9,
 *   successRateDecay: 0.05,
 *   failurePenalty: 'downgrade'
 * });
 * const result = service.enhance(equipment, gold);
 */
export class EnhanceService {
  private config: Required<EnhanceServiceConfig>;
  private eventBus?: EventBus;

  constructor(config: EnhanceServiceConfig, eventBus?: EventBus) {
    this.config = {
      requirePayment: true,
      ...config
    };
    this.eventBus = eventBus;
  }

  /**
   * 装備を強化可能かチェックする
   * 
   * @param equipment - 装備
   * @param resourceManager - リソース管理（オプション）
   * @returns 強化可否情報
   */
  canEnhance(
    equipment: EnhancableEquipment,
    resourceManager?: ResourceManager
  ): EnhanceInfo {
    // 最大レベルチェック
    if (!enhance.canEnhance(equipment, this.config)) {
      return {
        equipment,
        canEnhance: false,
        reason: `Equipment is already at max level (${this.config.maxLevel})`
      };
    }

    // コストチェック
    const cost = enhance.calculateEnhanceCost(equipment, equipment.enhanceLevel);
    if (this.config.requirePayment && resourceManager) {
      const canAfford = enhance.canAffordCost(cost, resourceManager);
      if (!canAfford) {
        return {
          equipment,
          canEnhance: false,
          reason: `Insufficient resources`,
          cost
        };
      }
    }

    // 成功率を計算
    const successRate = enhance.calculateEnhanceSuccess(equipment, this.config);

    return {
      equipment,
      canEnhance: true,
      successRate,
      cost
    };
  }

  /**
   * 装備を強化する
   * 
   * @param equipment - 装備
   * @param resourceManager - リソース管理（コストチェック用、オプション）
   * @param random - ランダム値（テスト用）
   * @returns 強化結果
   */
  enhance(
    equipment: EnhancableEquipment,
    resourceManager?: ResourceManager,
    random?: number
  ): EnhanceResult {
    // 強化可能かチェック
    const checkResult = this.canEnhance(equipment, resourceManager);
    if (!checkResult.canEnhance) {
      return {
        success: false,
        newLevel: equipment.enhanceLevel,
        previousLevel: equipment.enhanceLevel,
        message: checkResult.reason || 'Cannot enhance this equipment'
      };
    }

    // コストを計算
    const cost = enhance.calculateEnhanceCost(equipment, equipment.enhanceLevel);

    // 成功率計算
    const successRate = enhance.calculateEnhanceSuccess(equipment, this.config);
    const success = enhance.rollEnhanceSuccess(successRate, random);

    // コストを消費（失敗しても消費される）
    if (this.config.requirePayment && resourceManager) {
      this.consumeCost(resourceManager, cost);
    }

    // 失敗時の処理
    if (!success) {
      const failureResult = enhance.handleEnhanceFailure(equipment, this.config.failurePenalty);
      
      // 装備を更新
      equipment.enhanceLevel = failureResult.newLevel;

      return {
        success: false,
        newLevel: failureResult.newLevel,
        previousLevel: equipment.enhanceLevel,
        destroyed: failureResult.destroyed,
        costConsumed: cost,
        message: failureResult.destroyed
          ? 'Enhancement failed! Equipment was destroyed.'
          : `Enhancement failed (${Math.round(successRate * 100)}% success rate). ${
              this.config.failurePenalty === 'downgrade' 
                ? `Level downgraded to +${failureResult.newLevel}.`
                : 'No penalty applied.'
            }`
      };
    }

    // 成功時の処理
    const previousLevel = equipment.enhanceLevel;
    const newLevel = previousLevel + 1;
    
    // 装備を更新
    equipment.enhanceLevel = newLevel;
    
    // 強化後のステータスを計算
    const enhancedStats = enhance.applyEnhancement(equipment, newLevel);

    // データ変更イベントを発行
    if (this.eventBus) {
      this.eventBus.emit<DataChangeEvent>('data-changed', {
        type: 'enhancement-completed',
        timestamp: Date.now(),
        data: { 
          equipmentId: equipment.id, 
          previousLevel, 
          newLevel 
        }
      });
    }

    return {
      success: true,
      newLevel,
      previousLevel,
      stats: enhancedStats,
      costConsumed: cost,
      message: `Successfully enhanced to +${newLevel}!`
    };
  }

  /**
   * コストを消費する
   * 
   * @param resourceManager - リソース管理
   * @param cost - 消費するコスト
   */
  private consumeCost(resourceManager: ResourceManager, cost: EnhanceCost): void {
    // ゴールドを消費
    if (cost.gold !== undefined) {
      resourceManager.gold -= cost.gold;
    }
    
    // その他のリソースを消費
    if (cost.resources) {
      if (!resourceManager.resources) {
        resourceManager.resources = {};
      }
      for (const [resource, amount] of Object.entries(cost.resources)) {
        const current = resourceManager.resources[resource] ?? 0;
        resourceManager.resources[resource] = current - amount;
      }
    }
  }

  /**
   * 強化に必要なコストを取得する
   * 
   * @param equipment - 装備
   * @returns 強化コスト
   */
  getEnhanceCost(equipment: EnhancableEquipment): EnhanceCost {
    return enhance.calculateEnhanceCost(equipment, equipment.enhanceLevel);
  }

  /**
   * 強化成功率を取得する
   * 
   * @param equipment - 装備
   * @returns 成功率 (0.0 - 1.0)
   */
  getSuccessRate(equipment: EnhancableEquipment): number {
    return enhance.calculateEnhanceSuccess(equipment, this.config);
  }

  /**
   * 設定を更新する
   * 
   * @param config - 新しい設定
   */
  updateConfig(config: Partial<EnhanceServiceConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  /**
   * 現在の設定を取得する
   * 
   * @returns 現在の設定
   */
  getConfig(): Readonly<Required<EnhanceServiceConfig>> {
    return { ...this.config };
  }
}
