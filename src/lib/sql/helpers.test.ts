import { describe, expect, it } from "vitest";
import { q, toUserRows, wrapInTransaction } from "./helpers";
import type { AccountData } from "./types";

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

describe("toUserRows()", () => {
  const base: AccountData = {
    id: "t-1",
    userId: "teacher01",
    userName: "山田太郎",
    password: "$2b$10$hashedpw",
    role: "teacher",
  };

  it("teacher は role=1 に変換される", () => {
    const result = toUserRows([base]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ userId: "teacher01", pwHash: "$2b$10$hashedpw", role: 1 });
  });

  it("student は role=2 に変換される", () => {
    const result = toUserRows([{ ...base, id: "s-1", userId: "student01", role: "student" }]);
    expect(result[0].role).toBe(2);
  });

  it("password フィールドを pwHash にマッピングする", () => {
    const result = toUserRows([base]);
    expect(result[0].pwHash).toBe("$2b$10$hashedpw");
  });
});
