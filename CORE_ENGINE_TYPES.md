# Core Engine 型定義

Core Engineで使用するすべての型定義を定義したドキュメント

## 概要

このファイルには、Core Engineの7つのモジュールで使用されるすべての型定義が含まれています。
各型には日本語のコメントが付いており、実装時の参考になります。

---

## 共通型定義

### 基本型

```typescript
/**
 * ユニークID型
 * - すべてのエンティティの識別に使用
 */
type UniqueId = string;

/**
 * タイムスタンプ型
 * - ミリ秒単位のUNIXタイムスタンプ
 */
type Timestamp = number;

/**
 * 確率型
 * - 0.0（0%）から1.0（100%）の範囲
 */
type Probability = number;

/**
 * パーセンテージ型
 * - 0から100の範囲
 */
type Percentage = number;
```

### 属性型

```typescript
/**
 * 属性タイプ
 * - ゲーム内の各種属性を表現
 */
type Element = 
  | 'none'      // 無属性
  | 'fire'      // 炎
  | 'water'     // 水
  | 'earth'     // 土
  | 'wind'      // 風
  | 'lightning' // 雷
  | 'ice'       // 氷
  | 'light'     // 光
  | 'dark';     // 闇

/**
 * 属性耐性マップ
 * - 各属性に対する耐性値（0.0〜2.0）
 * - 1.0 = 通常、0.5 = 半減、2.0 = 2倍ダメージ、0 = 無効
 */
interface ElementResistance {
  fire: number;
  water: number;
  earth: number;
  wind: number;
  lightning: number;
  ice: number;
  light: number;
  dark: number;
}
```

---

## combat/ モジュールの型定義

### 戦闘参加者

```typescript
/**
 * 戦闘参加者の基本インターフェース
 * - キャラクターと敵の共通属性
 */
interface Combatant {
  id: UniqueId;              // ユニークID
  name: string;              // 名前
  level: number;             // レベル
  stats: Stats;              // ステータス
  currentHp: number;         // 現在のHP
  currentMp: number;         // 現在のMP
  statusEffects: StatusEffect[]; // 現在の状態異常
  position: number;          // 隊列位置（0=前列、1=後列）
}

/**
 * ステータス構造体
 * - キャラクターや敵の能力値
 */
interface Stats {
  maxHp: number;            // 最大HP
  maxMp: number;            // 最大MP
  attack: number;           // 攻撃力
  defense: number;          // 防御力
  magic: number;            // 魔力
  magicDefense: number;     // 魔法防御
  speed: number;            // 素早さ
  luck: number;             // 運
  accuracy: number;         // 命中率補正
  evasion: number;          // 回避率補正
  criticalRate: number;     // クリティカル率補正
}
```

### スキル

```typescript
/**
 * スキルタイプ
 */
type SkillType = 
  | 'physical'  // 物理攻撃
  | 'magic'     // 魔法攻撃
  | 'heal'      // 回復
  | 'buff'      // バフ
  | 'debuff'    // デバフ
  | 'special';  // 特殊

/**
 * ターゲットタイプ
 */
type TargetType = 
  | 'single-enemy'    // 敵単体
  | 'all-enemies'     // 敵全体
  | 'single-ally'     // 味方単体
  | 'all-allies'      // 味方全体
  | 'self'            // 自分
  | 'random-enemies'  // 敵ランダム
  | 'random-allies';  // 味方ランダム

/**
 * スキル定義
 */
interface Skill {
  id: UniqueId;             // スキルID
  name: string;             // スキル名
  type: SkillType;          // スキルタイプ
  targetType: TargetType;   // 対象タイプ
  element: Element;         // 属性
  power: number;            // 威力（倍率）
  mpCost: number;           // 消費MP
  accuracy: number;         // 命中率（1.0 = 100%）
  criticalBonus: number;    // クリティカル率ボーナス
  isGuaranteedHit: boolean; // 必中フラグ
  statusEffects?: StatusEffectApplication[]; // 付与する状態異常
  description: string;      // スキル説明
}

/**
 * 状態異常付与情報
 */
interface StatusEffectApplication {
  effectType: StatusEffectType; // 状態異常タイプ
  probability: Probability;     // 付与確率
  duration: number;             // 持続ターン数
  power: number;                // 効果の強さ
}
```

