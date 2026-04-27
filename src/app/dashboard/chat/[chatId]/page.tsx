"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import Practice from "@/components/Practice";
import type { ProblemResponse, Problem } from "@/types/problem";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const { chatId } = useParams();

  const [chat, setChat] = useState<{
    type: string;
    category: string | null;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isError, setIsError] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [showCTA, setShowCTA] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "practice">("chat");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const CATEGORY_LABELS: Record<string, string> = {
    react: "REACT",
    html_css: "HTML/CSS",
    javascript: "JavaScript",
  };

  // 自動スクロール
  // メッセージ確定時
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ストリーミング中
  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    });
  }, [streamingText]);

  // チャット情報取得
  useEffect(() => {
    const fetchChat = async () => {
      const { data } = await supabase
        .from("chats")
        .select("type, category")
        .eq("id", chatId)
        .single();

      if (data) setChat(data);
    };

    fetchChat();
  }, [chatId]);

  // メッセージ取得
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();
  }, [chatId]);

  // CTA表示トリガー
  useEffect(() => {
    if (!chatId) return;

    const hasShown =
      localStorage.getItem(`cta_${chatId}`) === "true";

    if (!hasShown) {
      // 条件を満たしたら表示
      if (
        messages.length >= 4 &&
        messages[messages.length - 1]?.role === "assistant"
      ) {
        setShowCTA(true);
        localStorage.setItem(`cta_${chatId}`, "true");
      }
    }
  }, [messages, chatId]);

  // メッセージ送信時にCTAを消す
  useEffect(() => {
    if (messages[messages.length - 1]?.role === "user") {
      setShowCTA(false);
    }
  }, [messages]);

  // 擬似ストリーミング
  const streamText = async (text: string) => {
    let current = "";

    for (let i = 0; i < text.length; i++) {
      current += text[i];
      setStreamingText(current);
      await new Promise((r) => setTimeout(r, 10));
    }
  };

  // 送信処理
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    const isFirstMessage = messages.length === 0;

    try {
      // ユーザーメッセージ保存
      const { data } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          role: "user",
          content: input,
        })
        .select()
        .single();

      if (!data) return;

      // ✅ Geminiを使わずタイトル設定
      if (isFirstMessage) {
        const title =
          input.length > 30
            ? input.slice(0, 30) + "..."
            : input;

        await supabase
          .from("chats")
          .update({ title })
          .eq("id", chatId);
      }

      const newMessages = [...messages, data];
      setMessages(newMessages);
      setInput("");

      // Gemini API呼び出し
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          type: chat?.type,
          category: chat?.category,
        }),
      });

      const aiText = await res.text();

      // 擬似ストリーミング
      await streamText(aiText);

      // AI返信保存
      const { data: aiData } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          role: "assistant",
          content: aiText,
        })
        .select()
        .single();

      if (aiData) {
        setMessages((prev) => [...prev, aiData]);
        setStreamingText("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatText = (text: string) => {
    return text.replace(/\n/g, "  \n");
  };

  const handleGenerateProblem = async () => {
    if (messages.length === 0) {
      alert("先にチャットで質問してください");
      return;
    }

    setIsError(false);
    setIsCreating(true);

    try {
      const res = await fetch("/api/generate-problem", {
        method: "POST",
        body: JSON.stringify({ messages, category: chat?.category ?? "free", topic: "free" }),
      });

      if (!res.ok) {
        throw new Error("生成失敗");
      }
      const data: ProblemResponse = await res.json();

      setProblem({
        ...data,
        category: chat?.category ?? undefined,
        source: "chat",
      });
    } catch (e) {
      console.error(e);
      setIsError(true);
    }

    setIsCreating(false);
    setActiveTab("practice");
  };

  return (
    <div className="flex flex-col md:flex-row h-full overflow-x-hidden">

      {/* タブ（モバイルのみ） */}
      <div className="md:hidden flex border-b mb-2">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 p-2 text-center ${
            activeTab === "chat"
              ? "border-b-2 border-blue-500 font-bold"
              : "text-gray-500"
          }`}
        >
          チャット
        </button>

        <button
          onClick={() => setActiveTab("practice")}
          className={`flex-1 p-2 text-center ${
            activeTab === "practice"
              ? "border-b-2 border-blue-500 font-bold"
              : "text-gray-500"
          }`}
        >
          問題
        </button>
      </div>

      {/* チャット */}
      <div
        className={`
          flex flex-col w-full md:w-1/2 min-w-0 border-r
          ${activeTab === "chat" ? "block" : "hidden md:flex"}
        `}
      >

        {/* タイトル */}
        {!chat ? (
          <h1 className="text-2xl font-bold ml-4 mb-4">
            読み込み中...
          </h1>
        ) : (
          <h1 className="text-2xl font-bold ml-4 mb-4">
            {chat.type === "free"
              ? "フリーチャット"
              : `${CATEGORY_LABELS[chat.category!] ?? chat.category}講師チャット`}
          </h1>
        )}


        {/* メッセージ */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className="w-full flex">
              {msg.role === "user" ? (
                // ✅ ユーザー：右寄せ
                <div className="ml-auto max-w-xl bg-blue-500 text-white p-3 rounded whitespace-pre-wrap">
                  {msg.content}
                </div>
              ) : (
                // ✅ AI：中央寄せ＋広く
                <div className="mx-auto w-full max-w-3xl min-w-0 wrap-break-word bg-gray-200 p-4 rounded leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      p: ({ children }) => <p className="mb-3">{children}</p>,
                      ul: ({ children }) => <ul className="mb-3 ml-6 list-disc">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-3 ml-6 list-decimal">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      h1: ({ children }) => <h1 className="text-xl font-bold mb-3">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                      code: ({ className, children }) => {
                        const isBlock = className?.includes("language-");

                        if (!isBlock) {
                          return (
                            <code className="bg-gray-300 px-1 rounded text-sm">
                              {children}
                            </code>
                          );
                        }

                        return (
                          <pre className="max-w-full overflow-x-auto text-white p-3 rounded my-2 text-sm">
                            <code className={`${className} wrap-break-word whitespace-pre-wrap`}>{children}</code>
                          </pre>
                        );
                      },
                    }}
                  >
                    {formatText(msg.content)}
                  </ReactMarkdown>
                </div>
              )}
            </div>        
          ))}

          {/* ストリーミング表示 */}
          {streamingText && (
            <div className="w-full flex">
              <div className="mx-auto w-full max-w-3xl bg-gray-200 p-4 rounded">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {formatText(streamingText)}
                </ReactMarkdown>
                <span className="inline-block w-2 animate-pulse">|</span>
              </div>
            </div>
          )}

          {showCTA && !problem && (
            <div className="w-full flex flex-col items-center mt-6 gap-2">
              <p className="text-sm text-gray-500">
                理解できたかチェックしてみましょう
              </p>

              <button
                onClick={() => {
                  handleGenerateProblem();
                  setShowCTA(false);
                }}
                disabled={isCreating || isLoading}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg shadow disabled:bg-gray-400 cursor-pointer"
              >
                この内容で問題を作る
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* 入力欄 */}
        <div className="border-t p-4 flex items-end gap-2">
          <textarea
            value={input}
            disabled={isLoading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = target.scrollHeight + "px";
            }}
            className="flex-1 min-w-0 border rounded-lg p-3 resize-none disabled:bg-gray-100"
            placeholder="メッセージを入力..."
            required
          />

          <button
            onClick={handleSend}
            disabled={isLoading || isCreating || !input}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded cursor-pointer disabled:bg-gray-400 disabled:cursor-default"
          >
            {isLoading ? "送信中..." : "送信"}
          </button>

          <button
            onClick={() => {
              handleGenerateProblem();
              setShowCTA(false);
            }}
            disabled={messages.length === 0 || isCreating || isLoading}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded cursor-pointer disabled:bg-gray-400 disabled:cursor-default"
          >
            {isCreating ? "生成中..." : "問題生成"}
          </button>
        </div>

      </div>

      {/* 問題 */}
      <div
        className={`
          w-full md:w-1/2 min-w-0
          ${activeTab === "practice" ? "block" : "hidden md:block"}
        `}
      >
        <Practice key={problem?.question} problem={problem} error={isError} creating={isCreating}/>
      </div>
    </div>
  );
}