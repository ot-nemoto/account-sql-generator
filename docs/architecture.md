# architecture.md

## 技術スタック

バージョンは `package.json` を参照すること。

### 本番依存

| パッケージ | 用途 |
|-----------|------|
| next | フレームワーク（App Router） |
| react / react-dom | UI ライブラリ |
| bcryptjs | パスワードハッシュ（Web Worker で非同期実行）※v2.4.3 に固定（$2a 出力維持のため） |

### 開発依存

| パッケージ | 用途 |
|-----------|------|
| typescript | 型安全 |
| @types/bcryptjs / @types/react / @types/react-dom / @types/node | 型定義 |
| tailwindcss / @tailwindcss/postcss | ユーティリティファースト CSS（v4） |
| @biomejs/biome | リント・フォーマット |
| vitest / @vitest/coverage-v8 | テストランナー・カバレッジ |
| cross-env | クロスプラットフォーム環境変数 |

## 環境変数

| 変数名 | 値 | 用途 |
|--------|----|------|
| `BUILD_MODE` | `static` | 静的エクスポートモードを有効化（`npm run build:static` で自動設定） |

## アーキテクチャ方針

- **クライアントサイドのみ**: バックエンドサーバーを持たず、全処理をブラウザ内で完結する
- **単一ページ構成**: 全機能をメイン画面 1 画面に集約する
- **App Router**: Next.js の App Router を使用。メインページは `"use client"` でクライアントコンポーネントとして動作する
- **SQL 生成ロジックの分離**: `src/lib/sql/` に集約し、UI とロジックを分離する

## 非機能要件

| 観点 | 要件 |
|------|------|
| 構成 | クライアントサイドのみで動作する（バックエンドサーバー不要） |
| デプロイ | 静的サイトとして GitHub Pages 等にデプロイできる |
| 入力 | 日本語入力（IME）が正常に動作する |
| セキュリティ | パスワードは平文で SQL に出力されない |
| パフォーマンス | 大量アカウント入力時にパフォーマンスが著しく低下しない（制限目安: 数百件） |

## バージョン固有の注意事項

### Tailwind CSS v4
- v4 では PostCSS プラグイン（`@tailwindcss/postcss`）が必須
- `tailwind.config.js` は不要（設定は CSS ファイル内で行う）
- v3 以前の `@apply` や設定ファイルの書き方は使用不可

### Next.js + React（バージョンは `package.json` を正とする）
- `use client` ディレクティブが必要なクライアントコンポーネントは明示的に宣言する
- `useCallback` / `memo` による最適化を積極的に活用する

### bcryptjs（Web Worker による非同期処理）
- `src/workers/bcryptWorker.ts` で bcrypt ハッシュ化を Web Worker に委譲し、UI スレッドのブロッキングを解消している
- Worker は `new Worker(new URL('../workers/bcryptWorker.ts', import.meta.url))` で生成し、webpack が静的エクスポート時にも正しくバンドルする
