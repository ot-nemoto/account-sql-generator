import { describe, expect, it } from "vitest";
import { defaultMailDomain } from "./helpers";
import { generateMembersSql } from "./generateMembersSql";
import type { MemberOptions } from "./types";

const baseOpts: MemberOptions = {
  organizationName: "テスト学校",
  pref: 13,
  city: 13101,
  rows: [],
  startDate: "2024-04-01",
  endDate: "2025-03-31",
  mailDomain: "example.com",
};

const row = {
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
    expect(result).toMatch(/COMMIT;$/);
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
    expect(result).toContain("NULL, ");
  });

  it("endDate が未指定の場合は period_to が NULL になる", () => {
    const result = generateMembersSql({
      ...baseOpts,
      rows: [row],
      endDate: undefined,
    });
    // period_to と expiration_date がともに NULL
    const nullMatches = result.match(/NULL/g);
    expect(nullMatches).not.toBeNull();
    expect((nullMatches ?? []).length).toBeGreaterThanOrEqual(2);
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
});
