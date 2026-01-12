/**
 * RewardService - 報酬処理サービス
 * 戦闘報酬の配分とレベルアップ処理を管理
 */

import type { Combatant } from '../types/combatant';
import type { BaseStats, DefaultStats } from '../types/stats';
import type { BattleRewards } from '../types/battle';
import type { BaseExpCurveType, DefaultExpCurveType } from '../types/config';
import type { 
  ExpDistribution, 
  LevelUpResult, 
  RewardDistributionResult 
} from '../types/reward';
import * as growth from '../character/growth';

/**
 * RewardService設定
 */
export interface RewardServiceConfig<
  TExpCurve extends BaseExpCurveType = DefaultExpCurveType,
  TStats extends BaseStats = DefaultStats
> {
  expCurve?: growth.ExpCurveConfig<TExpCurve>;
  statGrowth?: growth.StatGrowthConfig<TStats>;
}

/**
 * RewardService
 * 報酬処理を管理するサービスクラス
 * 
 * @template TExpCurve - 経験値曲線タイプ（デフォルト: DefaultExpCurveType）
 * @template TStats - ステータスの型（デフォルト: DefaultStats）
 * 
 * @example
 * // デフォルト設定で使用
 * const service = new RewardService();
 * 
 * @example
 * // カスタム経験値曲線で使用
 * const service = new RewardService({
 *   expCurve: { type: 'exponential', baseExpRequired: 100, expGrowthRate: 1.5 }
 * });
 * 
 * @example
 * // カスタム成長率で使用
 * const service = new RewardService({
 *   statGrowth: {
 *     growthRates: { maxHp: 15, maxMp: 8, attack: 4, ... },
 *     useRandomVariance: true,
 *     variancePercent: 0.1
 *   }
 * });
 */
export class RewardService<
  TExpCurve extends BaseExpCurveType = DefaultExpCurveType,
  TStats extends BaseStats = DefaultStats
> {
  private config: RewardServiceConfig<TExpCurve, TStats>;

  constructor(config?: RewardServiceConfig<TExpCurve, TStats>) {
    this.config = config || {};
  }

  /**
   * 経験値をパーティに配分
   * 
   * @param party - パーティメンバー
   * @param totalExp - 配分する総経験値
   * @param totalJobExp - 配分する総ジョブ経験値（オプション）
   * @returns 配分結果
   */
  distributeExp(party: Combatant<TStats>[], totalExp: number, totalJobExp?: number): ExpDistribution[] {
    const distribution = growth.distributeExpToParty(party, totalExp);
    const jobExpDistribution = totalJobExp ? growth.distributeExpToParty(party, totalJobExp) : null;
    const results: ExpDistribution[] = [];
    
    for (const [characterId, exp] of distribution.entries()) {
      const character = party.find(c => c.id === characterId);
      if (character) {
        character.currentExp = (character.currentExp || 0) + exp;
        
        const jobExp = jobExpDistribution?.get(characterId) || 0;
        if (jobExp > 0) {
          (character as any).jobExp = ((character as any).jobExp || 0) + jobExp;
        }
        
        results.push({ 
          characterId, 
          exp,
          jobExp: jobExp > 0 ? jobExp : undefined
        });
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
    while (growth.canLevelUp(character.currentExp || 0, character.level, this.config.expCurve)) {
      // レベルアップ
      character.level++;
      
      // ステータス成長
      const statGrowth = growth.calculateStatGrowth<TStats>(character.level, this.config.statGrowth);
      
      // ステータスを更新
      for (const [key, value] of Object.entries(statGrowth)) {
        const statKey = key as keyof TStats;
        if (typeof character.stats[statKey] === 'number' && typeof value === 'number') {
          character.stats[statKey] = (character.stats[statKey] as number) + value as TStats[keyof TStats];
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
    
    // ジョブレベルアップ判定
    const jobExp = (character as any).jobExp || 0;
    const jobLevel = (character as any).jobLevel || 1;
    
    while (growth.canJobLevelUp(jobExp, jobLevel, this.config.expCurve)) {
      (character as any).jobLevel = jobLevel + 1;
      
      results.push({
        newLevel: character.level,
        statGrowth: {},
        newSkills: [],
        jobLevelUp: true,
        newJobLevel: (character as any).jobLevel
      });
      
      break; // 1回のみジョブレベルアップ処理
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
    // 経験値配分（ジョブ経験値も含む）
    const expDistribution = this.distributeExp(party, rewards.exp, rewards.jobExp);
    
    // レベルアップ処理（ジョブレベルアップも含む）
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
