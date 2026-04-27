"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { error } = await supabase.auth.getSession();

      if (error) {
        router.replace("/login");
        return;
      }

      window.location.href = "/dashboard/profile";
    })();
  }, [router]);

  return <p>認証中...</p>;
}