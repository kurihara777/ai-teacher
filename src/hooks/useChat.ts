"use client";

import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type CreateChatParams = {
  type: string;
  category?: string | null;
};

export const useChat = () => {
  const router = useRouter();

  const createChat = async ({ type, category }: CreateChatParams) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("chats")
      .insert({
        user_id: user.id,
        title: "新しいチャット",
        type,
        category: category ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error(error);
      return null;
    }

    router.push(`/dashboard/chat/${data.id}`);

    return data;
  };

  return { createChat };
};