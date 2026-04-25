import { describe, expect, it } from "vitest";
import { q, wrapInTransaction } from "./helpers";

describe("q()", () => {
  it("null を NULL に変換する", () => {
    expect(q(null)).toBe("NULL");
  });

  it("文字列をシングルクォートで囲む", () => {
    expect(q("hello")).toBe("'hello'");
  });

  it("数値をシングルクォートで囲む", () => {
    expect(q(42)).toBe("'42'");
  });

  it("文字列内のシングルクォートをエスケープする", () => {
    expect(q("it's")).toBe("'it''s'");
  });

  it("複数のシングルクォートをすべてエスケープする", () => {
    expect(q("a'b'c")).toBe("'a''b''c'");
  });

  it("空文字列をシングルクォートで囲む", () => {
    expect(q("")).toBe("''");
  });
});

describe("wrapInTransaction()", () => {
  it("START TRANSACTION と COMMIT でラップされる", () => {
    const result = wrapInTransaction("SELECT 1;");
    expect(result).toMatch(/^START TRANSACTION;\n/);
    expect(result).toMatch(/\nCOMMIT;\n$/);
  });

  it("SQL 本文が間に含まれる", () => {
    const result = wrapInTransaction("SELECT 1;");
    expect(result).toContain("SELECT 1;");
  });
});
