"use client";

import { useState } from "react";
import { generateMembersSql } from "@/lib/sql/generateMembersSql";
import { generateUsersSql } from "@/lib/sql/generateUsersSql";
import { toUserRows } from "@/lib/sql/helpers";
import type { AccountData } from "@/lib/sql/types";

const hashPasswords = (passwords: string[]): Promise<string[]> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../workers/bcryptWorker.ts", import.meta.url),
    );
    worker.onmessage = (e: MessageEvent<string[]>) => {
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };
    worker.postMessage(passwords);
  });

type UseSQLGenerationProps = {
  organizationName: string;
  prefCode: string;
  municipalityCode: string;
  startDate: string;
  endDate: string;
  teacherRows: AccountData[];
  studentRows: AccountData[];
};

export function useSQLGeneration({
  organizationName,
  prefCode,
  municipalityCode,
  startDate,
  endDate,
  teacherRows,
  studentRows,
}: UseSQLGenerationProps) {
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [generatedMemberSQL, setGeneratedMemberSQL] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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


    try {
      const filteredRows = [
        ...teacherRows.filter((r) => r.userId.trim().length > 0),
        ...studentRows.filter((r) => r.userId.trim().length > 0),
      ];
      const hashes = await hashPasswords(
        filteredRows.map((r) => r.password || "password"),
      );
      const mergedRows = filteredRows.map((r, i) => ({
        ...r,
        password: hashes[i],
      }));

      const usersSql = generateUsersSql({
        organizationName,
        pref,
        city,
        users: toUserRows(mergedRows),
      });
      setGeneratedSQL(usersSql || "-- No users found");

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

  return { generatedSQL, generatedMemberSQL, isGenerating, errorMessage, generateSQL };
}
