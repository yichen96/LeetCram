export interface Example {
  input: string;
  output: string;
  explanation: string;
}

export interface MCQ {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface CodeBlock {
  id: string;
  code: string;
}

export interface CodePuzzleData {
  description: string;
  blocks: CodeBlock[];
  distractors?: CodeBlock[];
  correctOrder: (string | string[])[];
}

export interface Problem {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  examples: Example[];
  constraints: string[];
  mcq: MCQ[];
  codePuzzle: CodePuzzleData;
}

export interface SkillPath {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  problemIds: number[];
}

export interface UserProgress {
  classicCompleted: number[];
  questCompleted: number[];
  questXP: number;
  questStreak: number;
  lastQuestDate: string | null;
  skillPathProgress: Record<string, number[]>;
}

export type PageType = "home" | "classic" | "quest" | "skillpath" | "prompt";
export type ClassicPhase = "read" | "quiz" | "puzzle";