### ダメージ計算結果

```typescript
/**
 * ダメージ計算結果
 * - ダメージ計算の詳細情報を含む
 */
interface DamageResult {
  finalDamage: number;          // 最終ダメージ
  baseDamage: number;           // 基礎ダメージ
  isCritical: boolean;          // クリティカルヒットフラグ
  isHit: boolean;               // 命中フラグ
  elementalModifier: number;    // 属性相性倍率
  variance: number;             // ダメージ分散値
  appliedModifiers: DamageModifier[]; // 適用された補正
}

/**
 * ダメージ補正情報
 */
interface DamageModifier {
  source: string;   // 補正の出所（例: "クリティカル", "属性相性"）
  multiplier: number; // 補正倍率
}

/**
 * 回復結果
 */
interface HealResult {
  healAmount: number;       // 回復量
  overheal: number;         // オーバーヒール量
  isCritical: boolean;      // クリティカル回復フラグ
}
```

### 戦闘コンテキスト

```typescript
/**
 * 戦闘状況
 * - AI判断などで使用される戦闘の状況
 */
interface BattleSituation {
  turn: number;                     // 現在のターン数
  allyParty: Combatant[];           // 味方パーティ
  enemyParty: Combatant[];          // 敵パーティ
  averageAllyHpRate: number;        // 味方の平均HP率
  averageEnemyHpRate: number;       // 敵の平均HP率
  defeatedAllies: number;           // 戦闘不能の味方数
  defeatedEnemies: number;          // 戦闘不能の敵数
}

/**
 * 戦闘コンテキスト
 * - ルール適用時に使用
 */
interface CombatContext {
  attacker: Combatant;              // 攻撃者
  target: Combatant;                // 対象
  skill: Skill;                     // 使用スキル
  situation: BattleSituation;       // 戦闘状況
  damageMultiplier: number;         // ダメージ倍率（初期値1.0）
  additionalEffects: string[];      // 追加効果
  
  // コンテキストメソッド
  addEffect(effect: string): void;
  getFinalDamage(): number;
}
```

### 勝敗判定

```typescript
/**
 * 戦闘結果タイプ
 */
type BattleResult = 
  | 'ongoing'   // 戦闘継続中
  | 'victory'   // 勝利
  | 'defeat'    // 敗北
  | 'escaped';  // 逃走成功

/**
 * 勝敗判定結果
 */
interface VictoryCheckResult {
  result: BattleResult;         // 判定結果
  reason: string;               // 理由（デバッグ用）
}

/**
 * 逃走判定結果
 */
interface EscapeCheckResult {
  success: boolean;             // 成功フラグ
  rate: Probability;            // 成功率
  attemptCount: number;         // 試行回数
}
```

---

## character/ モジュールの型定義

### キャラクター

```typescript
/**
 * キャラクター
 * - プレイヤーキャラクターの完全な定義
 */
interface Character extends Combatant {
  experience: number;               // 現在の経験値
  expToNextLevel: number;           // 次のレベルまでの必要経験値
  job: Job;                         // 現在のジョブ
  equipment: EquipmentSet;          // 装備セット
  skills: Skill[];                  // 習得済みスキル
  jobHistory: JobHistory[];         // 転職履歴
  baseStats: Stats;                 // 基礎ステータス（装備なし）
}

/**
 * ジョブ定義
 */
interface Job {
  id: UniqueId;                     // ジョブID
  name: string;                     // ジョブ名
  description: string;              // ジョブ説明
  statModifiers: Partial<Stats>;    // ステータス補正
  statGrowthRates: Partial<Stats>;  // 成長率
  learnableSkills: SkillLearnCondition[]; // 習得可能スキル
  equipmentRestrictions: EquipmentType[]; // 装備可能種別
  icon: string;                     // アイコンURL
}

/**
 * スキル習得条件
 */
interface SkillLearnCondition {
  skill: Skill;                     // スキル
  levelRequired: number;            // 必要レベル
  prerequisiteSkills: UniqueId[];   // 前提スキルID
  cost?: number;                    // 習得コスト（SP等）
}

/**
 * 転職履歴
 */
interface JobHistory {
  jobId: UniqueId;                  // ジョブID
  levelReached: number;             // 到達レベル
  masteredAt?: Timestamp;           // マスター時刻
}
```

