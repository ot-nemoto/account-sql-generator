"use client";

import { useState } from "react";
import type { AccountData } from "@/components/AccountSpreadsheet";
import AccountSpreadsheet from "@/components/AccountSpreadsheet";
import { generateMembersSql } from "@/lib/sql/generateMembersSql";
import { generateUsersSql } from "@/lib/sql/generateUsersSql";

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

    const pref = parseInt(prefCode || "0", 10);
    const city = parseInt(municipalityCode || "0", 10);

    // prepare users and hash passwords once
    const teachersUsers = teacherRows
      .filter((r) => r.userId && r.userId.trim().length > 0)
      .map((r) => ({
        userId: r.userId,
        pwHash: hashPassword(r.password || "password"),
        role: 1,
      }));

    const studentsUsers = studentRows
      .filter((r) => r.userId && r.userId.trim().length > 0)
      .map((r) => ({
        userId: r.userId,
        pwHash: hashPassword(r.password || "password"),
        role: 2,
      }));

    const allUsers = [...teachersUsers, ...studentsUsers];

    const usersSql = generateUsersSql({
      organizationName,
      pref,
      city,
      users: allUsers,
    });
    setGeneratedSQL(usersSql || "-- No users found");

    // Prepare rows for members generator: include hashed password in 'password' field
    const mergedRows = [
      ...teacherRows.filter((r) => r.userId && r.userId.trim().length > 0),
      ...studentRows.filter((r) => r.userId && r.userId.trim().length > 0),
    ].map((r) => ({ ...r, password: hashPassword(r.password || "password") }));

    const membersSql = generateMembersSql({
      organizationName,
      pref,
      city,
      rows: mergedRows,
      startDate,
      endDate,
      mailDomain: "kankouyohou.com",
    });

    setGeneratedMemberSQL(membersSql || "-- No members found");
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
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded h-64 overflow-auto">
            {generatedMemberSQL}
          </pre>
        </div>
      </div>
    </div>
  );
}
