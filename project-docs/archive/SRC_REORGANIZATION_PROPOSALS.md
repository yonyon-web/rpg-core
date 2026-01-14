# src配下の構成見直し提案書

## 現状分析

### 現在のディレクトリ構造

```
src/
├── character/        # キャラクター関連（6ファイル）
├── combat/          # 戦闘計算関連（6ファイル）
├── config/          # 設定（2ファイル）
├── core/            # コアシステム（4ファイル）
├── craft/           # クラフト（2ファイル）
├── item/            # アイテム（4ファイル）
├── party/           # パーティ（2ファイル）
├── services/        # サービス層（19ファイル）
├── shop/            # ショップ（2ファイル）
├── status/          # 状態異常（2ファイル）
├── system/          # システム（1ファイル）
├── types/           # 型定義（21ファイル）
└── ui/              # Headless UI（37ファイル）
    ├── controllers/ # コントローラー（15ファイル）
    ├── core/        # UIコア（4ファイル）
    ├── types/       # UI型定義（16ファイル）
    └── utils/       # ユーティリティ（1ファイル）
```

**合計**: 14トップレベルディレクトリ、109ファイル

### 現状の課題

1. **ディレクトリが平坦すぎる**: 14個のトップレベルディレクトリが並列に存在し、階層が見えにくい
2. **関連性が不明瞭**: どのディレクトリがどの層に属するか分かりにくい（例: `craft`, `shop`, `item` の関係性）
3. **types の肥大化**: 21ファイルあり、ドメインごとに分類されていない
4. **services の肥大化**: 19ファイルが1つのディレクトリに集中
5. **アーキテクチャとの不一致**: 
   - ドキュメントでは「Core Engine / Services / Headless UI」の3層と説明
   - しかし、src構造からはこの階層が読み取りにくい

---

## 提案1: レイヤー優先構成（アーキテクチャ重視）

### コンセプト
アーキテクチャの3層構造（Core Engine / Services / Headless UI）を明確に表現

### ディレクトリ構造

