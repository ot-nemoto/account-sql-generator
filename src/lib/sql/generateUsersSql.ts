import { q } from "./helpers";
import type { UserRow } from "./types";

export function generateUsersSql(opts: {
  organizationName: string;
  pref: number;
  city: number;
  users: UserRow[];
}) {
  const { organizationName, pref, city, users } = opts;
  const orgNameEsc = organizationName.replace(/'/g, "''");

  let sql = "";

  sql += `INSERT INTO user_group (
  user_group_name,
  prefecture_code,
  city_code,
  version_no,
  create_date,
  created_by,
  update_date,
  updated_by,
  delete_flag
) VALUES
  ('${orgNameEsc}', ${pref}, ${city}, 1, NOW(), 'admin', NOW(), 'admin', 0);\n\n`;

  if (users.length > 0) {
    sql += "SET @user_group_id = LAST_INSERT_ID();\n\n";
    sql += `INSERT INTO users (
  user_name,
  password,
  role_id,
  user_group_id,
  version_no,
  create_date,
  created_by,
  update_date,
  updated_by,
  delete_date,
  delete_flag
)
VALUES
`;

    const vals = users.map(
      (u) =>
        `  (${q(u.userId)}, ${q(u.pwHash)}, ${u.role}, @user_group_id, 1, NOW(), 'admin', NOW(), 'admin', NULL, 0)`,
    );
    sql += vals.join(",\n");
    sql += ";";
  }

  return `START TRANSACTION;\n\n${sql}\n\nCOMMIT;\n`;
}
