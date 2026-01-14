# サービスの関数引数と依存関係の分析結果

## 問題提起

> 各サービスの関数の引数で他のサービスなどを依存関係に入れれば引数で指定しなくてもいいものを洗い出してほしい。引数で指定させる方がいいのか自動的に取ってくるのがいいのか検討して

## 結論

現在の設計は**ほぼ最適**です。以下の理由により、ほとんどのサービスは現状のままで問題ありません：

1. ✅ サービスと**データ**の区別が明確
2. ✅ 柔軟性が高い（複数のインスタンスを処理可能）
3. ✅ テストが容易（モックデータを直接渡せる）
4. ✅ 状態を持たない設計（ステートレス）

**改善を実装したサービス:** BattleServiceのみ（RewardServiceとBattleActionExecutorをDI注入に変更）

## 判断基準

### コンストラクタで注入すべきもの（依存関係）

```typescript
✅ constructor(otherService: Service, config: Config, eventBus: EventBus)
```

**該当するもの:**
- 他のサービス（ItemService, InventoryService, RewardService等）
- 設定オブジェクト（GameConfig）
- 横断的関心事（EventBus）

**理由:**
- サービスのライフサイクル全体で使用
- 同じインスタンスを常に使用
- 「依存関係」である（データではない）

### メソッドパラメータで渡すべきもの（データ）

```typescript
✅ processData(character: Character, party: Party[], inventory: Item[])
```

**該当するもの:**
- ゲームデータ（Character, Enemy, Party）
- コレクション（Inventory配列, Item配列）
- 操作ごとに変わるデータ

**理由:**
- メソッド呼び出しごとに異なるデータ
- 複数のインスタンスを処理する必要がある
- 純粋関数スタイルが望ましい
- テストで異なるデータセットを使用

## サービス別の分析結果

### 🔧 改善実施: BattleService

**問題点:**
```typescript
constructor(config?: GameConfig) {
  this.actionExecutor = new BattleActionExecutor(this.config);
  this.rewardService = new RewardService();
}
```

- RewardServiceとBattleActionExecutorを内部で直接生成
- 隠れた依存関係
- テスト時にモックを注入できない

**改善後:**
```typescript
constructor(
  config?: GameConfig,
  rewardService?: RewardService,
  actionExecutor?: BattleActionExecutor
) {
  this.rewardService = rewardService || new RewardService();
  this.actionExecutor = actionExecutor || new BattleActionExecutor(this.config);
}
```

**メリット:**
- ✅ 依存関係が明確
- ✅ テスト時にモックを注入可能
- ✅ ServiceContainerで一元管理
- ✅ 後方互換性を維持

### ✅ 現状維持推奨: CraftService

**現在の実装:**
```typescript
canCraft(recipe: CraftRecipe, inventory: InventoryItem[], character?: Character)
craft(recipe: CraftRecipe, inventory: InventoryItem[], character?: Character)
```

**検討: InventoryServiceを注入すべきか？**

❌ **注入すべきでない理由:**

1. **柔軟性が失われる**
   - 現在: 複数のインベントリを処理可能
   - 注入した場合: 1つのインベントリに制限される

2. **データとサービスの混同**
   - inventoryは「処理対象のデータ」
   - サービスではない

3. **テストが困難になる**
   - 現在: モックデータを直接渡せる
   - 注入した場合: モックサービスが必要

4. **使用例:**
   ```typescript
   // 現在: 柔軟（推奨）
   craftService.craft(recipe, inventory1, character);
   craftService.craft(recipe, inventory2, character);
   
   // 注入した場合: 不便
   craftService1.craft(recipe, character);  // inventory1用
   craftService2.craft(recipe, character);  // inventory2用
   ```

**結論:** パラメータで渡す現在の設計が最適

### ✅ 現状維持推奨: PartyService

**現在の実装:**
```typescript
addMember(party: Combatant[], member: Combatant)
removeMember(party: Combatant[], memberId: UniqueId)
```

**検討: Partyをサービス内で保持すべきか？**

❌ **保持すべきでない理由:**

1. **複数パーティを扱えない**
   - 現在: 1つのサービスで複数パーティを管理
   - 保持した場合: パーティごとに別サービスが必要

2. **ステートレスの利点**
   - 現在: 予測可能、副作用なし
   - 保持した場合: 状態管理が必要

3. **使用例:**
   ```typescript
   // 現在: 柔軟（推奨）
   partyService.addMember(mainParty, hero);
   partyService.addMember(reserveParty, hero2);
   
   // 保持した場合: 不便
   mainPartyService.addMember(hero);
   reservePartyService.addMember(hero2);
   ```

**結論:** ユーティリティサービスとして現在の設計が最適

### ✅ 現状維持推奨: ItemService

**現在の実装:**
```typescript
useItem(item: ConsumableItem, target: Combatant, conditions: ItemUseConditions)
```

