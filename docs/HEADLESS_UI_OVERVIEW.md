# ヘッドレスUI - 概要

rpg-coreのヘッドレスUI層の全体像を理解するためのガイド

---

## 📖 ドキュメント構成

### 1. [ヘッドレスUI設計.md](./ヘッドレスUI設計.md)
**用途**: 設計と仕様の理解  
**内容**:
- ヘッドレスUIの概念と設計思想
- 13のコントローラーの詳細な仕様
- 各コントローラーの状態定義とイベント定義
- React/Vue/Svelteでの使用例
- 約5,000行の詳細な設計ドキュメント

**読むべき人**:
- ヘッドレスUIの設計を理解したい開発者
- 各コントローラーのAPIを知りたい開発者
- UIフレームワークとの統合方法を学びたい開発者

### 2. [ヘッドレスUI実装計画書.md](./ヘッドレスUI実装計画書.md)
**用途**: 実装の進め方の理解  
**内容**:
- 6つのフェーズに分けた実装計画
- 各フェーズの期間と成果物
- ディレクトリ構造の設計
- テスト戦略とカバレッジ目標
- スケジュールとリスク管理
- 約850行の実装計画書

**読むべき人**:
- ヘッドレスUIの実装を担当する開発者
- プロジェクトマネージャー
- 実装の進捗を追跡したい人

---

## 🎯 実装の流れ

```
┌─────────────────────────────────────────┐
│ Phase 1: 基盤構築（2-3日）               │
│ - ObservableState の実装                │
│ - EventEmitter の実装                   │
│ - 共通型定義                            │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│ Phase 2: 戦闘UI（5-7日）                │
│ - BattleController                      │
│ - CommandController                     │
│ - StatusEffectController                │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│ Phase 3: 管理UI（6-8日）                │
│ - InventoryController                   │
│ - EquipmentController                   │
│ - PartyController                       │
│ - ItemController                        │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│ Phase 4: 成長・報酬UI（4-5日）          │
│ - RewardController                      │
│ - SkillLearnController                  │
│ - JobChangeController                   │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│ Phase 5: 発展UI（5-6日）                │
│ - CraftController                       │
│ - EnhanceController                     │
│ - ShopController                        │
│ - SaveLoadController                    │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│ Phase 6: テスト・ドキュメント（3-4日）  │
│ - 単体テスト・統合テスト                │
│ - UIフレームワーク統合ガイド            │
│ - サンプルコード                        │
└─────────────────────────────────────────┘
```

**総期間**: 約5週間（31.5日）

---

## 🏗️ アーキテクチャ

```
┌─────────────────────────────────────────┐
│     UI Framework (React/Vue/Svelte)     │
│  (レンダリングとユーザー入力のハンドリング) │
└─────────────────┬───────────────────────┘
                  │
                  │ subscribe / dispatch
                  ↓
┌─────────────────────────────────────────┐
│       Headless UI Controllers           │
│  (状態管理、イベント処理、UIロジック)    │
│  - BattleController                     │
│  - CommandController                    │
│  - ItemController                       │
│  etc... (14 controllers)                │
└─────────────────┬───────────────────────┘
                  │
                  │ call methods
                  ↓
┌─────────────────────────────────────────┐
│            Services (17)                │
│  (ビジネスロジック、フロー管理)          │
│  - BattleService                        │
│  - CommandService                       │
│  etc...                                 │
└─────────────────┬───────────────────────┘
                  │
                  │ delegate
                  ↓
┌─────────────────────────────────────────┐
│          Core Engine                    │
│  (計算、ルール判定)                      │
└─────────────────────────────────────────┘
```

---

## 📋 コントローラー一覧

