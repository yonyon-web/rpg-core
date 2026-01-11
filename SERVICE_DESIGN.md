# Service 詳細設計

rpg-coreライブラリの15のServiceについて、詳細な設計仕様をまとめたドキュメント

## 設計方針

### Service の基本原則

1. **ステートフル**: Serviceは操作フローの状態を保持
2. **UIフリー**: 表示や入力処理に依存しない
3. **Core Engine委譲**: 計算とルール判定はCore Engineに委譲
4. **中断・再開可能**: セーブ/ロード対応のため、状態を永続化可能
5. **型安全**: TypeScriptの型システムを活用

### Service の責任範囲

- ✅ 操作フローの管理（いつ、何を、どの順で）
- ✅ 状態の保持と更新
- ✅ 選択肢の提示と決定の受付
- ✅ Core Engineへの計算依頼
- ✅ 結果の整形と返却
- ❌ 数値計算やルール判定（Core Engineの責任）
- ❌ UI描画や入力処理（UIレイヤーの責任）

---

## 目次

### 🎮 戦闘・操作に関するService
1. [BattleService - 戦闘全体の進行管理](#1-battleservice---戦闘全体の進行管理)
2. [CommandService - 戦闘中のコマンド選択](#2-commandservice---戦闘中のコマンド選択)
3. [ItemService - アイテム使用の流れ](#3-itemservice---アイテム使用の流れ)

### 🧠 敵に関するService
4. [EnemyAIService - 敵の行動自動決定](#4-enemyaiservice---敵の行動自動決定)
5. [EnemyGroupService - 敵グループ管理](#5-enemygroupservice---敵グループ管理)

### 📈 成長・キャラクターに関するService
6. [SkillLearnService - スキル習得管理](#6-skilllearnservice---スキル習得管理)
7. [JobChangeService - 職業・クラス変更](#7-jobchangeservice---職業クラス変更)
8. [RewardService - 戦闘報酬処理](#8-rewardservice---戦闘報酬処理)

### 🎒 管理・編成に関するService
9. [InventoryService - インベントリ/バッグ管理](#9-inventoryservice---インベントリバッグ管理)
10. [EquipmentService - 装備変更管理](#10-equipmentservice---装備変更管理)
11. [PartyService - パーティ編成管理](#11-partyservice---パーティ編成管理)
12. [StatusEffectService - 状態異常・バフ管理](#12-statuseffectservice---状態異常バフ管理)

### 🛠 クラフト・育成に関するService
13. [CraftService - アイテム合成管理](#13-craftservice---アイテム合成管理)
14. [EnhanceService - 装備・キャラ強化](#14-enhanceservice---装備キャラ強化)

### 💾 システム・支援に関するService
15. [SaveLoadService - セーブ/ロード管理](#15-saveloadservice---セーブロード管理)
16. [SimulationService - 戦闘シミュレーション](#16-simulationservice---戦闘シミュレーション)

---

## 1. BattleService - 戦闘全体の進行管理

### 概要
戦闘開始から終了までの全体フローを管理し、ターン進行、フェーズ切り替え、勝敗判定を行う。

### 状態管理

```typescript
interface BattleState {
  // 戦闘状態
  phase: 'initializing' | 'player-turn' | 'enemy-turn' | 'processing' | 'ended';
  turnNumber: number;
  
  // 参加者
  playerParty: Character[];
  enemyGroup: Enemy[];
  
  // 行動順
  turnOrder: Combatant[];
  currentActorIndex: number;
  
  // 戦闘結果
  result?: 'victory' | 'defeat' | 'escaped';
  rewards?: BattleRewards;
  
  // 履歴
  actionHistory: BattleAction[];
}
```

### 公開インターフェース

```typescript
class BattleService {
  // 戦闘開始
  startBattle(party: Character[], enemies: Enemy[]): Promise<void>;
  
  // ターン進行
  advanceTurn(): Promise<void>;
  
  // 行動実行
  executeAction(actor: Combatant, action: BattleAction): Promise<ActionResult>;
  
  // 逃走試行
  attemptEscape(): Promise<EscapeResult>;
  
  // 戦闘終了チェック
  checkBattleEnd(): BattleEndCheck;
  
  // 現在の状態取得
  getState(): BattleState;
  
  // 戦闘終了
  endBattle(): BattleRewards;
}
```

### Core Engine 委譲

- `combat/turnOrder.calculateTurnOrder()` - 行動順計算
- `combat/turnOrder.checkPreemptiveStrike()` - 先制攻撃判定
- `combat/damage.calculatePhysicalDamage()` - 物理ダメージ計算
- `combat/damage.calculateMagicDamage()` - 魔法ダメージ計算
- `combat/accuracy.checkHit()` - 命中判定
- `combat/accuracy.checkCritical()` - クリティカル判定
- `combat/victory.checkVictoryCondition()` - 勝利条件判定
- `combat/victory.checkDefeatCondition()` - 敗北条件判定
- `combat/victory.calculateEscapeRate()` - 逃走成功率計算
- `status/duration.updateEffectDuration()` - 状態異常の持続時間更新

### フロー

```
1. startBattle() → 初期化
   ↓
2. calculateTurnOrder() → 行動順決定
   ↓
3. [ループ開始]
   ↓
4. advanceTurn() → 次の行動者を取得
   ↓
5. プレイヤーターン？
   ├─Yes→ CommandServiceで入力待ち
   └─No → EnemyAIServiceで行動決定
   ↓
6. executeAction() → 行動実行
   ↓
7. checkBattleEnd() → 勝敗判定
   ├─継続 → 3に戻る
   └─終了 → 8へ
   ↓
8. endBattle() → 報酬計算・戦闘終了
```

### 実装例

```typescript
class BattleService {
  constructor(
    private coreEngine: CoreEngine,
    private commandService: CommandService,
    private enemyAIService: EnemyAIService
  ) {}
  
  async startBattle(party: Character[], enemies: Enemy[]): Promise<void> {
    // 戦闘初期化
    this.state = {
      phase: 'initializing',
      turnNumber: 0,
      playerParty: [...party],
      enemyGroup: [...enemies],
      turnOrder: [],
      currentActorIndex: 0,
      actionHistory: []
    };
    
    // 先制攻撃チェック
    const preemptive = this.coreEngine.checkPreemptiveStrike(party, enemies);
    
    // 行動順計算
    const allCombatants = [...party, ...enemies];
    this.state.turnOrder = this.coreEngine.calculateTurnOrder(allCombatants);
    
    this.state.phase = 'player-turn';
  }
  
  async advanceTurn(): Promise<void> {
    // 次の行動者を取得
    const actor = this.state.turnOrder[this.state.currentActorIndex];
    
    if (!actor || actor.currentHp <= 0) {
      // スキップ
      this.currentActorIndex++;
      return this.advanceTurn();
    }
    
    // プレイヤーか敵かで分岐
    if (this.isPlayerCharacter(actor)) {
      this.state.phase = 'player-turn';
      // UIで入力を待つ
    } else {
      this.state.phase = 'enemy-turn';
      // AIで行動決定
      const action = await this.enemyAIService.decideAction(actor as Enemy, this.state);
      await this.executeAction(actor, action);
    }
  }
  
  checkBattleEnd(): BattleEndCheck {
    // 勝利条件チェック
    if (this.coreEngine.checkVictoryCondition(this.state.enemyGroup)) {
      return { isEnded: true, result: 'victory' };
    }
    
    // 敗北条件チェック
    if (this.coreEngine.checkDefeatCondition(this.state.playerParty)) {
      return { isEnded: true, result: 'defeat' };
    }
    
    return { isEnded: false };
  }
}
```

---

## 2. CommandService - 戦闘中のコマンド選択

### 概要
戦闘中のコマンド（攻撃・スキル・アイテム・防御・逃走）の選択肢提示と決定処理を管理。

### 状態管理

```typescript
interface CommandState {
  // 現在のコマンド選択段階
  stage: 'selecting-action' | 'selecting-skill' | 'selecting-item' | 'selecting-target';
  
  // 行動中のキャラクター
  actor: Character;
  
  // 選択中のコマンド
  selectedCommand?: 'attack' | 'skill' | 'item' | 'defend' | 'escape';
  selectedSkill?: Skill;
  selectedItem?: Item;
  selectedTargets?: Combatant[];
  
  // 利用可能な選択肢
  availableCommands: CommandOption[];
  availableSkills: Skill[];
  availableItems: Item[];
  availableTargets: Combatant[];
}
```

### 公開インターフェース

```typescript
class CommandService {
  // コマンド選択開始
  startCommandSelection(actor: Character, battleState: BattleState): CommandState;
  
  // 利用可能なコマンドを取得
  getAvailableCommands(actor: Character): CommandOption[];
  
  // コマンド選択
  selectCommand(command: string): void;
  
  // スキル/アイテム選択
  selectSkill(skill: Skill): void;
  selectItem(item: Item): void;
  
  // ターゲット選択
  selectTarget(target: Combatant): void;
  selectTargets(targets: Combatant[]): void;
  
  // 決定
  confirm(): BattleAction;
  
  // キャンセル
  cancel(): void;
}
```

### Core Engine 委譲

- `character/skill.checkSkillUsable()` - スキル使用可否判定
- `character/skill.calculateSkillCost()` - スキルコスト計算
- `item/effects.checkItemUsable()` - アイテム使用可否判定
- `item/effects.getItemTargets()` - アイテム対象取得

### フロー

```
1. startCommandSelection() → 選択開始
   ↓
2. getAvailableCommands() → コマンド一覧表示
   ↓
3. selectCommand() → コマンド選択
   ↓
4. コマンドに応じて分岐:
   - 攻撃 → ターゲット選択へ
   - スキル → スキル一覧表示
   - アイテム → アイテム一覧表示
   - 防御 → 即確定
   - 逃走 → 即実行
   ↓
5. selectSkill/selectItem() → 詳細選択
   ↓
6. selectTarget() → ターゲット選択
   ↓
7. confirm() → 行動確定、BattleActionを返す
```

### 実装例

```typescript
class CommandService {
  constructor(private coreEngine: CoreEngine) {}
  
  getAvailableCommands(actor: Character): CommandOption[] {
    const commands: CommandOption[] = [];
    
    // 攻撃は常に可能
    commands.push({ type: 'attack', label: '攻撃', enabled: true });
    
    // スキルチェック
    const usableSkills = actor.skills.filter(skill => 
      this.coreEngine.checkSkillUsable(actor, skill)
    );
    if (usableSkills.length > 0) {
      commands.push({ type: 'skill', label: 'スキル', enabled: true });
    }
    
    // アイテムチェック
    const usableItems = this.getUsableItemsInBattle(actor);
    if (usableItems.length > 0) {
      commands.push({ type: 'item', label: 'アイテム', enabled: true });
    }
    
    // 防御は常に可能
    commands.push({ type: 'defend', label: '防御', enabled: true });
    
    // 逃走は常に試行可能
    commands.push({ type: 'escape', label: '逃げる', enabled: true });
    
    return commands;
  }
  
  selectCommand(command: string): void {
    this.state.selectedCommand = command as any;
    
    switch (command) {
      case 'attack':
        this.state.stage = 'selecting-target';
        this.state.availableTargets = this.getAttackTargets();
        break;
        
      case 'skill':
        this.state.stage = 'selecting-skill';
        this.state.availableSkills = this.getUsableSkills(this.state.actor);
        break;
        
      case 'item':
        this.state.stage = 'selecting-item';
        this.state.availableItems = this.getUsableItemsInBattle(this.state.actor);
        break;
        
      case 'defend':
      case 'escape':
        // すぐに確定
        break;
    }
  }
  
  confirm(): BattleAction {
    return {
      actor: this.state.actor,
      type: this.state.selectedCommand!,
      skill: this.state.selectedSkill,
      item: this.state.selectedItem,
      targets: this.state.selectedTargets || []
    };
  }
}
```

---

## 3. ItemService - アイテム使用の流れ

### 概要
戦闘中・フィールドでのアイテム使用の流れを管理。使用可否判定、対象選択、効果適用を行う。

### 状態管理

```typescript
interface ItemUseState {
  // 使用段階
  stage: 'selecting-item' | 'selecting-target' | 'confirming' | 'applying';
  
  // コンテキスト
  context: 'battle' | 'field';
  
  // 選択
  selectedItem?: Item;
  selectedTargets?: Character[];
  
  // 結果
  result?: ItemUseResult;
}
```

### 公開インターフェース

```typescript
class ItemService {
  // アイテム使用開始
  startItemUse(context: 'battle' | 'field'): ItemUseState;
  
  // 使用可能なアイテム取得
  getUsableItems(context: 'battle' | 'field'): Item[];
  
  // アイテム選択
  selectItem(item: Item): void;
  
  // 対象選択
  selectTargets(targets: Character[]): void;
  
  // 使用実行
  useItem(): Promise<ItemUseResult>;
  
  // キャンセル
  cancel(): void;
}
```

### Core Engine 委譲

- `item/effects.checkItemUsable()` - 使用可否判定
- `item/effects.calculateItemEffect()` - アイテム効果計算
- `item/effects.getItemTargets()` - 対象取得
- `item/inventory.removeItemFromInventory()` - インベントリから削除

### 実装例

```typescript
class ItemService {
  constructor(private coreEngine: CoreEngine) {}
  
  getUsableItems(context: 'battle' | 'field'): Item[] {
    return this.inventory.items.filter(item => 
      this.coreEngine.checkItemUsable(item, context)
    );
  }
  
  async useItem(): Promise<ItemUseResult> {
    const item = this.state.selectedItem!;
    const targets = this.state.selectedTargets!;
    
    const results: ItemEffectResult[] = [];
    
    // 各ターゲットに効果適用
    for (const target of targets) {
      const effect = this.coreEngine.calculateItemEffect(
        item,
        target,
        this.state.context
      );
      
      // 効果適用
      this.applyItemEffect(target, effect);
      results.push(effect);
    }
    
    // インベントリから削除
    this.coreEngine.removeItemFromInventory(this.inventory, item, 1);
    
    return {
      success: true,
      item,
      targets,
      effects: results
    };
  }
}
```

---

## 4. EnemyAIService - 敵の行動自動決定

### 概要
敵の行動を自動決定する。AI戦略に基づいてスキルとターゲットを選択。

### 状態管理

```typescript
interface AIDecisionState {
  // 判断中の敵
  enemy: Enemy;
  
  // 戦闘状況
  situation: BattleSituation;
  
  // 評価結果
  skillEvaluations: SkillEvaluation[];
  targetEvaluations: TargetEvaluation[];
  
  // 決定結果
  decision?: AIDecision;
}
```

### 公開インターフェース

```typescript
class EnemyAIService {
  // 行動決定
  decideAction(enemy: Enemy, battleState: BattleState): Promise<BattleAction>;
  
  // スキル評価
  evaluateSkills(enemy: Enemy, situation: BattleSituation): SkillEvaluation[];
  
  // ターゲット評価
  evaluateTargets(enemy: Enemy, skill: Skill, targets: Character[]): TargetEvaluation[];
  
  // 最適なスキル選択
  selectBestSkill(evaluations: SkillEvaluation[]): Skill;
  
  // 最適なターゲット選択
  selectBestTarget(evaluations: TargetEvaluation[]): Character;
}
```

### Core Engine 委譲

- `enemy/ai.evaluateSkill()` - スキル評価
- `enemy/ai.selectBestSkill()` - 最適スキル選択
- `enemy/ai.evaluateTarget()` - ターゲット評価
- `enemy/ai.selectBestTarget()` - 最適ターゲット選択
- `character/skill.checkSkillUsable()` - スキル使用可否

### 実装例

```typescript
class EnemyAIService {
  constructor(private coreEngine: CoreEngine) {}
  
  async decideAction(enemy: Enemy, battleState: BattleState): Promise<BattleAction> {
    // 戦闘状況を構築
    const situation: BattleSituation = {
      turn: battleState.turnNumber,
      allyParty: battleState.enemyGroup,
      enemyParty: battleState.playerParty,
      averageAllyHpRate: this.calculateAverageHpRate(battleState.enemyGroup),
      averageEnemyHpRate: this.calculateAverageHpRate(battleState.playerParty),
      defeatedAllies: battleState.enemyGroup.filter(e => e.currentHp <= 0).length,
      defeatedEnemies: battleState.playerParty.filter(c => c.currentHp <= 0).length
    };
    
    // 使用可能なスキルを取得
    const availableSkills = enemy.skills.filter(skill =>
      this.coreEngine.checkSkillUsable(enemy, skill)
    );
    
    // スキル評価
    const skillEvaluations = availableSkills.map(skill =>
      this.coreEngine.evaluateSkill(enemy, skill, situation)
    );
    
    // 最適スキル選択
    const bestSkill = this.coreEngine.selectBestSkill(
      enemy,
      availableSkills,
      situation,
      enemy.aiStrategy
    );
    
    // ターゲット候補
    const possibleTargets = battleState.playerParty.filter(c => c.currentHp > 0);
    
    // ターゲット評価
    const targetEvaluations = possibleTargets.map(target =>
      this.coreEngine.evaluateTarget(enemy, target, bestSkill)
    );
    
    // 最適ターゲット選択
    const bestTarget = this.coreEngine.selectBestTarget(
      enemy,
      possibleTargets,
      bestSkill,
      enemy.aiStrategy
    );
    
    return {
      actor: enemy,
      type: 'skill',
      skill: bestSkill,
      targets: [bestTarget]
    };
  }
}
```

---

## 5. EnemyGroupService - 敵グループ管理

### 概要
戦闘に登場する敵グループの生成、管理、ドロップアイテムの決定を行う。

### 状態管理

```typescript
interface EnemyGroupState {
  // 敵グループ
  enemies: Enemy[];
  
  // グループ情報
  groupType: string;
  difficulty: number;
  
  // ドロップ
  potentialDrops: DropItem[];
}
```

### 公開インターフェース

```typescript
class EnemyGroupService {
  // 敵グループ生成
  generateEnemyGroup(groupType: string, level: number): Enemy[];
  
  // 敵の初期化
  initializeEnemy(enemyType: EnemyType, level: number): Enemy;
  
  // ドロップアイテム決定
  rollDrops(defeatedEnemies: Enemy[]): Item[];
  
  // 経験値・お金計算
  calculateRewards(defeatedEnemies: Enemy[]): { exp: number; money: number };
}
```

### Core Engine 委譲

- `enemy/stats.generateEnemyStats()` - 敵ステータス生成
- `enemy/stats.getEnemySkills()` - 敵スキル取得
- `enemy/drops.rollDrops()` - ドロップ判定
- `enemy/drops.calculateExpReward()` - 経験値計算
- `enemy/drops.calculateMoneyReward()` - お金計算

### 実装例

```typescript
class EnemyGroupService {
  constructor(private coreEngine: CoreEngine) {}
  
  initializeEnemy(enemyType: EnemyType, level: number): Enemy {
    // ステータス生成
    const stats = this.coreEngine.generateEnemyStats(enemyType, level);
    
    // スキル取得
    const skills = this.coreEngine.getEnemySkills(enemyType);
    
    return {
      id: generateId(),
      enemyType,
      level,
      stats,
      currentHp: stats.maxHp,
      currentMp: stats.maxMp,
      skills,
      statusEffects: [],
      aiStrategy: enemyType.aiStrategy,
      position: 0,
      name: enemyType.name
    };
  }
  
  rollDrops(defeatedEnemies: Enemy[]): Item[] {
    const allDrops: Item[] = [];
    
    for (const enemy of defeatedEnemies) {
      const drops = this.coreEngine.rollDrops(enemy);
      allDrops.push(...drops);
    }
    
    return allDrops;
  }
  
  calculateRewards(defeatedEnemies: Enemy[]): { exp: number; money: number } {
    let totalExp = 0;
    let totalMoney = 0;
    
    for (const enemy of defeatedEnemies) {
      totalExp += this.coreEngine.calculateExpReward(enemy);
      totalMoney += this.coreEngine.calculateMoneyReward(enemy);
    }
    
    return { exp: totalExp, money: totalMoney };
  }
}
```

---

## 6. SkillLearnService - スキル習得管理

### 概要
キャラクターのスキル習得の流れを管理。習得条件チェック、習得処理を行う。

### 状態管理

```typescript
interface SkillLearnState {
  // 対象キャラクター
  character: Character;
  
  // 習得可能スキル
  learnableSkills: Skill[];
  
  // 選択中のスキル
  selectedSkill?: Skill;
  
  // コスト
  cost?: number;
}
```

### 公開インターフェース

```typescript
class SkillLearnService {
  // 習得可能スキル取得
  getLearnableSkills(character: Character): Skill[];
  
  // 習得条件チェック
  checkLearnCondition(character: Character, skill: Skill): LearnConditionCheck;
  
  // スキル習得
  learnSkill(character: Character, skill: Skill): LearnResult;
}
```

### Core Engine 委譲

- `character/skill.checkSkillLearnCondition()` - 習得条件判定
- `character/skill.getLearnableSkills()` - 習得可能スキル取得

---

## 7. JobChangeService - 職業・クラス変更

### 概要
キャラクターのジョブ変更の流れを管理。変更条件チェック、ジョブ変更処理を行う。

### 公開インターフェース

```typescript
class JobChangeService {
  // 転職可能ジョブ取得
  getAvailableJobs(character: Character): Job[];
  
  // 転職条件チェック
  checkJobChangeCondition(character: Character, targetJob: Job): JobChangeConditionCheck;
  
  // ジョブ変更実行
  changeJob(character: Character, targetJob: Job): JobChangeResult;
}
```

### Core Engine 委譲

- `character/job.getAvailableJobs()` - 転職可能ジョブ
- `character/job.checkJobChangeCondition()` - 転職条件判定
- `character/job.calculateJobStatModifier()` - ジョブステータス補正
- `character/stats.calculateFinalStats()` - 最終ステータス再計算

---

## 8. RewardService - 戦闘報酬処理

### 概要
戦闘終了後の報酬（経験値、お金、アイテム）の配分とレベルアップ処理を管理。

### 公開インターフェース

```typescript
class RewardService {
  // 報酬配分
  distributeRewards(party: Character[], rewards: BattleRewards): RewardDistributionResult;
  
  // 経験値配分
  distributeExp(party: Character[], totalExp: number): Map<Character, number>;
  
  // レベルアップ処理
  processLevelUps(character: Character, gainedExp: number): LevelUpResult[];
  
  // アイテム追加
  addItems(inventory: Inventory, items: Item[]): InventoryResult;
}
```

### Core Engine 委譲

- `character/growth.distributeExpToParty()` - 経験値配分
- `character/growth.checkLevelUp()` - レベルアップ判定
- `character/growth.calculateStatGrowth()` - ステータス成長計算
- `item/inventory.addItemToInventory()` - アイテム追加

---

## 9. InventoryService - インベントリ/バッグ管理

### 概要
アイテムと装備のインベントリ（バッグ）を管理。アイテムの追加・削除、検索、フィルタリング、ソートなどの機能を提供。詳細な設計は `INVENTORY_SYSTEM_DESIGN.md` を参照。

### 状態管理

```typescript
interface InventoryServiceState {
  // インベントリデータ
  inventory: Inventory;
  
  // 最後の操作結果
  lastOperation?: {
    type: 'add' | 'remove' | 'use' | 'stack';
    success: boolean;
    message?: string;
  };
}
```

### 公開インターフェース

```typescript
class InventoryService {
  constructor(
    private coreEngine: CoreEngine,
    private inventory: Inventory
  ) {}
  
  // === アイテム操作 ===
  
  // アイテム追加
  addItem(item: Item, quantity: number): InventoryResult;
  
  // アイテム削除
  removeItem(item: Item, quantity: number): InventoryResult;
  
  // アイテム使用（ItemServiceに委譲）
  useItem(item: Item, context: 'battle' | 'field', targets: Combatant[]): Promise<ItemUseResult>;
  
  // === フィルタリング ===
  
  // カテゴリ別取得
  getItemsByCategory(category: ItemCategory): InventorySlot[];
  
  // 使用可能アイテム取得
  getUsableItems(context: 'battle' | 'field'): InventorySlot[];
  
  // 装備可能アイテム取得
  getEquippableItems(character: Character): InventorySlot[];
  
  // 装備中アイテム取得
  getEquippedItems(): InventorySlot[];
  
  // カスタム検索
  searchItems(criteria: InventorySearchCriteria): InventorySlot[];
  
  // === ソート・整理 ===
  
  // ソート
  sortInventory(sortBy: InventorySortBy, order: SortOrder): void;
  
  // スタック整理
  stackItems(): StackResult;
  
  // === 統計・情報 ===
  
  // 統計情報取得
  getStats(): InventoryStats;
  
  // 空きスロット取得
  getAvailableSlots(): number;
  
  // アイテム所持チェック
  hasItem(itemId: UniqueId, quantity: number): boolean;
}
```

### Core Engine 委譲

- `item/inventory.addItemToInventory()` - アイテム追加
- `item/inventory.removeItemFromInventory()` - アイテム削除
- `item/inventory.searchItems()` - アイテム検索
- `item/inventory.sortInventory()` - アイテムソート
- `item/inventory.stackItems()` - スタック整理
- `item/inventory.getInventoryStats()` - 統計情報取得
- `item/effects.checkItemUsable()` - アイテム使用可否判定（ItemServiceと連携）
- `item/equipment.checkEquipmentEligibility()` - 装備可否判定（EquipmentServiceと連携）

### 他のServiceとの連携

#### ItemService との連携
```typescript
// ItemService内でInventoryServiceを参照
class ItemService {
  constructor(
    private coreEngine: CoreEngine,
    private inventoryService: InventoryService
  ) {}
  
  getUsableItems(context: 'battle' | 'field'): Item[] {
    // InventoryServiceから使用可能アイテムを取得
    return this.inventoryService.getUsableItems(context)
      .map(slot => slot.item);
  }
  
  async useItem(item: Item, targets: Combatant[], context: 'battle' | 'field'): Promise<ItemUseResult> {
    // アイテム効果適用
    const result = await this.applyItemEffects(item, targets, context);
    
    // 成功したらインベントリから削除
    if (result.success) {
      this.inventoryService.removeItem(item, 1);
    }
    
    return result;
  }
}
```

#### EquipmentService との連携
```typescript
// EquipmentService内でInventoryServiceを参照
class EquipmentService {
  constructor(
    private coreEngine: CoreEngine,
    private inventoryService: InventoryService
  ) {}
  
  getEquippableItems(character: Character): Equipment[] {
    // InventoryServiceから装備可能アイテムを取得
    return this.inventoryService.getEquippableItems(character)
      .map(slot => slot.item as Equipment);
  }
  
  equipItem(character: Character, equipment: Equipment, slot: EquipmentType): EquipResult {
    // 装備処理
    const result = this.performEquip(character, equipment, slot);
    
    // インベントリの装備フラグを更新
    if (result.success) {
      // Core Engineを通じてインベントリ内の装備フラグを更新
      this.coreEngine.updateEquippedFlag(this.inventoryService.inventory, equipment.id, true);
    }
    
    return result;
  }
}
```

#### RewardService との連携
```typescript
// RewardService内でInventoryServiceを参照
class RewardService {
  constructor(
    private coreEngine: CoreEngine,
    private inventoryService: InventoryService
  ) {}
  
  async distributeRewards(rewards: BattleRewards): Promise<RewardResult> {
    // 経験値・お金を配分
    const expResult = this.distributeExp(rewards.exp);
    const moneyResult = this.addMoney(rewards.money);
    
    // アイテムをインベントリに追加
    const itemResults: InventoryResult[] = [];
    for (const item of rewards.items) {
      const result = this.inventoryService.addItem(item, 1);
      itemResults.push(result);
    }
    
    return {
      exp: expResult,
      money: moneyResult,
      items: itemResults
    };
  }
}
```

#### CraftService との連携
```typescript
// CraftService内でInventoryServiceを参照
class CraftService {
  constructor(
    private coreEngine: CoreEngine,
    private inventoryService: InventoryService
  ) {}
  
  checkMaterials(recipe: Recipe): RecipeCheckResult {
    // インベントリから材料の所持数をチェック
    const materialsAvailable = recipe.materials.every(material =>
      this.inventoryService.hasItem(material.itemId, material.quantity)
    );
    
    return {
      canCraft: materialsAvailable,
      missingMaterials: this.getMissingMaterials(recipe)
    };
  }
  
  synthesize(recipe: Recipe): SynthesisResult {
    // 材料をインベントリから削除
    for (const material of recipe.materials) {
      this.inventoryService.removeItem(material.item, material.quantity);
    }
    
    // 合成処理
    const result = this.performSynthesis(recipe);
    
    // 成功したら結果アイテムをインベントリに追加
    if (result.success) {
      this.inventoryService.addItem(result.resultItem, 1);
    }
    
    return result;
  }
}
```

### 実装例

```typescript
class InventoryService {
  constructor(
    private coreEngine: CoreEngine,
    private inventory: Inventory
  ) {}
  
  addItem(item: Item, quantity: number): InventoryResult {
    // Core Engineに委譲
    return this.coreEngine.addItemToInventory(this.inventory, item, quantity);
  }
  
  getUsableItems(context: 'battle' | 'field'): InventorySlot[] {
    // インベントリから全アイテムを取得
    const allItems = this.inventory.slots;
    
    // 使用可能なアイテムのみフィルタ
    return allItems.filter(slot => 
      this.coreEngine.checkItemUsable(slot.item, context)
    );
  }
  
  searchItems(criteria: InventorySearchCriteria): InventorySlot[] {
    // Core Engineに委譲
    return this.coreEngine.searchItems(this.inventory, criteria);
  }
  
  sortInventory(sortBy: InventorySortBy, order: SortOrder): void {
    // Core Engineに委譲してソート実行
    this.coreEngine.sortInventory(this.inventory, sortBy, order);
  }
  
  getStats(): InventoryStats {
    // Core Engineに委譲
    return this.coreEngine.getInventoryStats(this.inventory);
  }
}
```

---

## 10. EquipmentService - 装備変更管理

### 概要
キャラクターの装備変更を管理。装備可否判定、装備変更、比較機能を提供。

### 公開インターフェース

```typescript
class EquipmentService {
  // 装備可否チェック
  checkEquipmentEligibility(character: Character, equipment: Equipment): EquipmentEligibilityCheck;
  
  // 装備変更
  equipItem(character: Character, equipment: Equipment, slot: EquipmentType): EquipResult;
  
  // 装備解除
  unequipItem(character: Character, slot: EquipmentType): UnequipResult;
  
  // 装備比較
  compareEquipment(character: Character, currentEquip: Equipment | null, newEquip: Equipment): EquipmentComparison;
}
```

### Core Engine 委譲

- `item/equipment.checkEquipmentEligibility()` - 装備可否判定
- `item/equipment.calculateEquipmentBonus()` - 装備ボーナス計算
- `item/equipment.compareEquipment()` - 装備比較
- `character/stats.calculateFinalStats()` - 最終ステータス再計算

---

## 11. PartyService - パーティ編成管理

### 概要
パーティの編成、メンバー入れ替え、隊列変更を管理。複数のパーティ編成をプリセットとして保存・切り替え可能。

### 公開インターフェース

```typescript
interface PartyFormation {
  id: string;
  name: string;
  members: Character[];
  formationPositions: number[];
  createdAt: number;
  updatedAt: number;
}

class PartyService {
  // メンバー追加
  addMember(party: Character[], character: Character): PartyResult;
  
  // メンバー削除
  removeMember(party: Character[], character: Character): PartyResult;
  
  // メンバー入れ替え
  swapMembers(party: Character[], index1: number, index2: number): PartyResult;
  
  // 隊列変更
  changeFormation(party: Character[], formation: number[]): PartyResult;
  
  // 複数パーティ編成管理
  saveFormation(id: string, name: string, party: Character[], formationPositions: number[]): FormationResult;
  loadFormation(id: string): FormationLoadResult;
  deleteFormation(id: string): FormationResult;
  getAllFormations(): PartyFormation[];
  switchToFormation(id: string): FormationSwitchResult;
}
```

### Core Engine 委譲

- `party/formation.validatePartyComposition()` - パーティ構成の検証
- `party/formation.saveFormation()` - パーティ編成の保存
- `party/formation.loadFormation()` - パーティ編成の読み込み
- `party/formation.deleteFormation()` - パーティ編成の削除
- `party/formation.getAllFormations()` - 全パーティ編成の取得

---

## 12. StatusEffectService - 状態異常・バフ管理

### 概要
キャラクターの状態異常とバフ/デバフを管理。付与、解除、効果適用、持続時間管理を行う。

### 公開インターフェース

```typescript
class StatusEffectService {
  // 状態異常付与
  applyStatusEffect(target: Combatant, effect: StatusEffect, attacker?: Combatant): ApplicationResult;
  
  // 状態異常解除
  removeStatusEffect(target: Combatant, effectType: StatusEffectType): RemovalResult;
  
  // ターン経過処理
  processTurnEffects(target: Combatant): TurnEffectResult;
  
  // 行動制限チェック
  checkActionRestriction(target: Combatant): ActionRestriction;
}
```

### Core Engine 委譲

- `status/effects.checkStatusEffectApplication()` - 付与判定
- `status/effects.calculateStatusDamage()` - 継続ダメージ計算
- `status/effects.checkActionRestriction()` - 行動制限判定
- `status/duration.updateEffectDuration()` - 持続時間更新
- `status/duration.checkEffectStack()` - スタック判定

---

## 13. CraftService - アイテム合成管理

### 概要
アイテム合成の流れを管理。レシピ確認、材料チェック、合成実行を行う。

### 公開インターフェース

```typescript
class CraftService {
  // 利用可能レシピ取得
  getAvailableRecipes(): Recipe[];
  
  // 材料チェック
  checkMaterials(recipe: Recipe, inventory: Inventory): RecipeCheckResult;
  
  // 合成実行
  synthesize(recipe: Recipe, inventory: Inventory): SynthesisResult;
}
```

### Core Engine 委譲

- `craft/synthesis.checkRecipeRequirements()` - レシピ材料チェック
- `craft/synthesis.calculateSynthesisSuccessRate()` - 成功率計算
- `craft/synthesis.rollSynthesisResult()` - 合成結果判定
- `craft/synthesis.calculateMaterialReturn()` - 材料返還判定

---

## 14. EnhanceService - 装備・キャラ強化

### 概要
装備やキャラクターの強化を管理。強化実行、成功判定を行う。

### 公開インターフェース

```typescript
class EnhanceService {
  // 強化実行
  enhance(target: EnhanceTarget, materials: Item[]): EnhanceResult;
  
  // 強化コスト計算
  calculateCost(target: EnhanceTarget, currentLevel: number): EnhanceCost;
  
  // 成功率取得
  getSuccessRate(target: EnhanceTarget, currentLevel: number): number;
}
```

### Core Engine 委譲

- `craft/enhance.calculateEnhanceSuccessRate()` - 成功率計算
- `craft/enhance.rollEnhanceResult()` - 強化結果判定
- `craft/enhance.calculateEnhanceBonus()` - 強化ボーナス計算
- `craft/enhance.calculateEnhanceCost()` - コスト計算

---

## 15. SaveLoadService - セーブ/ロード管理

### 概要
ゲームの状態をセーブ・ロードする。シリアライズ、デシリアライズ、バージョン管理を行う。

### 公開インターフェース

```typescript
class SaveLoadService {
  // セーブ
  save(slot: number, gameState: GameState): Promise<SaveResult>;
  
  // ロード
  load(slot: number): Promise<GameState>;
  
  // セーブデータ一覧
  listSaves(): SaveData[];
  
  // セーブ削除
  deleteSave(slot: number): Promise<void>;
}
```

---

## 16. SimulationService - 戦闘シミュレーション

### 概要
戦闘結果をシミュレーションし、勝率や期待ダメージを計算。

### 公開インターフェース

```typescript
class SimulationService {
  // 戦闘シミュレーション
  simulateBattle(party: Character[], enemies: Enemy[], iterations: number): SimulationResult;
  
  // ダメージ期待値計算
  calculateExpectedDamage(attacker: Combatant, target: Combatant, skill: Skill): number;
  
  // 勝率計算
  calculateWinRate(party: Character[], enemies: Enemy[]): number;
}
```

### Core Engine 委譲
- ほぼすべてのCore Engine機能を使用して戦闘をシミュレート

---

## まとめ

### Service実装の優先順位

**フェーズ1: 戦闘の基礎**
1. BattleService
2. CommandService
3. EnemyAIService
4. EnemyGroupService
5. StatusEffectService

**フェーズ2: 成長とカスタマイズ**
6. RewardService
7. EquipmentService
8. PartyService
9. SkillLearnService
10. JobChangeService

**フェーズ3: 発展的機能**
11. ItemService
12. CraftService
13. EnhanceService
14. SaveLoadService
15. SimulationService

### Service間の依存関係

```
BattleService
├─depends on→ CommandService
├─depends on→ EnemyAIService
├─depends on→ StatusEffectService
└─depends on→ RewardService (戦闘終了時)

RewardService
└─depends on→ SkillLearnService (レベルアップ時)

CommandService
└─depends on→ ItemService (アイテム選択時)

PartyService
└─depends on→ EquipmentService (メンバー変更時)
```

### 共通設計パターン

すべてのServiceは以下のパターンに従います：

1. **状態管理**: 現在の処理段階を保持
2. **Core Engine委譲**: 計算とルール判定はCore Engineに委譲
3. **型安全**: TypeScriptの型システムを活用
4. **エラーハンドリング**: 不正な状態遷移を防ぐ
5. **テスタビリティ**: 依存注入によりテスト容易

この設計により、rpg-coreライブラリの15のServiceを一貫性を持って実装できます。