```
src/
├── core/                    # Core Engine層
│   ├── combat/              # 戦闘計算
│   │   ├── accuracy.ts
│   │   ├── damage.ts
│   │   ├── turnOrder.ts
│   │   └── constants.ts
│   ├── character/           # キャラクター計算
│   │   ├── growth.ts
│   │   ├── stats.ts
│   │   ├── skill.ts
│   │   └── skillCost.ts
│   ├── item/                # アイテム計算
│   │   ├── effects.ts
│   │   ├── equipment.ts
│   │   └── inventory.ts
│   ├── craft/               # クラフト計算
│   │   ├── synthesis.ts
│   │   └── enhance.ts
│   ├── status/              # 状態異常計算
│   │   └── effects.ts
│   ├── system/              # システム基盤
│   │   ├── EventBus.ts
│   │   ├── ServiceContainer.ts
│   │   ├── GEasyKit.ts
│   │   └── persistence.ts
│   ├── config/              # 設定
│   │   └── defaultConfig.ts
│   └── index.ts
│
├── services/                # Service層（操作フロー管理）
│   ├── battle/              # 戦闘関連
│   │   ├── BattleService.ts
│   │   ├── BattleActionExecutor.ts
│   │   ├── CommandService.ts
│   │   └── index.ts
│   ├── character/           # キャラクター関連
│   │   ├── JobChangeService.ts
│   │   ├── SkillLearnService.ts
│   │   └── index.ts
│   ├── item/                # アイテム関連
│   │   ├── ItemService.ts
│   │   ├── InventoryService.ts
│   │   ├── EquipmentService.ts
│   │   ├── CraftService.ts
│   │   ├── EnhanceService.ts
│   │   ├── ShopService.ts
│   │   └── index.ts
│   ├── party/               # パーティ関連
│   │   ├── PartyService.ts
│   │   └── index.ts
│   ├── enemy/               # 敵関連
│   │   ├── EnemyAIService.ts
│   │   ├── EnemyGroupService.ts
│   │   └── index.ts
│   ├── status/              # 状態異常関連
│   │   ├── StatusEffectService.ts
│   │   └── index.ts
│   ├── system/              # システム関連
│   │   ├── SaveLoadService.ts
│   │   ├── SimulationService.ts
│   │   ├── RewardService.ts
│   │   └── index.ts
│   └── index.ts
│
├── ui/                      # Headless UI層
│   ├── core/                # UIコア機能
│   │   ├── BaseController.ts
│   │   ├── EventEmitter.ts
│   │   ├── ObservableState.ts
│   │   └── index.ts
│   ├── controllers/         # UIコントローラー
│   │   ├── battle/
│   │   │   ├── BattleController.ts
│   │   │   └── CommandController.ts
│   │   ├── character/
│   │   │   ├── JobChangeController.ts
│   │   │   └── SkillLearnController.ts
│   │   ├── item/
│   │   │   ├── ItemController.ts
│   │   │   ├── InventoryController.ts
│   │   │   ├── EquipmentController.ts
│   │   │   ├── CraftController.ts
│   │   │   ├── EnhanceController.ts
│   │   │   └── ShopController.ts
│   │   ├── party/
│   │   │   ├── PartyController.ts
│   │   │   └── PartySelectionController.ts
│   │   ├── status/
│   │   │   └── StatusEffectController.ts
│   │   ├── system/
│   │   │   └── RewardController.ts
│   │   └── index.ts
│   ├── types/               # UI型定義
│   │   └── [既存のUI型定義ファイル]
│   ├── utils/
│   │   └── battleMessageFormatter.ts
│   └── index.ts
│
├── types/                   # 共通型定義
│   ├── core/                # Core Engine型
│   │   ├── stats.ts
│   │   ├── damage.ts
│   │   ├── formulas.ts
│   │   └── index.ts
│   ├── domain/              # ドメイン型
│   │   ├── character.ts     # job.ts, skill.ts を統合
│   │   ├── battle.ts        # combatant.ts, battle.ts を統合
│   │   ├── item.ts          # item.ts, equipment.ts を統合
│   │   ├── craft.ts
│   │   ├── statusEffect.ts
│   │   ├── shop.ts
│   │   ├── reward.ts
│   │   └── index.ts
│   ├── system/              # システム型
│   │   ├── config.ts
│   │   ├── events.ts
│   │   ├── save.ts
│   │   ├── command.ts
│   │   ├── simulation.ts
│   │   └── index.ts
│   ├── common.ts            # 共通型
│   ├── gameTypes.ts         # ゲーム全体型
│   └── index.ts
│
└── index.ts                 # エントリポイント
```

### メリット

1. **アーキテクチャが明確**: Core / Services / UI の3層が一目で分かる
2. **責任範囲が明瞭**: 各層の役割が構造から理解できる
3. **ドキュメントとの整合性**: アーキテクチャドキュメントと構造が一致
4. **学習コストの削減**: 新規参加者がアーキテクチャを理解しやすい
5. **インポートパスが直感的**: `core/combat`, `services/battle`, `ui/controllers/battle` など

### デメリット

1. **移動コストが高い**: 既存ファイルの大幅な移動が必要
2. **インポートパスの変更**: 多くのimport文を更新する必要がある
3. **services配下がさらに深くなる**: `services/battle/BattleService.ts` のような3階層
4. **controllers配下が深い**: `ui/controllers/battle/BattleController.ts` など

### 推奨度: ★★★★☆ (4/5)
- アーキテクチャを重視するプロジェクトに最適
- 長期的な保守性が高い

---

## 提案2: ドメイン優先構成（機能重視）

### コンセプト
「戦闘」「キャラクター」「アイテム」などのドメインを最上位に配置

### ディレクトリ構造

