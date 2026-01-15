# Astro Implementation Summary

## 概要

GEasy-Kit のドキュメントを Astro で生成するように実装しました。これにより、HTML の保守性が大幅に向上しました。

## 実装内容

### 1. Astro のセットアップ

- **依存関係のインストール**
  - `astro`: メインフレームワーク
  - `@astrojs/mdx`: Markdown/MDX サポート
  - `@astrojs/check`: 型チェック

- **設定ファイル**: `astro.config.mjs`
  - サイトURL: `https://yonyon-web.github.io`
  - ベースパス: `/GEasy-Kit`
  - 出力ディレクトリ: `./docs`
  - アセットディレクトリ: `lib`

### 2. レイアウトシステム

#### BaseLayout.astro
- ヘッダー、ナビゲーション、フッターを含む基本レイアウト
- 全ページで共通のスタイルとスクリプトを読み込み
- BASE_URL を正しく処理（末尾スラッシュ対応）

#### DocsLayout.astro
- ドキュメントページ用のレイアウト
- サイドバー付き
- ページ内リンクのスムーススクロール対応
- 関連ページリンクのサポート

### 3. ページ変換

以下のページを Astro 形式に変換しました：

**ホームページ**
- `src/pages/index.astro` → `docs/index.html`

**ドキュメント** (17ページ)
- `src/pages/docs/index.astro` → ドキュメントTOP
- `src/pages/docs/battle.astro` → 戦闘システム
- `src/pages/docs/item.astro` → アイテム
- `src/pages/docs/character-growth.astro` → キャラクター成長
- `src/pages/docs/party.astro` → パーティ編成
- `src/pages/docs/status-effects.astro` → 状態異常
- `src/pages/docs/enemy-ai.astro` → 敵AI
- その他コントローラー関連ページ（11ページ）

**カスタマイズ**
- `src/pages/customization/index.astro` → カスタマイズガイド

**その他**
- `src/pages/404.astro` → 404ページ

### 4. スタイルとアセット

- CSS を `src/styles/style.css` に移動
- syntax-highlight ファイルを `public/lib/` に配置
- Astro が自動的に CSS を最適化・バンドル

### 5. GitHub Actions の更新

`.github/workflows/deploy-pages.yml` を更新：
- Node.js 環境のセットアップ
- 依存関係のインストール (`npm ci`)
- Astro ビルドの実行 (`npm run build:docs`)
- GitHub Pages へのデプロイ

### 6. npm スクリプト

`package.json` に以下を追加：
```json
{
  "scripts": {
    "build:docs": "astro build",
    "dev:docs": "astro dev",
    "preview:docs": "astro preview"
  }
}
```

## メリット

### 1. メンテナンス性の向上

**Before (HTML)**
```html
<!-- 各ページでヘッダーを繰り返し記述 -->
<header class="header">
  <nav class="nav">
    <div class="container">
      <!-- 30行のコード -->
    </div>
  </nav>
</header>
```

**After (Astro)**
```astro
<!-- レイアウトを1回定義 -->
<BaseLayout title="ページタイトル">
  <!-- コンテンツのみ -->
</BaseLayout>
```

### 2. DRY原則の実現

- ヘッダー・フッター・ナビゲーションは1箇所で管理
- 変更が必要な場合、1ファイルのみ編集すればOK
- サイドバーの構造も再利用可能

### 3. 開発体験の向上

- **ホットリロード**: 変更が即座に反映
- **TypeScript サポート**: 型安全なコンポーネント
- **コンポーネント化**: 複雑な構造を分割して管理
- **Markdown サポート**: MDX でドキュメントを記述可能

### 4. コード例の改善

**Before**
```html
<!-- JavaScript オブジェクトのエスケープが複雑 -->
<code>const obj = {'{'}foo: 'bar'{'}'}</code>
```

**After**
```astro
<!-- バッククォートで簡潔に記述 -->
<code>{`const obj = {foo: 'bar'}`}</code>
```

### 5. パフォーマンス

- 静的サイト生成でページロードが高速
- CSS/JS の自動最適化
- 必要最小限の JavaScript のみ出力

## ファイル構成

```
プロジェクトルート/
├── astro.config.mjs          # Astro 設定
├── package.json              # npm スクリプト追加
├── src/
│   ├── layouts/              # レイアウトコンポーネント
│   │   ├── BaseLayout.astro
│   │   └── DocsLayout.astro
│   ├── pages/                # ページファイル（自動ルーティング）
│   │   ├── index.astro
│   │   ├── 404.astro
│   │   ├── docs/
│   │   └── customization/
│   └── styles/
│       └── style.css
├── public/                   # 静的アセット
│   └── lib/
│       ├── syntax-highlight.css
│       └── syntax-highlight.js
└── docs/                     # ビルド出力（GitHub Pages）
    ├── index.html
    ├── 404.html
    ├── docs/
    │   ├── index.html
    │   ├── battle/
    │   └── ...
    └── lib/
```

## 使い方

### 開発

```bash
# 開発サーバー起動
npm run dev:docs

# ブラウザで http://localhost:4321/GEasy-Kit/ にアクセス
```

### ビルド

```bash
# 本番用ビルド
npm run build:docs

# ビルド結果のプレビュー
npm run preview:docs
```

### 新しいページの追加

1. `src/pages/` に `.astro` ファイルを作成
2. レイアウトを選択（BaseLayout または DocsLayout）
3. コンテンツを記述
4. ビルドすると自動的に HTML が生成される

## テスト結果

✅ ビルド成功: 19ページ生成
✅ リンク検証: 全てのリンクが正しいパスを持つ
✅ 開発サーバー: 正常起動
✅ GitHub Actions: ワークフロー更新完了

## 今後の拡張

1. **MDX の活用**: Markdown でドキュメントを記述
2. **コンポーネントの追加**: コードブロック、アラートなどの再利用可能コンポーネント
3. **検索機能**: Algolia や Pagefind の統合
4. **ダークモード**: テーマ切り替え機能
5. **多言語対応**: i18n サポート

## 参考資料

- [ASTRO_DOCS.md](./ASTRO_DOCS.md) - 詳細なドキュメント
- [Astro 公式ドキュメント](https://docs.astro.build/)
- [GitHub Actions ワークフロー](./.github/workflows/deploy-pages.yml)
