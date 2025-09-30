import type { AccountData } from "@/components/AccountSpreadsheet";

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
