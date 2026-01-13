# コードレビュー結果

## レビュー方針
以下の原理原則に基づいてコードベースをレビューしました：
- 基本原則（DRY, KISS, YAGNI, POLA）
- SOLID原則
- 構造・依存の原則
- 設計・保守性

---

## 🔴 重要度：高

### 1. DRY違反：ダメージ計算ロジックの重複
**場所**: `src/combat/damage.ts`

**問題点**:
- `calculatePhysicalDamage` と `calculateMagicDamage` 関数がほぼ同じ構造を持っている
- `performHitAndCriticalChecks` と `applyDamageModifiers` の呼び出しが重複
- `calculateDamage` 関数があるにも関わらず、他の2つの関数が残っている

**影響**:
- コードの保守性が低下
- バグ修正や機能追加時に複数箇所を修正する必要がある

**推奨される修正**:
```typescript
// calculateDamage 関数に統一し、calculatePhysicalDamage と calculateMagicDamage は
// calculateDamage のラッパーとして実装するか、削除する
```

**原則**: DRY (Don't Repeat Yourself)

---

### 2. SRP違反：BattleServiceの責任過多
**場所**: `src/services/BattleService.ts`

**問題点**:
- 戦闘の初期化、ターン進行、アクション実行、勝敗判定、報酬計算まで1つのクラスが担当
- 171-216行目の `endBattle` メソッドが報酬計算とHP回復の両方を行っている
- 報酬計算の詳細ロジックが直接実装されている（ドロップ判定など）

**影響**:
- テストが困難
- クラスの変更理由が複数存在する
- 責任の境界が不明確

**推奨される修正**:
- 報酬計算を `RewardService` に完全に委譲
- HP回復処理を別のサービスに分離
- 戦闘状態管理と進行管理を分離することを検討

**原則**: SRP (Single Responsibility Principle)

---

### 3. DIP違反：具体実装への依存
**場所**: `src/core/RPGCore.ts`

**問題点**:
- 114-204行目の `registerServices` メソッドで具体クラスを直接 `new` している
- サービス間の依存関係がハードコーディングされている
- 拡張性が低く、テストが困難

**影響**:
- モックやスタブを使ったテストが困難
- 異なる実装への切り替えが困難
- 依存関係の変更がクラス全体に影響

**推奨される修正**:
```typescript
// インターフェースを定義し、それに依存するように変更
interface IBattleService { /* ... */ }
class BattleService implements IBattleService { /* ... */ }

// ファクトリーパターンや依存注入を使用
```

**原則**: DIP (Dependency Inversion Principle)

---

### 4. Law of Demeter違反：チェーンアクセス
**場所**: 複数箇所

**問題点**:
- `src/combat/damage.ts` 63行目: `(target.stats as any).elementalResistance`
- `src/services/BattleActionExecutor.ts` 126行目: `target.stats.maxHp`
- 深いオブジェクトのプロパティへの直接アクセスが多数

**影響**:
- 密結合が発生
- 変更の影響範囲が広い
- カプセル化の破壊

**推奨される修正**:
```typescript
// メソッドを通じてアクセス
target.getMaxHp()
target.getElementalResistance(element)
```

**原則**: Law of Demeter

---

### 5. Open-Closed Principle違反：型によるswitch文
**場所**: `src/services/BattleActionExecutor.ts`

**問題点**:
- 39-64行目の `executeAction` メソッドで action.type によるswitch文
- 新しいアクションタイプを追加するたびにこのメソッドを修正する必要がある

**影響**:
- 既存コードの修正が必要
- 拡張性が低い

**推奨される修正**:
```typescript
// Strategy パターンや Command パターンを使用
interface ActionExecutor {
  execute(action: BattleAction, state: BattleState): Promise<ActionResult>;
}

class AttackExecutor implements ActionExecutor { /* ... */ }
class SkillExecutor implements ActionExecutor { /* ... */ }

// アクションタイプごとにExecutorを登録
const executors: Map<ActionType, ActionExecutor> = new Map();
```

**原則**: OCP (Open-Closed Principle)

---

## 🟡 重要度：中

### 6. YAGNI違反：未使用の複雑な機能
**場所**: `src/services/CommandService.ts`

**問題点**:
- 203-232行目の `previewTarget` メソッドが「プレビュー用」とコメントされているが、実際の使用箇所が不明
- 文字列パースのロジックが複雑

**影響**:
- メンテナンスコストの増加
- コードの複雑化

**推奨される修正**:
- 実際に使用されていない場合は削除
- 使用される予定がある場合はTODOコメントを追加

**原則**: YAGNI (You Aren't Gonna Need It)

---

### 7. High Cohesion違反：関連性の低い機能の混在
**場所**: `src/services/CommandService.ts`

**問題点**:
- コマンド選択の状態管理とターゲット取得の両方を担当
- 99-127行目の `selectCommand` メソッド内で複数の異なる処理フロー

**影響**:
- クラスの目的が不明確
- 変更の影響範囲が予測困難

**推奨される修正**:
- ターゲット選択を別のクラスに分離
- コマンド選択の状態機械として再設計

**原則**: High Cohesion

---

### 8. 魔法の数値（Magic Numbers）
**場所**: 複数箇所

**問題点**:
- `src/services/BattleActionExecutor.ts` 173行目: `power: 2.0`
- `src/services/BattleActionExecutor.ts` 200行目: `0.95`, `0.05`, `0.5`
- `src/combat/damage.ts` 294行目: `0.05`
- `src/services/SimulationService.ts` 69行目: `maxTurns = 100`

**影響**:
- 意味が不明確
- 調整が困難

**推奨される修正**:
```typescript
const DEFEND_POWER_MULTIPLIER = 2.0;
const MAX_ESCAPE_RATE = 0.95;
const MIN_ESCAPE_RATE = 0.05;
const BASE_ESCAPE_RATE = 0.5;
const HEAL_VARIANCE = 0.05;
const MAX_SIMULATION_TURNS = 100;
```

**原則**: Clean Code Principle

---

### 9. 型安全性の欠如
**場所**: 複数箇所

**問題点**:
- `src/combat/damage.ts` 63行目: `(target.stats as any).elementalResistance`
- `src/combat/damage.ts` 390行目: `(attacker.stats as any).attack`
- `src/services/BattleService.ts` 231行目: 戻り値の型が `any`
- 頻繁な型アサーション

**影響**:
- 型安全性の喪失
- ランタイムエラーのリスク増加

**推奨される修正**:
```typescript
// 適切なジェネリック型パラメータの使用
// 型ガード関数の実装
function hasElementalResistance(stats: BaseStats): stats is StatsWithElementalResistance {
  return 'elementalResistance' in stats;
}
```

**原則**: Type Safety (TypeScript Best Practices)

---

### 10. Low Coupling違反：直接的な状態変更
**場所**: 複数箇所

**問題点**:
- `src/services/BattleActionExecutor.ts` 92行目: `target.currentHp = ...`
- `src/services/BattleActionExecutor.ts` 149行目: `target.currentHp = ...`
- 他のオブジェクトの状態を直接変更している

**影響**:
- 密結合
- 状態変更の追跡が困難
- 副作用の管理が困難

**推奨される修正**:
```typescript
// メソッドを通じて変更
target.takeDamage(damage);
target.heal(healAmount);
```

**原則**: Low Coupling, Encapsulation

---

## 🟢 重要度：低

### 11. 可読性：長いメソッド
**場所**: `src/services/BattleService.ts`

**問題点**:
- `endBattle` メソッドが45行（171-216行目）
- 複数の処理を1つのメソッドで実施

**推奨される修正**:
- HP回復処理を別メソッドに抽出
- 報酬計算を別メソッドに抽出

**原則**: Clean Code Principle

---

### 12. コメントの過剰
**場所**: 複数箇所

**問題点**:
- 自明な処理にコメントが付いている
- 例: `src/services/BattleActionExecutor.ts` 91行目: `// ダメージを適用`

**影響**:
- コメントのメンテナンスコスト
- コードとコメントの不一致のリスク

**推奨される修正**:
- 自明なコメントは削除
- コード自体を自己説明的にする

**原則**: Clean Code Principle

---

### 13. 命名の一貫性
**場所**: 複数箇所

**問題点**:
- `getState()` と `getCurrentActor()` で get の使い方が異なる
- `check`, `calculate`, `perform` など動詞の使い分けが不明確

**推奨される修正**:
- 命名規則を統一
- プロジェクト全体で一貫した動詞を使用

**原則**: Clean Code Principle

---

### 14. エラーハンドリングの不足
**場所**: 複数箇所

**問題点**:
- `src/services/BattleActionExecutor.ts` で null チェックはあるが、詳細なエラー情報が不足
- 例外の種類が少ない（すべて `Error`）

**推奨される修正**:
```typescript
// カスタムエラークラスの定義
class BattleStateError extends Error { /* ... */ }
class InvalidTargetError extends Error { /* ... */ }
```

**原則**: Robustness Principle

---

### 15. 循環的複雑度
**場所**: `src/services/CommandService.ts`

**問題点**:
- `cancel` メソッド（235-268行目）のswitch文が複雑
- ネストしたif文による複雑度の増加

**推奨される修正**:
- State パターンを使用
- 各状態を別クラスとして実装

**原則**: KISS (Keep It Simple)

---

## 📊 統計情報

### 発見された問題の内訳
- 🔴 重要度：高 - 5件
- 🟡 重要度：中 - 5件
- 🟢 重要度：低 - 5件

### 原則別の問題数
- DRY: 1件
- SRP: 1件
- OCP: 1件
- DIP: 1件
- Law of Demeter: 1件
- YAGNI: 1件
- High Cohesion: 1件
- Low Coupling: 1件
- Clean Code: 5件
- その他: 2件

---

## 🎯 優先的に対応すべき項目

1. **BattleServiceの責任分離** (問題#2)
   - 影響範囲が大きく、テストや保守性に直接影響

2. **ダメージ計算ロジックの統一** (問題#1)
   - 頻繁に使用される部分であり、バグのリスクが高い

3. **依存性注入の改善** (問題#3)
   - アーキテクチャの根幹に関わる問題

4. **アクション実行のリファクタリング** (問題#5)
   - 拡張性に直接影響

5. **型安全性の向上** (問題#9)
   - ランタイムエラーのリスク軽減

---

## 📝 総評

全体的に見て、このコードベースは以下の特徴があります：

### 良い点
- TypeScriptを活用した型定義
- サービス層とコア層の分離
- DIコンテナの実装
- ドキュメンテーションコメントの充実

### 改善が必要な点
- 責任の分離が不十分な箇所がある
- 具体実装への依存が多い
- 型安全性を犠牲にしている箇所がある
- 拡張性を考慮した設計が不足

### 推奨アクション
1. 重要度「高」の問題から順に対応
2. リファクタリング時は既存のテストを確認・追加
3. インターフェースの定義と抽象化の推進
4. コーディング規約の策定と適用

---

**注意**: この レビューは原理原則に基づく理想的な設計を基準としています。実際の修正を行うかどうかは、プロジェクトの優先順位、スケジュール、リソースを考慮して判断してください。
