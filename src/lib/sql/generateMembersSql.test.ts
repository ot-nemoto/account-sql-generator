import { describe, expect, it } from "vitest";
import { generateMembersSql } from "./generateMembersSql";
import { defaultMailDomain } from "./helpers";
import type { AccountData, MemberOptions } from "./types";

const baseOpts: MemberOptions = {
  organizationName: "テスト学校",
  pref: 13,
  city: 13101,
  rows: [],
  startDate: "2024-04-01",
  endDate: "2025-03-31",
  mailDomain: "example.com",
};

const row: AccountData = {
  id: "t-1",
  userId: "teacher01",
  userName: "山田太郎",
  password: "$2b$10$hashedpassword",
  role: "teacher",
};

describe("generateMembersSql()", () => {
  it("rows が空の場合は固定メッセージを返す", () => {
    const result = generateMembersSql({ ...baseOpts, rows: [] });
    expect(result).toBe("-- メンバーがありません");
  });

  it("START TRANSACTION と COMMIT でラップされる", () => {
    const result = generateMembersSql({ ...baseOpts, rows: [row] });
    expect(result).toMatch(/^START TRANSACTION;/);
    expect(result).toMatch(/COMMIT;\n$/);
  });

  it("member INSERT が含まれる", () => {
    const result = generateMembersSql({ ...baseOpts, rows: [row] });
    expect(result).toContain("INSERT INTO member");
    expect(result).toContain("'teacher01'");
    expect(result).toContain("'山田太郎'");
    expect(result).toContain("'テスト学校'");
  });

  it("member_roles INSERT が含まれる（USER と GENERAL）", () => {
    const result = generateMembersSql({ ...baseOpts, rows: [row] });
    expect(result).toContain("INSERT INTO member_roles");
    expect(result).toContain("'USER'");
    expect(result).toContain("'GENERAL'");
  });

  it("member_role_periods INSERT が含まれる", () => {
    const result = generateMembersSql({ ...baseOpts, rows: [row] });
    expect(result).toContain("INSERT INTO member_role_periods");
    expect(result).toContain("'2024-04-01 00:00:00'");
    expect(result).toContain("'2025-03-31 00:00:00'");
  });

  it("startDate が未指定の場合は period_from が NULL になる", () => {
    const result = generateMembersSql({
      ...baseOpts,
      rows: [row],
      startDate: undefined,
    });
    expect(result).toMatch(
      /INSERT INTO member_role_periods[\s\S]*'GENERAL', NULL, '2025-03-31 00:00:00'/,
    );
  });

  it("endDate が未指定の場合は period_to と expiration_date が NULL になる", () => {
    const result = generateMembersSql({
      ...baseOpts,
      rows: [row],
      endDate: undefined,
    });
    // member_role_periods の period_to が NULL
    expect(result).toMatch(
      /INSERT INTO member_role_periods[\s\S]*?'2024-04-01 00:00:00',\s*NULL/,
    );
    // member の expiration_date が NULL
    // カラム順: mail_address, registration_date, password, pref, city, last_login_date(NULL), failure_count('0'), expiration_date(NULL)
    expect(result).toMatch(
      /'teacher01@example\.com',\s*NOW\(\),\s*'[^']+',\s*13,\s*13101,\s*NULL,\s*'0',\s*NULL/,
    );
  });

  it("mailDomain 未指定時はデフォルトドメインが使われる", () => {
    const result = generateMembersSql({
      ...baseOpts,
      rows: [row],
      mailDomain: undefined,
    });
    expect(result).toContain(`teacher01@${defaultMailDomain}`);
  });

  it("mailDomain 指定時は指定ドメインが使われる", () => {
    const result = generateMembersSql({ ...baseOpts, rows: [row] });
    expect(result).toContain("teacher01@example.com");
  });

  it("複数行で @first_member_id のオフセットが増加する", () => {
    const row2 = { ...row, id: "t-2", userId: "teacher02" };
    const result = generateMembersSql({ ...baseOpts, rows: [row, row2] });
    expect(result).toContain("@first_member_id + 0");
    expect(result).toContain("@first_member_id + 1");
  });

  it("userId のシングルクォートがエスケープされる", () => {
    const result = generateMembersSql({
      ...baseOpts,
      rows: [{ ...row, userId: "o'brien" }],
    });
    expect(result).toContain("'o''brien'");
    expect(result).toContain("o''brien@example.com");
  });
});
