"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ProfileForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) return;

      const metaName = user.user_metadata?.name ?? "";
      if (metaName) {
        setName(metaName);
      }

      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      setName(data?.name ?? "");
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("profiles").upsert({
      id: user.id,
      name,
    });

    await supabase.auth.updateUser({
      data: { name }
    });

    setMessage("保存しました");
  };

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">表示名</h2>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded w-full"
      />

      <button
        onClick={handleSave}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
      >
        保存
      </button>

      {message && <p className="text-green-500">{message}</p>}
    </div>
  );
}