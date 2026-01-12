/**
 * EnemyGroupService - 敵グループ管理
 * 
 * 戦闘に登場する敵グループの生成、管理、ドロップアイテムの決定を行う
 */

import { Enemy, DropItem, BattleRewards } from '../types';
import { GameTypeConfig } from '../types/gameTypes';
import { UniqueId } from '../types/common';

/**
 * 敵タイプ定義
 */
export interface EnemyType<TConfig extends GameTypeConfig = GameTypeConfig> {
  id: UniqueId;                          // 敵タイプID
  name: string;                          // 敵の名前
  baseStats: TConfig['TStats'];          // 基本ステータス
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
export class EnemyGroupService<TConfig extends GameTypeConfig = GameTypeConfig> {
  private enemyTypes: Map<UniqueId, EnemyType<TConfig>> = new Map();

  /**
   * 敵タイプを登録する
   * @param enemyType 敵タイプ
   */
  registerEnemyType(enemyType: EnemyType<TConfig>): void {
    this.enemyTypes.set(enemyType.id, enemyType);
  }

  /**
   * 敵グループを生成する
   * @param groupType グループタイプ
   * @param level レベル
   */
  generateEnemyGroup(groupType: EnemyGroupType, level: number): Enemy<TConfig>[] {
    const enemies: Enemy<TConfig>[] = [];

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
  initializeEnemy(enemyType: EnemyType<TConfig>, level: number): Enemy<TConfig> {
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
  rollDrops(defeatedEnemies: Enemy<TConfig>[]): DropItem[] {
    const droppedItems: DropItem[] = [];

    for (const enemy of defeatedEnemies) {
      if (!enemy.dropItems) {
        continue;
      }

      for (const drop of enemy.dropItems) {
        // ドロップ判定
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
  calculateRewards(defeatedEnemies: Enemy<TConfig>[]): { exp: number; money: number } {
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
  private scaleStats(baseStats: TConfig['TStats'], multiplier: number): TConfig['TStats'] {
    const scaled: any = { ...baseStats };

    // 数値プロパティをスケーリング
    for (const key in scaled) {
      if (typeof scaled[key] === 'number') {
        scaled[key] = Math.floor(scaled[key] * multiplier);
      }
    }

    return scaled;
  }

  /**
   * 敵タイプを取得する
   * @param typeId 敵タイプID
   */
  getEnemyType(typeId: UniqueId): EnemyType<TConfig> | undefined {
    return this.enemyTypes.get(typeId);
  }

  /**
   * 全ての敵タイプを取得する
   */
  getAllEnemyTypes(): EnemyType<TConfig>[] {
    return Array.from(this.enemyTypes.values());
  }
}
