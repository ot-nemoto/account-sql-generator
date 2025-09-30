"use client";

import { useState } from "react";
import type { AccountData } from "@/components/AccountSpreadsheet";
import AccountSpreadsheet from "@/components/AccountSpreadsheet";

const bcrypt = require("bcryptjs");
// sql-formatter: format generated SQL for readability in the UI
// use require to match the project's existing runtime style
// sql-formatter removed — show raw generated SQL

export default function Home() {
  const [organizationName, setOrganizationName] = useState("");
  const [prefCode, setPrefCode] = useState("13");
  const [municipalityCode, setMunicipalityCode] = useState("13101");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [teacherRows, setTeacherRows] = useState<AccountData[]>([]);
  const [studentRows, setStudentRows] = useState<AccountData[]>([]);
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [generatedMemberSQL, setGeneratedMemberSQL] = useState("");

  const handleDataChange = (teacher: AccountData[], student: AccountData[]) => {
    setTeacherRows(teacher);
    setStudentRows(student);
  };

  const hashPassword = (pw: string) => {
    // bcryptjs: using 10 rounds default
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(pw, salt);
  };

  const generateSQL = () => {
    // Guard: require organization name
    if (!organizationName) {
      setGeneratedSQL("-- 組織名を入力してください");
      return;
    }

    const orgNameEsc = organizationName.replace(/'/g, "''");
    const pref = parseInt(prefCode || "0", 10);
    const city = parseInt(municipalityCode || "0", 10);

    // collect and prepare users
    const teachers = teacherRows
      .filter((r) => r.userId && r.userId.trim().length > 0)
      .map((r) => ({
        userIdEsc: r.userId.replace(/'/g, "''"),
        pwHash: hashPassword(r.password || "password"),
      }));

    const students = studentRows
      .filter((r) => r.userId && r.userId.trim().length > 0)
      .map((r) => ({
        userIdEsc: r.userId.replace(/'/g, "''"),
        pwHash: hashPassword(r.password || "password"),
      }));

    const allUsers = [
      ...teachers.map((t) => ({ ...t, role: 1 })),
      ...students.map((s) => ({ ...s, role: 2 })),
    ];

    let sql = "";

    // Insert user_group first
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

    if (allUsers.length > 0) {
      // Capture last insert id into a user variable and use it for subsequent inserts
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

      const vals = allUsers.map((u) => {
        return `  ('${u.userIdEsc}', '${u.pwHash}', ${u.role}, @user_group_id, 1, NOW(), 'admin', NOW(), 'admin', NULL, 0)`;
      });

      sql += vals.join(",\n");
      sql += ";";
    }

    const txSqlRaw = `START TRANSACTION;\n\n${sql}\n\nCOMMIT;\n`;
    // no formatting — display raw generated SQL
    setGeneratedSQL(txSqlRaw);

    // --- generate member / member_roles / member_role_periods SQL ---
    const teachersForMembers = teacherRows.filter(
      (r) => r.userId && r.userId.trim().length > 0,
    );
    const studentsForMembers = studentRows.filter(
      (r) => r.userId && r.userId.trim().length > 0,
    );

    // We'll generate per-user INSERT statements and use LAST_INSERT_ID()
    // to capture the generated member_id for subsequent inserts.
    // This avoids hardcoding member_id (auto-increment) and keeps the
    // whole operation inside a single transaction.
    const memberStatements: string[] = [];

    const zip = "105-0001";
    const cityName = "港区";
    const address = "虎ノ門3-1-1";
    const phone = "012-345-6789";
    const mailDomain = "kankouyohou.com";

    const periodFrom = startDate ? `${startDate} 00:00:00` : null;
    const periodTo = endDate ? `${endDate} 00:00:00` : null;
    const expiration = periodTo;

    // helper to quote and escape
    const q = (s: string | number | null) =>
      s === null ? "NULL" : `'${String(s).replace(/'/g, "''")}'`;

    // unify teacher/student member SQL generation into a single helper
    const addMemberStatements = (rows: AccountData[], roleLabel: string) => {
      rows.forEach((r, idx) => {
        const loginId = r.userId.replace(/'/g, "''");
        const memberName = r.userName?.trim() ?? "";
        const pwHash = hashPassword(r.password || "password");

        memberStatements.push(`-- ${loginId}`);
        memberStatements.push(
          `INSERT INTO member (
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
  (${q(loginId)}, '0', '0', ${q(memberName)}, ${q(organizationName)}, '${zip}', ${pref}, ${q(cityName)}, ${q(address)}, ${q(phone)}, ${q(`${loginId}@${mailDomain}`)}, NOW(), '${pwHash}', ${pref}, ${city}, NULL, '0', ${q(expiration)}, '0', NOW(), NOW(), NULL, '0');`,
        );
        memberStatements.push("SET @member_id = LAST_INSERT_ID();");

        memberStatements.push(
          `INSERT INTO member_roles (member_id, role, create_date, update_date) VALUES (@member_id, 'USER', NOW(), NOW()), (@member_id, 'GENERAL', NOW(), NOW());`,
        );

        memberStatements.push(
          `INSERT INTO member_role_periods (member_id, role, period_from, period_to, status, create_date, update_date) VALUES (@member_id, 'GENERAL', ${q(
            periodFrom,
          )}, ${q(periodTo)}, 2, NOW(), NOW());`,
        );
        memberStatements.push("");
      });
    };

    addMemberStatements(teachersForMembers, "teacher");
    addMemberStatements(studentsForMembers, "student");

    let memberSql = "";
    if (memberStatements.length > 0) {
      // keep formatting consistent with the first SQL block: include a section
      // comment and initialize the member id variable before per-user inserts
      // memberSql += "-- 3_member ( teacher / student )\n\n";
      // memberSql += "SET @member_id = 0;\n\n";
      memberSql += memberStatements.join("\n\n");
    }

    const txMemberSqlRaw = `START TRANSACTION;\n\n${memberSql}\n\nCOMMIT;\n`;
    // no formatting — display raw generated member SQL
    setGeneratedMemberSQL(txMemberSqlRaw);
  };

  // no custom uppercase processing — let sql-formatter decide

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          アカウントSQL生成ツール
        </h1>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="organization"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                組織名
              </label>
              <input
                id="organization"
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                onPaste={(e) => {
                  // Stop propagation so global spreadsheet paste handler does not intercept
                  e.stopPropagation();
                  // also stop other native listeners attached on document
                  try {
                    const ne = e.nativeEvent as unknown;
                    if (
                      typeof ne === "object" &&
                      ne !== null &&
                      "stopImmediatePropagation" in ne
                    ) {
                      (
                        ne as { stopImmediatePropagation: () => void }
                      ).stopImmediatePropagation();
                    }
                  } catch {
                    // ignore
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="組織名を入力"
              />
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="prefCode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    都道府県コード
                  </label>
                  <input
                    id="prefCode"
                    type="text"
                    value={prefCode}
                    onChange={(e) => setPrefCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="municipalityCode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    市区町村コード
                  </label>
                  <input
                    id="municipalityCode"
                    type="text"
                    value={municipalityCode}
                    onChange={(e) => setMunicipalityCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                開始日
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                終了日
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <AccountSpreadsheet onDataChange={handleDataChange} />
        </div>
      </div>

      {/* フォーマット設定は不要のため削除。デフォルトではキーワードを大文字化、カンマは後置（行末）に固定 */}

      {/* SQL生成ボタン（ページ内の右寄せ。スクロールしても動かない） */}
      <div className="max-w-7xl mx-auto mt-6 flex justify-end">
        <button
          type="button"
          onClick={generateSQL}
          className="px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          SQL生成
        </button>
      </div>

      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-white rounded-lg border p-4">
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded h-64 overflow-auto">
            {generatedSQL}
          </pre>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-lg font-medium">Member 用 SQL</h3>
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded h-64 overflow-auto">
            {generatedMemberSQL}
          </pre>
        </div>
      </div>
    </div>
  );
}
