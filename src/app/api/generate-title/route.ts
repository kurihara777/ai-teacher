import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { message }: { message: string } = await req.json();

    const prompt = `
あなたはタイトル生成AIです。

次のメッセージからチャットタイトルを生成してください。

制約:
- 必ず1行のみ
- 余計な説明は一切禁止
- 記号や番号も不要
- タイトルだけ出力

メッセージ:
${message}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
    });

    return new Response(response.text, { status: 200 });
  } catch (e) {
    console.error("タイトル生成エラー:", e);
    return new Response("error", { status: 500 });
  }
}