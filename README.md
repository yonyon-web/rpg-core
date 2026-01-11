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

- [docs/コアエンジン.md](./docs/コアエンジン.md) - Core Engineの完全ガイド（役割、型定義、関数仕様、拡張性）
- [docs/サービス設計.md](./docs/サービス設計.md) - サービス層の設計
- [docs/ヘッドレスUI設計.md](./docs/ヘッドレスUI設計.md) - ヘッドレスUI設計
- [docs/実装要素.md](./docs/実装要素.md) - 実装要素

### 機能別ドキュメント

各機能は Core Engine、Service、Headless UI の3層で設計されています。

#### 戦闘・バトル
- [docs/features/戦闘.md](./docs/features/戦闘.md) - 戦闘システム全体の設計

#### キャラクター・成長
- [docs/features/キャラクター成長.md](./docs/features/キャラクター成長.md) - ステータス、レベルアップ、成長システム
- [docs/features/スキル習得.md](./docs/features/スキル習得.md) - スキル習得管理
- [docs/features/ジョブ変更.md](./docs/features/ジョブ変更.md) - 職業・クラス変更システム

#### アイテム・装備
- [docs/features/アイテム.md](./docs/features/アイテム.md) - アイテム使用システム
- [docs/features/インベントリ.md](./docs/features/インベントリ.md) - インベントリ（バッグ）管理
- [docs/features/装備.md](./docs/features/装備.md) - 装備変更管理
- [docs/features/クラフト.md](./docs/features/クラフト.md) - アイテム合成システム
- [docs/features/強化.md](./docs/features/強化.md) - 装備・キャラクター強化

#### パーティ・編成
- [docs/features/パーティ編成.md](./docs/features/パーティ編成.md) - パーティ編成管理

#### 状態・効果
- [docs/features/状態異常.md](./docs/features/状態異常.md) - 状態異常・バフ・デバフ管理

#### 敵・AI
- [docs/features/敵AI.md](./docs/features/敵AI.md) - 敵の行動決定とグループ管理

#### システム・その他
- [docs/features/報酬.md](./docs/features/報酬.md) - 戦闘報酬処理
- [docs/features/セーブロード.md](./docs/features/セーブロード.md) - セーブ/ロード管理
- [docs/features/データ永続化.md](./docs/features/データ永続化.md) - データ永続化設計
- [docs/features/シミュレーション.md](./docs/features/シミュレーション.md) - 戦闘シミュレーション

## ライセンス

ISC

## 貢献

このプロジェクトへの貢献を歓迎します。バグ報告、機能提案、プルリクエストなど、お気軽にお寄せください。

