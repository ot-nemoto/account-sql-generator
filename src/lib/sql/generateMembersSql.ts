import {
  defaultAddress,
  defaultCityName,
  defaultMailDomain,
  defaultPhone,
  defaultZip,
  q,
} from "./helpers";
import type { MemberOptions } from "./types";

export function generateMembersSql(opts: MemberOptions) {
  const { organizationName, pref, city, rows, startDate, endDate, mailDomain } =
    opts;
  const md = mailDomain || defaultMailDomain;
  const zip = defaultZip;
  const cityName = defaultCityName;
  const address = defaultAddress;
  const phone = defaultPhone;
  const periodFrom = startDate ? `${startDate} 00:00:00` : null;
  const periodTo = endDate ? `${endDate} 00:00:00` : null;
  const expiration = periodTo;

  if (!rows || rows.length === 0) return "-- メンバーがありません";

  const memberVals: string[] = [];
  const roleVals: string[] = [];
  const periodVals: string[] = [];

  rows.forEach((r, idx) => {
    const loginId = r.userId.replace(/'/g, "''");
    const memberName = r.userName?.trim() ?? "";
    const pwHash = r.password ? r.password : ""; // caller should provide hashed pw if desired
    const mail = `${loginId}@${md}`;

    memberVals.push(
      `(${q(loginId)}, '0', '0', ${q(memberName)}, ${q(organizationName)}, '${zip}', ${pref}, ${q(cityName)}, ${q(address)}, ${q(phone)}, ${q(mail)}, NOW(), '${pwHash}', ${pref}, ${city}, NULL, '0', ${q(expiration)}, '0', NOW(), NOW(), NULL, '0')`,
    );

    const base = `(@first_member_id + ${idx})`;
    // pair USER and GENERAL on the same line to match original formatting
    roleVals.push(
      `(${base}, 'USER', NOW(), NOW()), (${base}, 'GENERAL', NOW(), NOW())`,
    );
    periodVals.push(
      `(${base}, 'GENERAL', ${q(periodFrom)}, ${q(periodTo)}, 2, NOW(), NOW())`,
    );
  });

  const memberSql = `START TRANSACTION;

INSERT INTO member (
  login_id,
  member_type,
  member_attribute,
  member_name,
  company_name,
  zip_code,
  prefecture_code,
  city_name,
  address,
  phone_number,
  mail_address,
  registration_date,
  password,
  def_prefecture_code,
  def_administrative_area_code,
  last_login_date,
  failure_login_count,
  expiration_date,
  login_flag,
  create_date,
  update_date,
  delete_date,
  delete_flag
) VALUES
${memberVals.map((v) => `  ${v}`).join(",\n")};

SET @first_member_id = LAST_INSERT_ID();

INSERT INTO member_roles (
  member_id,
  role,
  create_date,
  update_date
) VALUES
${roleVals.map((v) => `  ${v}`).join(",\n")};

INSERT INTO member_role_periods (
  member_id,
  role,
  period_from,
  period_to,
  status,
  create_date,
  update_date
) VALUES
${periodVals.map((v) => `  ${v}`).join(",\n")};

COMMIT;`;

  // memberSql already contains START/COMMIT to match the original page.tsx output
  return memberSql;
}
