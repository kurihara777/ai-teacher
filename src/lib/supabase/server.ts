import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createSupabaseServer = async () => {
  const cookieStore = await cookies(); // ← ここ重要

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  );
};