| # | Controller | 対応Service | 優先度 | フェーズ | 状態 |
|---|-----------|------------|-------|---------|------|
| 1 | BattleController | BattleService | 最高 | Phase 2 | 🔴 未着手 |
| 2 | CommandController | CommandService | 最高 | Phase 2 | 🔴 未着手 |
| 3 | StatusEffectController | StatusEffectService | 高 | Phase 2 | 🔴 未着手 |
| 4 | InventoryController | InventoryService | 中 | Phase 3 | 🔴 未着手 |
| 5 | EquipmentController | EquipmentService | 中 | Phase 3 | 🔴 未着手 |
| 6 | PartyController | PartyService | 中 | Phase 3 | 🔴 未着手 |
| 7 | ItemController | ItemService | 中 | Phase 3 | 🔴 未着手 |
| 8 | RewardController | RewardService | 中 | Phase 4 | 🔴 未着手 |
| 9 | SkillLearnController | SkillLearnService | 中 | Phase 4 | 🔴 未着手 |
| 10 | JobChangeController | JobChangeService | 中 | Phase 4 | 🔴 未着手 |
| 11 | CraftController | CraftService | 低 | Phase 5 | 🔴 未着手 |
| 12 | EnhanceController | EnhanceService | 低 | Phase 5 | 🔴 未着手 |
| 13 | ShopController | ShopService | 低 | Phase 5 | 🔴 未着手 |
| 14 | SaveLoadController | SaveLoadService | 低 | Phase 5 | 🔴 未着手 |

**凡例**:
- 🔴 未着手
- 🟡 進行中
- 🟢 完了
- ✅ テスト済み

---

## 🚀 クイックスタート

### ステップ1: 設計を理解する

[ヘッドレスUI設計.md](./ヘッドレスUI設計.md)を読んで、以下を理解してください：
- ヘッドレスUIとは何か
- ObservableStateとEventEmitterの基本パターン
- 各コントローラーの責務

### ステップ2: 実装計画を確認する

[ヘッドレスUI実装計画書.md](./ヘッドレスUI実装計画書.md)を読んで、以下を理解してください：
- 実装の優先順位
- 各フェーズの期間と成果物
- ディレクトリ構造
- テスト戦略

### ステップ3: Phase 1から実装開始

1. **ObservableState の実装**
   ```typescript
   // src/ui/core/ObservableState.ts
   ```

2. **EventEmitter の実装**
   ```typescript
   // src/ui/core/EventEmitter.ts
   ```

3. **テストの作成**
   ```typescript
   // tests/ui/core/ObservableState.test.ts
   // tests/ui/core/EventEmitter.test.ts
   ```

### ステップ4: Phase 2に進む

Phase 1が完了したら、最優先のBattleControllerから実装を開始してください。

---

## 💡 ベストプラクティス

### コントローラー実装時

1. **型安全性を重視する**
   - すべての状態とイベントに型定義を付ける
   - ジェネリクスを活用して柔軟性を保つ

2. **Serviceに委譲する**
   - ビジネスロジックはServiceに任せる
   - コントローラーはUI状態の管理に集中

3. **不変性を保つ**
   - 状態更新時は常に新しいオブジェクトを作成
   - スプレッド演算子を活用

4. **イベントを活用する**
   - 重要な状態変更はイベントとして発火
   - UIフレームワークがイベントに反応できるようにする

### テスト作成時

1. **単体テストを充実させる**
   - 各メソッドの動作を確認
   - 状態遷移をテスト
   - エッジケースをカバー

2. **統合テストを作成する**
   - コントローラーとServiceの連携を確認
   - 実際のフローをテスト

3. **カバレッジ目標を達成する**
   - 行カバレッジ: 80%以上
   - 分岐カバレッジ: 75%以上
   - 関数カバレッジ: 90%以上

---

## 🔗 関連リソース

### 内部ドキュメント
- [実装状況.md](./実装状況.md) - 全体の実装状況
- [サービス設計.md](./サービス設計.md) - Service層の設計
- [コアエンジン.md](./コアエンジン.md) - Core Engineの設計

### 外部リソース
- [Headless UI パターン](https://www.patterns.dev/posts/headless-ui)
- [Observer パターン](https://refactoring.guru/design-patterns/observer)
- [React Hooks](https://react.dev/reference/react)
- [Vue Composables](https://vuejs.org/guide/reusability/composables.html)
- [Svelte Stores](https://svelte.dev/docs/svelte-store)

---

## 📞 サポート

質問や問題がある場合は、以下を参照してください：

1. **設計の詳細**: [ヘッドレスUI設計.md](./ヘッドレスUI設計.md)
2. **実装の進め方**: [ヘッドレスUI実装計画書.md](./ヘッドレスUI実装計画書.md)
3. **既存の実装**: Service層のコードを参照（すべて実装済み）

---

**最終更新**: 2026-01-13