### レベルアップ

```typescript
/**
 * レベルアップ結果
 */
interface LevelUpResult {
  levelsGained: number;             // 上がったレベル数
  newLevel: number;                 // 新しいレベル
  statsGained: Partial<Stats>;      // 上昇したステータス
  skillsLearned: Skill[];           // 習得したスキル
  remainingExp: number;             // 余剰経験値
}

/**
 * 経験値計算結果
 */
interface ExpCalculation {
  totalExp: number;                 // 総経験値
  expToNextLevel: number;           // 次のレベルまで
  levelUpsPossible: number;         // 上がれるレベル数
}

/**
 * 経験値配分結果
 */
type ExpDistribution = Map<UniqueId, number>;
```

### ジョブ変更

```typescript
/**
 * ジョブ変更結果
 */
interface JobChangeResult {
  success: boolean;                 // 成功フラグ
  oldJob: Job;                      // 変更前のジョブ
  newJob: Job;                      // 変更後のジョブ
  statChanges: Partial<Stats>;      // ステータス変化
  unequippedItems: Equipment[];     // 装備不可になったアイテム
  lostSkills: Skill[];              // 使用不可になったスキル
  gainedSkills: Skill[];            // 使用可能になったスキル
  failureReason?: string;           // 失敗理由
}

/**
 * ジョブ変更条件チェック結果
 */
interface JobChangeConditionCheck {
  canChange: boolean;               // 変更可能フラグ
  missingRequirements: string[];    // 満たしていない条件
  requiredLevel?: number;           // 必要レベル
  requiredItems?: UniqueId[];       // 必要アイテム
}
```

---

## item/ モジュールの型定義

### アイテム

```typescript
/**
 * アイテムカテゴリ
 */
type ItemCategory = 
  | 'consumable'    // 消耗品
  | 'equipment'     // 装備
  | 'material'      // 素材
  | 'key-item'      // 重要アイテム
  | 'quest-item';   // クエストアイテム

/**
 * アイテム基本定義
 */
interface Item {
  id: UniqueId;                     // アイテムID
  name: string;                     // アイテム名
  description: string;              // 説明
  category: ItemCategory;           // カテゴリ
  rarity: number;                   // レアリティ（1〜5）
  stackable: boolean;               // スタック可能フラグ
  maxStack: number;                 // 最大スタック数
  sellPrice: number;                // 売却価格
  icon: string;                     // アイコンURL
}

/**
 * 消耗品アイテム
 */
interface ConsumableItem extends Item {
  category: 'consumable';
  effect: ItemEffect;               // アイテム効果
  usableInBattle: boolean;          // 戦闘中使用可否
  usableInField: boolean;           // フィールド使用可否
  targetType: TargetType;           // 対象タイプ
}

/**
 * アイテム効果
 */
interface ItemEffect {
  type: ItemEffectType;             // 効果タイプ
  power: number;                    // 効果量
  element?: Element;                // 属性
  statusEffects?: StatusEffectApplication[]; // 状態異常
}

/**
 * アイテム効果タイプ
 */
type ItemEffectType = 
  | 'heal-hp'           // HP回復
  | 'heal-mp'           // MP回復
  | 'heal-hp-percentage' // HP割合回復
  | 'heal-mp-percentage' // MP割合回復
  | 'revive'            // 蘇生
  | 'cure-status'       // 状態異常治療
  | 'apply-buff'        // バフ付与
  | 'damage';           // ダメージ

/**
 * アイテム効果結果
 */
interface ItemEffectResult {
  success: boolean;                 // 成功フラグ
  hpRestored?: number;              // 回復したHP
  mpRestored?: number;              // 回復したMP
  statusRemoved?: StatusEffectType[]; // 解除した状態異常
  statusApplied?: StatusEffectType[]; // 付与した状態異常
  message: string;                  // 結果メッセージ
}
```

