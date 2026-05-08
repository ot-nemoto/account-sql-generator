# architecture.md

## 技術スタック

### 本番依存

| パッケージ | バージョン | 用途 |
|-----------|-----------|------|
| next | 15.5.4 | フレームワーク（App Router） |
| react | 19.1.0 | UI ライブラリ |
| react-dom | 19.1.0 | React DOM レンダリング |
| bcryptjs | 2.4.3 | パスワードハッシュ（Web Worker で非同期実行）※バージョン固定（$2a 出力維持のため） |

### 開発依存

| パッケージ | バージョン | 用途 |
|-----------|-----------|------|
| typescript | ^5 | 型安全 |
| @types/react | ^19 | React 型定義 |
| @types/react-dom | ^19 | React DOM 型定義 |
| @types/node | ^20 | Node.js 型定義 |
| tailwindcss | ^4 | ユーティリティファースト CSS |
| @tailwindcss/postcss | ^4 | Tailwind v4 の PostCSS プラグイン |
| @biomejs/biome | 2.2.0 | リント・フォーマット |
| cross-env | ^7.0.3 | クロスプラットフォーム環境変数 |

## ディレクトリ構成

```
account-sql-generator/
├── src/
│   ├── app/
│   │   ├── page.tsx          # メインページ（状態管理・SQL生成オーケストレーション）
│   │   ├── layout.tsx        # ルートレイアウト（メタデータ・HTML設定）
│   │   └── globals.css       # Tailwind インポート・グローバルスタイル
│   ├── components/
│   │   └── AccountSpreadsheet.tsx  # スプレッドシートエディタコンポーネント
│   ├── hooks/
│   │   ├── useSQLGeneration.ts          # SQL生成・データ加工ロジック
│   │   └── useClipboardAndDownload.ts   # クリップボードコピー・ファイルダウンロード
│   ├── workers/
│   │   └── bcryptWorker.ts              # bcrypt ハッシュ化 Web Worker（UI スレッドをブロックしない）
│   └── lib/
│       └── sql/
│           ├── types.ts             # TypeScript インターフェース定義
│           ├── helpers.ts           # 定数・SQL エスケープユーティリティ
│           ├── generateUsersSql.ts  # users 系 SQL ビルダー
│           └── generateMembersSql.ts # member 系 SQL ビルダー
├── docs/                     # プロジェクトドキュメント
├── .github/
│   ├── dependabot.yml        # Dependabot 設定（devcontainers + npm 週次チェック）
│   └── workflows/
│       ├── deploy-github-pages.yml  # GitHub Pages デプロイ
│       └── bump-version.yml         # SemVer バージョンバンプ
├── .devcontainer/            # Dev Container 設定
├── next.config.ts            # Next.js 設定（静的エクスポート対応）
├── tsconfig.json             # TypeScript 設定
├── biome.json                # Biome リント・フォーマット設定
├── postcss.config.mjs        # PostCSS 設定
└── package.json
```

## 環境変数

| 変数名 | 値 | 用途 |
|--------|----|------|
| `BUILD_MODE` | `static` | 静的エクスポートモードを有効化（`npm run build:static` で自動設定） |

## アーキテクチャ方針

- **クライアントサイドのみ**: バックエンドサーバーを持たず、全処理をブラウザ内で完結する
- **単一ページ構成**: 全機能をメイン画面 1 画面に集約する
- **App Router**: Next.js の App Router を使用。メインページは `"use client"` でクライアントコンポーネントとして動作する
- **SQL 生成ロジックの分離**: `src/lib/sql/` に集約し、UI とロジックを分離する

## バージョン固有の注意事項

### Tailwind CSS v4
- v4 では PostCSS プラグイン（`@tailwindcss/postcss`）が必須
- `tailwind.config.js` は不要（設定は CSS ファイル内で行う）
- v3 以前の `@apply` や設定ファイルの書き方は使用不可

### Next.js 15 + React 19
- `use client` ディレクティブが必要なクライアントコンポーネントは明示的に宣言する
- `useCallback` / `memo` による最適化を積極的に活用する

### bcryptjs（Web Worker による非同期処理）
- `src/workers/bcryptWorker.ts` で bcrypt ハッシュ化を Web Worker に委譲し、UI スレッドのブロッキングを解消している
- Worker は `new Worker(new URL('../workers/bcryptWorker.ts', import.meta.url))` で生成し、webpack が静的エクスポート時にも正しくバンドルする
