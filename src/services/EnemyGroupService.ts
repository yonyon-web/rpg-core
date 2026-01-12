/**
 * EnemyGroupService - 敵グループ管理
 * 
 * 戦闘に登場する敵グループの生成、管理、ドロップアイテムの決定を行う
 */

import { Enemy, DropItem } from '../types';
import { UniqueId } from '../types/common';
import { DefaultStats } from '../types/stats';

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
   * @param level レベル
   */
  generateEnemyGroup(groupType: EnemyGroupType, level: number): Enemy[] {
    const enemies: Enemy[] = [];

    for (const composition of groupType.enemies) {
      const enemyType = this.enemyTypes.get(composition.typeId);
      if (!enemyType) {
        throw new Error(`Enemy type not found: ${composition.typeId}`);
      }

      for (let i = 0; i < composition.count; i++) {
        const enemy = this.initializeEnemy(enemyType, level);
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
    const levelMultiplier = 1 + (level - 1) * 0.1; // レベルごとに10%増加
    const stats = this.scaleStats(enemyType.baseStats, levelMultiplier);

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
      expReward: Math.floor(enemyType.expReward * levelMultiplier),
      moneyReward: Math.floor(enemyType.moneyReward * levelMultiplier)
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
   * @param multiplier 倍率
   */
  private scaleStats(baseStats: DefaultStats, multiplier: number): DefaultStats {
    return {
      maxHp: Math.floor(baseStats.maxHp * multiplier),
      maxMp: Math.floor(baseStats.maxMp * multiplier),
      attack: Math.floor(baseStats.attack * multiplier),
      defense: Math.floor(baseStats.defense * multiplier),
      magic: Math.floor(baseStats.magic * multiplier),
      magicDefense: Math.floor(baseStats.magicDefense * multiplier),
      speed: Math.floor(baseStats.speed * multiplier),
      luck: Math.floor(baseStats.luck * multiplier),
      accuracy: Math.floor(baseStats.accuracy * multiplier),
      evasion: Math.floor(baseStats.evasion * multiplier),
      criticalRate: baseStats.criticalRate * multiplier
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
