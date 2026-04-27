import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();

  // 🔐 ログインユーザー取得（RLS対応）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // リクエスト取得
  const { problemId, selectedAnswer } = await req.json();

  if (!problemId || !selectedAnswer) {
    return Response.json(
      { error: "Missing params" },
      { status: 400 }
    );
  }

  // 問題取得
  const { data: problem, error: problemError } = await supabase
    .from("problems")
    .select("*")
    .eq("id", problemId)
    .single();

  if (problemError || !problem) {
    console.error(problemError);
    return Response.json(
      { error: "Problem not found" },
      { status: 404 }
    );
  }

  // 採点
  const isCorrect = problem.answer === selectedAnswer;

  // 回答履歴保存
  const { error: insertError } = await supabase
    .from("user_answers")
    .insert({
      user_id: user.id,
      problem_id: problemId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
    });

  if (insertError) {
    console.error(insertError);
    return Response.json(
      { error: "Answer save failed" },
      { status: 500 }
    );
  }

  // フロントへ結果返却
  return Response.json({
    isCorrect,
    correctAnswer: problem.answer,
    explanation: problem.explanation,
  });
}