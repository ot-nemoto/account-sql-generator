export const ROLE_MAP = { teacher: 1, student: 2 } as const;
export type RoleLabel = keyof typeof ROLE_MAP;

export interface AccountData {
  id: string;
  userId: string;
  userName: string;
  password: string;
  role: RoleLabel;
}

export type UserRow = {
  userId: string;
  pwHash: string;
  role: number;
};

export type MemberOptions = {
  organizationName: string;
  pref: number;
  city: number;
  rows: AccountData[];
  startDate?: string;
  endDate?: string;
  mailDomain?: string;
};
