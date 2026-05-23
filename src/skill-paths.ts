import type { SkillPath } from "./types";

export const SKILL_PATHS: SkillPath[] = [
  {
    id: "arrays",
    name: "Arrays & Hashing",
    icon: "AH",
    color: "#f59e0b",
    description: "Master hash maps and array manipulation",
    problemIds: [1, 49, 128, 136, 169, 238, 347, 560],
  },
  {
    id: "twoptr",
    name: "Two Pointers",
    icon: "2P",
    color: "#22c55e",
    description: "Solve with two moving indices",
    problemIds: [11, 15, 75, 283, 763],
  },
  {
    id: "sliding",
    name: "Sliding Window",
    icon: "SW",
    color: "#06b6d4",
    description: "Dynamic window techniques",
    problemIds: [3, 76, 239, 438, 560],
  },
  {
    id: "stack",
    name: "Stack & Queue",
    icon: "SQ",
    color: "#a78bfa",
    description: "LIFO/FIFO data structures",
    problemIds: [20, 32, 84, 155, 394, 739],
  },
  {
    id: "bsearch",
    name: "Binary Search",
    icon: "BS",
    color: "#fb7185",
    description: "Divide and conquer search",
    problemIds: [4, 33, 34, 35, 74, 240],
  },
  {
    id: "linked",
    name: "Linked Lists",
    icon: "LL",
    color: "#34d399",
    description: "Pointer manipulation and traversal",
    problemIds: [2, 19, 21, 23, 24, 25, 141, 142, 148, 160, 206, 234],
  },
  {
    id: "trees",
    name: "Trees & BST",
    icon: "TR",
    color: "#4ade80",
    description: "Recursive tree algorithms",
    problemIds: [108, 114, 124, 199, 226, 230, 236, 437, 543],
  },
  {
    id: "graphs",
    name: "Graphs & BFS",
    icon: "GR",
    color: "#f97316",
    description: "Graph traversal and connectivity",
    problemIds: [200, 207, 994],
  },
  {
    id: "dp",
    name: "Dynamic Programming",
    icon: "DP",
    color: "#e879f9",
    description: "Optimal substructure and memoization",
    problemIds: [45, 55, 62, 64, 70, 72, 139, 152, 198, 279, 300, 322, 416],
  },
  {
    id: "backtrack",
    name: "Backtracking",
    icon: "BT",
    color: "#facc15",
    description: "Explore all possibilities systematically",
    problemIds: [22, 39, 46, 51, 78, 79, 131],
  },
];

const XP_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];

export function getLevel(xp: number): number {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, XP_THRESHOLDS.length);
}

export function getXPForNextLevel(level: number): number {
  return XP_THRESHOLDS[level] ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
}

export function getXPForCurrentLevel(level: number): number {
  return XP_THRESHOLDS[level - 1] ?? 0;
}
