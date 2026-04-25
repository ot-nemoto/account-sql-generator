"use client";

import { useState } from "react";

export function useClipboardAndDownload(organizationName: string) {
  const [copiedUsers, setCopiedUsers] = useState(false);
  const [copiedMembers, setCopiedMembers] = useState(false);

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

  return { copiedUsers, copiedMembers, copyToClipboard, downloadSqlFile };
}
