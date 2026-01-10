# Core Engine 機能設計

各Serviceで使用するCore Engineの機能を関心事単位で設計したドキュメント

## 設計方針

### 基本原則

1. **関心事による分離**: 機能を7つのモジュール（combat, character, item, status, enemy, craft, config）に分類
2. **Service駆動設計**: 各Serviceが必要とする機能から逆算して設計
3. **純粋関数**: すべての関数は副作用を持たず、同じ入力に対して同じ出力を返す
4. **型安全性**: TypeScriptの型システムを最大限活用
5. **テスタビリティ**: すべての関数が独立してテスト可能

### モジュール構成

```text
CoreEngine/
├── combat/           # 戦闘計算
├── character/        # キャラクター・成長
├── item/             # アイテム・装備
├── status/           # 状態異常・バフ
├── enemy/            # 敵関連
├── craft/            # クラフト・強化
└── config/           # 設定・パラメータ
```

---

## combat/ - 戦闘計算モジュール

### 概要
戦闘に関連する数値計算を担当。ダメージ、命中、行動順など。

### 使用するService
- 戦闘全体の進行を管理するService
- 戦闘中のコマンド選択を扱うService
- 敵の行動を自動決定するService
- 戦闘や成長のシミュレーションを行うService

### 機能一覧

#### combat/damage.ts

**calculatePhysicalDamage**
```typescript
function calculatePhysicalDamage(
  attacker: Character,
  target: Character,
  skill: Skill,
  config: GameConfig
): DamageResult {
  // 物理攻撃のダメージ計算
  // - 攻撃力と防御力から基礎ダメージ算出
  // - クリティカル判定と倍率適用
  // - 属性相性による補正
  // - ダメージ分散の適用
}
```
**使用Service**: 戦闘全体の進行、戦闘中のコマンド選択、敵の行動決定

**calculateMagicDamage**
```typescript
function calculateMagicDamage(
  attacker: Character,
  target: Character,
  skill: Skill,
  config: GameConfig
): DamageResult {
  // 魔法攻撃のダメージ計算
  // - 魔力と魔法防御から基礎ダメージ算出
  // - 属性相性による補正
}
```
**使用Service**: 戦闘全体の進行、戦闘中のコマンド選択、敵の行動決定

**calculateHealAmount**
```typescript
function calculateHealAmount(
  caster: Character,
  target: Character,
  skill: Skill,
  config: GameConfig
): number {
  // 回復量の計算
  // - 固定値、割合、最大HPベースなどに対応
  // - 回復力の補正を適用
}
```
**使用Service**: 戦闘中のコマンド選択、アイテム使用の流れ

**calculateElementalModifier**
```typescript
function calculateElementalModifier(
  attackElement: Element,
  targetResistance: ElementResistance
): number {
  // 属性相性の倍率計算
  // - 弱点: 1.5x, 耐性: 0.5x, 無効: 0x など
}
```
**使用Service**: 戦闘全体の進行、敵の行動決定

#### combat/accuracy.ts

**calculateHitRate**
```typescript
function calculateHitRate(
  attacker: Character,
  target: Character,
  skill: Skill
): number {
  // 命中率の計算
  // - 攻撃側の命中率と防御側の回避率を考慮
  // - 必中スキルの処理
}
```
**使用Service**: 戦闘全体の進行、戦闘や成長のシミュレーション

**checkHit**
```typescript
function checkHit(hitRate: number): boolean {
  // 命中判定
  // - 確率に基づいて命中/回避を決定
}
```
**使用Service**: 戦闘全体の進行

**calculateCriticalRate**
```typescript
function calculateCriticalRate(
  attacker: Character,
  skill: Skill,
  config: GameConfig
): number {
  // クリティカル率の計算
  // - 基礎クリティカル率 + 運の値による補正
}
```
**使用Service**: 戦闘全体の進行、戦闘や成長のシミュレーション

**checkCritical**
```typescript
function checkCritical(criticalRate: number): boolean {
  // クリティカル判定
}
```
**使用Service**: 戦闘全体の進行

#### combat/turnOrder.ts