```
src/
├── battle/                  # 戦闘ドメイン
│   ├── core/                # 戦闘計算ロジック
│   │   ├── accuracy.ts
│   │   ├── damage.ts
│   │   ├── turnOrder.ts
│   │   ├── combatantState.ts
│   │   └── constants.ts
│   ├── services/            # 戦闘サービス
│   │   ├── BattleService.ts
│   │   ├── BattleActionExecutor.ts
│   │   ├── CommandService.ts
│   │   └── index.ts
│   ├── controllers/         # 戦闘UI
│   │   ├── BattleController.ts
│   │   ├── CommandController.ts
│   │   └── index.ts
│   ├── types/               # 戦闘型定義
│   │   ├── battle.ts
│   │   ├── combatant.ts
│   │   ├── command.ts
│   │   └── index.ts
│   └── index.ts
│
├── character/               # キャラクタードメイン
│   ├── core/                # キャラクター計算
│   │   ├── growth.ts
│   │   ├── stats.ts
│   │   ├── skill.ts
│   │   ├── skillCost.ts
│   │   └── job.ts
│   ├── services/            # キャラクターサービス
│   │   ├── JobChangeService.ts
│   │   ├── SkillLearnService.ts
│   │   └── index.ts
│   ├── controllers/         # キャラクターUI
│   │   ├── JobChangeController.ts
│   │   ├── SkillLearnController.ts
│   │   └── index.ts
│   ├── types/               # キャラクター型定義
│   │   ├── job.ts
│   │   ├── skill.ts
│   │   └── stats.ts
│   └── index.ts
│
├── item/                    # アイテムドメイン
│   ├── core/                # アイテム計算
│   │   ├── effects.ts
│   │   ├── equipment.ts
│   │   └── inventory.ts
│   ├── services/            # アイテムサービス
│   │   ├── ItemService.ts
│   │   ├── InventoryService.ts
│   │   ├── EquipmentService.ts
│   │   ├── ShopService.ts
│   │   └── index.ts
│   ├── controllers/         # アイテムUI
│   │   ├── ItemController.ts
│   │   ├── InventoryController.ts
│   │   ├── EquipmentController.ts
│   │   ├── ShopController.ts
│   │   └── index.ts
│   ├── types/               # アイテム型定義
│   │   ├── item.ts
│   │   ├── equipment.ts
│   │   └── shop.ts
│   └── index.ts
│
├── craft/                   # クラフトドメイン
│   ├── core/                # クラフト計算
│   │   ├── synthesis.ts
│   │   └── enhance.ts
│   ├── services/            # クラフトサービス
│   │   ├── CraftService.ts
│   │   ├── EnhanceService.ts
│   │   └── index.ts
│   ├── controllers/         # クラフトUI
│   │   ├── CraftController.ts
│   │   ├── EnhanceController.ts
│   │   └── index.ts
│   ├── types/
│   │   └── craft.ts
│   └── index.ts
│
├── party/                   # パーティドメイン
│   ├── core/
│   │   └── formation.ts
│   ├── services/
│   │   └── PartyService.ts
│   ├── controllers/
│   │   ├── PartyController.ts
│   │   └── PartySelectionController.ts
│   ├── types/
│   │   └── party.ts
│   └── index.ts
│
├── enemy/                   # 敵ドメイン
│   ├── services/
│   │   ├── EnemyAIService.ts
│   │   └── EnemyGroupService.ts
│   ├── types/
│   │   └── enemy.ts
│   └── index.ts
│
├── status/                  # 状態異常ドメイン
│   ├── core/
│   │   └── effects.ts
│   ├── services/
│   │   └── StatusEffectService.ts
│   ├── controllers/
│   │   └── StatusEffectController.ts
│   ├── types/
│   │   └── statusEffect.ts
│   └── index.ts
│
├── system/                  # システムドメイン
│   ├── core/                # システムコア
│   │   ├── EventBus.ts
│   │   ├── ServiceContainer.ts
│   │   ├── GEasyKit.ts
│   │   └── persistence.ts
│   ├── services/            # システムサービス
│   │   ├── SaveLoadService.ts
│   │   ├── SimulationService.ts
│   │   └── RewardService.ts
│   ├── controllers/
│   │   └── RewardController.ts
│   ├── types/
│   │   ├── config.ts
│   │   ├── events.ts
│   │   ├── save.ts
│   │   └── simulation.ts
│   └── index.ts
│
├── ui/                      # 共通UI機能
│   ├── core/
│   │   ├── BaseController.ts
│   │   ├── EventEmitter.ts
│   │   └── ObservableState.ts
│   ├── utils/
│   │   └── battleMessageFormatter.ts
│   └── index.ts
│
├── config/                  # 設定
│   ├── defaultConfig.ts
│   └── index.ts
│
├── types/                   # 共通型定義
│   ├── common.ts
│   ├── gameTypes.ts
│   ├── damage.ts
│   ├── formulas.ts
│   ├── reward.ts
│   └── index.ts
│
└── index.ts
```

