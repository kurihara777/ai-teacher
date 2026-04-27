"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import MessageDialog from "@/components/Modal";
import type { FormEvent } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState(""); // ← 後でprofilesに保存
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isComp, setIsComp] = useState(false);

  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsOpen(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name, // ← metadataに保存される
        },
      },
    });

    await sleep(1000);
    setIsOpen(false);

    if (error) {
      console.error("signup error:", error);
      setError(error.message);
      return;
    }

    setIsComp(true);
    await sleep(1000);
    setIsComp(false);

    // 自動ログインされている場合
    if (data.session) {
      router.push("/dashboard");
    } else {
      // メール確認ONの場合
      router.push("/login");
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-4">新規登録</h1>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="ユーザー名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded"
            required
          />

          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded"
            required
          />

          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded"
            required
            minLength={6}
          />

          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            登録
          </button>
        </form>
      </div>

      <div>
        <p className="text-2xl text-center my-6 underline">
          <Link className="text-blue-500" href="/">
            戻る
          </Link>
        </p>
      </div>

      <MessageDialog open={isOpen} title="ユーザー登録中..." />
      <MessageDialog open={isComp} title="ユーザー登録完了！" />
    </>
  );
}