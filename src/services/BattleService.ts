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
  BattleRewards,
  BattleResult,
  GameConfig
} from '../types';
import { calculateTurnOrder, checkPreemptiveStrike } from '../combat/turnOrder';
import { defaultGameConfig } from '../config/defaultConfig';
import { filterAlive, isDead, allDead } from '../combat/combatantState';
import { BattleActionExecutor } from './BattleActionExecutor';
import { RewardService } from './RewardService';

/**
 * BattleServiceクラス
 */
export class BattleService {
  private state: BattleState | null = null;
  private config: GameConfig;
  private actionExecutor: BattleActionExecutor;
  private rewardService: RewardService;

  /**
   * コンストラクタ
   * @param config ゲーム設定（省略時はdefaultGameConfigを使用）
   */
  constructor(config?: GameConfig) {
    this.config = config || defaultGameConfig;
    this.actionExecutor = new BattleActionExecutor(this.config);
    // RewardServiceはデフォルトの型パラメータを使用（DefaultExpCurveType, DefaultStats）
    this.rewardService = new RewardService();
  }

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
      this.config
    );

    // 行動順を計算
    const allCombatants = [...party, ...enemies];
    this.state.turnOrder = calculateTurnOrder(allCombatants, this.config);

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
        ...filterAlive(this.state.playerParty),
        ...filterAlive(this.state.enemyGroup)
      ];
      this.state.turnOrder = calculateTurnOrder(allCombatants, this.config);
    }

    const actor = this.getCurrentActor();
    if (!actor) {
      return;
    }

    // 戦闘不能チェック
    if (isDead(actor)) {
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

    // BattleActionExecutorに委譲
    const result = await this.actionExecutor.executeAction(action, this.state);

    // 逃走成功時は戦闘状態を更新
    if (action.type === 'escape' && result.success) {
      this.state.phase = 'ended' as BattlePhase;
      this.state.result = 'escaped' as BattleResult;
    }

    // 行動履歴に追加
    this.state.actionHistory.push(action);

    return result;
  }

  /**
   * 戦闘終了をチェックする
   */
  checkBattleEnd(): BattleEndCheck {
    if (!this.state) {
      return { isEnded: false };
    }

    // 勝利条件：全ての敵が倒れた
    if (allDead(this.state.enemyGroup)) {
      return { isEnded: true, result: 'victory' as BattleResult };
    }

    // 敗北条件：全てのプレイヤーが倒れた
    if (allDead(this.state.playerParty)) {
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

    // 報酬を計算（基本情報のみ）
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
    
    // RewardServiceで経験値配分とレベルアップ処理
    // Note: この時点では報酬の基本情報のみを返す
    // 実際の経験値配分とレベルアップは、このBattleRewardsオブジェクトを
    // getRewardService().distributeRewards(party, rewards) に渡して処理する
    
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

  /**
   * RewardServiceを取得する
   * 戦闘終了後の報酬配分処理に使用
   */
  getRewardService(): RewardService {
    return this.rewardService;
  }
}