### メリット

1. **関連コードが近い**: 同じドメインのコードが1つのディレクトリに集約
2. **機能追加が容易**: 新機能は新しいドメインディレクトリを追加するだけ
3. **ファイル探索が簡単**: 「戦闘の何か」を探すなら `battle/` を見ればよい
4. **モジュール性が高い**: ドメインごとに独立性が高く、再利用や分割が容易
5. **ドメイン駆動設計との親和性**: DDD的なアプローチと相性が良い

### デメリット

1. **層の境界が不明瞭**: Core Engine / Services の区別が分かりにくい
2. **小さいドメインが散在**: `party/` や `status/` など小規模なドメインも独立
3. **共通機能の扱いが難しい**: `types/`, `config/`, `ui/core/` の位置が曖昧
4. **移動コストが非常に高い**: 既存構造からの変更が最も大きい

### 推奨度: ★★★☆☆ (3/5)
- 機能が独立していて、頻繁に新ドメインを追加する場合に有効
- 既存コードベースの移行コストが高い

---

## 提案3: ハイブリッド構成（現実的なバランス）

### コンセプト
現在の構造を尊重しつつ、問題点を最小限の変更で改善

### ディレクトリ構造

```
src/
├── core/                    # Core Engine + システム基盤
│   ├── combat/              # 戦闘計算（既存のcombat/を移動）
│   │   ├── accuracy.ts
│   │   ├── damage.ts
│   │   ├── turnOrder.ts
│   │   ├── combatantState.ts
│   │   └── constants.ts
│   ├── character/           # キャラクター計算（既存のcharacter/を移動）
│   │   ├── growth.ts
│   │   ├── stats.ts
│   │   ├── skill.ts
│   │   ├── skillCost.ts
│   │   └── job.ts
│   ├── item/                # アイテム計算（既存のitem/を移動）
│   │   ├── effects.ts
│   │   ├── equipment.ts
│   │   └── inventory.ts
│   ├── craft/               # クラフト計算（既存のcraft/を移動）
│   │   ├── synthesis.ts
│   │   └── enhance.ts
│   ├── party/               # パーティ計算（既存のparty/を移動）
│   │   └── formation.ts
│   ├── status/              # 状態異常計算（既存のstatus/を移動）
│   │   └── effects.ts
│   ├── system/              # システム基盤（既存のcore/とsystem/を統合）
│   │   ├── EventBus.ts
│   │   ├── ServiceContainer.ts
│   │   ├── GEasyKit.ts
│   │   └── persistence.ts
│   └── index.ts
│
├── services/                # Service層（ドメイン別にグループ化）
│   ├── battle/              # 戦闘サービス
│   │   ├── BattleService.ts
│   │   ├── BattleActionExecutor.ts
│   │   ├── CommandService.ts
│   │   └── index.ts
│   ├── character/           # キャラクターサービス
│   │   ├── JobChangeService.ts
│   │   ├── SkillLearnService.ts
│   │   └── index.ts
│   ├── item/                # アイテムサービス
│   │   ├── ItemService.ts
│   │   ├── InventoryService.ts
│   │   ├── EquipmentService.ts
│   │   ├── ShopService.ts
│   │   └── index.ts
│   ├── craft/               # クラフトサービス
│   │   ├── CraftService.ts
│   │   ├── EnhanceService.ts
│   │   └── index.ts
│   ├── party/               # パーティサービス
│   │   ├── PartyService.ts
│   │   └── index.ts
│   ├── enemy/               # 敵サービス
│   │   ├── EnemyAIService.ts
│   │   ├── EnemyGroupService.ts
│   │   └── index.ts
│   ├── status/              # 状態異常サービス
│   │   ├── StatusEffectService.ts
│   │   └── index.ts
│   ├── system/              # システムサービス
│   │   ├── SaveLoadService.ts
│   │   ├── SimulationService.ts
│   │   ├── RewardService.ts
│   │   └── index.ts
│   └── index.ts
│
├── ui/                      # Headless UI層（既存構造を維持）
│   ├── core/
│   │   ├── BaseController.ts
│   │   ├── EventEmitter.ts
│   │   ├── ObservableState.ts
│   │   └── index.ts
│   ├── controllers/         # ドメイン別にグループ化
│   │   ├── battle/
│   │   │   ├── BattleController.ts
│   │   │   └── CommandController.ts
│   │   ├── character/
│   │   │   ├── JobChangeController.ts
│   │   │   └── SkillLearnController.ts
│   │   ├── item/
│   │   │   ├── ItemController.ts
│   │   │   ├── InventoryController.ts
│   │   │   ├── EquipmentController.ts
│   │   │   └── ShopController.ts
│   │   ├── craft/
│   │   │   ├── CraftController.ts
│   │   │   └── EnhanceController.ts
│   │   ├── party/
│   │   │   ├── PartyController.ts
│   │   │   └── PartySelectionController.ts
│   │   ├── status/
│   │   │   └── StatusEffectController.ts
│   │   ├── system/
│   │   │   └── RewardController.ts
│   │   └── index.ts
│   ├── types/               # UI型定義（既存維持）
│   │   └── [既存ファイル群]
│   ├── utils/
│   │   └── battleMessageFormatter.ts
│   └── index.ts
│
├── types/                   # 共通型定義（ドメイン別に整理）
│   ├── battle/
│   │   ├── battle.ts
│   │   ├── combatant.ts
│   │   └── command.ts
│   ├── character/
│   │   ├── job.ts
│   │   ├── skill.ts
│   │   └── stats.ts
│   ├── item/
│   │   ├── item.ts
│   │   ├── equipment.ts
│   │   └── shop.ts
│   ├── craft/
│   │   └── craft.ts
│   ├── status/
│   │   └── statusEffect.ts
│   ├── system/
│   │   ├── config.ts
│   │   ├── events.ts
│   │   ├── save.ts
│   │   ├── reward.ts
│   │   └── simulation.ts
│   ├── core/
│   │   ├── damage.ts
│   │   ├── formulas.ts
│   │   └── gameTypes.ts
│   ├── common.ts
│   └── index.ts
│
├── config/                  # 設定（既存維持）
│   ├── defaultConfig.ts
│   └── index.ts
│
└── index.ts
```

