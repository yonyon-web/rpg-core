# Astro Documentation

このプロジェクトのドキュメントは [Astro](https://astro.build) を使用して生成されています。

## ディレクトリ構造

```
src/
├── layouts/          # レイアウトコンポーネント
│   ├── BaseLayout.astro      # ベースレイアウト（ヘッダー・フッター付き）
│   └── DocsLayout.astro      # ドキュメントレイアウト（サイドバー付き）
├── pages/            # ページファイル（自動的にルーティングされる）
│   ├── index.astro           # ホームページ
│   ├── 404.astro             # 404ページ
│   ├── docs/                 # ドキュメントページ
│   │   ├── index.astro
│   │   ├── battle.astro
│   │   └── ...
│   └── customization/        # カスタマイズページ
│       └── index.astro
├── styles/           # グローバルスタイル
│   └── style.css
└── components/       # 再利用可能なコンポーネント（将来的に追加）

public/
└── lib/              # 静的アセット（syntax-highlight など）
```

## 開発方法

### 必要なもの

- Node.js 18 以上
- npm

### セットアップ

```bash
npm install
```

### 開発サーバー起動

```bash
npm run dev:docs
```

ブラウザで http://localhost:4321/GEasy-Kit/ を開くとプレビューできます。

### ビルド

```bash
npm run build:docs
```

ビルドされたファイルは `docs/` ディレクトリに出力されます。

### プレビュー

ビルド後、以下のコマンドでプレビューできます：

```bash
npm run preview:docs
```

## ページの追加方法

### 新しいドキュメントページを追加

1. `src/pages/docs/` に新しい `.astro` ファイルを作成
2. `DocsLayout` を使用してレイアウトを指定
3. サイドバーのリンクを設定

例：

```astro
---
import DocsLayout from '../../layouts/DocsLayout.astro';

const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

const sidebarLinks = [
  { href: '#overview', text: '概要', active: true }
];
---

<DocsLayout 
  title="新しいページ" 
  sidebarTitle="新しいページ"
  sidebarLinks={sidebarLinks}
>
    <h1 id="overview">新しいページ</h1>
    <p>内容...</p>
</DocsLayout>
```

### コード例を追加

コード例は \`{\`...\`}\` で囲むことで、Astro の構文解析を回避できます：

```astro
<pre><code>{`
const example = {
  key: 'value'
};
`}</code></pre>
```

## デプロイ

GitHub Actions が自動的に以下を実行します：

1. 依存関係のインストール
2. Astro サイトのビルド
3. GitHub Pages へのデプロイ

設定は `.github/workflows/deploy-pages.yml` を参照してください。

## 利点

### メンテナンス性の向上

- **レイアウトの一元管理**: ヘッダー・フッター・サイドバーを1箇所で管理
- **コンポーネント化**: 繰り返しの要素を再利用可能なコンポーネントに分離
- **TypeScript サポート**: 型安全なプロップスと自動補完

### 開発体験の向上

- **ホットリロード**: 開発中の変更が即座に反映
- **Markdown サポート**: MDX を使用して Markdown で記述可能
- **エディタサポート**: VS Code などのエディタで優れた補完機能

### パフォーマンス

- **静的サイト生成**: ビルド時に HTML を生成するため高速
- **最適化**: CSS/JS の自動最適化
- **小さなバンドルサイズ**: 必要最小限の JavaScript のみ

## トラブルシューティング

### ビルドエラーが出る場合

1. `node_modules` を削除して再インストール：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. キャッシュをクリア：
   ```bash
   rm -rf .astro
   ```

### リンクが正しく動作しない場合

`baseUrl` が正しく設定されているか確認してください：

```astro
const baseUrl = import.meta.env.BASE_URL.endsWith('/') 
  ? import.meta.env.BASE_URL 
  : `${import.meta.env.BASE_URL}/`;
```

## 参考リンク

- [Astro ドキュメント](https://docs.astro.build/)
- [Astro レイアウト](https://docs.astro.build/en/core-concepts/layouts/)
- [Astro ページ](https://docs.astro.build/en/core-concepts/astro-pages/)
