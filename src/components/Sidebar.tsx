"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Trash2 } from "lucide-react";

type Chat = {
  id: string;
  title: string;
  type: string;
  category: string | null;
};

type SidebarProps = {
  onClose?: () => void;
};

export default function Sidebar({ onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [targetChatId, setTargetChatId] = useState<string | null>(null);

  // ユーザー取得
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
      }
    };
    getUser();
  }, []);

  // チャット履歴取得
  useEffect(() => {
    const fetchChats = async () => {
      const { data, error } = await supabase
        .from("chats")
        .select("id, title, type, category")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setChats(data);
      }
    };

    fetchChats();
  }, []);

  // Realtime更新
  useEffect(() => {
    const channel = supabase
      .channel("chats-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chats" },
        (payload) => {
          const newChat = payload.new as Chat;
          setChats((prev) => [newChat, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chats" },
        (payload) => {
          const updated = payload.new as Chat;
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === updated.id
                ? { ...chat, title: updated.title }
                : chat
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chats" },
        (payload) => {
          const deleted = payload.old as Chat;
          setChats((prev) =>
            prev.filter((chat) => chat.id !== deleted.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ログアウト
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose?.();
    router.push("/login");
  };

  // チャット削除
  const handleDelete = async (chatId: string) => {
    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("id", chatId);

    if (error) {
      console.error(error);
      return;
    }

    if (pathname === `/dashboard/chat/${chatId}`) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* 上部 */}
      <div className="mx-4 py-4 border-b">
        <p className="text-sm text-gray-500">ログイン中</p>
        <p className="font-bold truncate">{user?.email}</p>
      </div>

      <div>
        {/* 新規チャット */}
        <Link
          href="/dashboard"
          onClick={() => onClose?.()}
          className="m-4 block text-left bg-blue-600 text-white hover:bg-blue-500 p-2 rounded"
        >
          + 新しいチャット
        </Link>
      </div>

      {/* メインスクロール領域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* チャット履歴 */}
        <div className="space-y-1">
          <p className="text-sm text-gray-500 mb-2">チャット履歴</p>

          {chats.map((chat) => {
            const isActive =
              pathname === `/dashboard/chat/${chat.id}`;

            return (
              <div
                key={chat.id}
                className="flex items-center justify-between group"
              >
                <Link
                  href={`/dashboard/chat/${chat.id}`}
                  onClick={() => onClose?.()}
                  className={`block w-full p-2 rounded truncate ${
                    isActive
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {chat.title}
                </Link>

                {/* 削除ボタン */}
                <button
                  onClick={() => setTargetChatId(chat.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-gray-200 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

        {/* ナビゲーション */}
        <div className="m-4 space-y-2 border-t pt-4">
          <Link
            href="/dashboard/practice"
            onClick={() => onClose?.()}
            className="block text-left p-2 rounded hover:bg-gray-100"
          >
            問題演習
          </Link>

          <Link
            href="/dashboard/analytics"
            onClick={() => onClose?.()}
            className="block w-full text-left p-2 rounded hover:bg-gray-100"
          >
            ダッシュボード
          </Link>

          <Link
            href="/dashboard/profile"
            onClick={() => onClose?.()}
            className="block w-full text-left p-2 rounded hover:bg-gray-100"
          >
            プロフィール
          </Link>
        </div>

      {/* 下部 */}
      <div className="mx-4 pt-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full text-left mb-16 p-2 rounded text-red-500 hover:bg-gray-100"
        >
          ログアウト
        </button>
      </div>

      {/* 削除モーダル（外に出した） */}
      {targetChatId && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded border shadow">
            <p>このチャットを削除しますか？</p>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setTargetChatId(null)}
                className="rounded px-4 py-2 text-white bg-gray-500 hover:bg-gray-400"
              >
                キャンセル
              </button>

              <button
                onClick={() => {
                  handleDelete(targetChatId);
                  setTargetChatId(null);
                  onClose?.();
                }}
                className="rounded px-4 py-2 text-white bg-red-600 hover:bg-red-500"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}