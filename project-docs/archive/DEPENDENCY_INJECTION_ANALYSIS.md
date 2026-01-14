# サービス関数の依存関係パラメータ分析

## 概要

このドキュメントは、各サービスの関数で引数として渡されているものの中で、依存関係注入（DI）システムを通じて自動的に取得できる可能性があるものを分析します。

## 分析の目的

1. どの引数が依存関係として注入できるかを洗い出す
2. 引数で指定する方法と自動注入する方法のトレードオフを検討
3. ベストプラクティスとガイドラインを提案

## 現在の依存関係パターン

### パターン1: コンストラクタ注入（推奨）

現在のシステムでは、サービス間の依存関係はコンストラクタで注入されています：

```typescript
// ShopService: InventoryServiceへの依存をコンストラクタで注入
constructor(shop: Shop, inventoryService: InventoryService, eventBus?: EventBus)

// SkillLearnService: InventoryServiceをオプションで注入
constructor(inventoryService?: InventoryService, eventBus?: EventBus)
```

**メリット:**
- 依存関係が明確
- テストが容易（モックを簡単に注入できる）
- サービスの初期化時に依存関係が確定

### パターン2: メソッドパラメータとして渡す（現在の主流）

ほとんどのメソッドは、データオブジェクト（inventory, party, character等）をパラメータとして受け取っています：

```typescript
// CraftService
canCraft(recipe: CraftRecipe, inventory: synthesis.InventoryItem[], character?: Character)
craft(recipe: CraftRecipe, inventory: synthesis.InventoryItem[], character?: Character)

// PartyService
addMember(party: Combatant<TStats>[], member: Combatant<TStats>)
removeMember(party: Combatant<TStats>[], memberId: UniqueId)
```

**メリット:**
- 柔軟性が高い（複数のパーティやインベントリを扱える）
- 状態を持たない（ステートレス）
- 純粋関数に近い設計
- テストが容易（データを直接渡せる）

## 詳細分析

### 1. BattleService

**現在の実装:**
```typescript
constructor(config?: GameConfig) {
  this.config = config || defaultGameConfig;
  this.actionExecutor = new BattleActionExecutor(this.config);
  this.rewardService = new RewardService();
}
```

**問題点:**
- `RewardService`を内部で直接インスタンス化している
- `BattleActionExecutor`も内部で直接インスタンス化している

**改善案:**
```typescript
constructor(
  config?: GameConfig,
  rewardService?: RewardService,
  actionExecutor?: BattleActionExecutor
) {
  this.config = config || defaultGameConfig;
  this.rewardService = rewardService || new RewardService();
  this.actionExecutor = actionExecutor || new BattleActionExecutor(this.config);
}
```

**推奨: DI注入を使用**
- RewardServiceとBattleActionExecutorは他のサービスと同様にDIコンテナから注入すべき
- テスタビリティが向上
- サービス間の依存関係が明確になる

### 2. CraftService

**現在の実装:**
```typescript
canCraft(recipe: CraftRecipe, inventory: synthesis.InventoryItem[], character?: Character): RecipeInfo
craft(recipe: CraftRecipe, inventory: synthesis.InventoryItem[], character?: Character): CraftResult
```

**検討事項:**
- `inventory`パラメータは毎回渡される
- InventoryServiceへの依存を追加できるか？

**改善案A: InventoryServiceを注入**
```typescript
constructor(config: CraftServiceConfig = {}, inventoryService?: InventoryService, eventBus?: EventBus)

canCraft(recipe: CraftRecipe, character?: Character): RecipeInfo {
  const inventory = this.inventoryService?.getInventory();
  // ...
}
```

**改善案B: 現状維持（推奨）**
- 現在の設計の方が柔軟性が高い
- 複数のインベントリを扱える
- テストが容易（モックインベントリを直接渡せる）
- CraftServiceは純粋な計算サービスとして機能

**推奨: 現状維持**
- inventoryは「処理対象のデータ」であり、「依存するサービス」ではない
- パラメータとして渡す方が適切

### 3. PartyService

**現在の実装:**
```typescript
addMember(party: Combatant<TStats>[], member: Combatant<TStats>): PartyOperationResult<TStats>
removeMember(party: Combatant<TStats>[], memberId: UniqueId): PartyOperationResult<TStats>
```

**検討事項:**
- `party`は毎回パラメータとして渡される
- PartyServiceが特定のパーティを保持すべきか？

**改善案A: パーティをサービス内で保持**
```typescript
constructor(party: Combatant<TStats>[], config?: PartyServiceConfig, eventBus?: EventBus) {
  this.party = party;
}

addMember(member: Combatant<TStats>): PartyOperationResult<TStats> {
  // this.partyを直接操作
}
```

**改善案B: 現状維持（推奨）**
- 複数のパーティを管理できる
- ステートレスで予測可能
- テストが容易

**推奨: 現状維持**
- PartyServiceは「パーティ操作のユーティリティ」として機能
- 特定のパーティに束縛されない方が柔軟

### 4. InventoryService

**現在の実装:**
```typescript
constructor(inventory: Inventory, eventBus?: EventBus) {
  this.inventory = inventory;
}

addItem(item: Item, quantity: number): InventoryResult
```

**特徴:**
- inventoryを内部で保持
- インベントリに特化したサービス

**評価: 適切な設計**
- InventoryServiceは特定のインベントリを管理するサービス
- 状態を持つことが適切
- GEasyKitで自動的に初期化される

### 5. ShopService