**calculateTurnOrder**
```typescript
function calculateTurnOrder(
  participants: Combatant[],
  config: GameConfig
): Combatant[] {
  // 行動順の計算
  // - 素早さに基づいてソート
  // - 同速の場合のタイブレーク処理
}
```
**使用Service**: 戦闘全体の進行を管理するService

**checkPreemptiveStrike**
```typescript
function checkPreemptiveStrike(
  party: Character[],
  enemies: Enemy[],
  config: GameConfig
): boolean {
  // 先制攻撃の判定
  // - パーティと敵の平均素早さを比較
}
```
**使用Service**: 戦闘全体の進行を管理するService

**applySpeedModifier**
```typescript
function applySpeedModifier(
  baseSpeed: number,
  modifiers: StatusEffect[]
): number {
  // 素早さへのバフ/デバフ適用
}
```
**使用Service**: 戦闘全体の進行を管理するService、状態異常やバフ・デバフを管理するService

#### combat/victory.ts

**checkVictoryCondition**
```typescript
function checkVictoryCondition(enemies: Enemy[]): boolean {
  // 勝利条件の判定
  // - すべての敵が戦闘不能か確認
}
```
**使用Service**: 戦闘全体の進行を管理するService

**checkDefeatCondition**
```typescript
function checkDefeatCondition(party: Character[]): boolean {
  // 敗北条件の判定
  // - パーティ全員が戦闘不能か確認
}
```
**使用Service**: 戦闘全体の進行を管理するService

**calculateEscapeRate**
```typescript
function calculateEscapeRate(
  party: Character[],
  enemies: Enemy[],
  escapeAttempts: number,
  config: GameConfig
): number {
  // 逃走成功率の計算
  // - 素早さの差と試行回数を考慮
}
```
**使用Service**: 戦闘全体の進行を管理するService

---

## character/ - キャラクター・成長モジュール

### 概要
キャラクターのステータス、成長、ジョブに関する計算を担当。

### 使用するService
- 戦闘やイベントの報酬を処理するService
- スキル習得の流れを管理するService
- 職業・クラス変更の流れを管理するService
- 装備の変更を管理するService
- パーティ編成を管理するService

### 機能一覧

#### character/stats.ts

**calculateFinalStats**
```typescript
function calculateFinalStats(
  character: Character,
  equipment: Equipment[],
  statusEffects: StatusEffect[],
  job: Job
): Stats {
  // 最終ステータスの計算
  // - 基礎値 + 装備補正 + バフ/デバフ + ジョブ補正
}
```
**使用Service**: すべての戦闘関連Service、装備の変更を管理するService

**getBaseStats**
```typescript
function getBaseStats(
  character: Character,
  level: number
): Stats {
  // 基礎ステータスの取得
  // - レベルに応じた基礎値
}
```
**使用Service**: 戦闘やイベントの報酬を処理するService

**applyEquipmentBonus**
```typescript
function applyEquipmentBonus(
  baseStats: Stats,
  equipment: Equipment[]
): Stats {
  // 装備によるステータス補正
}
```
**使用Service**: 装備の変更を管理するService

**applyJobBonus**
```typescript
function applyJobBonus(
  baseStats: Stats,
  job: Job,
  level: number
): Stats {
  // ジョブによるステータス補正
}
```
**使用Service**: 職業・クラス変更の流れを管理するService

#### character/growth.ts

**calculateExpRequired**
```typescript
function calculateExpRequired(
  level: number,
  config: GameConfig
): number {
  // 次のレベルに必要な経験値の計算
  // - 線形、指数、カスタム曲線に対応
}
```
**使用Service**: 戦闘やイベントの報酬を処理するService

**checkLevelUp**
```typescript
function checkLevelUp(
  currentExp: number,
  currentLevel: number,
  config: GameConfig
): LevelUpResult {
  // レベルアップ判定
  // - 現在の経験値で何レベル上がるか計算
}
```
**使用Service**: 戦闘やイベントの報酬を処理するService

**calculateStatGrowth**
```typescript
function calculateStatGrowth(
  character: Character,
  fromLevel: number,
  toLevel: number,
  job: Job,
  config: GameConfig
): Stats {
  // レベルアップ時の能力値上昇の計算
  // - 成長率とジョブ補正を適用
}
```
**使用Service**: 戦闘やイベントの報酬を処理するService

