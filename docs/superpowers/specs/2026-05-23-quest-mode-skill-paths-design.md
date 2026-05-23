# LeetCram: Quest Mode + Skill Paths Design

**Date:** 2026-05-23  
**Status:** Approved → In Implementation

## Overview

Add two major features to LeetCram:
1. **Quest Mode** — line-by-line Python code reveal with prediction mechanic and XP gamification
2. **Skill Paths** — RPG-style categorized problem sets training specific CS skills
3. **Session Progress** — localStorage-persisted progress (no auth)
4. **Rename existing flow** to "Classic"

## Architecture

Split the monolithic `leetcode-app.tsx` (1,419 lines) into focused modules:

```
src/
  types.ts              — All TypeScript interfaces
  skill-paths.ts        — Skill path config + XP/level system
  progress.ts           — localStorage progress management
  components/
    ui.tsx              — Shared: Icons, DiffBadge, Timer, Modal, markdown renderer
    ClassicMode.tsx     — ProblemView, MCQPhase, CodePuzzle (extracted)
    QuestMode.tsx       — Line-by-line reveal + prediction + XP
    SkillPaths.tsx      — Skill path grid + RPG node path view
    Home.tsx            — Home screen with mode selector + paths
leetcode-app.tsx        — Main App shell (~200 lines, imports above)
```

## Feature Specs

### Classic Mode (existing, renamed)
- Existing read → MCQ quiz → code puzzle flow
- "Classic" label in UI
- Completed problems tracked in `classicCompleted[]` in localStorage

### Quest Mode
**Mechanic:** Predict-and-choose — before each line is revealed, user taps the correct next line from 4 options (correct + 3 distractors).

**Visual per line:**
- Code builds up line-by-line with syntax highlighting
- Example input/output always visible at top
- Line annotation badge (type: loop/condition/assign/return/def) + description
- XP flash animation on correct answer

**XP System:**
- Correct first try: +30 XP
- Correct after seeing distractors: +10 XP
- Problem completion bonus: +100 XP
- Streak multiplier: consecutive corrects × 1.5×
- Levels: 1→10 based on XP thresholds [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000]

**Data:** Uses existing `codePuzzle.blocks`, `distractors`, `correctOrder` — no new JSON fields needed for MVP.

### Skill Paths (10 paths)
| Path | Icon | Problems |
|------|------|----------|
| Arrays & Hashing | 🗂️ | 1, 49, 128, 169, 238, 347, 560 |
| Two Pointers | 👆 | 11, 15, 75, 283, 763 |
| Sliding Window | 🪟 | 3, 76, 239, 438 |
| Stack & Queue | 📚 | 20, 32, 84, 155, 394, 739 |
| Binary Search | 🔍 | 4, 33, 34, 35, 74, 240 |
| Linked Lists | 🔗 | 2, 19, 21, 23, 24, 25, 141, 142, 148, 160, 206, 234 |
| Trees & BST | 🌳 | 108, 114, 124, 199, 226, 230, 236, 437, 543 |
| Graphs & BFS | 🕸️ | 200, 207, 994 |
| Dynamic Programming | 🧮 | 45, 55, 62, 64, 70, 72, 139, 152, 198, 279, 300, 322, 416 |
| Backtracking | 🔄 | 22, 39, 46, 51, 78, 79, 131 |

Each path shows as a vertical RPG node chain. Problems show as: locked (no attempts), available, completed (glowing).

### Session Progress (localStorage)
Key: `leetcram-progress`
```typescript
interface UserProgress {
  classicCompleted: number[];  // problem IDs
  questCompleted: number[];    // problem IDs
  questXP: number;
  questStreak: number;
  lastQuestDate: string | null;
  skillPathProgress: Record<string, number[]>; // path id → completed problem IDs
}
```

## Mobile-First Constraints
- All touch targets ≥ 44px
- Quest choice buttons: full-width, stacked
- Skill path nodes: scrollable vertical chain
- Desktop: max-width 720px centered, 2-column grids where appropriate
