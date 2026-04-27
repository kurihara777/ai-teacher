import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServer();

  // 🔐 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // ===== RPC呼び出し =====
    const [
      { data: accuracy, error: accError },
      { data: byCategory, error: catError },
      { data: weakTopics, error: weakError },
      { data: recent, error: recentError },
      { data: practiceCount, error: practiceError },
    ] = await Promise.all([
      supabase.rpc("get_accuracy"),
      supabase.rpc("get_accuracy_by_category"),
      supabase.rpc("get_weak_topics"),
      supabase.rpc("get_recent_answers"),
      supabase.rpc("get_practice_count_by_category"),
    ]);

    // ===== エラーチェック =====
    if (accError || catError || weakError || recentError || practiceError){
      console.error({
        accError,
        catError,
        weakError,
        recentError,
        practiceError,
      });

      return Response.json(
        { error: "Analytics fetch failed" },
        { status: 500 }
      );
    }

    // ===== データ整形（null対策） =====

    // accuracyは配列で返るので1件取り出す
    const acc = accuracy?.[0] ?? {
      total: 0,
      correct: 0,
      accuracy: 0,
    };

    return Response.json({
      accuracy: {
        total: acc.total ?? 0,
        correct: acc.correct ?? 0,
        accuracy: acc.accuracy ?? 0,
      },
      byCategory: byCategory ?? [],
      weakTopics: weakTopics ?? [],
      recent: recent ?? [],
      practiceCount: practiceCount ?? [],
    });
  } catch (e) {
    console.error("Analytics API error:", e);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}