**distributeExpToParty**
```typescript
function distributeExpToParty(
  totalExp: number,
  party: Character[],
  config: GameConfig
): Map<string, number> {
  // パーティへの経験値配分
  // - 均等配分、レベル差補正などに対応
}
```
**使用Service**: 戦闘やイベントの報酬を処理するService

#### character/job.ts

**checkJobChangeCondition**
```typescript
function checkJobChangeCondition(
  character: Character,
  targetJob: Job
): JobChangeResult {
  // 転職条件の判定
  // - レベル、アイテム、クエスト完了などをチェック
}
```
**使用Service**: 職業・クラス変更の流れを管理するService

**calculateJobStatModifier**
```typescript
function calculateJobStatModifier(
  job: Job,
  level: number
): Stats {
  // ジョブによるステータス補正値の計算
}
```
**使用Service**: 職業・クラス変更の流れを管理するService

**getAvailableJobs**
```typescript
function getAvailableJobs(
  character: Character,
  allJobs: Job[]
): Job[] {
  // 転職可能なジョブのリスト
  // - 条件を満たすジョブをフィルタ
}
```
**使用Service**: 職業・クラス変更の流れを管理するService

#### character/skill.ts

**checkSkillLearnCondition**
```typescript
function checkSkillLearnCondition(
  character: Character,
  skill: Skill
): boolean {
  // スキル習得条件の判定
  // - レベル、ジョブ、前提スキルをチェック
}
```
**使用Service**: スキル習得の流れを管理するService

**getLearnableSkills**
```typescript
function getLearnableSkills(
  character: Character,
  allSkills: Skill[]
): Skill[] {
  // 習得可能なスキルのリスト
}
```
**使用Service**: スキル習得の流れを管理するService

**calculateSkillCost**
```typescript
function calculateSkillCost(
  character: Character,
  skill: Skill
): number {
  // スキル使用コストの計算
  // - MP、SP、HPなど
}
```
**使用Service**: 戦闘中のコマンド選択を扱うService

**checkSkillUsable**
```typescript
function checkSkillUsable(
  character: Character,
  skill: Skill
): boolean {
  // スキル使用可否の判定
  // - コスト、状態異常、装備制限をチェック
}
```
**使用Service**: 戦闘中のコマンド選択を扱うService、敵の行動を自動決定するService

---

## item/ - アイテム・装備モジュール

### 概要
アイテムの効果、装備の判定、インベントリ管理を担当。

### 使用するService
- アイテム使用の流れを扱うService
- 装備の変更を管理するService
- 戦闘やイベントの報酬を処理するService

### 機能一覧

#### item/effects.ts

**calculateItemEffect**
```typescript
function calculateItemEffect(
  item: Item,
  target: Character,
  context: 'battle' | 'field'
): ItemEffectResult {
  // アイテムの効果計算
  // - 回復、バフ、ダメージなど
}
```
**使用Service**: アイテム使用の流れを扱うService

**checkItemUsable**
```typescript
function checkItemUsable(
  item: Item,
  context: 'battle' | 'field'
): boolean {
  // アイテム使用可能状況の確認
}
```
**使用Service**: アイテム使用の流れを扱うService

**getItemTargets**
```typescript
function getItemTargets(
  item: Item,
  party: Character[]
): Character[] {
  // アイテムの使用可能対象を取得
  // - 単体/全体、対象条件をチェック
}
```
**使用Service**: アイテム使用の流れを扱うService

#### item/equipment.ts

**checkEquipmentEligibility**
```typescript
function checkEquipmentEligibility(
  character: Character,
  equipment: Equipment
): EquipmentCheckResult {
  // 装備可能条件の判定
  // - レベル、ジョブ、ステータス要件をチェック
}
```
**使用Service**: 装備の変更を管理するService

**calculateEquipmentBonus**
```typescript
function calculateEquipmentBonus(
  equipment: Equipment,
  character: Character
): Stats {
  // 装備によるステータス補正値の計算
  // - 基本補正 + セット効果
}
```
**使用Service**: 装備の変更を管理するService

