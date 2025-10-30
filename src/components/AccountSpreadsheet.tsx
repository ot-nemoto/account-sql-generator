"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

export interface AccountData {
  id: string;
  userId: string;
  userName: string;
  password: string;
  role: string;
}

const COL_KEYS: (keyof AccountData)[] = ["userId", "userName", "password"];

// module-scope initial data so identity is stable across renders
const INITIAL_TEACHER: AccountData[] = [
  { id: "t-1", userId: "", userName: "", password: "", role: "teacher" },
];
const INITIAL_STUDENT: AccountData[] = [
  { id: "s-1", userId: "", userName: "", password: "", role: "student" },
];

// base columns (won't change)
const baseColumns = [
  { key: "userId", name: "ユーザーID" },
  { key: "userName", name: "ユーザー名" },
  { key: "password", name: "パスワード" },
];

// Row component at module scope to keep identity stable across renders.
const Row = memo(function RowComponent({
  row,
  rowIdx,
  accountRole,
  onChangeField,
  onDeleteRow,
  getInputRef,
  inputRefs,
  composingRef,
  teacherSelectedRef,
  studentSelectedRef,
  focusedRoleRef,
}: {
  row: AccountData;
  rowIdx: number;
  accountRole: "teacher" | "student";
  onChangeField: (
    id: string,
    key: keyof AccountData,
    value: string,
    after?: () => void,
  ) => void;
  onDeleteRow: (id: string) => void;
  getInputRef: (
    id: string,
    key: string,
  ) => (el: HTMLInputElement | null) => void;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  composingRef: React.MutableRefObject<boolean>;
  teacherSelectedRef: React.MutableRefObject<{
    rowIdx: number;
    columnKey: string;
  } | null>;
  studentSelectedRef: React.MutableRefObject<{
    rowIdx: number;
    columnKey: string;
  } | null>;
  focusedRoleRef: React.MutableRefObject<"teacher" | "student" | null>;
}) {
  // Row render (debug logging removed)
  return (
    <tr className="odd:bg-white even:bg-gray-50">
      {COL_KEYS.map((key) => (
        <td key={String(key)} className="border px-2 py-1">
          <input
            key={`${row.id}:${String(key)}`}
            ref={getInputRef(row.id, String(key))}
            className="w-full bg-transparent outline-none"
            value={row[key]}
            onChange={(e) => {
              const val = (e.target as HTMLInputElement).value;
              const caret = (e.target as HTMLInputElement).selectionStart;
              if (composingRef.current) {
                // update state during composition to avoid global lockups on
                // some IME implementations that don't reliably dispatch
                // compositionend; avoid restoring caret while composing.
                onChangeField(row.id, key, val);
                return;
              }
              onChangeField(row.id, key, val, () => {
                const ref = inputRefs.current[`${row.id}:${String(key)}`];
                if (ref) {
                  try {
                    ref.focus();
                    if (typeof caret === "number") {
                      ref.setSelectionRange(caret, caret);
                    }
                  } catch {}
                }
              });
            }}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={(e) => {
              composingRef.current = false;
              const caret = (e.target as HTMLInputElement).selectionStart;
              const val = (e.target as HTMLInputElement).value;
              onChangeField(row.id, key, val, () => {
                const ref = inputRefs.current[`${row.id}:${String(key)}`];
                if (ref) {
                  try {
                    ref.focus();
                    if (typeof caret === "number") {
                      ref.setSelectionRange(caret, caret);
                    }
                  } catch {}
                }
              });
            }}
            onKeyDown={(e) => {
              // Some IME or OS actions may not reliably fire compositionend; ensure
              // composing flag is cleared on Enter/Escape to avoid blocking future input.
              if (e.key === "Enter" || e.key === "Escape")
                composingRef.current = false;
            }}
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
            onBlur={() => {
              // clear composing flag on blur as a safety in case compositionend
              // didn't fire. Also clear selection refs.
              composingRef.current = false;
              if (accountRole === "teacher") teacherSelectedRef.current = null;
              else studentSelectedRef.current = null;
              focusedRoleRef.current = null;
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
          onClick={() => onDeleteRow(row.id)}
          className="text-red-600 hover:text-red-800"
          title="削除"
        >
          ✕
        </button>
      </td>
    </tr>
  );
});

// RoleGrid moved to module scope and memoized so its identity is stable and
// we can observe when it re-renders or is recreated.
const RoleGridComponent = memo(function RoleGridComponent(props: {
  accountRole: "teacher" | "student";
  rows: AccountData[];
  setRows: React.Dispatch<React.SetStateAction<AccountData[]>>;
  teacherCounter: React.MutableRefObject<number>;
  studentCounter: React.MutableRefObject<number>;
  getInputRef: (
    id: string,
    key: string,
  ) => (el: HTMLInputElement | null) => void;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  composingRef: React.MutableRefObject<boolean>;
  teacherSelectedRef: React.MutableRefObject<{
    rowIdx: number;
    columnKey: string;
  } | null>;
  studentSelectedRef: React.MutableRefObject<{
    rowIdx: number;
    columnKey: string;
  } | null>;
  focusedRoleRef: React.MutableRefObject<"teacher" | "student" | null>;
}) {
  const {
    accountRole,
    rows,
    setRows,
    teacherCounter,
    studentCounter,
    getInputRef,
    inputRefs,
    composingRef,
    teacherSelectedRef,
    studentSelectedRef,
    focusedRoleRef,
  } = props;

  // RoleGrid render (debug logging removed)

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
  }, [accountRole, setRows, teacherCounter, studentCounter]);

  const resetGrid = useCallback(() => {
    if (accountRole === "teacher") {
      setRows(INITIAL_TEACHER);
      teacherCounter.current = INITIAL_TEACHER.length + 1;
    } else {
      setRows(INITIAL_STUDENT);
      studentCounter.current = INITIAL_STUDENT.length + 1;
    }
  }, [accountRole, setRows, teacherCounter, studentCounter]);

  const onChangeField = useCallback(
    (id: string, key: keyof AccountData, value: string, after?: () => void) => {
      setRows((prev) => {
        const next = prev.map((r) => ({ ...r }));
        const idx = next.findIndex((r) => r.id === id);
        if (idx === -1) return next;
        next[idx] = { ...next[idx], [key]: value };
        return next;
      });
      if (after) {
        // ensure DOM has updated before running after (caret restore)
        requestAnimationFrame(() => {
          try {
            after();
          } catch {}
        });
      }
    },
    [setRows],
  );

  const onDeleteRow = useCallback(
    (id: string) => setRows((prev) => prev.filter((r) => r.id !== id)),
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
              <Row
                key={row.id}
                row={row}
                rowIdx={rowIdx}
                accountRole={accountRole}
                onChangeField={onChangeField}
                onDeleteRow={onDeleteRow}
                getInputRef={getInputRef}
                inputRefs={inputRefs}
                composingRef={composingRef}
                teacherSelectedRef={teacherSelectedRef}
                studentSelectedRef={studentSelectedRef}
                focusedRoleRef={focusedRoleRef}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default function AccountSpreadsheet(props: {
  onDataChange?: (teacher: AccountData[], student: AccountData[]) => void;
}) {
  const { onDataChange } = props;

  useEffect(() => {
    // ensure component mounted
  }, []);

  const [teacherAccounts, setTeacherAccounts] =
    useState<AccountData[]>(INITIAL_TEACHER);
  const [studentAccounts, setStudentAccounts] =
    useState<AccountData[]>(INITIAL_STUDENT);

  // notify parent when data changes
  useEffect(() => {
    if (!onDataChange) return;
    const id = setTimeout(
      () => onDataChange(teacherAccounts, studentAccounts),
      100,
    );
    return () => clearTimeout(id);
  }, [teacherAccounts, studentAccounts, onDataChange]);

  // base columns are defined at module scope as `baseColumns`

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

  // refs for inputs to restore focus/selection after controlled updates
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  // IME composition flag to avoid interrupting composition with React updates
  const composingRef = useRef(false);
  // stable callbacks per input to avoid ref function churn
  const inputRefCallbacks = useRef<
    Record<string, (el: HTMLInputElement | null) => void>
  >({});
  const getInputRef = useCallback((id: string, key: string) => {
    const k = `${id}:${key}`;
    if (!inputRefCallbacks.current[k]) {
      inputRefCallbacks.current[k] = (el: HTMLInputElement | null) => {
        inputRefs.current[k] = el;
      };
    }
    return inputRefCallbacks.current[k];
  }, []);

  // (inner Row removed — using module-scope Row to keep identity stable)

  // Keep counters in sync with the highest numeric id present in each list.
  // This prevents duplicate ids when rows are added via paste (which may
  // append ids based on existing max) or when rows are removed.
  useEffect(() => {
    const max = teacherAccounts.length
      ? Math.max(
          ...teacherAccounts.map(
            (a) => parseInt(a.id.replace(/[^0-9]/g, ""), 10) || 0,
          ),
        )
      : 0;
    teacherCounter.current = max + 1;
  }, [teacherAccounts]);

  useEffect(() => {
    const max = studentAccounts.length
      ? Math.max(
          ...studentAccounts.map(
            (a) => parseInt(a.id.replace(/[^0-9]/g, ""), 10) || 0,
          ),
        )
      : 0;
    studentCounter.current = max + 1;
  }, [studentAccounts]);

  // RoleGrid is provided by the memoized `RoleGridComponent` defined at
  // module scope so we intentionally don't define an inner RoleGrid here.

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        アカウント情報
      </h2>

      <div className="overflow-x-auto">
        <RoleGridComponent
          accountRole="teacher"
          rows={teacherAccounts}
          setRows={setTeacherAccounts}
          teacherCounter={teacherCounter}
          studentCounter={studentCounter}
          getInputRef={getInputRef}
          inputRefs={inputRefs}
          composingRef={composingRef}
          teacherSelectedRef={teacherSelectedRef}
          studentSelectedRef={studentSelectedRef}
          focusedRoleRef={focusedRoleRef}
        />
        <RoleGridComponent
          accountRole="student"
          rows={studentAccounts}
          setRows={setStudentAccounts}
          teacherCounter={teacherCounter}
          studentCounter={studentCounter}
          getInputRef={getInputRef}
          inputRefs={inputRefs}
          composingRef={composingRef}
          teacherSelectedRef={teacherSelectedRef}
          studentSelectedRef={studentSelectedRef}
          focusedRoleRef={focusedRoleRef}
        />
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Teacher: {teacherAccounts.length} 件 / Student: {studentAccounts.length}{" "}
        件
      </div>
    </div>
  );
}
