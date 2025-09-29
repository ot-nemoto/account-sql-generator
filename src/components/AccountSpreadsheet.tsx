"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AccountData {
  id: string;
  userId: string;
  userName: string;
  password: string;
  role: string;
}

const COL_KEYS: (keyof AccountData)[] = ["userId", "userName", "password"];

export default function AccountSpreadsheet(props: {
  onDataChange?: (teacher: AccountData[], student: AccountData[]) => void;
}) {
  const { onDataChange } = props;

  // keep two separate lists: teacher and student. Role column is kept in data
  // but will not be shown in the grid (user asked to remove the role column).
  const INITIAL_TEACHER: AccountData[] = [
    { id: "t-1", userId: "", userName: "", password: "", role: "teacher" },
  ];
  const INITIAL_STUDENT: AccountData[] = [
    { id: "s-1", userId: "", userName: "", password: "", role: "student" },
  ];

  const [teacherAccounts, setTeacherAccounts] =
    useState<AccountData[]>(INITIAL_TEACHER);
  const [studentAccounts, setStudentAccounts] =
    useState<AccountData[]>(INITIAL_STUDENT);

  // notify parent when data changes
  useEffect(() => {
    onDataChange?.(teacherAccounts, studentAccounts);
  }, [teacherAccounts, studentAccounts, onDataChange]);

  // base columns (role column intentionally omitted)
  const baseColumns = [
    { key: "userId", name: "ユーザーID" },
    { key: "userName", name: "ユーザー名" },
    { key: "password", name: "パスワード" },
  ];

  // Instead of storing selected cell in parent state (which caused re-renders
  // and scroll/focus jumps), keep per-grid refs and a focusedRoleRef. These
  // are mutated by each RoleGrid when selection changes and are read by the
  // document-level paste handler without triggering re-renders.
  const teacherSelectedRef = useRef<{
    rowIdx: number;
    columnKey: string;
  } | null>(null);
  const studentSelectedRef = useRef<{
    rowIdx: number;
    columnKey: string;
  } | null>(null);
  const focusedRoleRef = useRef<"teacher" | "student" | null>(null);

  // handle paste from Excel/Sheets (TSV) at grid level
  useEffect(() => {
    function handler(e: ClipboardEvent) {
      const focused = focusedRoleRef.current;
      if (!focused) return;
      const sel =
        focused === "teacher"
          ? teacherSelectedRef.current
          : studentSelectedRef.current;
      if (!sel) return;
      const text = e.clipboardData?.getData("text");
      if (!text) return;
      e.preventDefault();

      const rows = text.split(/\r\n|\n|\r/).filter((r) => r.length > 0);
      const parsed = rows.map((r) => r.split(/\t/));

      const colsKeys = COL_KEYS;

      const applyTo = (
        setRowsFn: React.Dispatch<React.SetStateAction<AccountData[]>>,
        rolePrefix: string,
      ) => {
        setRowsFn((prev: AccountData[]) => {
          const next = prev.map((r) => ({ ...r }));
          const startRow = sel.rowIdx;
          const startCol = colsKeys.indexOf(sel.columnKey as keyof AccountData);
          const needed = startRow + parsed.length - next.length;
          if (needed > 0) {
            const maxNum = next.length
              ? Math.max(
                  ...next.map(
                    (a) => parseInt(a.id.replace(/[^0-9]/g, ""), 10) || 0,
                  ),
                )
              : 0;
            for (let i = 0; i < needed; i++) {
              next.push({
                id: `${rolePrefix}${maxNum + 1 + i}`,
                userId: "",
                userName: "",
                password: "",
                role: focused,
              });
            }
          }

          for (let r = 0; r < parsed.length; r++) {
            const targetRow = startRow + r;
            for (let c = 0; c < parsed[r].length; c++) {
              const targetCol = startCol + c;
              if (targetRow < 0 || targetRow >= next.length) continue;
              if (targetCol < 0 || targetCol >= colsKeys.length) continue;
              const key = colsKeys[targetCol];
              next[targetRow] = { ...next[targetRow], [key]: parsed[r][c] };
            }
          }

          return next;
        });
      };

      if (focused === "teacher") applyTo(setTeacherAccounts, "t-");
      else applyTo(setStudentAccounts, "s-");
    }

    document.addEventListener("paste", handler as EventListener);
    return () =>
      document.removeEventListener("paste", handler as EventListener);
  }, []);

  // counters for generating ids per-role
  const teacherCounter = useRef(teacherAccounts.length + 1);
  const studentCounter = useRef(studentAccounts.length + 1);

  // reusable grid component configured per role
  function RoleGrid(props: {
    accountRole: "teacher" | "student";
    rows: AccountData[];
    setRows: React.Dispatch<React.SetStateAction<AccountData[]>>;
  }) {
    const { accountRole, rows, setRows } = props;

    const addRow = useCallback(() => {
      if (accountRole === "teacher") {
        const id = `t-${teacherCounter.current++}`;
        setRows((prev) => [
          ...prev,
          { id, userId: "", userName: "", password: "", role: accountRole },
        ]);
      } else {
        const id = `s-${studentCounter.current++}`;
        setRows((prev) => [
          ...prev,
          { id, userId: "", userName: "", password: "", role: accountRole },
        ]);
      }
    }, [accountRole, setRows]);

    const resetGrid = useCallback(() => {
      if (accountRole === "teacher") {
        setRows(INITIAL_TEACHER);
        teacherCounter.current = INITIAL_TEACHER.length + 1;
      } else {
        setRows(INITIAL_STUDENT);
        studentCounter.current = INITIAL_STUDENT.length + 1;
      }
    }, [accountRole, setRows]);

    const updateCell = useCallback(
      (rowIdx: number, key: keyof AccountData, value: string) => {
        setRows((prev) => {
          const next = prev.map((r) => ({ ...r }));
          if (rowIdx < 0 || rowIdx >= next.length) return next;
          next[rowIdx] = { ...next[rowIdx], [key]: value };
          return next;
        });
      },
      [setRows],
    );

    return (
      <div className="mb-6 border rounded-md">
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
          <div className="font-medium">
            {accountRole === "teacher" ? "Teacher" : "Student"}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetGrid}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md"
            >
              初期化
            </button>
            <button
              type="button"
              onClick={addRow}
              className="px-3 py-1 bg-blue-600 text-white rounded-md"
            >
              行を追加
            </button>
          </div>
        </div>

        <div className="p-3 overflow-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {baseColumns.map((c) => (
                  <th
                    key={c.key as string}
                    className="border px-2 py-1 text-left"
                  >
                    {c.name}
                  </th>
                ))}
                <th className="border px-2 py-1">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={row.id} className="odd:bg-white even:bg-gray-50">
                  {COL_KEYS.map((key) => (
                    <td key={String(key)} className="border px-2 py-1">
                      <input
                        className="w-full bg-transparent outline-none"
                        value={row[key]}
                        onChange={(e) =>
                          updateCell(rowIdx, key, e.target.value)
                        }
                        onFocus={() => {
                          const target = { rowIdx, columnKey: key } as {
                            rowIdx: number;
                            columnKey: keyof AccountData;
                          };
                          if (accountRole === "teacher")
                            teacherSelectedRef.current = target;
                          else studentSelectedRef.current = target;
                          focusedRoleRef.current = accountRole;
                        }}
                        onPaste={() => {
                          /* noop - global handler handles multi-cell paste */
                        }}
                      />
                    </td>
                  ))}
                  <td className="border px-2 py-1 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setRows((prev) => prev.filter((r) => r.id !== row.id))
                      }
                      className="text-red-600 hover:text-red-800"
                      title="削除"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        アカウント情報
      </h2>

      <div className="overflow-x-auto">
        <RoleGrid
          accountRole="teacher"
          rows={teacherAccounts}
          setRows={setTeacherAccounts}
        />
        <RoleGrid
          accountRole="student"
          rows={studentAccounts}
          setRows={setStudentAccounts}
        />
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Teacher: {teacherAccounts.length} 件 / Student: {studentAccounts.length}{" "}
        件
      </div>
    </div>
  );
}
