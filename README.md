# アカウントSQL生成ツール

教育機関向けのユーザー/メンバーアカウントをまとめて登録するための SQL を生成する Next.js アプリケーションです。教師と生徒のアカウント情報をブラウザ上で編集・貼り付けし、`users` テーブルおよび `member` 系テーブル向けの `INSERT` 文を一括作成できます。

## クイックスタート (Try it)

1. 依存関係をインストール:
	```bash
	npm install
	```
2. 開発サーバーを起動:
	```bash
	npm run dev
	```
3. ブラウザで http://localhost:3000 にアクセス

静的サイトとして出力したい場合は `npm run build:static` を実行すると `out/` 以下に成果物が作成されます。

## 主な機能

- 教師/生徒の2セクションを持つスプレッドシート風フォーム (`AccountSpreadsheet`)
- Excel / Google スプレッドシートからの複数セル貼り付けに対応（タブ区切りで自動整形）
- 行の追加・初期化、削除操作を UI から実行可能
- 組織名・自治体コード・利用期間などのメタ情報を入力フォームで設定
- `bcryptjs` を用いたパスワードハッシュ生成（同期処理）
- `users` 向け SQL と `member` 向け SQL の同時生成とコピー機能
- `users` 向け SQL と `member` 向け SQL の同時生成およびコピー機能に加え、生成された SQL を `.sql` ファイルとしてダウンロードする機能があります（クライアント側で Blob を作成して保存します）。
- 生成中インジケーターやエラーメッセージ表示でフィードバック

## 使い方

1. 画面上部のフォームで以下を入力します。
	- 組織名：`user_group` / `member` それぞれの `company_name` に反映されます。
	- 都道府県コード / 市区町村コード：数値として `prefecture_code`, `city_code` に利用します。
	- 利用開始日 / 利用終了日（任意）：`member_role_periods` の有効期間に反映されます。
2. 「アカウント情報」セクションで教師・生徒それぞれの一覧を編集します。
	- 列は `ユーザーID`, `ユーザー名`, `パスワード` の3項目。
	- スプレッドシートからコピーしたデータをセルにフォーカスして貼り付けると、複数行が自動で展開されます。
	- 行を削除すると ID は再利用されません。行を追加すると自動で `t-` / `s-` プレフィックス付き ID が振られます。
3. 「SQL生成」ボタンを押すと処理が始まり、完了後に `users`・`member` 双方の SQL が表示されます。
4. 各 SQL ブロックの「コピー」ボタンでクリップボードに転送し、DB ツール等へ貼り付けます。
	- 各 SQL ブロックには「コピー」と「ダウンロード」ボタンがあり、表示されている SQL を `.sql` ファイルとしてダウンロードできます。
	- コピー／ダウンロードボタンは、SQL が実際に生成されてテキストが空でない場合にのみ有効になります（SQL が空または空白のみの場合は無効化されます）。
	- ダウンロード時のファイル名は組織名をベースにして作られます（例: `MyOrg_users.sql`）。組織名が空の場合は `sql_export_users.sql` / `sql_export_members.sql` のようなフォールバック名になります。特殊文字は安全なファイル名に変換されます。

> パスワード列は画面上では平文ですが、SQL 生成時に `bcrypt` ハッシュに変換されます。未入力の場合はデフォルトで `password` という文字列がハッシュ化されます。

## SQL 出力の概要

### `users` 系 SQL
- `START TRANSACTION` / `COMMIT` でラップされた `INSERT` 文を出力します。
- `user_group` に1レコード挿入した後、`LAST_INSERT_ID()` を用いて同じ `user_group_id` を `users` テーブルに紐づけます。
- 教師は `role_id = 1`, 生徒は `role_id = 2` の固定値で挿入されます。

### `member` 系 SQL
- `member`, `member_roles`, `member_role_periods` の3テーブルに対する `INSERT` 文をまとめて生成します。
- メールアドレスは `<ユーザーID>@kankouyohou.com` （カスタマイズ可）で自動生成されます。
- `member_roles` では `USER` と `GENERAL` の2ロールをそれぞれ登録します。
- 利用期間は入力された開始日/終了日に基づき、未入力の場合は `NULL` が挿入されます。

## 入力フォーマットのヒント

| 項目           | 必須 | 備考                                          |
| -------------- | ---- | --------------------------------------------- |
| ユーザーID     | ○    | SQL の `login_id` およびメールアドレスに利用 |
| ユーザー名     | △    | 未入力の場合は空文字で挿入                   |
| パスワード     | △    | 未入力時は `password` でハッシュ化           |

教師/生徒ともにユーザーIDが空の行は SQL 生成時に除外されます。

## 技術スタック

- フレームワーク: Next.js 15.5.4 (App Router)
- 言語: TypeScript 5, React 19
- UI: Tailwind CSS 4, ユーティリティベースのスタイリング
- ロジック: `bcryptjs` による同期ハッシュ、`src/lib/sql/*` に SQL ビルダー
- 開発ツール: Biome (Lint/Format), cross-env

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx          # アプリ全体のレイアウト
│   ├── page.tsx            # メインページ（フォーム & SQL 生成）
│   ├── globals.css         # Tailwind 4 ベースのグローバルスタイル
│   └── favicon.ico
├── components/
│   └── AccountSpreadsheet.tsx  # 教師/生徒のスプレッドシート UI
└── lib/
	 └── sql/
		  ├── generateUsersSql.ts    # user_group / users 用 SQL ビルダー
		  ├── generateMembersSql.ts  # member 系テーブル用 SQL ビルダー
		  ├── helpers.ts             # クオート関数・定数
		  └── types.ts               # 型定義
```

## 開発スクリプト

- `npm run dev` : 開発サーバーを起動 (`next dev`)
- `npm run build` : 本番ビルド (`next build`)
- `npm run build:static` : 静的出力モード（`BUILD_MODE=static`）
- `npm run start` : ビルド済みアプリを起動 (`next start`)
- `npm run lint` : Biome でのリンティング
- `npm run format` : Biome でのフォーマット整形

## 設定とカスタマイズ

- メールドメイン、郵便番号、住所などの固定値は `src/lib/sql/helpers.ts` で設定できます。
- パスワードハッシュ処理はクライアントサイドで同期的に行われるため、大量件数ではパフォーマンスへ影響があります。必要に応じて Web Worker やサーバーサイドへの移行を検討してください。

## ライセンス

ライセンス情報はリポジトリのルートに配置される `LICENSE` ファイルをご確認ください（未設定の場合は作者にお問い合わせください）。
