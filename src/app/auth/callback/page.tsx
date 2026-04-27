"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // URLからセッションを確定させる（重要）
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        router.replace("/login");
        return;
      }

      router.replace("/dashboard/profile");
    };

    handleCallback();
  }, [router]);

  return <p>認証中...</p>;
}