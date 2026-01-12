/**
 * 戦闘関連の型定義
 */

import { UniqueId } from './common';
import { Combatant } from './combatant';
import { Skill } from './skill';

/**
 * キャラクター（プレイヤー側の戦闘者）
 */
export interface Character extends Combatant {
  job?: string;          // ジョブ名（オプション）
  jobLevel?: number;     // 現在のジョブレベル（オプション）
  jobExp?: number;       // 現在のジョブ経験値（オプション）
  skills: Skill[];
  currentExp?: number;   // 現在の経験値（オプション）
}

/**
 * 敵（エネミー側の戦闘者）
 */
export interface Enemy extends Combatant {
  enemyType: string;     // 敵の種類
  skills: Skill[];
  aiStrategy: AIStrategy; // AI戦略
  dropItems?: DropItem[]; // ドロップアイテム
  expReward?: number;     // 経験値報酬
  jobExpReward?: number;  // ジョブ経験値報酬（オプション）
  moneyReward?: number;   // お金報酬
}

/**
 * AI戦略の基底型
 * - ゲームごとに独自のAI戦略を定義可能
 */
export type BaseAIStrategy = string;

/**
 * デフォルトAI戦略
 * - 標準的な戦略パターン
 */
export type DefaultAIStrategy = 
  | 'aggressive'   // 攻撃的（最もダメージを与える行動を選択）
  | 'defensive'    // 防御的（HPが低い味方を守る）
  | 'balanced'     // バランス型（状況に応じて行動を変える）
  | 'random'       // ランダム（ランダムに行動）
  | 'support';     // サポート型（バフ・デバフを優先）

/**
 * AI戦略（後方互換性のため）
 */
export type AIStrategy = DefaultAIStrategy;

/**
 * ドロップアイテム
 */
export interface DropItem {
  itemId: UniqueId;      // アイテムID
  probability: number;   // ドロップ率（0.0～1.0）
  quantity: number;      // ドロップ数
}

/**
 * 戦闘フェーズ
 */
export type BattlePhase = 
  | 'initializing'  // 初期化中
  | 'player-turn'   // プレイヤーターン
  | 'enemy-turn'    // 敵ターン
  | 'processing'    // 処理中
  | 'ended';        // 戦闘終了

/**
 * 戦闘状態
 */
export interface BattleState {
  phase: BattlePhase;                          // 現在のフェーズ
  turnNumber: number;                          // ターン数
  playerParty: Character[];                    // プレイヤーパーティ
  enemyGroup: Enemy[];                         // 敵グループ
  turnOrder: Combatant[];                      // 行動順
  currentActorIndex: number;                   // 現在の行動者インデックス
  result?: BattleResult;                       // 戦闘結果
  rewards?: BattleRewards;                     // 戦闘報酬
  actionHistory: BattleAction[];               // 行動履歴
}

/**
 * 戦闘結果
 */
export type BattleResult = 'victory' | 'defeat' | 'escaped';

/**
 * 戦闘報酬
 */
export interface BattleRewards {
  exp: number;           // 経験値
  jobExp?: number;       // ジョブ経験値（オプション）
  money: number;         // お金
  items: DropItem[];     // アイテム
}

/**
 * 戦闘アクション
 */
export interface BattleAction {
  actor: Combatant;       // 行動者
  type: BattleActionType; // アクションタイプ
  skill?: Skill;          // スキル（スキル使用時）
  itemId?: UniqueId;      // アイテムID（アイテム使用時）
  targets: Combatant[];   // 対象
}

/**
 * 戦闘アクションタイプ
 */
export type BattleActionType = 
  | 'attack'   // 通常攻撃
  | 'skill'    // スキル使用
  | 'item'     // アイテム使用
  | 'defend'   // 防御
  | 'escape';  // 逃走

/**
 * アクション結果
 */
export interface ActionResult {
  success: boolean;       // 成功したか
  damage?: number;        // ダメージ量
  heal?: number;          // 回復量
  missed?: boolean;       // ミスしたか
  critical?: boolean;     // クリティカルか
  message?: string;       // メッセージ
}

/**
 * 戦闘終了チェック結果
 */
export interface BattleEndCheck {
  isEnded: boolean;       // 戦闘が終了したか
  result?: BattleResult;  // 戦闘結果
}

/**
 * 逃走結果
 */
export interface EscapeResult {
  success: boolean;       // 成功したか
  message: string;        // メッセージ
}

/**
 * 戦闘状況（AI用）
 */
export interface BattleSituation {
  turn: number;                                // ターン数
  allyParty: Combatant[];                      // 味方パーティ
  enemyParty: Combatant[];                     // 敵パーティ
  averageAllyHpRate: number;                   // 味方の平均HP率
  averageEnemyHpRate: number;                  // 敵の平均HP率
  defeatedAllies: number;                      // 倒れた味方の数
  defeatedEnemies: number;                     // 倒れた敵の数
}

/**
 * スキル評価
 */
export interface SkillEvaluation {
  skill: Skill;           // スキル
  score: number;          // 評価スコア
  reason?: string;        // 理由
}

/**
 * ターゲット評価
 */
export interface TargetEvaluation {
  target: Combatant;      // ターゲット
  score: number;          // 評価スコア
  expectedDamage?: number; // 予想ダメージ
  reason?: string;        // 理由
}

/**
 * AI決定
 */
export interface AIDecision {
  skill: Skill;           // 選択されたスキル
  target: Combatant;      // 選択されたターゲット
  score: number;          // 決定スコア
}
