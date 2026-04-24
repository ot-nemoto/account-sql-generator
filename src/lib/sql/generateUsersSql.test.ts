import { describe, expect, it } from "vitest";
import { generateUsersSql } from "./generateUsersSql";
import type { UserRow } from "./types";

const baseOpts = {
  organizationName: "テスト学校",
  pref: 13,
  city: 13101,
};

const teacher: UserRow = {
  userId: "t-1",
  pwHash: "$2b$10$hashedpassword",
  role: 1,
};

const student: UserRow = {
  userId: "s-1",
  pwHash: "$2b$10$hashedpassword",
  role: 2,
};

describe("generateUsersSql()", () => {
  it("START TRANSACTION と COMMIT でラップされる", () => {
    const sql = generateUsersSql({ ...baseOpts, users: [teacher] });
    expect(sql).toMatch(/^START TRANSACTION;/);
    expect(sql).toMatch(/COMMIT;\n$/);
  });

  it("user_group INSERT が含まれる", () => {
    const sql = generateUsersSql({ ...baseOpts, users: [teacher] });
    expect(sql).toContain("INSERT INTO user_group");
    expect(sql).toMatch(
      /VALUES\s*\(\s*'テスト学校'\s*,\s*13\s*,\s*13101\s*[,)]/,
    );
  });

  it("users が空の場合は users INSERT を出力しない", () => {
    const sql = generateUsersSql({ ...baseOpts, users: [] });
    expect(sql).not.toContain("INSERT INTO users");
    expect(sql).not.toContain("LAST_INSERT_ID");
  });

  it("users がある場合は users INSERT と LAST_INSERT_ID が含まれる", () => {
    const sql = generateUsersSql({ ...baseOpts, users: [teacher] });
    expect(sql).toContain("INSERT INTO users");
    expect(sql).toContain("LAST_INSERT_ID()");
  });

  it("複数ユーザーがカンマ区切りの VALUES で出力される", () => {
    const sql = generateUsersSql({ ...baseOpts, users: [teacher, student] });
    expect(sql).toContain("'t-1'");
    expect(sql).toContain("'s-1'");
    // 2行目はカンマ区切りで続く
    expect(sql).toMatch(/\),\n\s+\(/);
  });

  it("教師は role_id = 1 で出力される", () => {
    const sql = generateUsersSql({ ...baseOpts, users: [teacher] });
    expect(sql).toContain(", 1, @user_group_id,");
  });

  it("生徒は role_id = 2 で出力される", () => {
    const sql = generateUsersSql({ ...baseOpts, users: [student] });
    expect(sql).toContain(", 2, @user_group_id,");
  });

  it("組織名のシングルクォートがエスケープされる", () => {
    const sql = generateUsersSql({
      ...baseOpts,
      organizationName: "O'Brien School",
      users: [],
    });
    expect(sql).toContain("'O''Brien School'");
  });
});
