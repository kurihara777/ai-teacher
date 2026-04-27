import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import "highlight.js/styles/github.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400"]
});

export const metadata: Metadata = {
  title: "講師AIサイト",
  description: "『学習体験の質向上』を実現する、教育支援に特化したAIサービス",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.className} m-0`}>
        {children}
      </body>
    </html>
  );
}
