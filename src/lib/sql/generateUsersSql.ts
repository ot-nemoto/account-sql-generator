import { q, wrapInTransaction } from "./helpers";
import type { UserRow } from "./types";

export function generateUsersSql(opts: {
  organizationName: string;
  pref: number;
  city: number;
  users: UserRow[];
}) {
  const { organizationName, pref, city, users } = opts;

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
  (${q(organizationName)}, ${pref}, ${city}, 1, NOW(), 'admin', NOW(), 'admin', 0);\n\n`;

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

  return wrapInTransaction(sql);
}
