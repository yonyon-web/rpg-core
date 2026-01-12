# Phase 4 Planning - 拡張機能実装

## 概要

Phase 4では、rpg-coreライブラリの最終フェーズとして、拡張機能を実装します。これらの機能は多くのJRPGで見られる発展的なシステムで、ゲームの深みと戦略性を大幅に向上させます。

## 実装予定のサービス（4つ）

### 1. CraftService - アイテム合成管理
**優先度**: High

**目的**: アイテムの合成・クラフトシステムを管理

**主要機能:**
- レシピ管理（登録、取得、条件チェック）
- 素材チェック（必要素材の確認）
- 合成実行（素材消費、アイテム生成）
- 成功率計算（スキル、レベルによる変動）
- レシピ解放システム

**必要なCore Engine:**
- `craft/synthesis.ts`
  - `validateRecipe(recipe, materials)` - レシピと素材の検証
  - `calculateCraftSuccess(recipe, character)` - 合成成功率計算
  - `consumeMaterials(inventory, recipe)` - 素材消費処理
  - `generateCraftedItem(recipe)` - 完成品生成

**想定されるテストケース:**
- 正常な合成実行
- 素材不足時のエラーハンドリング
- 成功率計算の正確性
- レシピ条件チェック（レベル、スキル）
- 複数アイテム生成
- 失敗時の素材消費/返却

**型定義:**
```typescript
interface CraftRecipe {
  id: UniqueId;
  name: string;
  materials: { itemId: UniqueId; quantity: number }[];
  result: { itemId: UniqueId; quantity: number };
  successRate: Probability;
  requirements?: {
    level?: number;
    skillId?: UniqueId;
    jobId?: string;
  };
}

interface CraftResult {
  success: boolean;
  item?: Item;
  materialsConsumed: { itemId: UniqueId; quantity: number }[];
  message: string;
}
```

### 2. EnhanceService - 装備強化管理
**優先度**: Medium

**目的**: 装備の強化システムを管理

**主要機能:**
- 強化レベル管理
- 成功率計算（強化レベルに応じて変動）
- 強化実行（ステータス上昇、失敗処理）
- 素材・費用消費
- 失敗時のペナルティ（レベルダウン、破壊）

**必要なCore Engine:**
- `craft/enhance.ts`
  - `calculateEnhanceSuccess(equipment, level)` - 強化成功率計算
  - `calculateEnhanceCost(equipment, level)` - 強化コスト計算
  - `applyEnhancement(equipment, level)` - 強化効果適用
  - `handleEnhanceFailure(equipment, penalty)` - 失敗時処理

**想定されるテストケース:**
- 正常な強化実行
- 強化レベルに応じた成功率変動
- 強化によるステータス上昇
- 失敗時のレベルダウン
- 失敗時の装備破壊
- 最大強化レベルの制限
- コスト・素材消費

**型定義:**
```typescript
interface EnhanceConfig {
  maxLevel: number;
  baseSuccessRate: Probability;
  successRateDecay: number; // レベルごとの成功率減少
  failurePenalty: 'none' | 'downgrade' | 'destroy';
}

interface EnhanceResult {
  success: boolean;
  newLevel: number;
  previousLevel: number;
  stats?: Partial<BaseStats>;
  message: string;
}
```

### 3. SaveLoadService - セーブ/ロード管理
**優先度**: Medium

**目的**: ゲーム状態の保存・読み込みを管理

**主要機能:**
- ゲーム状態のシリアライズ
- ゲーム状態のデシリアライズ
- 複数セーブスロット管理
- セーブデータのバリデーション
- バージョン互換性管理
- オートセーブ機能

**必要なCore Engine:**
- `system/persistence.ts`
  - `serializeGameState(state)` - 状態のシリアライズ
  - `deserializeGameState(data)` - 状態のデシリアライズ
  - `validateSaveData(data)` - セーブデータの検証
  - `migrateSaveData(data, version)` - バージョンマイグレーション

**想定されるテストケース:**
- 完全なゲーム状態の保存
- セーブデータの正確な復元
- 破損データのハンドリング
- バージョン互換性
- 複数スロット管理
- オートセーブ機能
- データ圧縮（オプション）

**型定義:**
```typescript
interface GameState {
  version: string;
  timestamp: number;
  player: {
    party: Combatant[];
    inventory: Item[];
    gold: number;
  };
  progress: {
    completedQuests: string[];
    unlockedAreas: string[];
    flags: Record<string, boolean | number | string>;
  };
}

interface SaveSlot {
  id: number;
  name: string;
  gameState: GameState;
  metadata: {
    playtime: number;
    saveDate: Date;
    location: string;
  };
}
```

### 4. SimulationService - 戦闘シミュレーション
**優先度**: Low（開発支援ツール）

**目的**: 大量の戦闘シミュレーションを実行し、バランス調整を支援

**主要機能:**
- AI vs AI戦闘シミュレーション
- 大量戦闘の並列実行
- 統計データ収集（勝率、平均ターン数、ダメージ分布）
- パラメータスイープ（様々な設定での戦闘テスト）
- レポート生成

**必要なCore Engine:**
- 既存のBattleServiceを活用
- 新規Core Engineは不要（統計処理のみ）

