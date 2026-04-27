"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useChat } from "@/hooks/useChat";

export default function DashboardMain() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const { createChat } = useChat();

  useEffect(() => {
    const init = async () => {
      // ① まずはsessionから即取得（速い）
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        setLoading(false);
        return;
      }

      // metadataを即反映（ここでチラつき防止）
      const metaName = user.user_metadata?.name ?? "";
      if (metaName) {
        setName(metaName);
      }

      // ② profilesから正データ取得（あとから上書き）
      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      if (data?.name) {
        setName(data.name);
      }

      setLoading(false);
    };

    init();
  }, []);

  return (
    <div className="space-y-6">
      {/* ユーザー名 */}
      <h1 className="text-2xl font-bold mb-2">
        {loading
          ? "読み込み中..."
          : `こんにちは！ ${name || "ユーザー"} さん`}
      </h1>

      {/* カテゴリ別質問 */}
      <section>
        <h2 className="text-xl font-bold">カテゴリ別質問</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-2">
          <button
            onClick={() =>
              createChat({ type: "category",
                           category: "react"
               })
            }
            className="p-4 bg-green-600 hover:bg-green-500 text-white rounded cursor-pointer"
          >
            React先生
          </button>
          <button
            onClick={() =>
              createChat({ type: "category",
                           category: "html_css"
               })
            }
            className="p-4 bg-green-600 hover:bg-green-500 text-white rounded cursor-pointer"
          >
            HTML/CSS先生
          </button>
          <button
            onClick={() =>
              createChat({ type: "category",
                           category: "javascript"
               })
            }
            className="p-4 bg-green-600 hover:bg-green-500 text-white rounded cursor-pointer"
          >
            JavaScript先生
          </button>
        </div>
      </section>

      {/* フリーチャット */}
      <section>
        <button
          onClick={() =>
            createChat({ type: "free" })
          }
          className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded cursor-pointer"
        >
          フリーチャット
        </button>
      </section>
    </div>
  );
}