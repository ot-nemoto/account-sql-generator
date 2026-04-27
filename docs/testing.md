# testing.md — テスト方針

## テスト種別

| 種別 | ツール | 対象 |
|------|--------|------|
| ユニットテスト | Vitest | `src/lib/sql/` 配下の純粋関数 |
| E2E テスト | Playwright MCP | UI 操作・画面全体の動作確認 |

---

## 完了条件

| 対象 | 完了条件 |
|------|---------|
| SQL 生成ロジック（`src/lib/sql/`） | ユニットテストの作成をもって完了 |
| UI コンポーネント（`src/components/`・`src/app/`） | Playwright MCP による E2E テスト実行をもって完了 |

---

## ユニットテスト（Vitest）

### 実行

```bash
npm test                          # 1回実行
npm run test:watch                # ウォッチモード（開発中）
npx vitest run --reporter=verbose # テストケース名をすべて表示
npm run test:coverage             # カバレッジレポート出力
```

### 対象・方針

- `src/lib/sql/` 配下の純粋関数はユニットテスト必須
- テストファイルは実装ファイルと同じディレクトリに `[name].test.ts` で配置

### カバレッジ方針

| ケース | 条件 |
|--------|------|
| 正常系 | 期待する戻り値 |
| 境界値・エッジケース | 空配列、null・undefined、特殊文字（シングルクォート等）など |

---

## E2E テスト（Playwright MCP）

### 実施方法

テスト対象の URL と [`docs/e2e-scenarios.md`](e2e-scenarios.md) のシナリオをモデルに渡して実施する。

本アプリケーションは認証不要のシングルページツールのため、テストユーザーは不要。
