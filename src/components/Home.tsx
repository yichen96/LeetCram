import { useState } from "react";
import type { Problem, SkillPath, UserProgress } from "../types";
import { SKILL_PATHS, getLevel, getXPForNextLevel, getXPForCurrentLevel } from "../skill-paths";
import { DiffBadge, Icons, btnPrimary } from "./ui";
import { SkillPathCard } from "./SkillPaths";

type DifficultyFilter = "All" | "Easy" | "Medium" | "Hard";
type HomeTab = "paths" | "classic";

interface HomeProps {
  problems: Problem[];
  progress: UserProgress;
  onStartClassic: (problem: Problem) => void;
  onStartQuest: (problem: Problem) => void;
  onOpenSkillPath: (path: SkillPath) => void;
  onImport: () => void;
  onReset: () => void;
}

export function Home({ problems, progress, onStartClassic, onStartQuest, onOpenSkillPath, onImport, onReset }: HomeProps) {
  const [tab, setTab] = useState<HomeTab>("paths");
  const [diffFilter, setDiffFilter] = useState<DifficultyFilter>("All");
  const [numberInput, setNumberInput] = useState("");
  const [mode, setMode] = useState<"classic" | "quest">("classic");

  const level = getLevel(progress.questXP);
  const xpForNext = getXPForNextLevel(level);
  const xpForCurrent = getXPForCurrentLevel(level);
  const xpInLevel = progress.questXP - xpForCurrent;
  const xpNeeded = xpForNext - xpForCurrent;
  const levelPct = xpNeeded > 0 ? (xpInLevel / xpNeeded) * 100 : 100;

  const filteredProblems = diffFilter === "All" ? problems : problems.filter((p) => p.difficulty === diffFilter);

  const handleNumberGo = () => {
    const num = parseInt(numberInput.trim());
    if (!num) return;
    const p = problems.find((pr) => pr.id === num);
    if (p) {
      mode === "classic" ? onStartClassic(p) : onStartQuest(p);
      setNumberInput("");
    }
  };

  const allCompletedIds = [
    ...new Set([...progress.classicCompleted, ...progress.questCompleted]),
  ];

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      {/* XP Level Bar */}
      {progress.questXP > 0 && (
        <div style={{ background: "#0c1222", border: "1px solid #1e293b", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "0.85rem", color: "#0f172a" }}>L{level}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#f1f5f9", fontSize: "0.75rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Quest Level {level}</span>
              <span style={{ color: "#64748b", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace" }}>{progress.questXP} XP</span>
            </div>
            <div style={{ height: 4, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${levelPct}%`, height: "100%", background: `linear-gradient(90deg, #f59e0b, #fbbf24)`, borderRadius: 4, transition: "width 0.5s ease" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#f59e0b" }}>
            {Icons.zap}
            <span style={{ fontSize: "0.7rem", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{progress.questCompleted.length} solved</span>
          </div>
        </div>
      )}

      {/* Mode Selector */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setMode("classic")}
          style={{ background: mode === "classic" ? "#f59e0b18" : "#0c1222", border: `1.5px solid ${mode === "classic" ? "#f59e0b60" : "#1e293b"}`, borderRadius: 14, padding: "16px 12px", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 8, background: mode === "classic" ? "#f59e0b20" : "#1e293b", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 6, color: mode === "classic" ? "#f59e0b" : "#64748b" }}>{Icons.map}</div>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: mode === "classic" ? "#f59e0b" : "#f1f5f9", marginBottom: 2 }}>Classic</div>
          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Read → MCQ → Puzzle</div>
          {progress.classicCompleted.length > 0 && (
            <div style={{ marginTop: 6, fontSize: "0.65rem", color: "#22c55e" }}>{progress.classicCompleted.length} completed</div>
          )}
        </button>
        <button
          onClick={() => setMode("quest")}
          style={{ background: mode === "quest" ? "#a78bfa18" : "#0c1222", border: `1.5px solid ${mode === "quest" ? "#a78bfa60" : "#1e293b"}`, borderRadius: 14, padding: "16px 12px", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 8, background: mode === "quest" ? "#a78bfa20" : "#1e293b", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 6, color: mode === "quest" ? "#a78bfa" : "#64748b" }}>{Icons.zap}</div>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: mode === "quest" ? "#a78bfa" : "#f1f5f9", marginBottom: 2 }}>Quest</div>
          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Line-by-line reveal + XP</div>
          {progress.questCompleted.length > 0 && (
            <div style={{ marginTop: 6, fontSize: "0.65rem", color: "#a78bfa" }}>{progress.questCompleted.length} completed · {progress.questXP} XP</div>
          )}
        </button>
      </div>

      {/* Tab: Skill Paths vs All Problems */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#0c1222", border: "1px solid #1e293b", borderRadius: 10, padding: 4 }}>
        {(["paths", "classic"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "none", background: tab === t ? "#1e293b" : "transparent", color: tab === t ? "#f1f5f9" : "#64748b", fontSize: "0.8rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            {t === "paths" ? <>{Icons.map} Skill Paths</> : <>{Icons.trophy} All Problems</>}
          </button>
        ))}
      </div>

      {tab === "paths" && (
        <div>
          <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            Train by Skill — {SKILL_PATHS.length} paths
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {SKILL_PATHS.map((path) => (
              <SkillPathCard
                key={path.id}
                path={path}
                problems={problems}
                completedIds={allCompletedIds}
                onClick={() => onOpenSkillPath(path)}
              />
            ))}
          </div>
        </div>
      )}

      {tab === "classic" && (
        <div>
          {/* Number search */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              type="number"
              placeholder="Jump to problem #"
              value={numberInput}
              onChange={(e) => setNumberInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNumberGo()}
              style={{ flex: 1, background: "#0c1222", border: "1.5px solid #1e293b", borderRadius: 10, color: "#f1f5f9", padding: "10px 14px", fontSize: "0.9rem", fontFamily: "'JetBrains Mono', monospace" }}
            />
            <button onClick={handleNumberGo} style={btnPrimary}>Go</button>
          </div>

          {/* Difficulty filter */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {(["All", "Easy", "Medium", "Hard"] as const).map((d) => {
              const active = diffFilter === d;
              const color = d === "Easy" ? "#22c55e" : d === "Medium" ? "#f59e0b" : d === "Hard" ? "#ef4444" : "#94a3b8";
              return (
                <button
                  key={d}
                  onClick={() => setDiffFilter(d)}
                  style={{ flex: 1, padding: "6px 0", background: active ? color + "18" : "transparent", border: `1.5px solid ${active ? color + "60" : "#1e293b"}`, borderRadius: 8, color: active ? color : "#64748b", fontSize: "0.72rem", fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "all 0.15s" }}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Problem count + reset */}
          <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{filteredProblems.length}{diffFilter !== "All" ? ` ${diffFilter}` : ""} Problems</span>
            <button onClick={onReset} style={{ background: "none", border: "none", color: "#ef444480", fontSize: "0.65rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Clear All</button>
          </div>

          {filteredProblems.length === 0 && problems.length === 0 && (
            <button
              onClick={onImport}
              style={{ width: "100%", padding: "28px 16px", background: "#0c1222", border: "2px dashed #334155", borderRadius: 14, color: "#94a3b8", fontSize: "0.85rem", cursor: "pointer", textAlign: "center", marginBottom: 12 }}
            >
              <span style={{ fontWeight: 600, color: "#f59e0b" }}>Import your first problems</span>
            </button>
          )}

          {/* Problem grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredProblems.map((p) => {
              const classicDone = progress.classicCompleted.includes(p.id);
              const questDone = progress.questCompleted.includes(p.id);
              return (
                <div key={p.id} style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => onStartClassic(p)}
                    style={{ flex: 1, background: classicDone ? "#22c55e0a" : "#0c1222", border: `1.5px solid ${classicDone ? "#22c55e30" : "#1e293b"}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s", color: "#f1f5f9" }}
                  >
                    {classicDone && <span style={{ color: "#22c55e", fontSize: "0.8rem" }}>✓</span>}
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", color: "#64748b", minWidth: 30 }}>#{p.id}</span>
                    <span style={{ flex: 1, fontSize: "0.88rem", fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: classicDone ? "#22c55e" : "#f1f5f9" }}>{p.title}</span>
                    <DiffBadge d={p.difficulty} />
                  </button>
                  <button
                    onClick={() => onStartQuest(p)}
                    title="Quest mode"
                    style={{ width: 44, height: 44, minWidth: 44, background: questDone ? "#a78bfa18" : "#0c1222", border: `1.5px solid ${questDone ? "#a78bfa40" : "#1e293b"}`, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: questDone ? "#a78bfa" : "#334155", transition: "all 0.15s", alignSelf: "center" }}
                  >
                    {Icons.zap}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
