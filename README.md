# rpg-core

ターン制RPGゲームを作る仕組みを提供するTypeScriptのライブラリ

## 概要

rpg-coreは、JRPG（日本のロールプレイングゲーム）スタイルのターン制RPGを作成するためのTypeScriptライブラリです。このライブラリは、数値計算とゲームルールの判定を担当するCore Engineを中心に設計されています。

## 特徴

- **純粋な計算とルール**: UIや操作フローに依存しない
- **状態を持たない**: Game Stateから必要なデータを受け取り、計算結果を返す
- **決定論的**: 同じ入力に対して常に同じ出力を返す
- **テスト容易**: モックや単体テストが容易に書ける
- **カスタマイズ可能**: ゲーム固有のルールに対応できる拡張性
- **TypeScript完全対応**: 型定義付きで開発体験が向上

## インストール

```bash
npm install rpg-core
```

## 基本的な使い方

### 新しい方法（推奨）: RPGCoreクラスを使用

```typescript
import { RPGCore } from 'rpg-core';

// 1カ所でライブラリ全体を初期化
const rpg = new RPGCore({
  config: customGameConfig,  // 省略可能（デフォルト設定を使用）
  useEventBus: true          // 省略可能（デフォルト: true）
});

// サービスに簡単にアクセス（依存関係は自動解決）
const battleService = rpg.services.battle;
const itemService = rpg.services.item;

// コントローラーも簡単に作成
const battleController = rpg.controllers.battle();
```

**メリット:**
- ✅ 依存関係が自動的に解決される
- ✅ 1カ所で設定が完結
- ✅ サービス間の接続が自動化
- ✅ 保守性と拡張性が向上

詳しくは [依存関係管理ガイド](./docs/DEPENDENCY_MANAGEMENT.md) を参照してください。

### 従来の方法: 個別にインスタンス化

従来の手動インスタンス化も引き続きサポートされています：

```typescript
import { BattleService, ItemService, defaultGameConfig } from 'rpg-core';

const config = defaultGameConfig;
const battleService = new BattleService(config);
const itemService = new ItemService();
```

## 開発環境のセットアップ

### 必要な環境

- Node.js 18.x以上
- npm 9.x以上

### 依存関係のインストール

```bash
npm install
```

### ビルド

```bash
npm run build
```

### テスト実行

```bash
# テストを実行
npm test

# テストをウォッチモードで実行
npm run test:watch

# カバレッジ付きでテスト実行
npm run test:coverage
```

### 開発モード

```bash
# TypeScriptのウォッチモードで開発
npm run watch
```

## プロジェクト構造

```
rpg-core/
├── src/                 # TypeScriptソースコード
│   └── index.ts        # エントリポイント
├── tests/              # テストファイル
│   └── index.test.ts   # テストコード
├── dist/               # ビルド出力（.gitignoreで除外）
├── package.json        # プロジェクト設定
├── tsconfig.json       # TypeScript設定
└── jest.config.js      # Jest設定
```

## ドキュメント

### 🏗️ プロジェクト構造の見直し提案

src配下の構成見直しについて、複数の提案を作成しました：
- 🎨 [ビジュアル図解](./docs/SRC_REORGANIZATION_VISUAL.md) - Before/After の視覚的比較（推奨から見る）
- 📄 [要約版](./docs/SRC_REORGANIZATION_SUMMARY.md) - 4つの提案の概要と比較表
- 📚 [詳細版](./docs/SRC_REORGANIZATION_PROPOSALS.md) - 各提案の完全な説明と実装計画

### 📚 読書ガイド

rpg-coreを理解するための推奨読書順序：

1. **まず読む** - ライブラリの全体像を把握
   - [実装要素.md](./docs/実装要素.md) - ライブラリが目指すものとスコープ
   - [依存関係管理.md](./docs/DEPENDENCY_MANAGEMENT.md) - 依存関係の設定と管理（🆕推奨）
   
2. **次に読む** - アーキテクチャを理解
   - [コアエンジン.md](./docs/コアエンジン.md) - Core Engineの役割と設計思想
   - [サービス設計.md](./docs/サービス設計.md) - Service層の詳細設計
   - [ヘッドレスUI設計.md](./docs/ヘッドレスUI設計.md) - UI層の設計
   - [ヘッドレスUI実装計画書.md](./docs/ヘッドレスUI実装計画書.md) - ヘッドレスUI実装の具体的な計画
   
3. **必要に応じて読む** - 実装したい機能の詳細
   - 戦闘・バトル: [戦闘.md](./docs/features/戦闘.md)
   - キャラクター・成長: [キャラクター成長.md](./docs/features/キャラクター成長.md), [スキル習得.md](./docs/features/スキル習得.md), [ジョブ変更.md](./docs/features/ジョブ変更.md)
   - アイテム・装備: [アイテム.md](./docs/features/アイテム.md), [インベントリ.md](./docs/features/インベントリ.md), [装備.md](./docs/features/装備.md), [クラフト.md](./docs/features/クラフト.md), [強化.md](./docs/features/強化.md)
   - パーティ・編成: [パーティ編成.md](./docs/features/パーティ編成.md)
   - 状態・効果: [状態異常.md](./docs/features/状態異常.md)
   - 敵・AI: [敵AI.md](./docs/features/敵AI.md)
   - システム: [報酬.md](./docs/features/報酬.md), [セーブロード.md](./docs/features/セーブロード.md), [データ永続化.md](./docs/features/データ永続化.md), [シミュレーション.md](./docs/features/シミュレーション.md)

## ライセンス

ISC

## 貢献

このプロジェクトへの貢献を歓迎します。バグ報告、機能提案、プルリクエストなど、お気軽にお寄せください。

