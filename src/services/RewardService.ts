/**
 * RewardService - 報酬処理サービス
 * 戦闘報酬の配分とレベルアップ処理を管理
 */

import type { Combatant } from '../types/combatant';
import type { BaseStats, DefaultStats } from '../types/stats';
import type { BattleRewards } from '../types/battle';
import type { 
  ExpDistribution, 
  LevelUpResult, 
  RewardDistributionResult 
} from '../types/reward';
import * as growth from '../character/growth';

/**
 * RewardService
 * 報酬処理を管理するサービスクラス
 */
export class RewardService<TStats extends BaseStats = DefaultStats> {
  constructor() {
    // 初期化処理
  }

  /**
   * 経験値をパーティに配分
   * 
   * @param party - パーティメンバー
   * @param totalExp - 配分する総経験値
   * @returns 配分結果
   */
  distributeExp(party: Combatant<TStats>[], totalExp: number): ExpDistribution[] {
    const distribution = growth.distributeExpToParty(party, totalExp);
    const results: ExpDistribution[] = [];
    
    for (const [characterId, exp] of distribution.entries()) {
      const character = party.find(c => c.id === characterId);
      if (character) {
        character.currentExp = (character.currentExp || 0) + exp;
        results.push({ characterId, exp });
      }
    }
    
    return results;
  }

  /**
   * レベルアップ処理
   * 
   * @param character - 対象キャラクター
   * @returns レベルアップ結果の配列
   */
  processLevelUps(character: Combatant<TStats>): LevelUpResult<TStats>[] {
    const results: LevelUpResult<TStats>[] = [];
    
    // レベルアップ判定を繰り返す
    while (growth.canLevelUp(character.currentExp || 0, character.level)) {
      const expRequired = growth.getExpForLevel(character.level + 1);
      
      // レベルアップ
      character.level++;
      character.currentExp = (character.currentExp || 0) - expRequired;
      
      // ステータス成長
      const statGrowth = growth.calculateStatGrowth<TStats>(character.level);
      
      // ステータスを更新
      for (const [key, value] of Object.entries(statGrowth)) {
        const statKey = key as keyof TStats;
        if (typeof character.stats[statKey] === 'number' && typeof value === 'number') {
          (character.stats[statKey] as number) += value;
        }
      }
      
      // HP/MP全回復
      character.currentHp = character.stats.maxHp as number;
      character.currentMp = character.stats.maxMp as number;
      
      results.push({
        newLevel: character.level,
        statGrowth,
        newSkills: [] // スキル習得は後で実装
      });
    }
    
    return results;
  }

  /**
   * 報酬を一括で配分
   * 
   * @param party - パーティメンバー
   * @param rewards - 戦闘報酬
   * @returns 配分結果
   */
  distributeRewards(
    party: Combatant<TStats>[], 
    rewards: BattleRewards
  ): RewardDistributionResult<TStats> {
    // 経験値配分
    const expDistribution = this.distributeExp(party, rewards.exp);
    
    // レベルアップ処理
    const levelUpResults = new Map<string, LevelUpResult<TStats>[]>();
    for (const character of party) {
      const levelUps = this.processLevelUps(character);
      if (levelUps.length > 0) {
        levelUpResults.set(character.id, levelUps);
      }
    }
    
    return {
      expDistribution,
      levelUpResults,
      goldTotal: rewards.money,
      itemsReceived: rewards.items
    };
  }
}
