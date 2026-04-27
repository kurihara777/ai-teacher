"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function EmailChangeForm() {
  const [currentEmail, setCurrentEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEmail = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
  
      if (!user) return;
   
      setCurrentEmail(user.email ?? "");
    };
  
    fetchEmail();
  }, []);

  useEffect(() => {
    const refreshUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentEmail(user?.email ?? "");
      setEmail("");
      setPassword("");
      setMessage("");
    };

    window.addEventListener("focus", refreshUser);

    return () => {
      window.removeEventListener("focus", refreshUser);
    };
  }, []);

  const handleChange = async () => {
    setError("");
    setMessage("");

    if (!email || !password) {
      setError("すべて入力してください");
      return;
    }

    if (currentEmail === email) {
      setError("同じメールは使えません");
      return;
    }
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setError("ユーザー取得失敗");
      return;
    }

    // 再認証
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (signInError) {
      setError("パスワードが違います");
      return;
    }

    // メール変更
    const { error } = await supabase.auth.updateUser({
      email,
    });

    if (error) {
      console.log("error:", error?.message);
      console.log("status:", error?.status);
      setError(error.message);
    } else {
      setMessage("確認メールを送信しました");
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">メール変更</h2>

      <p>現在のメールアドレス ： {currentEmail}</p>
      <input
        type="email"
        placeholder="新しいメール"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded w-full"
        required
      />

      <input
        type="password"
        placeholder="現在のパスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded w-full"
        required
      />

      <button
        onClick={handleChange}
        className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded"
      >
        変更
      </button>

      {error && <p className="text-red-500">{error}</p>}
      {message && <p className="text-green-500">{message}</p>}
    </div>
  );
}