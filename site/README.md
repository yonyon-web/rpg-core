# rpg-core Website

このディレクトリには、rpg-coreライブラリのGitHub Pagesサイトが含まれています。

## サイト構成

```
site/
├── index.html          # トップページ
├── style.css           # 共通スタイル
├── 404.html           # 404エラーページ
├── docs/              # ドキュメントページ
│   └── index.html
├── examples/          # サンプル・デモページ
│   └── index.html
└── api/               # APIリファレンスページ
    └── index.html
```

## ページ概要

### トップページ (index.html)
- ライブラリの概要と特徴
- クイックスタートガイド
- アーキテクチャ図
- インストール方法

### ドキュメント (docs/index.html)
- 詳細なドキュメント
- インストールと使用方法
- アーキテクチャの説明
- 主要機能の紹介
- カスタマイズ方法
- 開発環境のセットアップ

### サンプル (examples/index.html)
- 12種類の実用的なコードサンプル
- インタラクティブな戦闘デモ
- 各機能の使用例

### APIリファレンス (api/index.html)
- RPGCoreクラスの詳細
- Services一覧
- Controllers一覧
- 型定義
- 設定オプション
- EventBus

## デプロイ

GitHub Pagesへのデプロイは、`.github/workflows/deploy-pages.yml`で自動化されています。

mainブランチへのプッシュ時に自動的にデプロイされます。

## ローカルでの確認

ローカルでサイトを確認する場合は、シンプルなHTTPサーバーを起動してください：

```bash
# Pythonを使用する場合
cd site
python -m http.server 8000

# Node.jsのhttp-serverを使用する場合
npx http-server site -p 8000
```

その後、ブラウザで `http://localhost:8000` にアクセスしてください。

## 編集

サイトのコンテンツを編集する場合は、各HTMLファイルを直接編集してください。
スタイルを変更する場合は、`style.css`を編集してください。

すべてのページは共通の`style.css`を使用しているため、
スタイルの変更はすべてのページに反映されます。
