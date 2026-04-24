# アカウントSQL生成ツール

![CI](https://github.com/ot-nemoto/account-sql-generator/actions/workflows/ci.yml/badge.svg)
![Version](https://img.shields.io/github/package-json/v/ot-nemoto/account-sql-generator)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/github/license/ot-nemoto/account-sql-generator)

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
