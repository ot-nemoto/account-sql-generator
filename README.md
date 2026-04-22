# アカウントSQL生成ツール

[![Pages](https://github.com/ot-nemoto/account-sql-generator/actions/workflows/deploy.yml/badge.svg)](https://github.com/ot-nemoto/account-sql-generator/actions/workflows/deploy.yml)
[![Dependabot](https://github.com/ot-nemoto/account-sql-generator/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/ot-nemoto/account-sql-generator/actions/workflows/dependabot/dependabot-updates/)
[![License](https://img.shields.io/github/license/ot-nemoto/account-sql-generator)](https://github.com/ot-nemoto/account-sql-generator/blob/master/LICENSE)

教育機関向けに、教師・生徒のアカウントを一括登録するための SQL INSERT 文を生成する Web ツールです。

## 主な機能

- スプレッドシート風フォームで教師・生徒のアカウント情報を入力
- Excel / Google スプレッドシートからのコピー&ペーストに対応
- `users` 系・`member` 系テーブルの SQL を同時生成
- パスワードを bcrypt ハッシュに自動変換
- 生成した SQL をクリップボードコピーまたは `.sql` ファイルとしてダウンロード

## ドキュメント

| ファイル | 内容 |
|---------|------|
| [docs/product.md](docs/product.md) | プロダクトの目的・対象ユーザー・成功指標 |
| [docs/requirements.md](docs/requirements.md) | 機能要件・非機能要件・画面一覧 |
| [docs/architecture.md](docs/architecture.md) | 技術スタック・ディレクトリ構成・実装方針 |
| [docs/ui.md](docs/ui.md) | 画面仕様・コンポーネント一覧・UI規約 |
| [docs/development.md](docs/development.md) | ローカルセットアップ・ビルド・デプロイ手順 |
| [docs/tasks.md](docs/tasks.md) | フェーズ別マイルストーン |
| [docs/testing.md](docs/testing.md) | テスト方針・実行手順 |

## クイックスタート

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 にアクセスする。

詳細なセットアップ・デプロイ手順は [docs/development.md](docs/development.md) を参照。