### 装備

```typescript
/**
 * 装備タイプ
 */
type EquipmentType = 
  | 'weapon'        // 武器
  | 'head'          // 頭
  | 'body'          // 体
  | 'accessory1'    // アクセサリ1
  | 'accessory2';   // アクセサリ2

/**
 * 武器種別
 */
type WeaponType = 
  | 'sword'         // 剣
  | 'spear'         // 槍
  | 'axe'           // 斧
  | 'bow'           // 弓
  | 'staff'         // 杖
  | 'dagger';       // 短剣

/**
 * 装備アイテム
 */
interface Equipment extends Item {
  category: 'equipment';
  equipmentType: EquipmentType;     // 装備タイプ
  weaponType?: WeaponType;          // 武器種別（武器の場合）
  statBonus: Partial<Stats>;        // ステータスボーナス
  elementResistance?: Partial<ElementResistance>; // 属性耐性
  levelRequired: number;            // 必要レベル
  jobRestrictions: UniqueId[];      // ジョブ制限
  specialEffects: EquipmentEffect[]; // 特殊効果
  enhanceLevel: number;             // 強化レベル
  maxEnhanceLevel: number;          // 最大強化レベル
}

/**
 * 装備効果
 */
interface EquipmentEffect {
  type: EquipmentEffectType;        // 効果タイプ
  value: number;                    // 効果値
  description: string;              // 説明
}

/**
 * 装備効果タイプ
 */
type EquipmentEffectType = 
  | 'hp-regeneration'   // HP自動回復
  | 'mp-regeneration'   // MP自動回復
  | 'counter-attack'    // カウンター
  | 'double-attack'     // 二回攻撃
  | 'first-strike'      // 先制攻撃
  | 'exp-boost'         // 経験値ボーナス
  | 'drop-rate-boost';  // ドロップ率ボーナス

/**
 * 装備セット
 */
interface EquipmentSet {
  weapon?: Equipment;               // 武器
  head?: Equipment;                 // 頭
  body?: Equipment;                 // 体
  accessory1?: Equipment;           // アクセサリ1
  accessory2?: Equipment;           // アクセサリ2
}

/**
 * 装備適性チェック結果
 */
interface EquipmentEligibilityCheck {
  canEquip: boolean;                // 装備可能フラグ
  failureReasons: string[];         // 装備不可の理由
  levelRequired?: number;           // 必要レベル
  jobRestrictions?: string[];       // ジョブ制限
}

/**
 * 装備比較結果
 */
interface EquipmentComparison {
  statDifference: Partial<Stats>;   // ステータス差分
  isUpgrade: boolean;               // アップグレードかどうか
  improvements: string[];           // 改善点
  downgrades: string[];             // 劣化点
}
```

### インベントリ

```typescript
/**
 * インベントリスロット
 */
interface InventorySlot {
  item: Item;                       // アイテム
  quantity: number;                 // 数量
}

/**
 * インベントリ
 */
interface Inventory {
  slots: InventorySlot[];           // スロットリスト
  maxSlots: number;                 // 最大スロット数
  money: number;                    // 所持金
}

/**
 * インベントリ操作結果
 */
interface InventoryResult {
  success: boolean;                 // 成功フラグ
  slotsUsed: number;                // 使用スロット数
  itemsAdded?: number;              // 追加した数量
  itemsRemoved?: number;            // 削除した数量
  failureReason?: string;           // 失敗理由
}
```

