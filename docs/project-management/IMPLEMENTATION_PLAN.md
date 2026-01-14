# 実装計画書

## 概要
コードレビューで特定された25件の問題を段階的に修正するための実装計画です。

## 完了済み (2/25)

### ✅ Issue #9: Magic Numbers (重要度：中)
**Status**: 完了  
**Commit**: d29d394

**実施内容**:
- `src/combat/constants.ts` に定数を追加
  - `DEFEND_POWER_MULTIPLIER`, `MAX_ESCAPE_RATE`, `MIN_ESCAPE_RATE`, `BASE_ESCAPE_RATE`
  - `ESCAPE_SPEED_FACTOR`, `HEAL_VARIANCE`, `MIN_DAMAGE`, `MAX_SIMULATION_TURNS`
- 以下のファイルを更新:
  - `src/services/BattleActionExecutor.ts`
  - `src/combat/damage.ts`
  - `src/services/SimulationService.ts`

**効果**: 可読性向上、保守性向上

---

### ✅ Issue #6: Controller Duplication (重要度：高)
**Status**: 部分完了（1/13コントローラー）  
**Commit**: 0343636

**実施内容**:
- `BaseController<TState, TEvents>` 抽象クラスを作成
- `BattleController` を `BaseController` を継承するように変更
- `subscribe()`, `on()`, `getState()` メソッドの重複を削除

**残作業**:
- 残り12個のコントローラーを更新:
  - ItemController
  - EquipmentController
  - PartyController
  - CraftController
  - SkillLearnController
  - RewardController
  - EnhanceController
  - JobChangeController
  - StatusEffectController
  - InventoryController
  - ShopController
  - CommandController
  - PartySelectionController

**効果**: 500+行のコード削減、保守性大幅向上

---

## 推奨実装順序

### Phase 1: 基盤整備（優先度：高）

#### Issue #6の完了 (残作業)
**推定工数**: 2-3時間  
**ファイル数**: 12ファイル

各コントローラーで以下を実施:
1. `extends BaseController<StateType, EventsType>` を追加
2. `subscribe`, `on`, `getState` メソッドを削除
3. コンストラクタで `super()` を呼び出し

---

#### Issue #13: Custom Error Classes (重要度：中)
**推定工数**: 3-4時間  
**ファイル数**: 新規1 + 更新18

**実装手順**:
1. `src/errors/` ディレクトリを作成
2. カスタムエラークラスを定義:
   ```typescript
   // src/errors/BattleErrors.ts
   export class BattleError extends Error { /* ... */ }
   export class BattleNotStartedError extends BattleError { /* ... */ }
   export class InvalidTargetError extends BattleError { /* ... */ }
   
   // src/errors/ItemErrors.ts
   export class ItemError extends Error { /* ... */ }
   export class ItemNotFoundError extends ItemError { /* ... */ }
   
   // src/errors/index.ts
   export * from './BattleErrors';
   export * from './ItemErrors';
   // ...
   ```
3. 18箇所の `throw new Error()` を置換

**効果**: エラーハンドリングの改善、デバッグ容易性向上

---

### Phase 2: アーキテクチャ改善（優先度：高）

#### Issue #1: DRY - Damage Calculation (重要度：高)
**推定工数**: 2-3時間  
**ファイル数**: 1 (src/combat/damage.ts)

**実装手順**:
1. `calculatePhysicalDamage` と `calculateMagicDamage` を削除
2. すべての呼び出し元を `calculateDamage` に変更
3. または、ラッパー関数として残す:
   ```typescript
   export function calculatePhysicalDamage(...args): DamageResult {
     return calculateDamage(...args);
   }
   ```

**効果**: 保守性向上、バグリスク低減

---

#### Issue #2: SRP - BattleService (重要度：高)
**推定工数**: 5-6時間  
**ファイル数**: 2-3

**実装手順**:
1. `BattleRewardCalculator` クラスを作成:
   ```typescript
   export class BattleRewardCalculator {
     calculateRewards(enemies: Enemy[]): BattleRewards {
       // ドロップ判定ロジックをここに移動
     }
   }
   ```
2. `BattleRecoveryService` クラスを作成:
   ```typescript
   export class BattleRecoveryService {
     restorePartyHp(party: Character[]): void {
       // HP回復ロジックをここに移動
     }
   }
   ```
3. `BattleService.endBattle()` をリファクタリング

**効果**: テスト容易性向上、責任の明確化

---

#### Issue #5: OCP - Action Executor (重要度：高)
**推定工数**: 4-5時間  
**ファイル数**: 新規5 + 更新1

**実装手順**:
1. Strategy パターンの実装:
   ```typescript
   // src/services/actionExecutors/ActionExecutor.ts
   interface ActionExecutor {
     execute(action: BattleAction, state: BattleState): Promise<ActionResult>;
   }
   
   // src/services/actionExecutors/AttackExecutor.ts
   export class AttackExecutor implements ActionExecutor { /* ... */ }
   
   // src/services/actionExecutors/SkillExecutor.ts
   export class SkillExecutor implements ActionExecutor { /* ... */ }
   
   // src/services/actionExecutors/DefendExecutor.ts
   export class DefendExecutor implements ActionExecutor { /* ... */ }
   
   // src/services/actionExecutors/EscapeExecutor.ts
   export class EscapeExecutor implements ActionExecutor { /* ... */ }
   ```
