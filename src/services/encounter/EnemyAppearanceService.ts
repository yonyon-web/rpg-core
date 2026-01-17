/**
 * EnemyAppearanceService - 敵グループ出現管理
 * 
 * エンカウント時にどの敵グループを出現させるかを抽選するサービス
 * 複数の敵グループを束ねたプールを管理し、出現率に基づいて抽選を行う
 */

import { UniqueId } from '../../types/common';
import { Enemy } from '../../types/battle/battle';
import { EnemyGroupService, EnemyGroupType } from '../enemy/EnemyGroupService';

/**
 * 敵グループの出現設定
 */
export interface EnemyGroupAppearance {
  groupType: EnemyGroupType;  // 敵グループタイプ
  weight: number;             // 出現率の重み（相対値）
}

/**
 * 敵グループ出現プール
 * 複数の敵グループをまとめて管理し、それぞれの出現率を持つ
 */
export interface EnemyAppearancePool {
  id: UniqueId;                           // プールID
  name: string;                           // プール名
  appearances: EnemyGroupAppearance[];    // 敵グループの出現設定リスト
  defaultLevel?: number;                  // デフォルトレベル（オプション）
}

/**
 * 抽選結果
 */
export interface AppearanceResult {
  groupType: EnemyGroupType;  // 選択された敵グループタイプ
  enemies: Enemy[];           // 生成された敵リスト
}

/**
 * EnemyAppearanceServiceクラス
 */
export class EnemyAppearanceService {
  private pools: Map<UniqueId, EnemyAppearancePool> = new Map();
  private enemyGroupService: EnemyGroupService;

  /**
   * コンストラクタ
   * @param enemyGroupService 敵グループサービス
   */
  constructor(enemyGroupService: EnemyGroupService) {
    this.enemyGroupService = enemyGroupService;
  }

  /**
   * 敵出現プールを登録する
   * @param pool 敵出現プール
   */
  registerPool(pool: EnemyAppearancePool): void {
    // 重みの合計値を検証
    const totalWeight = pool.appearances.reduce((sum, app) => sum + app.weight, 0);
    if (totalWeight <= 0) {
      throw new Error(`Pool ${pool.id} has invalid total weight: ${totalWeight}`);
    }

    this.pools.set(pool.id, pool);
  }

  /**
   * 敵グループを抽選する
   * @param poolId プールID
   * @param level レベル（省略時はプールのデフォルトレベルを使用）
   * @returns 抽選結果
   */
  rollEnemyGroup(poolId: UniqueId, level?: number): AppearanceResult {
    const pool = this.pools.get(poolId);
    if (!pool) {
      throw new Error(`Pool not found: ${poolId}`);
    }

    if (pool.appearances.length === 0) {
      throw new Error(`Pool ${poolId} has no appearances`);
    }

    // 重み付き抽選を行う
    const selectedAppearance = this.weightedRandom(pool.appearances);

    // レベルを決定
    const effectiveLevel = level !== undefined ? level : (pool.defaultLevel || 1);

    // 敵グループを生成
    const enemies = this.enemyGroupService.generateEnemyGroup(
      selectedAppearance.groupType,
      effectiveLevel
    );

    return {
      groupType: selectedAppearance.groupType,
      enemies
    };
  }

  /**
   * 重み付きランダム抽選を行う
   * @param appearances 出現設定リスト
   * @returns 選択された出現設定
   */
  private weightedRandom(appearances: EnemyGroupAppearance[]): EnemyGroupAppearance {
    // 総重みを計算
    const totalWeight = appearances.reduce((sum, app) => sum + app.weight, 0);

    // 0から総重みの範囲でランダムな値を生成
    let random = Math.random() * totalWeight;

    // 重みに基づいて選択
    for (const appearance of appearances) {
      random -= appearance.weight;
      if (random <= 0) {
        return appearance;
      }
    }

    // フォールバック（浮動小数点の誤差対策）
    return appearances[appearances.length - 1];
  }

  /**
   * プールを取得する
   * @param poolId プールID
   * @returns プール
   */
  getPool(poolId: UniqueId): EnemyAppearancePool | undefined {
    return this.pools.get(poolId);
  }

  /**
   * 全てのプールを取得する
   * @returns プールの配列
   */
  getAllPools(): EnemyAppearancePool[] {
    return Array.from(this.pools.values());
  }

  /**
   * プールを削除する
   * @param poolId プールID
   */
  removePool(poolId: UniqueId): boolean {
    return this.pools.delete(poolId);
  }

  /**
   * プール内の敵グループの出現率を更新する
   * @param poolId プールID
   * @param groupTypeId 敵グループタイプID
   * @param newWeight 新しい重み
   */
  updateAppearanceWeight(poolId: UniqueId, groupTypeId: UniqueId, newWeight: number): void {
    const pool = this.pools.get(poolId);
    if (!pool) {
      throw new Error(`Pool not found: ${poolId}`);
    }

    const appearance = pool.appearances.find(app => app.groupType.id === groupTypeId);
    if (!appearance) {
      throw new Error(`Group type ${groupTypeId} not found in pool ${poolId}`);
    }

    if (newWeight <= 0) {
      throw new Error('Weight must be greater than 0');
    }

    appearance.weight = newWeight;
  }

  /**
   * プールに敵グループを追加する
   * @param poolId プールID
   * @param appearance 追加する出現設定
   */
  addAppearanceToPool(poolId: UniqueId, appearance: EnemyGroupAppearance): void {
    const pool = this.pools.get(poolId);
    if (!pool) {
      throw new Error(`Pool not found: ${poolId}`);
    }

    // 既に存在するかチェック
    const exists = pool.appearances.some(app => app.groupType.id === appearance.groupType.id);
    if (exists) {
      throw new Error(`Group type ${appearance.groupType.id} already exists in pool ${poolId}`);
    }

    pool.appearances.push(appearance);
  }

  /**
   * プールから敵グループを削除する
   * @param poolId プールID
   * @param groupTypeId 削除する敵グループタイプID
   */
  removeAppearanceFromPool(poolId: UniqueId, groupTypeId: UniqueId): void {
    const pool = this.pools.get(poolId);
    if (!pool) {
      throw new Error(`Pool not found: ${poolId}`);
    }

    const index = pool.appearances.findIndex(app => app.groupType.id === groupTypeId);
    if (index === -1) {
      throw new Error(`Group type ${groupTypeId} not found in pool ${poolId}`);
    }

    if (pool.appearances.length === 1) {
      throw new Error(`Cannot remove last appearance from pool ${poolId}`);
    }

    pool.appearances.splice(index, 1);
  }
}
