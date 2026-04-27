import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, type, category }: {
      messages: Message[];
      type: string;
      category: string | null;
    } = await req.json();

    const recentMessages = messages.slice(-5);

    let systemPrompt = "";

    // フリーチャット
    if (type === "free") {
      systemPrompt = `
あなたは優秀な講師です。

【目的】
わからないことを質問することで解消する。

【思考ルール】
・結論→考え方の順で説明
・なぜそうなるのかを説明

【出力制限】
・300文字以内

【出力形式】
・Markdown形式で回答する
・見出しや箇条書きを使う
`;
    }
    // カテゴリ別チャット
    if (type === "category") {
      if (category === "react") {
        systemPrompt = `
あなたはReactの専門講師です。
対象はプログラミング初心者です。

【目的】
初心者がReactの仕組みを理解すること

【思考ルール】
・結論→理由→コード例の順で説明
・なぜその書き方になるかを説明
・よくあるミスも補足する

【禁止】
・専門用語だけで説明しない
・抽象的な説明をしない

【出力形式】
・Markdown形式で回答する
・見出しや箇条書きを使う
【出力形式】
①結論
②解説
③コード例

【出力制限】
・300文字以内
`;
      }
      if (category === "html_css") {
        systemPrompt = `
あなたはHTML/CSS講師です。

【思考ルール】
・見た目がどう変わるか説明する
・レイアウトの考え方も説明する
・コードと結果をセットで説明する

【出力形式】
・Markdown形式で回答する
・見出しや箇条書きを使う

【出力制限】
・300文字以内
`;
      }
      if (category === "javascript") {
        systemPrompt = `
あなたはJavaScript講師です。

【思考ルール】
・処理の流れを順番に説明する
・なぜその結果になるか説明する
・具体例を必ず出す

【強調】
・実行結果をイメージできる説明にする

【出力形式】
・Markdown形式で回答する
・見出しや箇条書きを使う

【出力制限】
・300文字以内
`;
      }
    }
    const prompt = `
${systemPrompt}

${recentMessages.map((m: Message) => `${m.role}: ${m.content}`).join("\n")}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
    });

    return new Response(response.text, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return new Response("エラーが発生しました", { status: 500 });
  }
}