import { describe, expect, it } from "vitest";
import { q } from "./helpers";

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
