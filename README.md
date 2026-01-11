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

- [CORE_ENGINE.md](./CORE_ENGINE.md) - Core Engineの役割と責任範囲
- [CORE_ENGINE_TYPES.md](./CORE_ENGINE_TYPES.md) - 型定義
- [CORE_ENGINE_FUNCTIONS.md](./CORE_ENGINE_FUNCTIONS.md) - 関数仕様
- [CORE_ENGINE_EXTENSIBILITY.md](./CORE_ENGINE_EXTENSIBILITY.md) - 拡張性設計
- [SERVICE_DESIGN.md](./SERVICE_DESIGN.md) - サービス層の設計
- [HEADLESS_UI_DESIGN.md](./HEADLESS_UI_DESIGN.md) - ヘッドレスUI設計
- [DATA_PERSISTENCE_DESIGN.md](./DATA_PERSISTENCE_DESIGN.md) - データ永続化設計

## ライセンス

ISC

## 貢献

このプロジェクトへの貢献を歓迎します。バグ報告、機能提案、プルリクエストなど、お気軽にお寄せください。

