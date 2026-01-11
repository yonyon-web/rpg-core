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

詳細な設計ドキュメントは以下をご参照ください：

### アーキテクチャ設計

- [docs/core-engine.md](./docs/core-engine.md) - Core Engineの完全ガイド（役割、型定義、関数仕様、拡張性）
- [docs/service-design.md](./docs/service-design.md) - サービス層の設計
- [docs/headless-ui-design.md](./docs/headless-ui-design.md) - ヘッドレスUI設計
- [docs/implementation-elements.md](./docs/implementation-elements.md) - 実装要素

### 機能別ドキュメント

- [docs/features/inventory-system.md](./docs/features/inventory-system.md) - インベントリ（バッグ）システム設計
- [docs/features/party-formation.md](./docs/features/party-formation.md) - パーティ編成システム
- [docs/features/data-persistence.md](./docs/features/data-persistence.md) - データ永続化設計

## ライセンス

ISC

## 貢献

このプロジェクトへの貢献を歓迎します。バグ報告、機能提案、プルリクエストなど、お気軽にお寄せください。