---

## status/ モジュールの型定義

### 状態異常

```typescript
/**
 * 状態異常タイプ
 */
type StatusEffectType = 
  | 'poison'        // 毒
  | 'burn'          // 炎上
  | 'paralysis'     // 麻痺
  | 'sleep'         // 睡眠
  | 'confusion'     // 混乱
  | 'silence'       // 沈黙
  | 'blind'         // 暗闇
  | 'stun'          // スタン
  | 'regeneration'  // リジェネ
  | 'attack-up'     // 攻撃力アップ
  | 'attack-down'   // 攻撃力ダウン
  | 'defense-up'    // 防御力アップ
  | 'defense-down'  // 防御力ダウン
  | 'speed-up'      // 素早さアップ
  | 'speed-down';   // 素早さダウン

/**
 * 状態異常カテゴリ
 */
type StatusEffectCategory = 
  | 'debuff'        // デバフ
  | 'buff'          // バフ
  | 'dot'           // 継続ダメージ
  | 'hot'           // 継続回復
  | 'disable';      // 行動制限

/**
 * 状態異常
 */
interface StatusEffect {
  id: UniqueId;                     // 状態異常ID
  type: StatusEffectType;           // タイプ
  category: StatusEffectCategory;   // カテゴリ
  name: string;                     // 名前
  description: string;              // 説明
  power: number;                    // 効果の強さ
  duration: number;                 // 残り持続ターン数
  maxDuration: number;              // 最大持続ターン数
  stackCount: number;               // スタック数
  maxStack: number;                 // 最大スタック数
  canBeDispelled: boolean;          // 解除可能フラグ
  appliedAt: Timestamp;             // 付与時刻
  source?: UniqueId;                // 付与元ID
}

/**
 * 状態異常付与チェック結果
 */
interface StatusApplicationCheck {
  success: boolean;                 // 付与成功フラグ
  probability: Probability;         // 成功確率
  resistanceApplied: number;        // 適用された耐性値
  immunityActive: boolean;          // 免疫フラグ
}

/**
 * 行動制限
 */
interface ActionRestriction {
  canAct: boolean;                  // 行動可能フラグ
  canUseSkills: boolean;            // スキル使用可否
  canUseItems: boolean;             // アイテム使用可否
  canMove: boolean;                 // 移動可否
  restrictingEffects: StatusEffectType[]; // 制限している状態異常
  message: string;                  // 制限メッセージ
}
```

### 持続時間管理

```typescript
/**
 * 状態異常更新結果
 */
interface StatusUpdateResult {
  updated: StatusEffect[];          // 更新された状態異常
  expired: StatusEffect[];          // 期限切れの状態異常
  damage?: number;                  // 継続ダメージ
  heal?: number;                    // 継続回復
}

/**
 * 状態異常スタック結果
 */
interface StackResult {
  action: StackAction;              // 実行されたアクション
  finalEffect: StatusEffect;        // 最終的な状態異常
  message: string;                  // 結果メッセージ
}

/**
 * スタックアクション
 */
type StackAction = 
  | 'applied'       // 新規付与
  | 'refreshed'     // 時間リフレッシュ
  | 'stacked'       // スタック加算
  | 'replaced'      // 上書き
  | 'blocked';      // ブロック
```

---

## enemy/ モジュールの型定義

### 敵