2. `BattleActionExecutor` を更新してStrategy パターンを使用

**効果**: 拡張性向上、OCP準拠

---

### Phase 3: 型安全性の向上（優先度：高）

#### Issue #10: Type Safety - Remove `as any` (重要度：中)
**推定工数**: 8-10時間  
**ファイル数**: 15+

**実装手順**:
1. オプショナルプロパティの定義:
   ```typescript
   // src/types/character.ts
   export interface CharacterWithJobSystem extends Character {
     jobExp?: number;
     jobLevel?: number;
     jobLevelUps?: number;
   }
   ```
2. 型ガード関数の実装:
   ```typescript
   export function hasJobSystem(char: Character): char is CharacterWithJobSystem {
     return 'jobExp' in char;
   }
   ```
3. 101箇所の `as any` を順次修正
   - 優先度: RewardService.ts (6箇所)
   - 優先度: character/skillCost.ts (3箇所)
   - その他のファイル

**効果**: 型安全性向上、ランタイムエラーリスク低減

---

### Phase 4: テスト容易性の向上（優先度：中）

#### Issue #12: Time Dependency (重要度：中)
**推定工数**: 4-5時間  
**ファイル数**: 新規2 + 更新10+

**実施手順**:
1. `TimeProvider` インターフェースを作成:
   ```typescript
   // src/system/TimeProvider.ts
   export interface TimeProvider {
     now(): number;
   }
   
   export class SystemTimeProvider implements TimeProvider {
     now(): number {
       return Date.now();
     }
   }
   
   export class MockTimeProvider implements TimeProvider {
     constructor(private time: number = 0) {}
     now(): number {
       return this.time;
     }
     setTime(time: number): void {
       this.time = time;
     }
   }
   ```
2. 29箇所の `Date.now()` を `timeProvider.now()` に変更
3. 各サービスのコンストラクタに `TimeProvider` を注入

**効果**: テスト容易性大幅向上

---

#### Issue #3: DIP - Concrete Dependencies (重要度：高)
**推定工数**: 6-8時間  
**ファイル数**: 新規20+ + 更新3

**実装手順**:
1. サービスインターフェースを定義:
   ```typescript
   // src/services/interfaces/IBattleService.ts
   export interface IBattleService {
     startBattle(party: Character[], enemies: Enemy[]): Promise<void>;
     advanceTurn(): Promise<void>;
     // ...
   }
   
   // src/services/interfaces/IItemService.ts
   export interface IItemService {
     useItem(item: Item, target: Character): UseResult;
     // ...
   }
   ```
2. 各サービスがインターフェースを実装
3. `RPGCore.registerServices` を更新してインターフェースに依存

**効果**: テスト容易性向上、拡張性向上

---

### Phase 5: その他の改善（優先度：中〜低）

#### Issue #14: ISP - GameConfig Segregation (重要度：中)
**推定工数**: 3-4時間

**実装手順**:
1. 設定を分離:
   ```typescript
   export interface CombatConfig { /* ... */ }
   export interface GrowthConfig { /* ... */ }
   export interface ItemConfig { /* ... */ }
   
   export interface GameConfig {
     combat: CombatConfig;
     growth: GrowthConfig;
     item: ItemConfig;
   }
   ```
2. 各サービスが必要な設定のみを受け取るように変更

---

#### Issue #15: Console.error Removal (重要度：中)
**推定工数**: 2時間

**実装手順**:
1. `Logger` インターフェースを定義
2. `EventBus` に `Logger` を注入
3. `console.error` を `logger.error()` に変更

---

#### Issue #4: Law of Demeter (重要度：高)
**推定工数**: 6-8時間

**実装手順**:
1. `Combatant` にメソッドを追加:
   ```typescript
   getMaxHp(): number { return this.stats.maxHp; }
   getElementalResistance(element: Element): number { /* ... */ }
   ```
2. 直接アクセスをメソッド呼び出しに変更

---

## 見積もり

### 工数合計
- Phase 1: 5-7時間
- Phase 2: 11-14時間  
- Phase 3: 8-10時間
- Phase 4: 10-13時間
- Phase 5: 11-14時間

**合計**: 45-58時間（約6-8営業日）

### 優先順位別
- 重要度：高 (6件): 28-36時間
- 重要度：中 (11件): 30-38時間
- 重要度：低 (8件): 8-12時間

## 推奨アプローチ

1. **段階的な実装**: 一度にすべてを修正せず、フェーズごとに実装
2. **テスト駆動**: 各修正後に既存テストを実行
3. **レビュー**: 各フェーズ完了後にコードレビューを実施
4. **ドキュメント更新**: 大きな変更の際はドキュメントも更新

## 注意事項

- すべての問題を一度に解決する必要はありません
- プロジェクトの優先順位に応じて選択的に対応可能
- 各フェーズは独立しているため、順不同で実施可能
- 破壊的変更を避け、後方互換性を維持

## 次のステップ

1. このプランをレビュー
2. 優先順位を確認・調整
3. Phase 1から順次実装開始
4. 各フェーズ完了後に進捗を報告
