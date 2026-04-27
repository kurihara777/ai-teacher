"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleChange = async () => {
    setError("");
    setMessage("");

    if (!currentPassword || !newPassword || !confirm) {
      setError("すべて入力してください");
      return;
    }

    if (currentPassword === newPassword) {
      setError("同じパスワードは使えません");
      return;
    }

    if (newPassword !== confirm) {
      setError("パスワードが一致しません");
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
      password: currentPassword,
    });

    if (signInError) {
      setError("現在のパスワードが違います");
      return;
    }

    // 更新
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("パスワードを変更しました。再ログインしてください");
    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");

    setTimeout(async () => {
      await supabase.auth.signOut();
      router.push("/login");
    }, 1500);
  };

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">パスワード変更</h2>

      <input
        type="password"
        placeholder="現在のパスワード"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        className="border p-2 rounded w-full"
        required
      />

      <input
        type="password"
        placeholder="新しいパスワード"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="border p-2 rounded w-full"
        minLength={6}
        required
      />

      <input
        type="password"
        placeholder="確認"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="border p-2 rounded w-full"
        minLength={6}
        required
      />

      <button
        onClick={handleChange}
        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded"
      >
        変更
      </button>

      {error && <p className="text-red-500">{error}</p>}
      {message && <p className="text-green-500">{message}</p>}
    </div>
  );
}