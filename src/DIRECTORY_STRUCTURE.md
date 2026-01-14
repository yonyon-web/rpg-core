# srcディレクトリ構成方針

このドキュメントでは、`src/` ディレクトリ配下の構成方針と各ディレクトリの役割について説明します。

## 概要

rpg-coreライブラリは、**3層アーキテクチャ**を採用しています：

```
src/
├── core/        # Core Engine層（数値計算・ルール判定）
├── services/    # Service層（操作フロー管理）
├── ui/          # Headless UI層（UIコントローラー）
├── types/       # 型定義（全層で共通利用）
└── config/      # デフォルト設定
```

## ディレクトリ構造

### 🎯 core/ - Core Engine層

**目的**: 純粋な数値計算とゲームルールの判定を行う

**特徴**:
- 純粋関数として実装（可能な限り）
- 状態を持たない
- 決定論的（同じ入力に対して常に同じ出力）
- UIや操作フローに依存しない

**サブディレクトリ**:
```
core/
├── EventBus.ts           # イベントバス（システム基盤）
├── RPGCore.ts            # RPGCore クラス（依存関係管理）
├── ServiceContainer.ts   # サービスコンテナ
├── persistence.ts        # 永続化関連
├── character/            # キャラクター関連の計算
│   ├── growth.ts         # 成長・レベルアップ計算
│   ├── job.ts            # ジョブ・転職計算
│   ├── skill.ts          # スキル習得計算
│   └── stats.ts          # ステータス計算
├── combat/               # 戦闘関連の計算
│   ├── accuracy.ts       # 命中・回避計算
│   ├── combatantState.ts # 戦闘参加者の状態管理
│   ├── damage.ts         # ダメージ計算
│   └── turnOrder.ts      # 行動順計算
├── craft/                # クラフト関連の計算
│   ├── enhance.ts        # 装備強化計算
│   └── synthesis.ts      # アイテム合成計算
├── item/                 # アイテム関連の計算
│   ├── effects.ts        # アイテム効果計算
│   ├── equipment.ts      # 装備計算
│   └── inventory.ts      # インベントリ操作
├── party/                # パーティ関連の計算
│   └── formation.ts      # 隊列・フォーメーション計算
├── shop/                 # ショップ関連の計算
│   └── shop.ts           # 売買・価格計算
└── status/               # 状態異常関連の計算
    └── effects.ts        # 状態異常効果計算
```

**配置ルール**:
- ドメインごとにサブディレクトリを作成
- 各ファイルは特定の計算や判定に関する関数を提供
- 副作用を最小限にする（イベント発行などは避ける）

---

### 🎯 services/ - Service層

**目的**: ビジネスロジックと操作フローを管理

**特徴**:
- Core Engineの関数を組み合わせて高レベルな操作を提供
- 状態管理（ゲーム状態の読み書き）
- イベント発行
- バリデーションとエラーハンドリング

**サブディレクトリ**:
```
services/
├── battle/               # 戦闘サービス
│   ├── BattleService.ts
│   ├── BattleActionExecutor.ts
│   └── CommandService.ts
├── character/            # キャラクターサービス
│   ├── JobChangeService.ts
│   └── SkillLearnService.ts
├── craft/                # クラフトサービス
│   ├── CraftService.ts
│   └── EnhanceService.ts
├── enemy/                # 敵管理サービス
│   ├── EnemyAIService.ts
│   └── EnemyGroupService.ts
├── item/                 # アイテムサービス
│   ├── ItemService.ts
│   ├── InventoryService.ts
│   ├── EquipmentService.ts
│   └── ShopService.ts
├── party/                # パーティサービス
│   └── PartyService.ts
├── status/               # 状態異常サービス
│   └── StatusEffectService.ts
└── system/               # システムサービス
    ├── RewardService.ts
    ├── SaveLoadService.ts
    └── SimulationService.ts
```

**配置ルール**:
- ドメインごとにサブディレクトリを作成
- 1つのサービスクラスを1ファイルに配置
- サービス間の依存関係は明示的に注入

---

### 🎯 ui/ - Headless UI層

**目的**: UIコントローラーと表示ロジックを提供（フレームワーク非依存）

**特徴**:
- Serviceを利用してUIの状態を管理
- ユーザーアクションを処理
- 表示用のデータ形式を提供
- 実際のUIレンダリングは外部で行う

**サブディレクトリ**:
```
ui/
├── core/                 # UIコア機能
│   ├── BaseController.ts      # コントローラーの基底クラス
│   ├── EventEmitter.ts        # UIイベント発行
│   └── ObservableState.ts     # 監視可能な状態
├── controllers/          # UIコントローラー
│   ├── battle/           # 戦闘UI
│   ├── character/        # キャラクターUI
│   ├── craft/            # クラフトUI
│   ├── item/             # アイテムUI
│   ├── party/            # パーティUI
│   ├── status/           # 状態異常UI
│   └── system/           # システムUI
├── types/                # UI固有の型定義
└── utils/                # UIユーティリティ
```