**現在の実装:**
```typescript
constructor(shop: Shop, inventoryService: InventoryService, eventBus?: EventBus) {
  this.shop = shop;
  this.inventoryService = inventoryService;
}

buyItem(character: Character, shopItemIndex: number, quantity: number): ShopTransaction
```

**特徴:**
- Shopオブジェクトを内部で保持
- InventoryServiceへの依存を注入

**評価: 良い設計**
- 適切な依存関係注入の例
- ShopとInventoryServiceの関係が明確

### 6. ItemService

**現在の実装:**
```typescript
useItem(item: ConsumableItem, target: Combatant, conditions: ItemUseConditions): ItemUseResult
```

**特徴:**
- すべてパラメータで受け取る
- 完全にステートレス

**評価: 優れた設計**
- 純粋な計算サービス
- テストが非常に容易
- 予測可能

### 7. SkillLearnService

**現在の実装:**
```typescript
constructor(inventoryService?: InventoryService, eventBus?: EventBus)

learnSkill(
  character: Character,
  skill: Skill,
  requirements?: skillModule.SkillLearnRequirements,
  cost?: SkillLearnCost
): SkillLearnResult
```

**特徴:**
- InventoryServiceはオプション（リソースコスト管理用）
- characterは毎回パラメータで渡す

**評価: 適切な設計**
- InventoryServiceは「条件付き依存」として適切に実装
- characterはパラメータとして渡すのが適切

## 推奨事項とガイドライン

### ガイドライン1: サービスとデータの区別

**サービスはコンストラクタ注入:**
- ItemService
- InventoryService
- RewardService
- EventBus
- Config

**データはメソッドパラメータ:**
- Character
- Party (Combatant[])
- Inventory（配列として扱う場合）
- Item
- Recipe

### ガイドライン2: 状態の管理

**状態を持つべきサービス（特定のデータインスタンスに束縛）:**
- InventoryService - 特定のインベントリを管理
- ShopService - 特定のショップを管理
- SaveLoadService - セーブデータを管理

**状態を持たないべきサービス（ユーティリティ的）:**
- ItemService - アイテム使用ロジック
- PartyService - パーティ操作ロジック
- CraftService - クラフトロジック
- SkillLearnService - スキル習得ロジック

### ガイドライン3: 依存関係注入の判断基準

**DIすべきケース:**
1. サービスが他のサービスを使用する（ShopService → InventoryService）
2. 設定や共通リソース（Config, EventBus）
3. サービスのライフサイクル全体で使用される依存関係

**パラメータとして渡すべきケース:**
1. 処理対象のデータ（Character, Party, Item）
2. 操作ごとに変わる可能性があるデータ
3. 複数のインスタンスを扱う可能性があるデータ
4. テストで簡単にモック化したいデータ

## 具体的な改善提案

### 優先度: 高

#### 1. BattleServiceの依存関係を注入

**現在:**
```typescript
constructor(config?: GameConfig) {
  this.actionExecutor = new BattleActionExecutor(this.config);
  this.rewardService = new RewardService();
}
```

**改善後:**
```typescript
constructor(
  config?: GameConfig,
  rewardService?: RewardService,
  actionExecutor?: BattleActionExecutor
) {
  this.config = config || defaultGameConfig;
  this.rewardService = rewardService || new RewardService();
  this.actionExecutor = actionExecutor || new BattleActionExecutor(this.config);
}
```

**GEasyKitでの登録:**
```typescript
this._container.register('actionExecutor', (c) =>
  new BattleActionExecutor(c.resolve('config'))
);

this._container.register('battleService', (c) =>
  new BattleService(
    c.resolve('config'),
    c.resolve('rewardService'),
    c.resolve('actionExecutor')
  )
);
```

**メリット:**
- テスト時にモックを注入できる
- actionExecutorとrewardServiceの依存関係が明確
- ServiceContainerで一元管理

### 優先度: 中

#### 2. CraftServiceにInventoryServiceを注入（オプション）

**検討理由:**
- 現在は`inventory: synthesis.InventoryItem[]`を毎回渡している
- InventoryServiceを使えば、より統一的なアクセスが可能

**しかし推奨しない理由:**
- 現在の設計の方が柔軟性が高い
- inventoryは「処理対象のデータ」として扱うのが適切
- 複数のインベントリを扱う可能性がある

### 優先度: 低

#### 3. その他のサービス

以下のサービスは現状のままで問題なし：
- ItemService - 完全にステートレスで適切
- PartyService - パラメータで渡す方が柔軟
- EquipmentService - 現在の設計が適切
- StatusEffectService - ステートレスで問題なし

## まとめ

### 実装すべき変更

1. **BattleService**: RewardServiceとBattleActionExecutorをDI注入に変更（推奨）
   - テスタビリティの向上
   - 依存関係の明確化

### 現状維持すべきもの

1. **データパラメータ**: Character, Party, Inventory配列などは引き続きパラメータとして渡す
   - 柔軟性が高い
   - テストが容易
   - 複数のインスタンスを扱える

2. **ステートレスサービス**: ItemService, PartyService, CraftServiceなどは現在の設計を維持
   - 純粋関数的で予測可能
   - 再利用性が高い

### 設計原則

**依存関係注入を使用する場合:**
- サービス間の依存関係
- 設定やイベントバスなどの共通リソース
- サービスのライフサイクル全体で使用される依存

**メソッドパラメータを使用する場合:**
- 処理対象のデータ
- 操作ごとに変わる可能性があるデータ
- テストで直接操作したいデータ

この原則に従うことで、柔軟性とテスタビリティを両立した設計が実現できます。