**checkSetEffect**
```typescript
function checkSetEffect(
  equippedItems: Equipment[]
): SetEffect[] {
  // セット効果の判定
  // - 装備の組み合わせをチェック
}
```
**使用Service**: 装備の変更を管理するService

**compareEquipment**
```typescript
function compareEquipment(
  currentEquipment: Equipment | null,
  newEquipment: Equipment,
  character: Character
): EquipmentComparison {
  // 装備の比較
  // - ステータス変化を計算
}
```
**使用Service**: 装備の変更を管理するService

#### item/inventory.ts

**addItemToInventory**
```typescript
function addItemToInventory(
  inventory: Inventory,
  item: Item,
  quantity: number,
  config: GameConfig
): InventoryResult {
  // アイテムをインベントリに追加
  // - 所持上限をチェック
}
```
**使用Service**: 戦闘やイベントの報酬を処理するService、アイテム合成の流れを管理するService

**removeItemFromInventory**
```typescript
function removeItemFromInventory(
  inventory: Inventory,
  item: Item,
  quantity: number
): InventoryResult {
  // アイテムをインベントリから削除
}
```
**使用Service**: アイテム使用の流れを扱うService、アイテム合成の流れを管理するService

**checkInventorySpace**
```typescript
function checkInventorySpace(
  inventory: Inventory,
  requiredSlots: number,
  config: GameConfig
): boolean {
  // インベントリの空き容量チェック
}
```
**使用Service**: 戦闘やイベントの報酬を処理するService、アイテム合成の流れを管理するService

---

## status/ - 状態異常・バフモジュール

### 概要
状態異常やバフ・デバフの付与、効果、持続時間を管理。

### 使用するService
- 状態異常やバフ・デバフを管理するService
- 戦闘全体の進行を管理するService

### 機能一覧

#### status/effects.ts

**checkStatusEffectApplication**
```typescript
function checkStatusEffectApplication(
  target: Character,
  effect: StatusEffect,
  attacker?: Character
): boolean {
  // 状態異常の付与判定
  // - 基本成功率 + 耐性による軽減
}
```
**使用Service**: 状態異常やバフ・デバフを管理するService

**calculateStatusDamage**
```typescript
function calculateStatusDamage(
  target: Character,
  effect: StatusEffect
): number {
  // 状態異常による継続ダメージの計算
  // - 毒、炎上など
}
```
**使用Service**: 状態異常やバフ・デバフを管理するService、戦闘全体の進行を管理するService

**checkStatusRemoval**
```typescript
function checkStatusRemoval(
  effect: StatusEffect,
  condition: RemovalCondition
): boolean {
  // 状態異常の解除判定
  // - 自然解除、アイテム・スキルによる解除
}
```
**使用Service**: 状態異常やバフ・デバフを管理するService

**applyStatusModifier**
```typescript
function applyStatusModifier(
  baseStats: Stats,
  effects: StatusEffect[]
): Stats {
  // 状態異常によるステータス変動
}
```
**使用Service**: 状態異常やバフ・デバフを管理するService

**checkActionRestriction**
```typescript
function checkActionRestriction(
  character: Character,
  effects: StatusEffect[]
): ActionRestriction {
  // 行動制限の判定
  // - 麻痺、混乱、睡眠など
}
```
**使用Service**: 戦闘全体の進行を管理するService、戦闘中のコマンド選択を扱うService

#### status/duration.ts

**updateEffectDuration**
```typescript
function updateEffectDuration(
  effects: StatusEffect[],
  turnsPassed: number
): StatusEffect[] {
  // 持続ターン数の更新
  // - ターン経過による減少
}
```
**使用Service**: 状態異常やバフ・デバフを管理するService、戦闘全体の進行を管理するService

**checkEffectExpiration**
```typescript
function checkEffectExpiration(
  effect: StatusEffect
): boolean {
  // 効果の期限切れ判定
}
```
**使用Service**: 状態異常やバフ・デバフを管理するService

