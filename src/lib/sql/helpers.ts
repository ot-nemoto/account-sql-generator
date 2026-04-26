import { ROLE_MAP } from "./types";
import type { AccountData, UserRow } from "./types";

export const q = (s: string | number | null) =>
  s === null ? "NULL" : `'${String(s).replace(/'/g, "''")}'`;

export const wrapInTransaction = (sql: string): string =>
  `START TRANSACTION;\n\n${sql}\n\nCOMMIT;\n`;

/** ハッシュ済みパスワードを持つ AccountData[] を UserRow[] に変換する */
export const toUserRows = (rows: AccountData[]): UserRow[] =>
  rows.map((r) => ({
    userId: r.userId,
    pwHash: r.password,
    role: ROLE_MAP[r.role],
  }));

export const defaultMailDomain = "kankouyohou.com";
export const defaultZip = "105-0001";
export const defaultCityName = "港区";
export const defaultAddress = "虎ノ門3-1-1";
export const defaultPhone = "012-345-6789";
