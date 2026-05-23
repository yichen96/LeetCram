import type { UserProgress } from "./types";

const PROGRESS_KEY = "leetcram-progress";

const DEFAULT_PROGRESS: UserProgress = {
  classicCompleted: [],
  questCompleted: [],
  questXP: 0,
  questStreak: 0,
  lastQuestDate: null,
  skillPathProgress: {},
};

export function loadProgress(): UserProgress {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (saved) {
      return { ...DEFAULT_PROGRESS, ...JSON.parse(saved) };
    }
  } catch { /* silent */ }
  return { ...DEFAULT_PROGRESS };
}

export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch { /* silent */ }
}

export function markClassicComplete(progress: UserProgress, problemId: number): UserProgress {
  if (progress.classicCompleted.includes(problemId)) return progress;
  return { ...progress, classicCompleted: [...progress.classicCompleted, problemId] };
}

export function markQuestComplete(progress: UserProgress, problemId: number, xpEarned: number): UserProgress {
  const questCompleted = progress.questCompleted.includes(problemId)
    ? progress.questCompleted
    : [...progress.questCompleted, problemId];
  return { ...progress, questCompleted, questXP: progress.questXP + xpEarned, lastQuestDate: new Date().toISOString() };
}

export function markSkillPathComplete(progress: UserProgress, pathId: string, problemId: number): UserProgress {
  const current = progress.skillPathProgress[pathId] ?? [];
  if (current.includes(problemId)) return progress;
  return {
    ...progress,
    skillPathProgress: { ...progress.skillPathProgress, [pathId]: [...current, problemId] },
  };
}
