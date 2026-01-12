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

### 📚 読書ガイド

rpg-coreを理解するための推奨読書順序：

1. **まず読む** - ライブラリの全体像を把握
   - [実装要素.md](./docs/実装要素.md) - ライブラリが目指すものとスコープ
   
2. **次に読む** - アーキテクチャを理解
   - [コアエンジン.md](./docs/コアエンジン.md) - Core Engineの役割と設計思想
   - [サービス設計.md](./docs/サービス設計.md) - Service層の詳細設計
   - [ヘッドレスUI設計.md](./docs/ヘッドレスUI設計.md) - UI層の設計
   
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

