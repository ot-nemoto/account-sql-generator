"use client";

import { useCallback, useState } from "react";
import type { AccountData } from "@/components/AccountSpreadsheet";
import AccountSpreadsheet from "@/components/AccountSpreadsheet";
import { generateMembersSql } from "@/lib/sql/generateMembersSql";
import { generateUsersSql } from "@/lib/sql/generateUsersSql";

// bcryptjs is used synchronously here (existing behavior). For large workloads consider
// moving hashing into a Web Worker or to the server.
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
  const [generatedMemberSQL, setGeneratedMemberSQL] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedUsers, setCopiedUsers] = useState(false);
  const [copiedMembers, setCopiedMembers] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDataChange = useCallback(
    (teacher: AccountData[], student: AccountData[]) => {
      setTeacherRows(teacher);
      setStudentRows(student);
    },
    [],
  );

  const hashPassword = (pw: string) => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(pw, salt);
  };

  const generateSQL = async () => {
    if (!organizationName) {
      setGeneratedSQL("-- 組織名を入力してください");
      setGeneratedMemberSQL("");
      return;
    }

    const pref = parseInt(prefCode || "0", 10);
    const city = parseInt(municipalityCode || "0", 10);

    setIsGenerating(true);
    setErrorMessage(null);
    // Allow spinner to render before doing synchronous CPU work.
    await new Promise((res) => setTimeout(res, 0));

    try {
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

      const mergedRows = [
        ...teacherRows.filter((r) => r.userId && r.userId.trim().length > 0),
        ...studentRows.filter((r) => r.userId && r.userId.trim().length > 0),
      ].map((r) => ({
        ...r,
        password: hashPassword(r.password || "password"),
      }));

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
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("generateSQL failed", err);
      setErrorMessage(
        "処理中にエラーが発生しました。詳細はコンソールを確認してください。",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, which: "users" | "members") => {
    try {
      await navigator.clipboard.writeText(text || "");
      if (which === "users") {
        setCopiedUsers(true);
        setTimeout(() => setCopiedUsers(false), 2000);
      } else {
        setCopiedMembers(true);
        setTimeout(() => setCopiedMembers(false), 2000);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("copy failed", err);
    }
  };

  // download given text as a .sql file. filename uses organizationName fallback.
  const downloadSqlFile = (text: string, which: "users" | "members") => {
    try {
      const blob = new Blob([text || ""], {
        type: "application/sql;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      // Build filename base: remove half-width/全角 spaces and all symbols.
      // Keep only Unicode letters and numbers so Japanese stays but spaces/symbols are removed.
      const filenameBase =
        organizationName && organizationName.trim().length > 0
          ? (() => {
              const cleaned = organizationName
                .trim()
                // remove everything except Unicode letters and numbers
                .replace(/[^\p{L}\p{N}]/gu, "")
                .slice(0, 100);
              return cleaned.length > 0 ? cleaned : "sql_export";
            })()
          : "sql_export";
      const filename = `${filenameBase}_${which}.sql`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("download failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative">
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-md flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            <div className="text-sm text-gray-700">
              生成中…しばらくお待ちください
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          アカウントSQL生成ツール
        </h1>

        {errorMessage && (
          <div className="mb-4 max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
              {errorMessage}
            </div>
          </div>
        )}

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
                  e.stopPropagation();
                  try {
                    const ne = e.nativeEvent as unknown;
                    if (
                      typeof ne === "object" &&
                      ne !== null &&
                      "stopImmediatePropagation" in ne
                    )
                      (
                        ne as { stopImmediatePropagation: () => void }
                      ).stopImmediatePropagation();
                  } catch {}
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

      <div className="max-w-7xl mx-auto mt-6 flex justify-end">
        <button
          type="button"
          onClick={generateSQL}
          disabled={isGenerating}
          className={`px-4 py-2 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-green-500 ${isGenerating ? "bg-green-400 text-white cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"}`}
        >
          {isGenerating ? "生成中..." : "SQL生成"}
        </button>
      </div>

      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(generatedSQL, "users")}
                disabled={!generatedSQL || generatedSQL.trim().length === 0}
                className={`px-3 py-1 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500 ${!generatedSQL || generatedSQL.trim().length === 0 ? "bg-blue-300 text-white opacity-50 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
              >
                コピー
              </button>
              <button
                type="button"
                onClick={() => downloadSqlFile(generatedSQL, "users")}
                disabled={!generatedSQL || generatedSQL.trim().length === 0}
                className={`px-3 py-1 bg-gray-200 text-gray-800 rounded-md shadow ${!generatedSQL || generatedSQL.trim().length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-300"}`}
              >
                ダウンロード
              </button>
              {copiedUsers && (
                <div className="text-sm text-green-600">コピーしました</div>
              )}
            </div>
          </div>
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded h-64 overflow-auto">
            {generatedSQL}
          </pre>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(generatedMemberSQL, "members")}
                disabled={
                  !generatedMemberSQL || generatedMemberSQL.trim().length === 0
                }
                className={`px-3 py-1 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500 ${!generatedMemberSQL || generatedMemberSQL.trim().length === 0 ? "bg-blue-300 text-white opacity-50 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
              >
                コピー
              </button>
              <button
                type="button"
                onClick={() => downloadSqlFile(generatedMemberSQL, "members")}
                disabled={
                  !generatedMemberSQL || generatedMemberSQL.trim().length === 0
                }
                className={`px-3 py-1 bg-gray-200 text-gray-800 rounded-md shadow ${!generatedMemberSQL || generatedMemberSQL.trim().length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-300"}`}
              >
                ダウンロード
              </button>
              {copiedMembers && (
                <div className="text-sm text-green-600">コピーしました</div>
              )}
            </div>
          </div>
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded h-64 overflow-auto">
            {generatedMemberSQL}
          </pre>
        </div>
      </div>
    </div>
  );
}