**想定されるテストケース:**
- 単一戦闘シミュレーション
- 大量戦闘シミュレーション（N=1000）
- 統計データの正確性
- パラメータスイープ
- 結果レポート生成

**型定義:**
```typescript
interface SimulationConfig {
  iterations: number;
  party1: Combatant[];
  party2: Combatant[];
  battleConfig?: BattleConfig;
}

interface SimulationResult {
  totalBattles: number;
  party1Wins: number;
  party2Wins: number;
  averageTurns: number;
  averageDamage: {
    party1: number;
    party2: number;
  };
  distribution: {
    turnCounts: Map<number, number>;
    winByTurn: Map<number, number>;
  };
}
```

## 実装順序

### 推奨実装順序
1. **CraftService**（1週目）
   - 最も需要が高い
   - 他の機能への影響が大きい
   - テストケースが明確

2. **EnhanceService**（2週目）
   - CraftServiceと連携
   - 装備システムの完成

3. **SaveLoadService**（3週目）
   - 実用性が高い
   - 統合テストに有用

4. **SimulationService**（4週目）
   - 開発支援ツール
   - 他の機能に依存しない

## 実装ガイドライン

### TDD手法の継続
Phase 1-3と同様のアプローチを継続：

1. **Red（失敗するテストを書く）**
   ```typescript
   test('should craft item with valid recipe', () => {
     const service = new CraftService();
     const recipe = createRecipe();
     const inventory = createInventory();
     
     const result = service.craft(recipe, inventory);
     
     expect(result.success).toBe(true);
     expect(result.item).toBeDefined();
   });
   ```

2. **Green（テストをパスさせる）**
   - Core Engineモジュールを実装
   - Serviceクラスを実装
   - 最小限のコードでテストをパス

3. **Refactor（リファクタリング）**
   - コードの可読性向上
   - 重複の削除
   - パフォーマンス最適化

### 品質基準

Phase 4でも以下の基準を維持：
- ✅ すべてのテストがパス
- ✅ テストカバレッジ > 85%
- ✅ TypeScriptエラーなし
- ✅ Pure Functionsの原則（Core Engine）
- ✅ 明確な責任分離（Core Engine vs Service）
- ✅ 包括的なドキュメント

### 型安全性

- カスタム型パラメータのサポート継続
- ジェネリック型の活用
- 後方互換性の維持

## 期待される成果

### Phase 4完了時の状態

**実装完了サービス:**
- 全15サービス（100%）
  - Phase 1: 4サービス ✅
  - Phase 2: 4サービス ✅
  - Phase 3: 3サービス ✅
  - Phase 4: 4サービス ⏳

**テスト:**
- 総テスト数: 350+ 見込み
- テストカバレッジ: 85%以上維持
- すべてのテストがパス

**ドキュメント:**
- 各サービスの使用例完備
- APIリファレンス完成
- チュートリアル作成

**リリース準備:**
- npm公開準備
- バージョン1.0.0のリリース
- READMEの完成

## マイルストーン

### M1: CraftService実装（Week 1）
- [x] Phase 3完了確認
- [ ] craft/synthesis.ts実装
- [ ] CraftService実装
- [ ] テスト作成・実行
- [ ] ドキュメント更新

### M2: EnhanceService実装（Week 2）
- [ ] craft/enhance.ts実装
- [ ] EnhanceService実装
- [ ] テスト作成・実行
- [ ] ドキュメント更新

### M3: SaveLoadService実装（Week 3）
- [ ] system/persistence.ts実装
- [ ] SaveLoadService実装
- [ ] テスト作成・実行
- [ ] ドキュメント更新

### M4: SimulationService実装（Week 4）
- [ ] SimulationService実装
- [ ] テスト作成・実行
- [ ] ドキュメント更新

### M5: Phase 4完了と統合（Week 5）
- [ ] 統合テスト
- [ ] パフォーマンステスト
- [ ] ドキュメント最終確認
- [ ] リリースノート作成
- [ ] v1.0.0リリース準備

## リスクと対策

### リスク1: SaveLoadServiceの複雑性
**リスク**: シリアライズ/デシリアライズが複雑になる可能性

**対策**:
- 段階的な実装（まず基本的な保存・読み込みから）
- 既存のライブラリ活用を検討
- バージョン管理を最初から組み込む

### リスク2: SimulationServiceのパフォーマンス
**リスク**: 大量シミュレーションが遅い可能性

**対策**:
- 非同期処理の活用
- Web Worker（ブラウザ環境）の検討
- バッチ処理の最適化

### リスク3: テストの実行時間
**リスク**: テストケース増加で実行時間が長くなる

**対策**:
- 並列テスト実行
- 統合テストとユニットテストの分離
- CIでのキャッシュ活用

## 次のアクション

1. **即座に開始**: CraftServiceの設計とテスト作成
2. **ドキュメント準備**: craft/synthesis.tsの仕様確定
3. **型定義**: CraftRecipe, CraftResult等の型定義
4. **テンプレート準備**: テストファイルのテンプレート作成

---

**Phase 4 Status**: ⏳ **PLANNING COMPLETE - READY TO IMPLEMENT**

**Estimated Completion**: 4-5 weeks

**Priority**: CraftService → EnhanceService → SaveLoadService → SimulationService
