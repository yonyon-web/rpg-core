# Controller Design Review Status

このファイルは各コントローラーの設計レビュー状況を追跡するためのものです。

## レビュー状況

| # | Controller | レビュー状態 | レビュー日 | レビュアー | メモ |
|---|-----------|------------|-----------|----------|------|
| 1 | BattleController | ✅ レビュー済み | 2026-01-11 | @yonyon-web | 戦闘全体の進行、ターン管理、アニメーション制御 |
| 2 | CommandController | ✅ レビュー済み | 2026-01-11 | @yonyon-web | 戦闘中のコマンド選択フロー |
| 3 | ItemController | ✅ レビュー済み | 2026-01-11 | @yonyon-web | アイテム使用、敵/味方ターゲット対応済み |
| 4 | InventoryController | ✅ レビュー済み | 2026-01-11 | @yonyon-web | インベントリ管理、フィルタ、ソート、ページネーション |
| 5 | EquipmentController | ✅ レビュー済み | 2026-01-11 | @yonyon-web | 装備変更、スロット構成のカスタマイズ対応済み |
| 6 | PartyController | 未レビュー | - | - | パーティ編成、メンバー入れ替え、隊列変更 |
| 7 | CraftController | 未レビュー | - | - | アイテム合成、材料チェック、成功率表示 |
| 8 | SkillLearnController | 未レビュー | - | - | スキル習得、条件チェック、コスト管理 |
| 9 | RewardController | 未レビュー | - | - | 戦闘報酬配分、レベルアップ演出 |
| 10 | EnhanceController | 未レビュー | - | - | 装備・キャラ強化、成功判定 |
| 11 | SaveLoadController | 未レビュー | - | - | セーブ/ロード、スロット管理 |
| 12 | JobChangeController | 未レビュー | - | - | 職業変更、条件チェック、ステータス変化プレビュー |
| 13 | StatusEffectController | 未レビュー | - | - | 状態異常の表示、フィルタ、解除 |

## レビュー観点

各コントローラーのレビュー時には以下の観点を確認してください：

### 1. 状態定義 (State Definition)
- [ ] 必要な状態が全て定義されているか
- [ ] 状態の命名が明確か
- [ ] 型定義が適切か
- [ ] 拡張性を考慮した設計か

### 2. コントローラー実装 (Controller Implementation)
- [ ] イベントエミッターの定義が適切か
- [ ] 状態管理のロジックが明確か
- [ ] エラーハンドリングが適切か
- [ ] キャンセル処理が適切か
- [ ] カーソル移動などのUI操作が考慮されているか

### 3. Service連携
- [ ] Serviceとの役割分担が明確か
- [ ] Serviceの呼び出しが適切か
- [ ] Core Engineとの連携が適切か

### 4. 使用例
- [ ] React/Vue/Svelteでの使用例が記載されているか
- [ ] 実装に必要な情報が十分か
- [ ] エッジケースの扱いが明確か

### 5. 拡張性・設定
- [ ] ゲーム固有の設定が外部化されているか
- [ ] デフォルト値が適切か
- [ ] CORE_ENGINE_EXTENSIBILITY.md との整合性

## レビュー履歴

### BattleController
- **日付**: 2026-01-11
- **レビュアー**: @yonyon-web
- **主な変更**: なし
- **状態**: 承認

### CommandController
- **日付**: 2026-01-11
- **レビュアー**: @yonyon-web
- **主な変更**: なし
- **状態**: 承認

### ItemController
- **日付**: 2026-01-11
- **レビュアー**: @yonyon-web
- **主な変更**:
  - ターゲット選択で敵を対象にできるように変更（Combatant型対応）
  - ターゲット一覧の取得方法を明示化（startItemUseで渡す）
  - allTargetsフィールドを追加してキャンセル時の復元に対応
- **状態**: 承認

### EquipmentController
- **日付**: 2026-01-11
- **レビュアー**: @yonyon-web
- **主な変更**:
  - 装備スロット構成をコンストラクタで必須パラメータとして受け取るように変更
  - Core Engineの getEquipmentSlots() から取得することを必須化
  - ヘッドレスUI側のデフォルト値を削除し、Core Engine側で一元管理
  - CORE_ENGINE_EXTENSIBILITY.md に装備スロット構成セクションを追加
- **状態**: 承認

### InventoryController
- **日付**: 2026-01-11
- **レビュアー**: @yonyon-web
- **主な変更**:
  - 新規追加：インベントリ管理システムの包括的な設計
  - Core Engine、Service、Headless UIの3層で統合設計
  - 拡張可能な検索システム（customPredicate、index signature）
  - ItemService、EquipmentService、RewardService、CraftServiceとの連携
  - フィルタ、ソート、ページネーション機能
  - INVENTORY_SYSTEM_DESIGN.md に詳細設計を記載
- **状態**: 承認

## 次のレビュー優先度

1. **高**: PartyController - よく使われる機能
2. **中**: CraftController, SkillLearnController
3. **低**: その他のコントローラー（RewardController, EnhanceController, SaveLoadController, JobChangeController, StatusEffectController）

## 進捗状況

- **レビュー済み**: 5/13 コントローラー (38%)
- **未レビュー**: 8/13 コントローラー (62%)

## メモ

- 各コントローラーは独立してレビュー可能
- レビュー完了時はこのファイルを更新すること
- 変更があった場合は再レビューを検討すること