```typescript
/**
 * 敵タイプ
 */
interface EnemyType {
  id: UniqueId;                     // 敵タイプID
  name: string;                     // 名前
  description: string;              // 説明
  baseStats: Stats;                 // 基礎ステータス
  statGrowthRate: number;           // ステータス成長率
  skills: Skill[];                  // 使用可能スキル
  aiStrategy: AIStrategy;           // AI戦略
  dropTable: DropTable;             // ドロップテーブル
  expReward: number;                // 経験値報酬
  moneyReward: number;              // お金報酬
  elementResistance: ElementResistance; // 属性耐性
  sprite: string;                   // スプライトURL
}

/**
 * 敵インスタンス
 */
interface Enemy extends Combatant {
  enemyType: EnemyType;             // 敵タイプ
  aiStrategy: AIStrategy;           // AI戦略
  threatLevel: number;              // 脅威度
}

/**
 * AI戦略
 */
interface AIStrategy {
  id: UniqueId;                     // 戦略ID
  name: string;                     // 戦略名
  targetingPriority: TargetPriority; // ターゲット優先度
  skillSelectionRules: SkillSelectionRule[]; // スキル選択ルール
  behaviorModifiers: BehaviorModifier[]; // 行動補正
}

/**
 * ターゲット優先度
 */
type TargetPriority = 
  | 'lowest-hp'         // HP最小
  | 'highest-hp'        // HP最大
  | 'lowest-defense'    // 防御力最小
  | 'highest-threat'    // 脅威度最高
  | 'random'            // ランダム
  | 'back-row'          // 後列優先
  | 'front-row';        // 前列優先

/**
 * スキル選択ルール
 */
interface SkillSelectionRule {
  condition: SkillCondition;        // 発動条件
  skillId: UniqueId;                // 使用スキル
  priority: number;                 // 優先度
  weight: number;                   // 重み
}

/**
 * スキル発動条件
 */
interface SkillCondition {
  hpThreshold?: number;             // HP閾値
  mpThreshold?: number;             // MP閾値
  turnNumber?: number;              // ターン数
  allyCount?: number;               // 味方の数
  enemyCount?: number;              // 敵の数
  statusEffects?: StatusEffectType[]; // 状態異常
}

/**
 * 行動補正
 */
interface BehaviorModifier {
  type: string;                     // 補正タイプ
  value: number;                    // 補正値
}

/**
 * ターゲット評価結果
 */
interface TargetEvaluation {
  target: Combatant;                // 対象
  score: number;                    // 評価スコア
  reasons: string[];                // 理由
}

/**
 * スキル評価結果
 */
interface SkillEvaluation {
  skill: Skill;                     // スキル
  score: number;                    // 評価スコア
  expectedValue: number;            // 期待値
  reasons: string[];                // 理由
}
```

### ドロップ

```typescript
/**
 * ドロップテーブル
 */
interface DropTable {
  guaranteedDrops: DropItem[];      // 確定ドロップ
  randomDrops: DropItem[];          // ランダムドロップ
  rareDrops: DropItem[];            // レアドロップ
}

/**
 * ドロップアイテム
 */
interface DropItem {
  item: Item;                       // アイテム
  quantity: number;                 // 数量
  dropRate: Probability;            // ドロップ率
  isRare: boolean;                  // レアフラグ
}

/**
 * ドロップ判定結果
 */
interface DropRollResult {
  droppedItems: InventorySlot[];    // ドロップしたアイテム
  totalValue: number;               // 合計価値
}
```

---

## craft/ モジュールの型定義

### レシピと合成

