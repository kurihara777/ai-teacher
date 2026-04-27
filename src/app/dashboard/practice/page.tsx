"use client";

import { useState } from "react";
import Practice from "@/components/Practice";
import type { ProblemResponse, Problem } from "@/types/problem";

export default function PracticePage() {
  const [category, setCategory] = useState("react");
  const [topic, setTopic] = useState("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(false);

  const handleGenerate = async () => {
    setCreating(true);
    setError(false);

    try {
      const res = await fetch("/api/generate-problem", {
        method: "POST",
        body: JSON.stringify({ category, topic }),
      });

      if (!res.ok) throw new Error();

      const data: ProblemResponse = await res.json();
      setProblem({
        ...data,
        category,
        topic,
        source: "practice",
      });
    } catch {
      setError(true);
    }

    setCreating(false);
  };

  return (
    <div className="flex h-full">
      {/* 左：入力 */}
      <div className="w-1/2 p-6 border-r space-y-4">
        <h1 className="text-2xl font-bold">問題演習</h1>

        <h2 className="text-xl mt-2">カテゴリ選択</h2>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="react">React</option>
          <option value="html_css">HTML/CSS</option>
          <option value="javascript">JavaScript</option>
        </select>

        <h2 className="text-xl mt-2">出題分野</h2>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="例：useEffect / Flexbox / closure"
          className="border p-2 w-full"
          required
        />

        <button
          onClick={handleGenerate}
          disabled={!topic || creating}
          className="bg-green-600 hover:bg-green-500 text-white mt-4 px-4 py-2 rounded cursor-pointer disabled:bg-gray-400 disabled:cursor-default"
        >
          {creating ? "生成中..." : "問題生成"}
        </button>
      </div>

      {/* 右：問題 */}
      <div className="w-1/2">
        <Practice
          problem={problem}
          creating={creating}
          error={error}
        />
      </div>
    </div>
  );
}