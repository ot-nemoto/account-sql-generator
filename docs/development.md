# development.md

## ローカルセットアップ

### 前提条件

- Node.js `^20.19.0` または `>=22.12.0`（Vitest の依存する vite の要件）
- npm

### 手順

```bash
# リポジトリをクローン
git clone https://github.com/ot-nemoto/account-sql-generator.git
cd account-sql-generator

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセスする。

## 環境変数

| 変数名 | 値 | 設定方法 |
|--------|----|---------|
| `BUILD_MODE` | `static` | `npm run build:static` で自動設定（手動設定不要） |

`.env` ファイルは不要。

## 開発スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動（ホットリロード、http://localhost:3000） |
| `npm run build` | 本番ビルド（`.next/` に出力） |
| `npm run build:static` | 静的エクスポートビルド（`out/` に出力） |
| `npm run start` | ビルド済みアプリを起動（`npm run build` 後に実行） |
| `npm run lint` | Biome によるリント |
| `npm run format` | Biome による自動フォーマット |

## コードの変更・カスタマイズ

### SQL の固定値を変更する

`src/lib/sql/helpers.ts` に定義されている定数を編集する。

| 定数 | デフォルト値 | 説明 |
|------|-------------|------|
| `defaultMailDomain` | `"kankouyohou.com"` | メールアドレスのドメイン |
| `defaultZip` | `"105-0001"` | 郵便番号 |
| `defaultCityName` | `"港区"` | 市区町村名 |
| `defaultAddress` | `"虎ノ門3-1-1"` | 住所 |
| `defaultPhone` | `"012-345-6789"` | 電話番号 |

## デプロイ手順

### GitHub Pages（静的サイト）

`master` ブランチへのプッシュで `.github/workflows/deploy.yml` が自動実行され、GitHub Pages にデプロイされる。

- デプロイ先: `https://ot-nemoto.github.io/account-sql-generator/`
- ビルドコマンド: `npm run build:static`
- 出力ディレクトリ: `out/`

### 手動デプロイ

```bash
npm run build:static
# out/ ディレクトリを任意の静的ホスティングにアップロード
```

## Dev Container

`.devcontainer/devcontainer.json` が設定されており、VS Code または GitHub Codespaces で Dev Container を使用した開発環境が利用できる。