**extendEffectDuration**
```typescript
function extendEffectDuration(
  effect: StatusEffect,
  additionalTurns: number,
  maxDuration: number
): StatusEffect {
  // 効果時間の延長
}
```
**使用Service**: 状態異常やバフ・デバフを管理するService

**checkEffectStack**
```typescript
function checkEffectStack(
  existingEffects: StatusEffect[],
  newEffect: StatusEffect,
  maxStack: number
): StackResult {
  // 効果のスタック判定
  // - 重複時の処理（上書き、延長、スタック）
}
```
**使用Service**: 状態異常やバフ・デバフを管理するService

---

## enemy/ - 敵関連モジュール

### 概要
敵のステータス、ドロップ、AI判断の補助計算を担当。

### 使用するService
- 敵の行動を自動決定するService
- 複数の敵をひとまとまりとして扱うService
- 戦闘やイベントの報酬を処理するService

### 機能一覧

#### enemy/stats.ts

**generateEnemyStats**
```typescript
function generateEnemyStats(
  enemyType: EnemyType,
  level: number,
  config: GameConfig
): Stats {
  // 敵の初期ステータス設定
  // - レベルに応じた能力値
}
```
**使用Service**: 複数の敵をひとまとまりとして扱うService

**getEnemySkills**
```typescript
function getEnemySkills(
  enemy: Enemy
): Skill[] {
  // 敵が使用可能なスキルのリスト
}
```
**使用Service**: 敵の行動を自動決定するService

**checkEnemySkillUsable**
```typescript
function checkEnemySkillUsable(
  enemy: Enemy,
  skill: Skill
): boolean {
  // 敵がスキルを使用可能か判定
}
```
**使用Service**: 敵の行動を自動決定するService

#### enemy/drops.ts

**calculateDropRate**
```typescript
function calculateDropRate(
  enemy: Enemy,
  item: DropItem,
  config: GameConfig
): number {
  // ドロップ率の計算
  // - 基本レート + レアドロップ判定
}
```
**使用Service**: 複数の敵をひとまとまりとして扱うService、戦闘やイベントの報酬を処理するService

**rollDrops**
```typescript
function rollDrops(
  enemy: Enemy,
  config: GameConfig
): Item[] {
  // ドロップアイテムの決定
  // - 確率判定を行い、実際のドロップを決定
}
```
**使用Service**: 複数の敵をひとまとまりとして扱うService、戦闘やイベントの報酬を処理するService

**calculateExpReward**
```typescript
function calculateExpReward(
  enemy: Enemy,
  config: GameConfig
): number {
  // 撃破時の経験値の計算
}
```
**使用Service**: 戦闘やイベントの報酬を処理するService

**calculateMoneyReward**
```typescript
function calculateMoneyReward(
  enemy: Enemy,
  config: GameConfig
): number {
  // 撃破時のお金の計算
}
```
**使用Service**: 戦闘やイベントの報酬を処理するService

#### enemy/ai.ts

**evaluateTarget**
```typescript
function evaluateTarget(
  enemy: Enemy,
  target: Character,
  skill: Skill
): number {
  // ターゲットの評価値を計算
  // - HP、脅威度、弱点などを考慮
}
```
**使用Service**: 敵の行動を自動決定するService

**selectBestTarget**
```typescript
function selectBestTarget(
  enemy: Enemy,
  targets: Character[],
  skill: Skill,
  aiStrategy: AIStrategy
): Character {
  // 最適なターゲットを選択
}
```
**使用Service**: 敵の行動を自動決定するService

**evaluateSkill**
```typescript
function evaluateSkill(
  enemy: Enemy,
  skill: Skill,
  situation: BattleSituation
): number {
  // スキルの評価値を計算
  // - 状況に応じた優先度
}
```
**使用Service**: 敵の行動を自動決定するService

**selectBestSkill**
```typescript
function selectBestSkill(
  enemy: Enemy,
  availableSkills: Skill[],
  situation: BattleSituation,
  aiStrategy: AIStrategy
): Skill {
  // 最適なスキルを選択
}
```
**使用Service**: 敵の行動を自動決定するService

---

## craft/ - クラフト・強化モジュール