```typescript
/**
 * レシピ
 */
interface Recipe {
  id: UniqueId;                     // レシピID
  name: string;                     // レシピ名
  description: string;              // 説明
  requiredMaterials: MaterialRequirement[]; // 必要素材
  resultItem: Item;                 // 生成アイテム
  resultQuantity: number;           // 生成数量
  baseSuccessRate: Probability;     // 基本成功率
  synthesisTime: number;            // 合成時間（秒）
  requiredLevel?: number;           // 必要レベル
  requiredSkill?: UniqueId;         // 必要スキル
  category: CraftCategory;          // カテゴリ
}

/**
 * 必要素材
 */
interface MaterialRequirement {
  itemId: UniqueId;                 // アイテムID
  quantity: number;                 // 必要数量
}

/**
 * クラフトカテゴリ
 */
type CraftCategory = 
  | 'alchemy'       // 錬金術
  | 'blacksmith'    // 鍛冶
  | 'cooking'       // 料理
  | 'crafting';     // 工芸

/**
 * レシピ条件チェック結果
 */
interface RecipeCheckResult {
  canCraft: boolean;                // 作成可能フラグ
  missingMaterials: MaterialRequirement[]; // 不足素材
  sufficientMaterials: MaterialRequirement[]; // 充足素材
}

/**
 * 合成結果
 */
interface SynthesisResult {
  outcome: SynthesisOutcome;        // 結果
  itemsProduced: InventorySlot[];   // 生成されたアイテム
  materialsReturned: InventorySlot[]; // 返却された素材
  bonusItems?: InventorySlot[];     // ボーナスアイテム
  message: string;                  // 結果メッセージ
}

/**
 * 合成結果タイプ
 */
type SynthesisOutcome = 
  | 'great-success' // 大成功
  | 'success'       // 成功
  | 'failure';      // 失敗
```

### 強化

```typescript
/**
 * 強化対象
 */
type EnhanceTarget = Equipment | Character;

/**
 * 強化コスト
 */
interface EnhanceCost {
  money: number;                    // 必要なお金
  materials: MaterialRequirement[]; // 必要素材
}

/**
 * 強化結果
 */
interface EnhanceResult {
  outcome: EnhanceOutcome;          // 結果
  target: EnhanceTarget;            // 強化対象
  previousLevel: number;            // 強化前レベル
  newLevel: number;                 // 強化後レベル
  statGains?: Partial<Stats>;       // 獲得したステータス
  message: string;                  // 結果メッセージ
}

/**
 * 強化結果タイプ
 */
type EnhanceOutcome = 
  | 'success'       // 成功
  | 'failure'       // 失敗
  | 'destroyed'     // 破壊
  | 'downgrade';    // 劣化
```

---

## config/ モジュールの型定義

### ゲーム設定

```typescript
/**
 * ゲーム設定
 * - ゲーム全体のパラメータと設定
 */
interface GameConfig {
  // 戦闘パラメータ
  combat: CombatConfig;
  
  // 成長パラメータ
  growth: GrowthConfig;
  
  // バランス調整
  balance: BalanceConfig;
  
  // 状態異常パラメータ
  status: StatusConfig;
  
  // クラフトパラメータ
  craft: CraftConfig;
}

/**
 * 戦闘設定
 */
interface CombatConfig {
  baseCriticalRate: Probability;    // 基本クリティカル率（0.05 = 5%）
  criticalMultiplier: number;       // クリティカル倍率（2.0 = 2倍）
  damageVariance: number;           // ダメージ分散（0.1 = ±10%）
  escapeBaseRate: Probability;      // 基本逃走成功率（0.5 = 50%）
  escapeRateIncrement: number;      // 逃走試行毎の成功率上昇（0.1 = +10%）
  preemptiveStrikeThreshold: number; // 先制攻撃の素早さ差閾値
  speedVariance: number;            // 行動順のランダム幅
}

/**
 * 成長設定
 */
interface GrowthConfig {
  expCurve: ExpCurveType;           // 経験値曲線タイプ
  baseExpRequired: number;          // 基本必要経験値（100）
  expGrowthRate: number;            // 経験値成長率（1.2）
  statGrowthRates: StatGrowthRates; // ステータス成長率
  maxLevel: number;                 // 最大レベル（99）
}

/**
 * 経験値曲線タイプ
 */
type ExpCurveType = 
  | 'linear'        // 線形（レベル × 基本値）
  | 'exponential'   // 指数（基本値 × レベル ^ 成長率）
  | 'custom';       // カスタム

/**
 * ステータス成長率
 */
interface StatGrowthRates {
  hp: number;                       // HP成長率（10）
  mp: number;                       // MP成長率（5）
  attack: number;                   // 攻撃力成長率（3）
  defense: number;                  // 防御力成長率（2）
  magic: number;                    // 魔力成長率（3）
  magicDefense: number;             // 魔法防御成長率（2）
  speed: number;                    // 素早さ成長率（2）
  luck: number;                     // 運成長率（1）
}

/**
 * バランス設定
 */
interface BalanceConfig {
  maxPartySize: number;             // 最大パーティサイズ（4）
  maxInventorySlots: number;        // 最大インベントリスロット（99）
  dropRateModifier: number;         // ドロップ率補正（1.0 = 通常）
  expShareMode: ExpShareMode;       // 経験値配分モード
  moneyMultiplier: number;          // お金獲得倍率（1.0 = 通常）
}

/**
 * 経験値配分モード
 */
type ExpShareMode = 
  | 'equal'         // 均等配分
  | 'level-scaled'  // レベル差補正
  | 'participation'; // 参加者のみ

/**
 * 状態異常設定
 */
interface StatusConfig {
  basePoisonDamageRate: number;     // 基本毒ダメージ率（0.05 = 最大HPの5%）
  baseBurnDamageRate: number;       // 基本炎上ダメージ率（0.08 = 最大HPの8%）
  defaultDuration: number;          // デフォルト持続ターン数（3）
  maxStackCount: number;            // 最大スタック数（5）
  resistanceDecayRate: number;      // 耐性減衰率（0.1 = 10%減少）
}

/**
 * クラフト設定
 */
interface CraftConfig {
  baseSynthesisRate: Probability;   // 基本合成成功率（0.8 = 80%）
  greatSuccessRate: Probability;    // 大成功率（0.1 = 10%）
  materialReturnRate: Probability;  // 失敗時素材返還率（0.5 = 50%）
  enhanceSafeZone: number;          // 強化安全圏（+3まで失敗なし）
  enhanceDestroyRate: Probability;  // 強化失敗時破壊率（0.1 = 10%）
  enhanceCostMultiplier: number;    // 強化コスト倍率（レベル毎）
}
```

