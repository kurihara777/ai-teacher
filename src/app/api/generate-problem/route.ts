import { GoogleGenAI } from "@google/genai";
import { createSupabaseServer } from "@/lib/supabase/server";

type Message = {
  role: "user" | "assistant";
  content: string;
};

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

  const body = await req.json();
  const { messages, category, topic }: { messages: Message[], category: string, topic: string } = body;

  const source = messages ? "chat" : "practice";

  const rule = `
【重要ルール】
- 必ずJSONのみで返してください（説明文・前置き禁止）
- choicesはオブジェクト配列にする
- idは "A" "B" "C" "D" のいずれか
- answerは必ずchoicesのidと一致させる
- textには選択肢の内容のみを書く（"A."などは付けない）  
  `;

  const output = `
【出力形式】
{
  "question": "問題文",
  "choices": [
    { "id": "A", "text": "..." },
    { "id": "B", "text": "..." },
    { "id": "C", "text": "..." },
    { "id": "D", "text": "..." }
  ],
  "answer": "A",
  "explanation": "解説"
}
  `;

  let prompt = "";

  if (messages && messages.length > 0) {
    const recentMessages = messages
      .slice(-4)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    prompt = `
以下の会話内容から理解度チェックの四択問題を1問作成してください。

${rule}

${output}

${recentMessages}
`;
  } else if (category && topic) {
    // ✅ 新規（単体演習）
    prompt = `
あなたは優秀な講師です。
以下の条件で四択問題を1問作成してください。

【カテゴリ】
${category}

【分野】
${topic}

【要件】
・実務レベル
・ひっかけを1つ含める
・初学者〜中級者向け

【制約】
・React / HTML / JavaScript の実務知識に基づく
・曖昧な問題は禁止
・必ず1つだけ正解があること
・選択肢は紛らわしくする

${rule}

${output}
`;
  } else {
    return Response.json(
      { error: "Invalid input" },
      { status: 400 }
    );
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
    });

    const text = res.text ?? "";

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let json;

    try {
      json = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse error:", e);
      return Response.json(
        { error: "JSON parse failed", raw: cleaned },
        { status: 500 }
      );
    }

    // フォーマットチェック
    if (
      !json.question ||
      !Array.isArray(json.choices) ||
      !json.answer ||
      !json.explanation
    ) {
      return Response.json(
        { error: "Invalid AI response format" },
        { status: 500 }
      );
    }

    // 🧠 DB保存（正解・解説も保存）
    const { data, error } = await supabase
      .from("problems")
      .insert({
        user_id: user.id,
        question: json.question,
        choices: json.choices,
        answer: json.answer,
        explanation: json.explanation,
        category: category ?? "unknown",
        topic: topic ?? "unknown",
        source,
      })
      .select()
      .single();

    if (error) {
      console.error("DB error:", error);
      return Response.json(
        { error: "DB insert failed" },
        { status: 500 }
      );
    }

    // ✅ フロントには問題だけ返す（チート防止）
    return Response.json({
      id: data.id,
      question: data.question,
      choices: data.choices,
    });
  } catch (e) {
    console.error("AI generate error:", e);
    return Response.json(
      { error: "AI生成失敗" },
      { status: 500 }
    );
  }
}