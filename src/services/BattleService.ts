/**
 * BattleService - 戦闘全体の進行管理
 * 
 * 戦闘開始から終了までの全体フローを管理し、ターン進行、フェーズ切り替え、勝敗判定を行う
 */

import { 
  BattleState, 
  BattlePhase, 
  Character, 
  Enemy, 
  BattleAction, 
  ActionResult, 
  BattleEndCheck, 
  EscapeResult, 
  BattleRewards,
  BattleResult
} from '../types';
import { calculateTurnOrder, checkPreemptiveStrike } from '../combat/turnOrder';
import { calculateDamage } from '../combat/damage';
import { checkHit, checkCritical, calculateHitRate, calculateCriticalRate } from '../combat/accuracy';
import { defaultGameConfig } from '../config/defaultConfig';
import { checkSkillCost, consumeSkillCost } from '../character/skillCost';

/**
 * BattleServiceクラス
 */
export class BattleService {
  private state: BattleState | null = null;

  /**
   * 戦闘を開始する
   * @param party プレイヤーパーティ
   * @param enemies 敵グループ
   */
  async startBattle(party: Character[], enemies: Enemy[]): Promise<void> {
    // 戦闘状態を初期化
    this.state = {
      phase: 'initializing' as BattlePhase,
      turnNumber: 0,
      playerParty: [...party],
      enemyGroup: [...enemies],
      turnOrder: [],
      currentActorIndex: 0,
      actionHistory: []
    };

    // 先制攻撃判定
    const preemptive = checkPreemptiveStrike(
      party,
      enemies,
      defaultGameConfig
    );

    // 行動順を計算
    const allCombatants = [...party, ...enemies];
    this.state.turnOrder = calculateTurnOrder(allCombatants, defaultGameConfig);

    // フェーズを設定
    this.state.phase = 'player-turn' as BattlePhase;
    this.state.turnNumber = 1;
  }

  /**
   * ターンを進める
   */
  async advanceTurn(): Promise<void> {
    if (!this.state) {
      throw new Error('Battle not started');
    }

    // 次の行動者を取得
    this.state.currentActorIndex++;

    // 全員の行動が終わったら新しいターンを開始
    if (this.state.currentActorIndex >= this.state.turnOrder.length) {
      this.state.currentActorIndex = 0;
      this.state.turnNumber++;
      
      // 行動順を再計算
      const allCombatants = [
        ...this.state.playerParty.filter(c => c.currentHp > 0),
        ...this.state.enemyGroup.filter(e => e.currentHp > 0)
      ];
      this.state.turnOrder = calculateTurnOrder(allCombatants, defaultGameConfig);
    }

    const actor = this.getCurrentActor();
    if (!actor) {
      return;
    }

    // 戦闘不能チェック
    if (actor.currentHp <= 0) {
      return this.advanceTurn();
    }

    // フェーズを設定
    if (this.isPlayerCharacter(actor)) {
      this.state.phase = 'player-turn' as BattlePhase;
    } else {
      this.state.phase = 'enemy-turn' as BattlePhase;
    }
  }

  /**
   * 行動を実行する
   * @param actor 行動者
   * @param action 行動
   */
  async executeAction(actor: any, action: BattleAction): Promise<ActionResult> {
    if (!this.state) {
      throw new Error('Battle not started');
    }

    this.state.phase = 'processing' as BattlePhase;

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
        const escapeResult = await this.attemptEscape();
        result = { success: escapeResult.success, message: escapeResult.message };
        break;
      default:
        result = { success: false, message: 'Unknown action type' };
    }

    // 行動履歴に追加
    this.state.actionHistory.push(action);

