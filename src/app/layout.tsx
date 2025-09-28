import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "アカウントSQL生成ツール",
  description: "アカウント情報を管理してSQL文を生成するツール",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
