/**
 * EnemyAIService - 敵の行動自動決定
 * 
 * 敵の行動を自動決定する。AI戦略に基づいてスキルとターゲットを選択
 */

import {
  Enemy,
  BattleState,
  BattleAction,
  BattleSituation,
  SkillEvaluation,
  TargetEvaluation,
  AIDecision,
  AIStrategy
} from '../types';
import { GameTypeConfig } from '../types/gameTypes';
import { Skill } from '../types/skill';
import { Combatant } from '../types/combatant';

/**
 * EnemyAIServiceクラス
 */
export class EnemyAIService<TConfig extends GameTypeConfig = GameTypeConfig> {
  /**
   * 行動を決定する
   * @param enemy 敵
   * @param battleState 戦闘状態
   */
  async decideAction(enemy: Enemy<TConfig>, battleState: BattleState<TConfig>): Promise<BattleAction<TConfig>> {
    // 戦闘状況を構築
    const situation = this.buildBattleSituation(battleState);

    // 使用可能なスキルを取得
    const availableSkills = this.getAvailableSkills(enemy);

    if (availableSkills.length === 0) {
      // スキルがない場合は通常攻撃
      const target = this.selectDefaultTarget(battleState.playerParty.filter(c => c.currentHp > 0));
      return {
        actor: enemy,
        type: 'attack',
        targets: [target]
      };
    }

    // スキルを評価
    const skillEvaluations = this.evaluateSkills(enemy, availableSkills, situation);

    // 最適なスキルを選択
    const bestSkill = this.selectBestSkill(skillEvaluations, enemy.aiStrategy);

    // 対象候補を取得
    const possibleTargets = this.getPossibleTargets(bestSkill, battleState);

    // ターゲットを評価
    const targetEvaluations = this.evaluateTargets(enemy, bestSkill, possibleTargets);

    // 最適なターゲットを選択
    const bestTarget = this.selectBestTarget(targetEvaluations, enemy.aiStrategy);

    // 全体攻撃の場合は全員をターゲットに
    const targets = bestSkill.targetType === 'all-enemies' 
      ? possibleTargets 
      : [bestTarget];

    return {
      actor: enemy,
      type: 'skill',
      skill: bestSkill,
      targets
    };
  }

  /**
   * スキルを評価する
   * @param enemy 敵
   * @param skills スキルリスト
   * @param situation 戦闘状況
   */
  evaluateSkills(
    enemy: Enemy<TConfig>,
    skills: Skill<TConfig['TElement'], TConfig['TSkillType'], TConfig['TTargetType'], TConfig['TEffectType']>[],
    situation: BattleSituation<TConfig>
  ): SkillEvaluation<TConfig>[] {
    return skills.map(skill => {
      let score = 0;

      // 基本スコア：威力
      score += skill.power * 10;

      // スキルタイプによる評価
      if (skill.type === 'heal' && situation.averageAllyHpRate < 0.5) {
        // 味方のHPが低い場合は回復スキルを高く評価
        score += 50;
      } else if (skill.type === 'physical' || skill.type === 'magic') {
        // 攻撃スキルは敵のHP率が高いほど有効
        score += situation.averageEnemyHpRate * 30;
      }

      // 全体攻撃は複数の敵がいる場合に有効
      if (skill.targetType === 'all-enemies') {
        const aliveEnemies = situation.enemyParty.filter(c => c.currentHp > 0).length;
        score += aliveEnemies * 10;
      }

      // MP効率を考慮
      if (skill.mpCost > 0) {
        const mpRatio = enemy.currentMp / enemy.stats.maxMp;
        if (mpRatio < 0.3) {
          // MPが少ない場合は低コストスキルを優先
          score -= skill.mpCost * 2;
        }
      }

      return {
        skill,
        score,
        reason: `Score: ${score}`
      };
    });
  }

  /**
   * ターゲットを評価する
   * @param enemy 敵
   * @param skill スキル
   * @param targets ターゲットリスト
   */
  evaluateTargets(
    enemy: Enemy<TConfig>,
    skill: Skill<TConfig['TElement'], TConfig['TSkillType'], TConfig['TTargetType'], TConfig['TEffectType']>,
    targets: Combatant<TConfig['TStats'], TConfig['TEffectType'], TConfig['TEffectCategory']>[]
  ): TargetEvaluation<TConfig>[] {
    return targets.map(target => {
      let score = 0;

      // HP率が低いターゲットを優先（倒しやすい）
      const hpRate = target.currentHp / target.stats.maxHp;
      score += (1 - hpRate) * 50;

      // 防御力の低いターゲットを優先
      if (skill.type === 'physical') {
        score += (100 - target.stats.defense) / 2;
      } else if (skill.type === 'magic') {
        score += (100 - target.stats.magicDefense) / 2;
      }

      // 予想ダメージを計算（簡易版）
      let expectedDamage = 0;
      if (skill.type === 'physical') {
        expectedDamage = Math.max(1, (enemy.stats.attack - target.stats.defense) * skill.power);
      } else if (skill.type === 'magic') {
        expectedDamage = Math.max(1, (enemy.stats.magicAttack - target.stats.magicDefense) * skill.power);
      }

      score += expectedDamage / 10;

      return {
        target,
        score,
        expectedDamage,
        reason: `HP: ${Math.floor(hpRate * 100)}%, Damage: ${expectedDamage}`
      };
    });
  }

