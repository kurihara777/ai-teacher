"use client";

import { useEffect, useState } from "react";

type RecentAnswer = {
  question: string;
  category: string | null;
  topic: string | null;
  choices: { id: string; text: string }[];
  selected_answer: string;
  correct_answer: string;
  explanation: string;
  is_correct: boolean;
  created_at: string;
};

type Analytics = {
  accuracy: {
    total: number;
    correct: number;
    accuracy: number;
  };
  byCategory: {
    category: string;
    total: number;
    correct: number;
    accuracy: number;
  }[];
  weakTopics: {
    topic: string;
    total: number;
    correct: number;
    wrong: number;
  }[];
  recent: RecentAnswer[];
  practiceCount: {
    category: string;
    count: number;
  }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/analytics");
      const json = await res.json();
      setData(json);
    };

    fetchData();
  }, []);

  if (!data) return <div className="p-6">読み込み中...</div>;

  return (
    <div className="p-6 space-y-8">

      {/* タイトル */}
      <h1 className="text-2xl font-bold">学習ダッシュボード</h1>

      {/* ===== KPI ===== */}
      <div className="grid grid-cols-3 gap-4">
        <Card title="正答率" value={`${data.accuracy.accuracy}%`} />
        <Card title="総回答数" value={data.accuracy.total} />
        <Card title="正解数" value={data.accuracy.correct} />
      </div>

      {/* ===== カテゴリ別演習回数 ===== */}
      <div>
        <h2 className="font-bold mb-3">演習回数</h2>

        <div className="grid grid-cols-3 gap-4">
          {data.practiceCount.map((c) => (
            <div key={c.category} className="p-4 border rounded">
              <p className="font-semibold">{c.category}</p>
              <p className="text-xl font-bold">{c.count}回</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== カテゴリ別 ===== */}
      <div>
        <h2 className="font-bold mb-3">カテゴリ別正答率</h2>
        <div className="grid grid-cols-3 gap-4">
          {data.byCategory.map((c) => (
            <div key={c.category} className="p-4 border rounded">
              <p className="font-semibold">{c.category}</p>
              <p className="text-xl font-bold">{c.accuracy}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 苦手トピック ===== */}
      <div>
        <h2 className="font-bold mb-3">苦手トピック</h2>
        <div className="space-y-2">
          {data.weakTopics.map((t, i) => (
            <div
              key={i}
              className="flex justify-between p-3 border rounded"
            >
              <span>{t.topic}</span>
              <span className="text-red-500">
                ミス {t.wrong}/{t.total}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 履歴 ===== */}
      <div>
        <h2 className="font-bold mb-3">最近の回答</h2>
        
        <div className="space-y-4">
          {data.recent.map((r, i) => (
            <RecentCard key={i} data={r} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="p-4 border rounded shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function RecentCard({ data }: { data: RecentAnswer }) {
  const [open, setOpen] = useState(false);

  const isCorrect = data.is_correct;

  return (
    <div className="border rounded p-4 space-y-3">

      {/* ヘッダー */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">
            {data.category ?? "不明"} / {data.topic ?? "不明"}
          </p>
          <p className="font-medium">{data.question}</p>
        </div>

        <span
          className={`font-bold text-lg ${
            isCorrect ? "text-green-600" : "text-red-600"
          }`}
        >
          {isCorrect ? "○" : "×"}
        </span>
      </div>

      {/* 展開ボタン */}
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-blue-500"
      >
        {open ? "閉じる" : "詳細を見る"}
      </button>

      {/* 詳細 */}
      {open && (
        <div className="space-y-3">

          {/* 選択肢 */}
          <div className="space-y-2">
            {data.choices.map((c) => {
              let style = "p-2 rounded border text-sm";

              if (c.id === data.correct_answer) {
                style += " bg-green-100 border-green-400";
              } else if (c.id === data.selected_answer) {
                style += " bg-red-100 border-red-400";
              }

              return (
                <div key={c.id} className={style}>
                  {c.id}. {c.text}
                </div>
              );
            })}
          </div>

          {/* 回答情報 */}
          <div className="text-sm">
            <p>
              あなたの回答：{" "}
              <span className="font-semibold">
                {data.selected_answer}
              </span>
            </p>

            {!isCorrect && (
              <p className="text-red-500">
                正解：{data.correct_answer}
              </p>
            )}
          </div>

          {/* 解説 */}
          <div className="bg-gray-100 p-3 rounded text-sm">
            <p className="font-semibold mb-1">解説</p>
            <p>{data.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}