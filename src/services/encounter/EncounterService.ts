/**
 * EncounterService - エンカウント管理
 * 
 * エンカウント判定を柔軟に管理するサービス
 * ランダム判定、ステップカウンター判定、カスタムロジックなどをサポート
 */

/**
 * エンカウント判定戦略の基底インターフェース
 */
export interface EncounterStrategy {
  /**
   * エンカウント判定を行う
   * @returns エンカウントするかどうか
   */
  checkEncounter(): boolean;

  /**
   * 戦略の状態をリセットする
   */
  reset(): void;
}

/**
 * ランダムエンカウント戦略
 * 毎回指定された確率でエンカウント判定を行う
 */
export class RandomEncounterStrategy implements EncounterStrategy {
  private encounterRate: number;

  /**
   * コンストラクタ
   * @param encounterRate エンカウント率（0.0～1.0）
   */
  constructor(encounterRate: number) {
    if (encounterRate < 0 || encounterRate > 1) {
      throw new Error('Encounter rate must be between 0 and 1');
    }
    this.encounterRate = encounterRate;
  }

  /**
   * ランダムでエンカウント判定を行う
   */
  checkEncounter(): boolean {
    return Math.random() < this.encounterRate;
  }

  /**
   * 状態をリセット（ランダム戦略では何もしない）
   */
  reset(): void {
    // ランダム戦略では状態を持たないため何もしない
  }

  /**
   * エンカウント率を設定する
   * @param rate 新しいエンカウント率
   */
  setEncounterRate(rate: number): void {
    if (rate < 0 || rate > 1) {
      throw new Error('Encounter rate must be between 0 and 1');
    }
    this.encounterRate = rate;
  }
}

/**
 * ステップカウンター戦略
 * 指定されたステップ数に達したらエンカウントする
 */
export class StepCounterStrategy implements EncounterStrategy {
  private stepCount: number = 0;
  private encounterSteps: number;
  private randomRange: number;
  private targetSteps: number;

  /**
   * コンストラクタ
   * @param encounterSteps エンカウントまでの基本ステップ数
   * @param randomRange ランダムな変動幅（例：2なら±2ステップの範囲でランダム）
   */
  constructor(encounterSteps: number, randomRange: number = 0) {
    if (encounterSteps <= 0) {
      throw new Error('Encounter steps must be greater than 0');
    }
    if (randomRange < 0) {
      throw new Error('Random range must be non-negative');
    }
    this.encounterSteps = encounterSteps;
    this.randomRange = randomRange;
    this.targetSteps = this.calculateTargetSteps();
  }

  /**
   * ステップカウンターでエンカウント判定を行う
   */
  checkEncounter(): boolean {
    this.stepCount++;
    
    if (this.stepCount >= this.targetSteps) {
      this.stepCount = 0;
      this.targetSteps = this.calculateTargetSteps();
      return true;
    }
    
    return false;
  }

  /**
   * ステップカウンターをリセット
   */
  reset(): void {
    this.stepCount = 0;
    this.targetSteps = this.calculateTargetSteps();
  }

  /**
   * ランダム範囲を考慮した目標ステップ数を計算
   */
  private calculateTargetSteps(): number {
    const randomOffset = Math.floor(Math.random() * (this.randomRange * 2 + 1)) - this.randomRange;
    return Math.max(1, this.encounterSteps + randomOffset);
  }

  /**
   * 現在のステップ数を取得
   */
  getCurrentSteps(): number {
    return this.stepCount;
  }

  /**
   * エンカウントステップ数を設定
   * @param steps 新しいステップ数
   */
  setEncounterSteps(steps: number): void {
    if (steps <= 0) {
      throw new Error('Encounter steps must be greater than 0');
    }
    this.encounterSteps = steps;
    this.targetSteps = this.calculateTargetSteps();
  }
}

/**
 * カスタムエンカウント戦略
 * ユーザー定義のロジックでエンカウント判定を行う
 */
export class CustomEncounterStrategy implements EncounterStrategy {
  private checkFunction: () => boolean;
  private resetFunction?: () => void;

  /**
   * コンストラクタ
   * @param checkFunction エンカウント判定関数
   * @param resetFunction リセット関数（オプション）
   */
  constructor(
    checkFunction: () => boolean,
    resetFunction?: () => void
  ) {
    this.checkFunction = checkFunction;
    this.resetFunction = resetFunction;
  }

  /**
   * カスタムロジックでエンカウント判定を行う
   */
  checkEncounter(): boolean {
    return this.checkFunction();
  }

  /**
   * カスタムロジックをリセット
   */
  reset(): void {
    if (this.resetFunction) {
      this.resetFunction();
    }
  }
}

/**
 * エンカウント設定
 */
export interface EncounterConfig {
  enabled: boolean;           // エンカウントが有効かどうか
  strategy: EncounterStrategy; // 使用する戦略
}

/**
 * EncounterServiceクラス
 */
export class EncounterService {
  private config: EncounterConfig;

  /**
   * コンストラクタ
   * @param strategy エンカウント戦略
   * @param enabled エンカウントを有効にするか（デフォルト: true）
   */
  constructor(strategy: EncounterStrategy, enabled: boolean = true) {
    this.config = {
      enabled,
      strategy
    };
  }

  /**
   * エンカウント判定を行う
   * @returns エンカウントするかどうか
   */
  checkEncounter(): boolean {
    if (!this.config.enabled) {
      return false;
    }
    
    return this.config.strategy.checkEncounter();
  }

  /**
   * エンカウントを有効/無効にする
   * @param enabled 有効にするかどうか
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * エンカウントが有効かどうかを取得
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * エンカウント戦略を変更する
   * @param strategy 新しい戦略
   */
  setStrategy(strategy: EncounterStrategy): void {
    this.config.strategy = strategy;
  }

  /**
   * 現在の戦略を取得
   */
  getStrategy(): EncounterStrategy {
    return this.config.strategy;
  }

  /**
   * エンカウント状態をリセットする
   */
  reset(): void {
    this.config.strategy.reset();
  }
}
