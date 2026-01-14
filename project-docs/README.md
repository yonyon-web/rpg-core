# GEasy-Kit ドキュメント

このディレクトリには、GEasy-Kitライブラリの設計、実装、使用方法に関するドキュメントが含まれています。

## 📚 ドキュメント構成

### 🎯 コアドキュメント（必読）

プロジェクトの理解に必須のドキュメント：

- **[実装要素.md](./実装要素.md)** - ライブラリの全体像とスコープ
- **[コアエンジン.md](./コアエンジン.md)** - Core Engineの役割と設計思想
- **[サービス設計.md](./サービス設計.md)** - Service層の詳細設計
- **[DEPENDENCY_MANAGEMENT.md](./DEPENDENCY_MANAGEMENT.md)** - 依存関係の設定と管理（推奨）

### 🎨 UI/UX設計

ヘッドレスUIとユーザーインターフェースの設計：

- **[ヘッドレスUI設計.md](./ヘッドレスUI設計.md)** - UI層の設計
- **[ヘッドレスUI実装計画書.md](./ヘッドレスUI実装計画書.md)** - 実装計画の詳細
- **[HEADLESS_UI_OVERVIEW.md](./HEADLESS_UI_OVERVIEW.md)** - クイックリファレンス

### 💡 使用方法とカスタマイズ

- **[USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)** - 使用例とサンプルコード
- **[guides/](./guides/)** - カスタマイズガイド集
  - [CUSTOMIZATION_GUIDE.md](./guides/CUSTOMIZATION_GUIDE.md) - 総合カスタマイズガイド
  - [CUSTOM_STATS_GUIDE.md](./guides/CUSTOM_STATS_GUIDE.md) - カスタムステータスガイド
  - [EQUIPMENT_CUSTOMIZATION_GUIDE.md](./guides/EQUIPMENT_CUSTOMIZATION_GUIDE.md) - 装備カスタマイズ
  - [REWARD_CUSTOMIZATION_GUIDE.md](./guides/REWARD_CUSTOMIZATION_GUIDE.md) - 報酬カスタマイズ

### 🎮 機能別ドキュメント

個々の機能の詳細は[features/](./features/)ディレクトリ内：

#### 戦闘・バトル
- [戦闘.md](./features/戦闘.md) - 戦闘システム

#### キャラクター・成長
- [キャラクター成長.md](./features/キャラクター成長.md) - 経験値とレベルアップ
- [スキル習得.md](./features/スキル習得.md) - スキル習得システム
- [ジョブ変更.md](./features/ジョブ変更.md) - 職業変更システム

#### アイテム・装備
- [アイテム.md](./features/アイテム.md) - アイテムシステム
- [インベントリ.md](./features/インベントリ.md) - インベントリ管理
- [装備.md](./features/装備.md) - 装備システム
- [クラフト.md](./features/クラフト.md) - クラフトシステム
- [強化.md](./features/強化.md) - 装備強化

#### パーティ・編成
- [パーティ編成.md](./features/パーティ編成.md) - パーティ管理

#### 状態・効果
- [状態異常.md](./features/状態異常.md) - 状態異常システム

#### 敵・AI
- [敵AI.md](./features/敵AI.md) - 敵AIとグループ管理

#### システム
- [報酬.md](./features/報酬.md) - 報酬システム
- [セーブロード.md](./features/セーブロード.md) - セーブ/ロード
- [データ永続化.md](./features/データ永続化.md) - データ永続化
- [シミュレーション.md](./features/シミュレーション.md) - シミュレーション

### 🧪 テスト戦略

- **[テスト戦略テンプレート.md](./テスト戦略テンプレート.md)** - テスト設計の指針

### 📊 プロジェクト管理

実装状況と課題管理：

- **[project-management/](./project-management/)** - プロジェクト管理文書
  - [実装状況.md](./project-management/実装状況.md) - 現在の実装状況
  - [次に考えるべき課題.md](./project-management/次に考えるべき課題.md) - 今後の課題

### 📦 アーカイブ

過去の分析・計画文書（参考用）：

- **[archive/](./archive/)** - アーカイブされた文書
  - 依存性注入分析文書
  - srcディレクトリ再構成提案
  - 過去の実装計画書

## 🗺️ 推奨読書順序

### 初めて読む方

1. [実装要素.md](./実装要素.md) - ライブラリの全体像
2. [DEPENDENCY_MANAGEMENT.md](./DEPENDENCY_MANAGEMENT.md) - 推奨される使い方
3. [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) - 実際の使用例

### アーキテクチャを理解したい方

1. [コアエンジン.md](./コアエンジン.md) - Core Engineの設計
2. [サービス設計.md](./サービス設計.md) - Service層の設計
3. [ヘッドレスUI設計.md](./ヘッドレスUI設計.md) - UI層の設計

### 特定の機能を実装したい方

1. まず上記のアーキテクチャドキュメントを確認
2. [features/](./features/)から該当する機能のドキュメントを参照
3. 必要に応じて[guides/](./guides/)のカスタマイズガイドを参照

## 🔗 関連リソース

- [プロジェクトREADME](../README.md) - メインREADME
- [ソースコード](../src/) - 実装コード
- [テスト](../tests/) - テストコード
- [サンプル](../examples/) - 実装例
