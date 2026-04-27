export type Choice = {
  id: string;
  text: string;
};

// APIレスポンス
export type ProblemResponse = {
  id: string;
  question: string;
  choices: Choice[];
};

// UIで使う型
export type Problem = ProblemResponse & {
  category?: string;
  topic?: string;
  source?: "chat" | "practice";
};