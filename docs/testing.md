# testing.md

## テスト種別

| 種別 | 対象 | ツール |
|------|------|-------|
| ユニットテスト | `src/lib/sql/` の純粋関数 | Vitest |

UI コンポーネント（`src/components/`・`src/app/`）のテストは現時点でスコープ外とする。

## テスト対象

| ファイル | 内容 |
|---------|------|
| `src/lib/sql/helpers.ts` | `q()` 関数の SQL エスケープ処理 |
| `src/lib/sql/generateUsersSql.ts` | users / user_group INSERT 文の生成 |
| `src/lib/sql/generateMembersSql.ts` | member / member_roles / member_role_periods INSERT 文の生成 |

## 完了条件

- 全テストが `npm run test` でパスすること
- 上記3ファイルの主要ロジックがカバーされていること

## カバレッジ方針

- `npm run test:coverage` でカバレッジレポートを生成する
- カバレッジ対象: `src/lib/sql/**/*.ts`（`types.ts` を除く）
- 数値目標は設けないが、主要な分岐（空配列・null・特殊文字）を網羅する

## 実行手順

```bash
# テスト実行（一回）
npm run test

# ウォッチモード（開発中）
npm run test:watch

# カバレッジレポート生成
npm run test:coverage
```