**配置ルール**:
- `controllers/` 配下にドメイン別のサブディレクトリを作成
- 各コントローラーは対応するサービスに依存
- UI固有の型定義は `ui/types/` に配置

---

### 🎯 types/ - 型定義

**目的**: 全層で共通利用される型定義を提供

**特徴**:
- TypeScript型定義のみ（実装を含まない）
- ドメイン別に整理
- インターフェースと型エイリアスを定義

**サブディレクトリ**:
```
types/
├── battle/               # 戦闘関連の型
├── character/            # キャラクター関連の型
├── core/                 # コア機能の型
├── craft/                # クラフト関連の型
├── item/                 # アイテム関連の型
├── status/               # 状態異常関連の型
├── system/               # システム関連の型
└── common.ts             # 共通型定義
```

**配置ルール**:
- ドメインごとにサブディレクトリを作成
- 各サブディレクトリに `index.ts` でエクスポート
- 層をまたいで利用される型を定義

---

### 🎯 config/ - デフォルト設定

**目的**: ライブラリのデフォルト設定を提供

**構成**:
```
config/
├── defaultConfig.ts      # デフォルトゲーム設定
└── index.ts              # エクスポート
```

**配置ルール**:
- デフォルト設定値のみを配置
- 型定義は `types/system/config.ts` に配置

---

## ファイル配置の基本原則

### 1. 層の責務を明確にする

各層の役割を明確に分離し、適切な層にファイルを配置します：

| 層 | 配置するファイル |
|---|---|
| **core** | 純粋な計算・ルール判定ロジック |
| **services** | ビジネスロジック・状態管理 |
| **ui** | UIコントローラー・表示ロジック |
| **types** | 型定義（全層共通） |
| **config** | デフォルト設定値 |

### 2. ドメイン別に整理する

各層内では、ドメイン（機能領域）ごとにサブディレクトリを作成します：

- **battle** - 戦闘
- **character** - キャラクター
- **item** - アイテム
- **craft** - クラフト
- **party** - パーティ
- **status** - 状態異常
- **system** - システム

### 3. 1ファイル1責務

各ファイルは単一の責務を持つようにします：

- ✅ **良い例**: `damage.ts` - ダメージ計算に関する関数のみ
- ❌ **悪い例**: `battle.ts` - 戦闘関連の全ての関数

### 4. インポート順序

ファイル内でのインポートは以下の順序で記述します：

```typescript
// 1. 外部ライブラリ
import { someLib } from 'external-library';

// 2. 型定義（types/）
import type { Character } from '../../types/battle';

// 3. コアモジュール（core/）
import { calculateDamage } from '../../core/combat';

// 4. サービス（services/）
import { BattleService } from '../../services/battle';

// 5. UI（ui/）
import { BattleController } from '../../ui/controllers/battle';
```

---

## 新規ファイル追加のガイドライン

### Core Engineに追加する場合

1. 既存のドメインディレクトリを確認
2. 該当するドメインがない場合は新規作成を検討
3. 純粋関数として実装
4. 対応するテストファイルを `tests/` に作成

**例**: 新しい経験値計算ロジックを追加
```
src/core/character/experience.ts
tests/character/experience.test.ts
```

### Serviceに追加する場合

1. 既存のドメインディレクトリを確認
2. 新しいサービスクラスを作成
3. 必要な依存関係を constructor で注入
4. 対応するテストファイルを `tests/services/` に作成

**例**: 新しいクエストサービスを追加
```
src/services/quest/QuestService.ts
src/services/quest/index.ts
tests/services/QuestService.test.ts
```

### UIコントローラーに追加する場合

1. 既存のドメインディレクトリを確認
2. `BaseController` を継承
3. 対応するサービスへの依存を定義
4. 対応するテストファイルを `tests/ui/` に作成

**例**: 新しいクエストUIコントローラーを追加
```
src/ui/controllers/quest/QuestController.ts
src/ui/controllers/quest/index.ts
tests/ui/QuestController.test.ts
```

---

## アンチパターン

### ❌ 避けるべきこと

1. **層を跨いだ循環依存**
   ```
   ❌ core → services → core
   ❌ ui → services → ui
   ```

2. **層の責務の混在**
   ```
   ❌ core/ にサービスクラスを配置
   ❌ services/ に純粋な計算ロジック
   ```

3. **平坦すぎる構造**
   ```
   ❌ src/services/ に全サービスを直接配置
   ✅ src/services/battle/ にグループ化
   ```

4. **深すぎる階層**
   ```
   ❌ src/core/battle/actions/commands/physical/slash.ts
   ✅ src/core/combat/damage.ts
   ```

---

## 参考資料

- [コアエンジン設計](../docs/コアエンジン.md)
- [サービス設計](../docs/サービス設計.md)
- [ヘッドレスUI設計](../docs/ヘッドレスUI設計.md)
- [src構成見直し提案](../docs/SRC_REORGANIZATION_SUMMARY.md)

---

**作成日**: 2026-01-14  
**最終更新**: 2026-01-14