### 概要
アイテム合成と装備・キャラクター強化の計算を担当。

### 使用するService
- アイテム合成の流れを管理するService
- 装備やキャラクターの強化を管理するService

### 機能一覧

#### craft/synthesis.ts

**checkRecipeRequirements**
```typescript
function checkRecipeRequirements(
  recipe: Recipe,
  inventory: Inventory
): RecipeCheckResult {
  // レシピの材料チェック
  // - 必要な材料がすべて揃っているか
}
```
**使用Service**: アイテム合成の流れを管理するService

**calculateSynthesisSuccessRate**
```typescript
function calculateSynthesisSuccessRate(
  recipe: Recipe,
  character: Character,
  config: GameConfig
): number {
  // 合成成功率の計算
  // - 基本成功率 + スキル補正
}
```
**使用Service**: アイテム合成の流れを管理するService

**rollSynthesisResult**
```typescript
function rollSynthesisResult(
  recipe: Recipe,
  successRate: number
): SynthesisResult {
  // 合成結果の判定
  // - 成功、大成功、失敗
}
```
**使用Service**: アイテム合成の流れを管理するService

**calculateMaterialReturn**
```typescript
function calculateMaterialReturn(
  recipe: Recipe,
  result: SynthesisResult
): Item[] {
  // 失敗時の材料返還判定
}
```
**使用Service**: アイテム合成の流れを管理するService

#### craft/enhance.ts

**calculateEnhanceSuccessRate**
```typescript
function calculateEnhanceSuccessRate(
  target: Equipment | Character,
  currentLevel: number,
  config: GameConfig
): number {
  // 強化成功率の計算
  // - レベルが高いほど成功率が下がる
}
```
**使用Service**: 装備やキャラクターの強化を管理するService

**rollEnhanceResult**
```typescript
function rollEnhanceResult(
  successRate: number,
  safeZone: number
): EnhanceResult {
  // 強化結果の判定
  // - 成功、失敗、破壊
}
```
**使用Service**: 装備やキャラクターの強化を管理するService

**calculateEnhanceBonus**
```typescript
function calculateEnhanceBonus(
  target: Equipment | Character,
  fromLevel: number,
  toLevel: number,
  config: GameConfig
): Stats {
  // 強化による能力値上昇の計算
}
```
**使用Service**: 装備やキャラクターの強化を管理するService

**calculateEnhanceCost**
```typescript
function calculateEnhanceCost(
  target: Equipment | Character,
  currentLevel: number,
  config: GameConfig
): EnhanceCost {
  // 強化に必要なコストの計算
  // - お金、素材
}
```
**使用Service**: 装備やキャラクターの強化を管理するService

---

## config/ - 設定・パラメータモジュール

### 概要
ゲーム全体の設定値とバランス調整用のパラメータを管理。

### 使用するService
- すべてのService（設定値を参照）

### 機能一覧

#### config/parameters.ts

**GameConfig インターフェース**
```typescript
interface GameConfig {
  // 戦闘パラメータ
  combat: {
    baseCriticalRate: number;
    criticalMultiplier: number;
    damageVariance: number;
    escapeBaseRate: number;
  };
  
  // 成長パラメータ
  growth: {
    expCurve: 'linear' | 'exponential' | 'custom';
    baseExpRequired: number;
    expGrowthRate: number;
    statGrowthRates: {
      hp: number;
      mp: number;
      attack: number;
      defense: number;
      magic: number;
      magicDefense: number;
      speed: number;
      luck: number;
    };
  };
  
  // バランス調整
  balance: {
    maxLevel: number;
    maxPartySize: number;
    maxInventorySlots: number;
    dropRateModifier: number;
    expShareMode: 'equal' | 'level-scaled';
  };
  
  // 状態異常パラメータ
  status: {
    basePoisonDamageRate: number;
    baseBurnDamageRate: number;
    defaultDuration: number;
    maxStackCount: number;
  };
  
  // クラフトパラメータ
  craft: {
    baseSynthesisRate: number;
    materialReturnRate: number;
    enhanceSafeZone: number;
    enhanceDestroyRate: number;
  };
}
```