### カスタム計算式

```typescript
/**
 * ダメージ計算式
 * - カスタムダメージ計算に使用
 */
type DamageFormula = (
  attacker: Character,
  target: Character,
  skill: Skill,
  config: GameConfig
) => number;

/**
 * 経験値曲線計算式
 * - カスタム経験値曲線に使用
 */
type ExpCurveFormula = (
  level: number,
  config: GameConfig
) => number;

/**
 * ドロップ率計算式
 * - カスタムドロップ率計算に使用
 */
type DropRateFormula = (
  enemy: Enemy,
  dropItem: DropItem,
  config: GameConfig
) => Probability;

/**
 * カスタム計算式セット
 */
interface CustomFormulas {
  damageFormula?: DamageFormula;    // ダメージ計算式
  expCurveFormula?: ExpCurveFormula; // 経験値曲線
  dropRateFormula?: DropRateFormula; // ドロップ率計算
}
```

---

## まとめ

このドキュメントでは、Core Engineの7つのモジュールで使用されるすべての型定義を日本語のコメント付きで定義しました。

### 型定義の特徴

1. **網羅性**: すべてのモジュールの型を完全にカバー
2. **詳細な文書化**: 各プロパティに日本語コメントを記載
3. **型安全性**: TypeScriptの型システムを最大限活用
4. **実装指針**: 実装時にそのまま使用できる形式
5. **相互参照**: 型間の関係性が明確

### 使用方法

この型定義を使用して、各モジュールの実装を行います：

```typescript
// 例: combat/damage.ts の実装
import { Character, Skill, DamageResult, GameConfig } from './types';

function calculatePhysicalDamage(
  attacker: Character,
  target: Character,
  skill: Skill,
  config: GameConfig
): DamageResult {
  // 実装...
}
```

### 次のステップ

1. 各モジュールの関数実装
2. ユニットテストの作成
3. 統合テストの実施
4. パフォーマンス最適化

これらの型定義により、型安全で保守性の高いCore Engineの実装が可能になります。