### メリット

1. **移行コストが低い**: 主に既存ディレクトリを移動・グループ化するだけ
2. **段階的な移行が可能**: 少しずつリファクタリングできる
3. **アーキテクチャが分かりやすい**: `core/`, `services/`, `ui/` の3層構造が明確
4. **ドメインも見えやすい**: 各層内でドメイン別にグループ化
5. **既存コードとの互換性**: 大規模な書き換えが不要

### デメリット

1. **完全な整合性はない**: 一部妥協点が残る（例: `config/` の位置）
2. **types配下の整理**: 21ファイルを再配置する必要がある
3. **controllers配下が深い**: `ui/controllers/battle/` など3階層になる

### 推奨度: ★★★★★ (5/5)
- **最も推奨**: 現実的で、段階的に移行できる
- 既存コードへの影響を最小限にしつつ、問題を解決

---

## 提案4: 最小限の改善（保守的アプローチ）

### コンセプト
現在の構造をほぼ維持し、最も問題のある部分だけを修正

### 変更内容

1. **services配下をグループ化**: 19ファイルをドメイン別サブディレクトリに整理
2. **ui/controllers配下をグループ化**: 15ファイルをドメイン別サブディレクトリに整理
3. **types配下をグループ化**: 21ファイルをドメイン別サブディレクトリに整理
4. **core/とsystem/を統合**: 重複を避ける

