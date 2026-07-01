import type { SkillPath } from "./types";

export const SKILL_PATHS: SkillPath[] = [
  {
    id: "arrays",
    name: "Arrays & Hashing",
    icon: "AH",
    color: "#f59e0b",
    description: "Master hash maps and array manipulation",
    problemIds: [1, 136, 169, 128, 238, 347, 49, 560],
  },
  {
    id: "twoptr",
    name: "Two Pointers",
    icon: "2P",
    color: "#22c55e",
    description: "Solve with two moving indices",
    problemIds: [283, 75, 11, 763, 15],
  },
  {
    id: "sliding",
    name: "Sliding Window",
    icon: "SW",
    color: "#06b6d4",
    description: "Dynamic window techniques",
    problemIds: [3, 438, 560, 76, 239],
  },
  {
    id: "stack",
    name: "Stack & Queue",
    icon: "SQ",
    color: "#a78bfa",
    description: "LIFO/FIFO data structures",
    problemIds: [20, 155, 394, 739, 84, 32],
  },
  {
    id: "bsearch",
    name: "Binary Search",
    icon: "BS",
    color: "#fb7185",
    description: "Divide and conquer search",
    problemIds: [35, 34, 33, 74, 240, 4],
  },
  {
    id: "linked",
    name: "Linked Lists",
    icon: "LL",
    color: "#34d399",
    description: "Pointer manipulation and traversal",
    problemIds: [206, 21, 141, 234, 142, 160, 2, 19, 24, 148, 23, 25],
  },
  {
    id: "trees",
    name: "Trees & BST",
    icon: "TR",
    color: "#4ade80",
    description: "Recursive tree algorithms",
    problemIds: [226, 543, 199, 437, 108, 230, 236, 114, 124],
  },
  {
    id: "graphs",
    name: "Graphs & BFS",
    icon: "GR",
    color: "#f97316",
    description: "Graph traversal and connectivity",
    problemIds: [200, 994, 207],
  },
  {
    id: "dp",
    name: "Dynamic Programming",
    icon: "DP",
    color: "#e879f9",
    description: "Optimal substructure and memoization",
    problemIds: [70, 198, 55, 45, 322, 279, 62, 64, 300, 152, 139, 416, 72],
  },
  {
    id: "backtrack",
    name: "Backtracking",
    icon: "BT",
    color: "#facc15",
    description: "Explore all possibilities systematically",
    problemIds: [78, 46, 39, 131, 22, 79, 51],
  },
  {
    id: "sql-select",
    name: "SQL: Select & Filter",
    icon: "SL",
    color: "#38bdf8",
    description: "PostgreSQL WHERE, DISTINCT, and NULL handling",
    problemIds: [595, 1757, 584, 1148],
  },
  {
    id: "sql-joins",
    name: "SQL: Joins & Aggregation",
    icon: "JN",
    color: "#818cf8",
    description: "PostgreSQL JOINs, GROUP BY, and HAVING",
    problemIds: [175, 183, 197, 182],
  },
  {
    id: "pandas-basics",
    name: "Pandas: Basics",
    icon: "PD",
    color: "#2dd4bf",
    description: "Create, inspect, and select DataFrame data",
    problemIds: [2877, 2878, 2879, 2880],
  },
  {
    id: "pandas-clean",
    name: "Pandas: Clean & Reshape",
    icon: "PC",
    color: "#f472b6",
    description: "Drop duplicates, handle missing data, rename columns",
    problemIds: [2882, 2883, 2885, 2887],
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
