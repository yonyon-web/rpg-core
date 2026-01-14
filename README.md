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

📖 **[ドキュメントTOP](./docs/README.md)** - 完全なドキュメント構成とナビゲーション

### 📚 クイックスタートガイド

rpg-coreを理解するための推奨読書順序：

1. **まず読む** - ライブラリの全体像を把握
   - [実装要素.md](./docs/実装要素.md) - ライブラリが目指すものとスコープ
   - [依存関係管理](./docs/DEPENDENCY_MANAGEMENT.md) - 依存関係の設定と管理（🆕推奨）
   - [使用例](./docs/USAGE_EXAMPLES.md) - 実際の使用例
   
2. **次に読む** - アーキテクチャを理解
   - [コアエンジン](./docs/コアエンジン.md) - Core Engineの役割と設計思想
   - [サービス設計](./docs/サービス設計.md) - Service層の詳細設計
   - [ヘッドレスUI設計](./docs/ヘッドレスUI設計.md) - UI層の設計
   
3. **必要に応じて読む** - 実装したい機能の詳細
   - [機能別ドキュメント](./docs/features/) - 各機能の詳細仕様
   - [カスタマイズガイド](./docs/guides/) - ゲーム固有のカスタマイズ方法

### 📂 主要なドキュメント

- **[features/](./docs/features/)** - 機能別の詳細仕様（戦闘、アイテム、キャラクター成長など）
- **[guides/](./docs/guides/)** - カスタマイズガイド集
- **[project-management/](./docs/project-management/)** - 実装状況と課題管理
- **[archive/](./docs/archive/)** - 過去の分析・計画文書（参考用）

## ライセンス

ISC

## 貢献

このプロジェクトへの貢献を歓迎します。バグ報告、機能提案、プルリクエストなど、お気軽にお寄せください。