### ディレクトリ構造

```
src/
├── character/               # 既存維持
├── combat/                  # 既存維持
├── config/                  # 既存維持
├── core/                    # system/を統合
│   ├── EventBus.ts
│   ├── ServiceContainer.ts
│   ├── GEasyKit.ts
│   ├── persistence.ts       # system/から移動
│   └── index.ts
├── craft/                   # 既存維持
├── item/                    # 既存維持
├── party/                   # 既存維持
├── services/                # グループ化のみ変更
│   ├── battle/              # NEW: グループ化
│   │   ├── BattleService.ts
│   │   ├── BattleActionExecutor.ts
│   │   └── CommandService.ts
│   ├── character/           # NEW: グループ化
│   │   ├── JobChangeService.ts
│   │   └── SkillLearnService.ts
│   ├── item/                # NEW: グループ化
│   │   ├── ItemService.ts
│   │   ├── InventoryService.ts
│   │   ├── EquipmentService.ts
│   │   └── ShopService.ts
│   ├── craft/               # NEW: グループ化
│   │   ├── CraftService.ts
│   │   └── EnhanceService.ts
│   ├── party/               # NEW: グループ化
│   │   └── PartyService.ts
│   ├── enemy/               # NEW: グループ化
│   │   ├── EnemyAIService.ts
│   │   └── EnemyGroupService.ts
│   ├── status/              # NEW: グループ化
│   │   └── StatusEffectService.ts
│   ├── system/              # NEW: グループ化
│   │   ├── SaveLoadService.ts
│   │   ├── SimulationService.ts
│   │   └── RewardService.ts
│   └── index.ts
├── shop/                    # 既存維持
├── status/                  # 既存維持
├── types/                   # グループ化のみ変更
│   ├── battle/              # NEW: グループ化
│   │   ├── battle.ts
│   │   ├── combatant.ts
│   │   └── command.ts
│   ├── character/           # NEW: グループ化
│   │   ├── job.ts
│   │   ├── skill.ts
│   │   └── stats.ts
│   ├── item/                # NEW: グループ化
│   │   ├── item.ts
│   │   ├── equipment.ts
│   │   └── shop.ts
│   ├── system/              # NEW: グループ化
│   │   ├── config.ts
│   │   ├── events.ts
│   │   ├── save.ts
│   │   ├── simulation.ts
│   │   └── reward.ts
│   ├── craft.ts             # 既存維持
│   ├── statusEffect.ts      # 既存維持
│   ├── common.ts            # 既存維持
│   ├── damage.ts            # 既存維持
│   ├── formulas.ts          # 既存維持
│   ├── gameTypes.ts         # 既存維持
│   └── index.ts
├── ui/                      # 一部変更
│   ├── controllers/         # グループ化
│   │   ├── battle/          # NEW
│   │   ├── character/       # NEW
│   │   ├── item/            # NEW
│   │   ├── craft/           # NEW
│   │   ├── party/           # NEW
│   │   ├── status/          # NEW
│   │   ├── system/          # NEW
│   │   └── index.ts
│   ├── core/                # 既存維持
│   ├── types/               # 既存維持
│   └── utils/               # 既存維持
└── index.ts
```

### メリット

1. **変更が最小限**: 主にservices, controllers, typesのグループ化のみ
2. **リスクが低い**: ファイルの移動範囲が限定的
3. **即座に実行可能**: 数時間〜1日で完了
4. **破壊的変更なし**: 既存のインポートパスへの影響が少ない

### デメリット

1. **根本的な解決にならない**: 平坦な構造は残る
2. **アーキテクチャが不明瞭**: 3層構造が見えにくいまま
3. **将来の課題を先送り**: いずれより大きな再編が必要になる可能性

### 推奨度: ★★★☆☆ (3/5)
- リスクを最小限にしたい場合に有効
- ただし、長期的な保守性向上効果は限定的

---

## 比較表