    return result;
  }

  /**
   * 通常攻撃を実行する
   */
  private executeAttack(action: BattleAction): ActionResult {
    const attacker = action.actor;
    const target = action.targets[0];

    if (!target) {
      return { success: false, message: 'No target' };
    }

    // 簡易的な通常攻撃スキルを作成
    const basicAttackSkill: any = {
      accuracy: 0.95,
      isGuaranteedHit: false,
      power: 1.0,
      criticalBonus: 0,
      type: 'physical',
      element: 'none'
    };

    // 汎用ダメージ計算を使用
    const damageResult = calculateDamage(
      attacker,
      target,
      basicAttackSkill,
      defaultGameConfig
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
  private executeSkill(action: BattleAction): ActionResult {
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
      defaultGameConfig
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
   */
  private executeDefend(action: BattleAction): ActionResult {
    // 防御はステータス効果として実装する必要があるが、
    // 現時点では簡易実装
    return {
      success: true,
      message: `${action.actor.name} is defending!`
    };
  }

  /**
   * 逃走を試みる
   */
  async attemptEscape(): Promise<EscapeResult> {
    if (!this.state) {
      throw new Error('Battle not started');
    }

    // 逃走成功率を計算（簡易版）
    const partySpeed = this.state.playerParty.reduce((sum, c) => sum + c.stats.speed, 0) / this.state.playerParty.length;
    const enemySpeed = this.state.enemyGroup.reduce((sum, e) => sum + e.stats.speed, 0) / this.state.enemyGroup.length;
    
    const escapeRate = Math.min(0.95, Math.max(0.05, 0.5 + (partySpeed - enemySpeed) / 100));
    const success = Math.random() < escapeRate;

    if (success) {
      this.state.phase = 'ended' as BattlePhase;
      this.state.result = 'escaped' as BattleResult;
      return { success: true, message: 'Escaped successfully!' };
    }

    return { success: false, message: 'Failed to escape!' };
  }

  /**
   * 戦闘終了をチェックする
   */
  checkBattleEnd(): BattleEndCheck {
    if (!this.state) {
      return { isEnded: false };
    }

    // 勝利条件：全ての敵が倒れた
    const aliveEnemies = this.state.enemyGroup.filter(e => e.currentHp > 0);
    if (aliveEnemies.length === 0) {
      return { isEnded: true, result: 'victory' as BattleResult };
    }

    // 敗北条件：全てのプレイヤーが倒れた
    const aliveParty = this.state.playerParty.filter(c => c.currentHp > 0);
    if (aliveParty.length === 0) {
      return { isEnded: true, result: 'defeat' as BattleResult };
    }

    return { isEnded: false };
  }

  /**
   * 戦闘を終了する
   * @param restoreHp 戦闘終了後にHPを回復するか（デフォルト: false）
   */
  endBattle(restoreHp: boolean = false): BattleRewards {
    if (!this.state) {
      throw new Error('Battle not started');
    }

    this.state.phase = 'ended' as BattlePhase;

    // HPを回復
    if (restoreHp) {
      for (const character of this.state.playerParty) {
        if (character.currentHp > 0) {
          character.currentHp = character.stats.maxHp;
        }
      }
    }

    // 報酬を計算
    let totalExp = 0;
    let totalMoney = 0;
    const items: any[] = [];

    for (const enemy of this.state.enemyGroup) {
      totalExp += enemy.expReward || 0;
      totalMoney += enemy.moneyReward || 0;
      
      // ドロップ判定
      if (enemy.dropItems) {
        for (const drop of enemy.dropItems) {
          if (Math.random() < drop.probability) {
            items.push(drop);
          }
        }
      }
    }

    const rewards: BattleRewards = {
      exp: totalExp,
      money: totalMoney,
      items
    };

    this.state.rewards = rewards;
    return rewards;
  }

  /**
   * 現在の戦闘状態を取得する
   */
  getState(): BattleState {
    if (!this.state) {
      throw new Error('Battle not started');
    }
    return this.state;
  }

  /**
   * 現在の行動者を取得する
   */
  getCurrentActor(): any {
    if (!this.state || this.state.currentActorIndex >= this.state.turnOrder.length) {
      return null;
    }
    return this.state.turnOrder[this.state.currentActorIndex];
  }

  /**
   * プレイヤーキャラクターかどうかを判定する
   */
  private isPlayerCharacter(actor: any): boolean {
    if (!this.state) return false;
    return this.state.playerParty.some(c => c.id === actor.id);
  }


}