**getDefaultConfig**
```typescript
function getDefaultConfig(): GameConfig {
  // デフォルト設定値を返す
}
```
**使用Service**: すべてのService

**validateConfig**
```typescript
function validateConfig(config: Partial<GameConfig>): GameConfig {
  // 設定値の検証とデフォルト値のマージ
}
```
**使用Service**: 初期化時

#### config/formulas.ts

**DamageFormula 型定義**
```typescript
type DamageFormula = (
  attacker: Character,
  target: Character,
  skill: Skill,
  config: GameConfig
) => number;
```

**getDefaultDamageFormula**
```typescript
function getDefaultDamageFormula(): DamageFormula {
  // デフォルトのダメージ計算式
}
```
**使用Service**: 戦闘全体の進行を管理するService

**ExpCurveFormula 型定義**
```typescript
type ExpCurveFormula = (
  level: number,
  config: GameConfig
) => number;
```

**getExpCurveFormula**
```typescript
function getExpCurveFormula(
  curveType: 'linear' | 'exponential' | 'custom'
): ExpCurveFormula {
  // 経験値曲線の計算式を返す
}
```
**使用Service**: 戦闘やイベントの報酬を処理するService

---

## 方針の修正事項

### 1. config/モジュールの追加

**理由**: 
- 当初の設計では、設定値やパラメータの管理方法が明確ではなかった
- すべてのモジュールが設定値を必要とするため、独立したモジュールとして分離
- ゲームバランス調整を一箇所で管理できるようにするため

**影響**:
- すべての計算関数が `GameConfig` を引数として受け取る
- 設定値の変更が容易になり、テストも簡単になる

### 2. AIロジックを enemy/ai.ts として独立

**理由**:
- 当初は敵の行動決定をServiceのみが担当すると考えていた
- しかし、ターゲット選択やスキル評価など、複雑な計算が必要
- Core Engineが評価値を計算し、Serviceが最終決定を行う方が責任分離が明確

**影響**:
- 敵AIの動作をテストしやすくなる
- AI戦略をカスタマイズしやすくなる

### 3. 各関数の戻り値を詳細な型に

**理由**:
- 単純な数値ではなく、計算の詳細情報も含めた型を返す
- デバッグやUI表示が容易になる
- 将来の機能拡張に対応しやすい

**例**:
```typescript
// 修正前: number を返す
calculatePhysicalDamage(...): number

// 修正後: 詳細情報を含む型を返す
interface DamageResult {
  finalDamage: number;
  baseDamage: number;
  isCritical: boolean;
  elementalModifier: number;
  appliedModifiers: string[];
}
calculatePhysicalDamage(...): DamageResult
```

---

## 実装優先度

### フェーズ1: 戦闘の基礎（最優先）
- combat/damage.ts
- combat/accuracy.ts
- combat/turnOrder.ts
- combat/victory.ts
- character/stats.ts
- enemy/stats.ts
- enemy/ai.ts
- config/parameters.ts

### フェーズ2: 成長と管理
- character/growth.ts
- character/skill.ts
- character/job.ts
- item/equipment.ts
- item/inventory.ts
- status/effects.ts
- status/duration.ts

### フェーズ3: 発展的な機能
- item/effects.ts
- enemy/drops.ts
- craft/synthesis.ts
- craft/enhance.ts
- config/formulas.ts

---

## まとめ

このドキュメントでは、15のServiceが必要とするCore Engine機能を7つのモジュールに整理して設計しました。

### 設計の特徴

1. **Service駆動**: 各Serviceの「Core Engineへの委譲」から逆算して必要な関数を抽出
2. **関心事の分離**: 7つのモジュールに機能を分類し、独立性を確保
3. **型安全**: すべての関数に明確な型定義
4. **拡張性**: 計算式やパラメータをカスタマイズ可能
5. **テスタビリティ**: 純粋関数により単体テストが容易

### 次のステップ

1. 各モジュールの詳細な型定義
2. 実装例とユニットテストの作成
3. Service層との統合インターフェースの設計
4. パフォーマンス最適化の検討

この設計により、JRPGの複雑なゲームロジックを保守性高く実装できます。
