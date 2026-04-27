"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import MessageDialog from "@/components/Modal";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isComp, setIsComp] = useState(false);

  // 既にログイン済ならリダイレクト
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.push("/dashboard");
      }
    };
    checkUser();
  }, [router]);

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // エラーメッセージ日本語化
  const translateError = (msg: string) => {
    if (msg.includes("Invalid login credentials")) {
      return "メールアドレスまたはパスワードが違います";
    }
    if (msg.includes("Email not confirmed")) {
      return "メール認証が完了していません";
    }
    return msg;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsOpen(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    await sleep(1000);
    setIsOpen(false);

    if (error) {
      console.error("login error:", error.message);
      setError(translateError(error.message));
      return;
    }

    setIsComp(true);
    await sleep(800);
    setIsComp(false);

    router.push("/dashboard");
  };

  return (
    <>
      <div className="max-w-md mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-4">ログイン</h1>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          />

          <button className="bg-blue-500 text-white p-2 rounded">
            ログイン
          </button>
        </form>
      </div>

      <div className="text-center mt-4">
        <p>
          アカウントをお持ちでない方は{" "}
          <Link href="/signup" className="text-blue-500 underline">
            新規登録
          </Link>
        </p>
      </div>

      <div>
        <p className="text-2xl text-center my-6 underline">
          <Link className="text-blue-500" href="/">戻る</Link>
        </p>
      </div>

      <MessageDialog open={isOpen} title="ログイン中..." />
      <MessageDialog open={isComp} title="ログイン成功！" />
    </>
  );
}