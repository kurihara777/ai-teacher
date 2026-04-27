"use client";

import { useState, useEffect } from "react";
import type { Problem } from "@/types/problem";

type JudgeResult = {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
};

export default function Practice({
  problem,
  error,
  creating,
}: {
  problem: Problem | null;
  error: boolean;
  creating: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<JudgeResult | null>(null);

  // 新しい問題が来たら状態リセット
  useEffect(() => {
    setSelected(null);
    setIsAnswered(false);
    setIsSubmitting(false);
    setResult(null);
  }, [problem?.id]);

  if (creating) {
    return (
      <div className="p-6 text-gray-500">
        問題を生成中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        問題生成に失敗しました（時間をおいて再試行してください）
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="p-6 text-gray-500">
        問題を生成してください
      </div>
    );
  }

  const handleSelect = (id: string) => {
    if (isAnswered) return;
    setSelected(id);
  };

  const handleSubmit = async () => {
    if (!selected || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/submit-answer", {
        method: "POST",
        body: JSON.stringify({
          problemId: problem.id,
          selectedAnswer: selected,
        }),
      });

      if (!res.ok) {
        throw new Error("採点失敗");
      }

      const data: JudgeResult = await res.json();

      setResult(data);
      setIsAnswered(true);
    } catch (e) {
      console.error(e);
      alert("採点に失敗しました");
    }

    setIsSubmitting(false);
  };

  const isCorrect = result?.isCorrect;

  return (
    <div className="p-6 flex flex-col h-full">
      {/* 問題 */}
      <h2 className="text-lg font-bold mb-4">
        {problem.question}
      </h2>

      {/* 選択肢 */}
      <div className="space-y-2">
        {problem.choices.map((choice) => {
          let base =
            "w-full text-left p-3 rounded border transition";

          // 未回答
          if (!isAnswered) {
            base +=
              selected === choice.id
                ? " bg-blue-100 border-blue-400"
                : " hover:bg-gray-100";
          }

          // 回答後（サーバー採点結果反映）
          if (isAnswered && result) {
            if (choice.id === result.correctAnswer) {
              base += " bg-green-200 border-green-500";
            } else if (choice.id === selected) {
              base += " bg-red-200 border-red-500";
            } else {
              base += " opacity-60";
            }
          }

          return (
            <button
              key={choice.id}
              onClick={() => handleSelect(choice.id)}
              className={base}
            >
              {choice.id}. {choice.text}
            </button>
          );
        })}
      </div>

      {/* ボタン or 結果 */}
      {!isAnswered ? (
        <button
          onClick={handleSubmit}
          disabled={!selected || isSubmitting}
          className="mt-4 bg-blue-500 text-white py-2 rounded disabled:bg-gray-400"
        >
          {isSubmitting ? "採点中..." : "回答する"}
        </button>
      ) : (
        <div className="mt-4 space-y-4">
          {/* 結果 */}
          <div
            className={`font-bold text-lg ${
              isCorrect ? "text-green-600" : "text-red-600"
            }`}
          >
            {isCorrect ? "正解！" : "不正解"}
          </div>

          {/* 解説 */}
          <div className="bg-gray-100 p-4 rounded">
            <p className="font-semibold mb-2">解説</p>
            <p>{result?.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}