  /**
   * 最適なスキルを選択する
   * @param evaluations スキル評価リスト
   * @param strategy AI戦略
   */
  selectBestSkill(
    evaluations: SkillEvaluation<TConfig>[],
    strategy: AIStrategy
  ): Skill<TConfig['TElement'], TConfig['TSkillType'], TConfig['TTargetType'], TConfig['TEffectType']> {
    if (evaluations.length === 0) {
      throw new Error('No skills available');
    }

    if (strategy === 'random') {
      // ランダム選択
      const randomIndex = Math.floor(Math.random() * evaluations.length);
      return evaluations[randomIndex].skill;
    }

    // 最高スコアのスキルを選択
    const sorted = [...evaluations].sort((a, b) => b.score - a.score);
    return sorted[0].skill;
  }

  /**
   * 最適なターゲットを選択する
   * @param evaluations ターゲット評価リスト
   * @param strategy AI戦略
   */
  selectBestTarget(
    evaluations: TargetEvaluation<TConfig>[],
    strategy: AIStrategy
  ): Combatant<TConfig['TStats'], TConfig['TEffectType'], TConfig['TEffectCategory']> {
    if (evaluations.length === 0) {
      throw new Error('No targets available');
    }

    if (strategy === 'random') {
      // ランダム選択
      const randomIndex = Math.floor(Math.random() * evaluations.length);
      return evaluations[randomIndex].target;
    }

    // AI戦略に応じた選択
    switch (strategy) {
      case 'aggressive':
        // 最もダメージを与えられるターゲット
        const sorted = [...evaluations].sort((a, b) => b.score - a.score);
        return sorted[0].target;

      case 'defensive':
        // ランダム（防御戦略は味方を守るため、対象選択は通常）
        return evaluations[0].target;

      case 'balanced':
      default:
        // バランス型：最高スコア
        const balancedSorted = [...evaluations].sort((a, b) => b.score - a.score);
        return balancedSorted[0].target;
    }
  }

  /**
   * 使用可能なスキルを取得する
   * @param enemy 敵
   */
  private getAvailableSkills(
    enemy: Enemy<TConfig>
  ): Skill<TConfig['TElement'], TConfig['TSkillType'], TConfig['TTargetType'], TConfig['TEffectType']>[] {
    return enemy.skills.filter(skill => enemy.currentMp >= skill.mpCost);
  }

  /**
   * 戦闘状況を構築する
   * @param battleState 戦闘状態
   */
  private buildBattleSituation(battleState: BattleState<TConfig>): BattleSituation<TConfig> {
    const aliveAllies = battleState.enemyGroup.filter(e => e.currentHp > 0);
    const aliveEnemies = battleState.playerParty.filter(c => c.currentHp > 0);

    const averageAllyHpRate = aliveAllies.length > 0
      ? aliveAllies.reduce((sum, e) => sum + e.currentHp / e.stats.maxHp, 0) / aliveAllies.length
      : 0;

    const averageEnemyHpRate = aliveEnemies.length > 0
      ? aliveEnemies.reduce((sum, c) => sum + c.currentHp / c.stats.maxHp, 0) / aliveEnemies.length
      : 0;

    return {
      turn: battleState.turnNumber,
      allyParty: battleState.enemyGroup,
      enemyParty: battleState.playerParty,
      averageAllyHpRate,
      averageEnemyHpRate,
      defeatedAllies: battleState.enemyGroup.filter(e => e.currentHp <= 0).length,
      defeatedEnemies: battleState.playerParty.filter(c => c.currentHp <= 0).length
    };
  }

  /**
   * 可能なターゲットを取得する
   * @param skill スキル
   * @param battleState 戦闘状態
   */
  private getPossibleTargets(
    skill: Skill<TConfig['TElement'], TConfig['TSkillType'], TConfig['TTargetType'], TConfig['TEffectType']>,
    battleState: BattleState<TConfig>
  ): Combatant<TConfig['TStats'], TConfig['TEffectType'], TConfig['TEffectCategory']>[] {
    switch (skill.targetType) {
      case 'single-enemy':
      case 'all-enemies':
        return battleState.playerParty.filter(c => c.currentHp > 0);
      case 'single-ally':
      case 'all-allies':
      case 'self':
        return battleState.enemyGroup.filter(e => e.currentHp > 0);
      default:
        return battleState.playerParty.filter(c => c.currentHp > 0);
    }
  }

  /**
   * デフォルトのターゲットを選択する（通常攻撃用）
   * @param targets ターゲットリスト
   */
  private selectDefaultTarget(
    targets: Combatant<TConfig['TStats'], TConfig['TEffectType'], TConfig['TEffectCategory']>[]
  ): Combatant<TConfig['TStats'], TConfig['TEffectType'], TConfig['TEffectCategory']> {
    if (targets.length === 0) {
      throw new Error('No targets available');
    }

    // ランダムに選択
    return targets[Math.floor(Math.random() * targets.length)];
  }
}
