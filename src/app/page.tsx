"use client";

import { useState } from "react";
import type { AccountData } from "@/components/AccountSpreadsheet";
import AccountSpreadsheet from "@/components/AccountSpreadsheet";

const bcrypt = require("bcryptjs");

export default function Home() {
  const [organizationName, setOrganizationName] = useState("");
  const [prefCode, setPrefCode] = useState("13");
  const [municipalityCode, setMunicipalityCode] = useState("13101");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [teacherRows, setTeacherRows] = useState<AccountData[]>([]);
  const [studentRows, setStudentRows] = useState<AccountData[]>([]);
  const [generatedSQL, setGeneratedSQL] = useState("");

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
    sql += "-- 1_user_group\n";
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
 ) VALUES (
  '${orgNameEsc}', ${pref}, ${city}, 1, NOW(), 'admin', NOW(), 'admin', 0
 );\n\n`;

    if (allUsers.length > 0) {
      // Capture last insert id into a user variable and use it for subsequent inserts
      sql += "SET @user_group_id = LAST_INSERT_ID();\n\n";

      sql += "-- 2_users (teacher / student)\n";
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
      sql += ";\n\n";
    } else {
      // No users: show the id retrieval for user_group
      sql += "SELECT LAST_INSERT_ID() AS user_group_id;\n\n";
    }

    setGeneratedSQL(sql);
  };

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
    </div>
  );
}
