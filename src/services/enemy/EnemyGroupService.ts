/**
 * EnemyGroupService - 敵グループ管理
 * 
 * 戦闘に登場する敵グループの生成、管理、ドロップアイテムの決定を行う
 */

import { Enemy, DropItem } from '../../types';
import { UniqueId } from '../../types/common';
import { DefaultStats } from '../../types/character/stats';

/**
 * 敵タイプ定義
 */
export interface EnemyType {
  id: UniqueId;                          // 敵タイプID
  name: string;                          // 敵の名前
  baseStats: DefaultStats;               // 基本ステータス
  skills: any[];                         // スキルリスト
  aiStrategy: 'aggressive' | 'defensive' | 'balanced' | 'random' | 'support'; // AI戦略
  expReward: number;                     // 基本経験値
  moneyReward: number;                   // 基本お金
  dropItems?: DropItem[];                // ドロップアイテム
  statMultipliers?: Partial<Record<keyof DefaultStats, number>>; // ステータスごとの上昇倍率
}

/**
 * 敵グループ定義
 */
export interface EnemyGroupType {
  id: UniqueId;              // グループID
  name: string;              // グループ名
  enemies: {                 // 敵の構成
    typeId: UniqueId;        // 敵タイプID
    count: number;           // 数
    level?: number;          // 個別レベル指定（オプション）
  }[];
  difficulty: number;        // 難易度（1.0が基準）
}

/**
 * EnemyGroupServiceクラス
 */
export class EnemyGroupService {
  private enemyTypes: Map<UniqueId, EnemyType> = new Map();

  /**
   * 敵タイプを登録する
   * @param enemyType 敵タイプ
   */
  registerEnemyType(enemyType: EnemyType): void {
    this.enemyTypes.set(enemyType.id, enemyType);
  }

  /**
   * 敵グループを生成する
   * @param groupType グループタイプ
   * @param level デフォルトレベル（個別レベルが指定されていない敵に適用）
   */
  generateEnemyGroup(groupType: EnemyGroupType, level: number): Enemy[] {
    const enemies: Enemy[] = [];

    for (const composition of groupType.enemies) {
      const enemyType = this.enemyTypes.get(composition.typeId);
      if (!enemyType) {
        throw new Error(`Enemy type not found: ${composition.typeId}`);
      }

      // 個別レベル指定があればそれを使用、なければデフォルトレベルを使用
      const enemyLevel = composition.level !== undefined ? composition.level : level;

      for (let i = 0; i < composition.count; i++) {
        const enemy = this.initializeEnemy(enemyType, enemyLevel);
        enemies.push(enemy);
      }
    }

    return enemies;
  }

  /**
   * 敵を初期化する
   * @param enemyType 敵タイプ
   * @param level レベル
   */
  initializeEnemy(enemyType: EnemyType, level: number): Enemy {
    // ステータスをレベルに応じてスケーリング
    const stats = this.scaleStats(enemyType.baseStats, level, enemyType.statMultipliers);

    // ユニークIDを生成
    const id = `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as UniqueId;

    return {
      id,
      name: enemyType.name,
      level,
      stats,
      currentHp: stats.maxHp,
      currentMp: stats.maxMp,
      skills: [...enemyType.skills],
      statusEffects: [],
      position: 0,
      enemyType: enemyType.id,
      aiStrategy: enemyType.aiStrategy,
      dropItems: enemyType.dropItems,
      expReward: Math.floor(enemyType.expReward * (1 + (level - 1) * 0.1)),
      moneyReward: Math.floor(enemyType.moneyReward * (1 + (level - 1) * 0.1))
    };
  }

  /**
   * ドロップアイテムを判定する
   * @param defeatedEnemies 倒した敵リスト
   */
  rollDrops(defeatedEnemies: Enemy[]): DropItem[] {
    const droppedItems: DropItem[] = [];

    for (const enemy of defeatedEnemies) {
      if (!enemy.dropItems) {
        continue;
      }

      for (const drop of enemy.dropItems) {
        if (Math.random() < drop.probability) {
          droppedItems.push({
            itemId: drop.itemId,
            probability: drop.probability,
            quantity: drop.quantity
          });
        }
      }
    }

    return droppedItems;
  }

  /**
   * 報酬を計算する
   * @param defeatedEnemies 倒した敵リスト
   */
  calculateRewards(defeatedEnemies: Enemy[]): { exp: number; money: number } {
    let totalExp = 0;
    let totalMoney = 0;

    for (const enemy of defeatedEnemies) {
      totalExp += enemy.expReward || 0;
      totalMoney += enemy.moneyReward || 0;
    }

    return {
      exp: totalExp,
      money: totalMoney
    };
  }

  /**
   * ステータスをスケーリングする
   * @param baseStats 基本ステータス
   * @param level レベル
   * @param statMultipliers ステータスごとの倍率（オプション）
   */
  private scaleStats(
    baseStats: DefaultStats, 
    level: number, 
    statMultipliers?: Partial<Record<keyof DefaultStats, number>>
  ): DefaultStats {
    const defaultMultiplier = 1 + (level - 1) * 0.1; // レベルごとに10%増加（デフォルト）
    
    return {
      maxHp: Math.floor(baseStats.maxHp * (statMultipliers?.maxHp !== undefined ? 1 + (level - 1) * statMultipliers.maxHp : defaultMultiplier)),
      maxMp: Math.floor(baseStats.maxMp * (statMultipliers?.maxMp !== undefined ? 1 + (level - 1) * statMultipliers.maxMp : defaultMultiplier)),
      attack: Math.floor(baseStats.attack * (statMultipliers?.attack !== undefined ? 1 + (level - 1) * statMultipliers.attack : defaultMultiplier)),
      defense: Math.floor(baseStats.defense * (statMultipliers?.defense !== undefined ? 1 + (level - 1) * statMultipliers.defense : defaultMultiplier)),
      magic: Math.floor(baseStats.magic * (statMultipliers?.magic !== undefined ? 1 + (level - 1) * statMultipliers.magic : defaultMultiplier)),
      magicDefense: Math.floor(baseStats.magicDefense * (statMultipliers?.magicDefense !== undefined ? 1 + (level - 1) * statMultipliers.magicDefense : defaultMultiplier)),
      speed: Math.floor(baseStats.speed * (statMultipliers?.speed !== undefined ? 1 + (level - 1) * statMultipliers.speed : defaultMultiplier)),
      luck: Math.floor(baseStats.luck * (statMultipliers?.luck !== undefined ? 1 + (level - 1) * statMultipliers.luck : defaultMultiplier)),
      accuracy: Math.floor(baseStats.accuracy * (statMultipliers?.accuracy !== undefined ? 1 + (level - 1) * statMultipliers.accuracy : defaultMultiplier)),
      evasion: Math.floor(baseStats.evasion * (statMultipliers?.evasion !== undefined ? 1 + (level - 1) * statMultipliers.evasion : defaultMultiplier)),
      criticalRate: baseStats.criticalRate * (statMultipliers?.criticalRate !== undefined ? 1 + (level - 1) * statMultipliers.criticalRate : defaultMultiplier)
    };
  }

  /**
   * 敵タイプを取得する
   * @param typeId 敵タイプID
   */
  getEnemyType(typeId: UniqueId): EnemyType | undefined {
    return this.enemyTypes.get(typeId);
  }

  /**
   * 全ての敵タイプを取得する
   */
  getAllEnemyTypes(): EnemyType[] {
    return Array.from(this.enemyTypes.values());
  }
}
