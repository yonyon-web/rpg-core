/**
 * BattleActionExecutor - 戦闘アクション実行サービス
 * 
 * 戦闘中の個別アクション（攻撃、スキル、防御、逃走）の実行を担当
 * BattleServiceから責任を分離し、単一責任原則（SRP）に準拠
 */

import {
  BattleAction,
  ActionResult,
  EscapeResult,
  BattleState,
  GameConfig
} from '../types';
import { Skill } from '../types/skill';
import { calculateDamage } from '../combat/damage';
import { checkSkillCost, consumeSkillCost } from '../character/skillCost';

/**
 * BattleActionExecutorクラス
 */
export class BattleActionExecutor {
  private config: GameConfig;

  /**
   * コンストラクタ
   * @param config ゲーム設定
   */
  constructor(config: GameConfig) {
    this.config = config;
  }

  /**
   * 行動を実行する
   * @param action 行動
   * @param battleState 戦闘状態（逃走判定に必要）
   */
  async executeAction(action: BattleAction, battleState?: BattleState): Promise<ActionResult> {
    let result: ActionResult = { success: false };

    switch (action.type) {
      case 'attack':
        result = this.executeAttack(action);
        break;
      case 'skill':
        result = this.executeSkill(action);
        break;
      case 'defend':
        result = this.executeDefend(action);
        break;
      case 'escape':
        if (!battleState) {
          result = { success: false, message: 'Battle state required for escape' };
        } else {
          const escapeResult = await this.attemptEscape(battleState);
          result = { success: escapeResult.success, message: escapeResult.message };
        }
        break;
      default:
        result = { success: false, message: 'Unknown action type' };
    }

    return result;
  }

  /**
   * 通常攻撃を実行する
   */
  executeAttack(action: BattleAction): ActionResult {
    const attacker = action.actor;
    const target = action.targets[0];

    if (!target) {
      return { success: false, message: 'No target' };
    }

    // 簡易的な通常攻撃スキルを作成
    const basicAttackSkill = {
      accuracy: 0.95,
      isGuaranteedHit: false,
      power: 1.0,
      criticalBonus: 0,
      type: 'physical',
      element: 'none'
    } as Skill;

    // 汎用ダメージ計算を使用
    const damageResult = calculateDamage(
      attacker,
      target,
      basicAttackSkill,
      this.config
    );

    // ミスの場合
    if (!damageResult.isHit) {
      return { success: true, missed: true, message: 'Miss!' };
    }

    // ダメージを適用
    target.currentHp = Math.max(0, target.currentHp - damageResult.finalDamage);

    return {
      success: true,
      damage: damageResult.finalDamage,
      critical: damageResult.isCritical,
      message: damageResult.isCritical ? 'Critical hit!' : 'Hit!'
    };
  }

  /**
   * スキルを実行する
   */
  executeSkill(action: BattleAction): ActionResult {
    const attacker = action.actor;
    const skill = action.skill;
    const target = action.targets[0];

    if (!skill || !target) {
      return { success: false, message: 'Invalid skill or target' };
    }

    // コスト消費チェック
    const costCheck = checkSkillCost(attacker, skill);
    if (!costCheck.canUse) {
      return { success: false, message: costCheck.message || 'Cannot use skill' };
    }

    // コスト消費
    consumeSkillCost(attacker, skill);

    // 回復スキルの場合
    if (skill.type === 'heal') {
      const healAmount = Math.floor(attacker.stats.magic * skill.power);
      target.currentHp = Math.min(target.stats.maxHp, target.currentHp + healAmount);
      return {
        success: true,
        heal: healAmount,
        message: `Healed ${healAmount} HP!`
      };
    }

    // ダメージスキルの場合：汎用ダメージ計算を使用
    // これにより任意のスキルタイプ（physical, magic, laser, plasma等）に対応
    const damageResult = calculateDamage(
      attacker,
      target,
      skill,
      this.config
    );

    // ミスの場合
    if (!damageResult.isHit) {
      return { success: true, missed: true, message: 'Miss!' };
    }

    // ダメージを適用
    target.currentHp = Math.max(0, target.currentHp - damageResult.finalDamage);

    return {
      success: true,
      damage: damageResult.finalDamage,
      critical: damageResult.isCritical,
      message: damageResult.isCritical ? 'Critical hit!' : 'Hit!'
    };
  }

  /**
   * 防御を実行する
   * 防御時に防御力アップの状態異常を付与する
   */
  executeDefend(action: BattleAction): ActionResult {
    const actor = action.actor;
    
    // 防御状態異常を作成
    const defendEffect = {
      id: `defend-${actor.id}-${Date.now()}`,
      type: 'defense-up' as const,
      category: 'buff' as const,
      name: '防御',
      description: '防御力が上昇している',
      power: 2.0, // 防御力2倍
      duration: 1, // 次のターン開始まで
      maxDuration: 1,
      stackCount: 1,
      maxStack: 1,
      canBeDispelled: true,
      appliedAt: Date.now(),
      source: actor.id
    };
    
    // 状態異常を付与
    actor.statusEffects.push(defendEffect);
    
    return {
      success: true,
      message: `${action.actor.name} is defending!`
    };
  }

  /**
   * 逃走を試みる
   */
  async attemptEscape(battleState: BattleState): Promise<EscapeResult> {
    // 逃走成功率を計算（簡易版）
    const partySpeed = battleState.playerParty.reduce((sum, c) => sum + c.stats.speed, 0) / battleState.playerParty.length;
    const enemySpeed = battleState.enemyGroup.reduce((sum, e) => sum + e.stats.speed, 0) / battleState.enemyGroup.length;
    
    const escapeRate = Math.min(0.95, Math.max(0.05, 0.5 + (partySpeed - enemySpeed) / 100));
    const success = Math.random() < escapeRate;

    if (success) {
      return { success: true, message: 'Escaped successfully!' };
    }

    return { success: false, message: 'Failed to escape!' };
  }
}
