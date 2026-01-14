# カスタマイズガイド

このディレクトリには、GEasy-Kitをプロジェクト固有のニーズに合わせてカスタマイズするためのガイドが含まれています。

## 📖 ガイド一覧

### 総合ガイド

- **[CUSTOMIZATION_GUIDE.md](./CUSTOMIZATION_GUIDE.md)** - カスタマイズの総合ガイド
  - ゲーム固有のルールを追加する方法
  - 既存の機能を拡張する方法
  - カスタムデータ型の定義

### 機能別カスタマイズガイド

- **[CUSTOM_STATS_GUIDE.md](./CUSTOM_STATS_GUIDE.md)** - カスタムステータスガイド
  - 独自のステータスパラメータを追加
  - カスタム計算式の実装
  - 型安全なステータス管理

- **[EQUIPMENT_CUSTOMIZATION_GUIDE.md](./EQUIPMENT_CUSTOMIZATION_GUIDE.md)** - 装備カスタマイズガイド
  - カスタム装備タイプの追加
  - 装備効果のカスタマイズ
  - 装備制限ルールの実装

- **[REWARD_CUSTOMIZATION_GUIDE.md](./REWARD_CUSTOMIZATION_GUIDE.md)** - 報酬カスタマイズガイド
  - カスタム報酬タイプの追加
  - 報酬計算ロジックのカスタマイズ
  - ドロップ率の調整

## 🎯 使い方

### 1. 基本の流れ

1. まず[CUSTOMIZATION_GUIDE.md](./CUSTOMIZATION_GUIDE.md)を読んで全体像を把握
2. カスタマイズしたい機能に対応するガイドを参照
3. サンプルコードを参考に実装

### 2. カスタマイズの種類

#### 型のカスタマイズ
```typescript
// カスタムステータス型を定義
interface MyGameStats extends BaseStats {
  magic: number;
  faith: number;
}
```

#### 計算式のカスタマイズ
```typescript
// カスタム計算式を実装
const customConfig: GameConfig = {
  ...defaultGameConfig,
  damageFormula: (attacker, defender) => {
    // 独自のダメージ計算
  }
};
```

#### サービスの拡張
```typescript
// 既存サービスを拡張
class MyBattleService extends BattleService {
  // カスタムロジックを追加
}
```

## 💡 ヒント

- **型安全性を保つ**: TypeScriptのジェネリクスを活用してカスタマイズしても型安全性を維持
- **デフォルト設定を活用**: `defaultGameConfig`を起点にして、必要な部分だけ上書き
- **段階的にカスタマイズ**: 一度にすべてをカスタマイズせず、必要な機能から順に

## 🔗 関連ドキュメント

- [実装要素.md](../実装要素.md) - ライブラリの全体像
- [サービス設計.md](../サービス設計.md) - Service層の設計
- [features/](../features/) - 各機能の詳細仕様
- [USAGE_EXAMPLES.md](../USAGE_EXAMPLES.md) - 実際の使用例

## 📝 フィードバック

カスタマイズガイドに関するフィードバックや、新しいガイドの提案は歓迎します。
- より詳しい説明が必要な箇所
- 追加してほしいカスタマイズ例
- わかりにくい部分

などがあれば、Issueで教えてください。