**特徴:**
- 完全にステートレス
- 純粋な計算サービス
- 依存関係なし

**結論:** 理想的な設計、変更不要

### ✅ 良い設計例: ShopService

**現在の実装:**
```typescript
constructor(shop: Shop, inventoryService: InventoryService, eventBus?: EventBus)
buyItem(character: Character, shopItemIndex: number, quantity: number)
```

**なぜ良いか:**
- ✅ ShopとInventoryServiceは**依存関係**として注入
- ✅ Characterは**データ**としてパラメータで渡す
- ✅ 適切な責任分担

**結論:** 模範的な設計

### ✅ 良い設計例: InventoryService

**現在の実装:**
```typescript
constructor(inventory: Inventory, eventBus?: EventBus)
addItem(item: Item, quantity: number)
```

**なぜ良いか:**
- 特定のインベントリを管理するサービス
- 状態を持つことが適切
- RPGCoreで自動初期化

**結論:** 正しい設計

## 設計ガイドライン

### ガイドライン1: サービスとデータを区別する

**サービス（コンストラクタ注入）:**
- 他のサービス
- 設定オブジェクト
- EventBus

**データ（メソッドパラメータ）:**
- Character
- Party（配列）
- Inventory（配列）
- Item
- Recipe

### ガイドライン2: 状態管理を検討する

**状態を持つべきサービス:**
- InventoryService - 特定のインベントリを管理
- ShopService - 特定のショップを管理
- SaveLoadService - セーブデータを管理

**状態を持たないべきサービス:**
- ItemService - アイテム使用ロジック
- PartyService - パーティ操作ロジック
- CraftService - クラフトロジック
- SkillLearnService - スキル習得ロジック

### ガイドライン3: 柔軟性を優先する

```typescript
// ❌ 悪い例: 柔軟性がない
class CraftService {
  constructor(inventory: Inventory) { ... }
  craft(recipe: Recipe) { ... }  // 1つのインベントリのみ
}

// ✅ 良い例: 柔軟性が高い
class CraftService {
  craft(recipe: Recipe, inventory: Inventory[]) { ... }  // 複数対応
}
```

## よくある落とし穴

### ❌ データを過剰に注入してはいけない

**悪い例:**
```typescript
class CraftService {
  constructor(
    inventory: Inventory[],    // ❌ データを注入
    character: Character       // ❌ データを注入
  ) {}
}
```

**理由:**
- 柔軟性が失われる
- 異なるデータを処理できない
- サービスが特定のデータに束縛される

### ❌ サービスの依存を隠してはいけない

**悪い例:**
```typescript
class BattleService {
  executeAction() {
    const rewards = new RewardService();  // ❌ 隠れた依存
  }
}
```

**理由:**
- 依存関係が不明確
- テスト時にモックを注入できない
- 保守性が低下

## 実装状況

### ✅ 完了

1. **BattleService改善**
   - RewardServiceとBattleActionExecutorをDI注入
   - RPGCoreで適切に登録
   - テストで検証済み

2. **包括的なドキュメント作成**
   - 分析ドキュメント（日本語・英語）
   - 実例コード
   - ガイドライン

3. **テストの追加**
   - RPGCore DI テスト 10個
   - すべてのテストが成功（565テスト）

### 📝 変更不要

以下のサービスは現在の設計が最適：
- ItemService
- CraftService
- PartyService
- EquipmentService
- StatusEffectService
- SkillLearnService
- JobChangeService
- EnemyAIService
- EnemyGroupService
- その他すべてのサービス

## 利点まとめ

### 現在の設計の利点

1. **柔軟性**
   - 複数のデータインスタンスを処理可能
   - 人為的な制限がない
   - 様々な状況で使用可能

2. **テスト容易性**
   - モックデータを直接渡せる
   - サービスインスタンス全体をモック化不要
   - 予測可能な動作

3. **明確性**
   - 依存関係とデータの区別が明確
   - 隠れた状態がない
   - データフローが理解しやすい

4. **再利用性**
   - サービスが純粋なユーティリティとして機能
   - 異なるシナリオで使用可能
   - 特定のデータインスタンスに結合していない

## まとめ

**問いへの回答:**

1. **引数で指定しなくてもいいもの（DI注入すべき）:**
   - 他のサービス（BattleService → RewardService, BattleActionExecutor）
   - 設定（GameConfig）
   - EventBus

2. **引数で指定すべきもの（パラメータで渡す）:**
   - ゲームデータ（Character, Party, Inventory配列, Item）
   - 操作対象のデータ
   - メソッドごとに変わる可能性があるデータ

3. **どちらがいいか:**
   - **サービス = DI注入** が適切
   - **データ = パラメータ** が適切
   - この区別により、柔軟性とテスト容易性を両立

**結論:** rpg-coreライブラリは既に優れた設計パターンに従っており、BattleServiceの改善以外は変更不要です。