| 項目 | 提案1<br>レイヤー優先 | 提案2<br>ドメイン優先 | 提案3<br>ハイブリッド | 提案4<br>最小限 |
|------|---------------------|---------------------|---------------------|----------------|
| **アーキテクチャの明確さ** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **ドメインの分かりやすさ** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **移行コストの低さ** | ⭐⭐ | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **長期的な保守性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **学習コスト** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **ファイル探索のしやすさ** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **コードの独立性** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **段階的移行の可能性** | ⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **総合推奨度** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 推奨案: 提案3（ハイブリッド構成）

### 理由

1. **バランスが良い**: アーキテクチャの明確さと移行コストのバランスが最適
2. **段階的な移行が可能**: リスクを管理しながら進められる
3. **ドキュメントとの整合性**: `core/`, `services/`, `ui/` がアーキテクチャと一致
4. **既存コードへの影響が少ない**: 主に移動とグループ化のみ
5. **長期的な保守性**: 将来的な拡張や変更に対応しやすい

### 実装ステップ（段階的移行）

#### フェーズ1: サービス層のグループ化（最優先）

**作業内容**:
- `services/` 配下の19ファイルをドメイン別サブディレクトリに移動
- `services/index.ts` の export を更新

**影響範囲**: 
- サービスをimportしているファイルのパス更新
- 比較的少ない（主にコントローラーとテスト）

**所要時間**: 2-3時間

#### フェーズ2: UI コントローラーのグループ化

**作業内容**:
- `ui/controllers/` 配下の15ファイルをドメイン別サブディレクトリに移動
- `ui/controllers/index.ts` の export を更新

**影響範囲**:
- コントローラーをimportしているファイルのパス更新
- 主にテストとエントリポイント

**所要時間**: 2-3時間

#### フェーズ3: 型定義のグループ化

**作業内容**:
- `types/` 配下の21ファイルをドメイン別サブディレクトリに移動
- `types/index.ts` の export を更新

**影響範囲**:
- 型をimportしているすべてのファイル
- **最も影響が大きい**

**所要時間**: 4-6時間

#### フェーズ4: Core Engine層の整理

**作業内容**:
- 既存の `character/`, `combat/`, `item/`, `craft/`, `party/`, `status/` を `core/` 配下に移動
- `core/` と `system/` を統合
- エクスポートパスを更新

**影響範囲**:
- Core機能をimportしているファイル
- サービスとテストが主な対象

**所要時間**: 3-4時間

### 合計所要時間: 11-16時間（約2営業日）

---

## 次のステップ

### 決定事項の確認

以下の点について決定してください：

1. **どの提案を採用するか？**
   - 提案3（ハイブリッド構成）を推奨
   - または別の提案、あるいはカスタマイズ版

2. **移行タイミング**
   - 即座に開始するか？
   - 次のマイルストーンで実施するか？

3. **移行戦略**
   - 段階的移行（推奨）
   - 一括移行

4. **テスト戦略**
   - 各フェーズ後にテストを実行
   - 最後にまとめてテスト

### 移行時の注意事項

1. **ブランチ戦略**: 別ブランチで作業し、PRでレビュー
2. **テストの実行**: 各フェーズ後に `npm test` を実行
3. **ビルドの確認**: `npm run build` でエラーがないか確認
4. **コミット粒度**: フェーズごとに別コミットにする
5. **後方互換性**: 必要に応じて一時的なre-exportを用意

---

## まとめ

**現状の問題点**:
- 14個のトップレベルディレクトリが平坦に配置
- アーキテクチャの3層構造が不明瞭
- services, types, ui/controllers の肥大化

**推奨案（提案3）**:
- `core/`, `services/`, `ui/` の3層構造を明確化
- 各層内でドメイン別にグループ化
- 段階的な移行で リスク最小化
- 既存コードへの影響を抑えつつ、長期的な保守性を向上

**期待される効果**:
- アーキテクチャがコード構造から理解できる
- 関連ファイルが見つけやすくなる
- 新規開発者の学習コストが下がる
- 長期的な保守性とスケーラビリティが向上

---

以上の提案について、ご意見・ご質問があればお知らせください。
