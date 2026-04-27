"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ================= PCサイドバー ================= */}
      <aside className="hidden md:flex md:w-64 border-r bg-white">
        <Sidebar />
      </aside>

      {/* ================= モバイル用サイドバー ================= */}
      {isOpen && (
        <>
          {/* 背景オーバーレイ */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* スライドメニュー */}
          <aside className="fixed top-0 left-0 w-64 h-full bg-white z-50 shadow-lg p-4">
            <Sidebar onClose={() => setIsOpen(false)} />
          </aside>
        </>
      )}

      {/* ================= メインエリア ================= */}
      <div className="flex-1 flex flex-col">
        {/* モバイルヘッダー */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-white">
          <h1 className="font-bold">AI講師</h1>
          <button
            onClick={() => setIsOpen(true)}
            className="text-2xl"
          >
            ☰
          </button>
        </header>

        {/* コンテンツ */}
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}