import type { Problem } from "../types";
import type { SkillPath } from "../types";
import { DiffBadge, Icons } from "./ui";

interface SkillPathCardProps {
  path: SkillPath;
  problems: Problem[];
  completedIds: number[];
  onClick: () => void;
}

export function SkillPathCard({ path, problems, completedIds, onClick }: SkillPathCardProps) {
  const available = problems.filter((p) => path.problemIds.includes(p.id));
  const completed = available.filter((p) => completedIds.includes(p.id)).length;
  const pct = available.length > 0 ? (completed / available.length) * 100 : 0;
  const isComplete = available.length > 0 && completed === available.length;

  return (
    <button
      onClick={onClick}
      style={{ background: isComplete ? path.color + "12" : "#0c1222", border: `1.5px solid ${isComplete ? path.color + "60" : "#1e293b"}`, borderRadius: 14, padding: "16px", textAlign: "left", cursor: "pointer", transition: "all 0.15s", color: "#f1f5f9", width: "100%" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: path.color + "20", display: "flex", alignItems: "center", justifyContent: "center", color: path.color, fontWeight: 800, fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, letterSpacing: "-0.02em" }}>{path.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: isComplete ? path.color : "#f1f5f9" }}>{path.name}</div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 1 }}>{path.description}</div>
        </div>
        {isComplete && <span style={{ color: path.color, fontSize: "1rem" }}>✓</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 4, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: path.color, borderRadius: 4, transition: "width 0.5s ease" }} />
        </div>
        <span style={{ color: "#64748b", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace", minWidth: 36, textAlign: "right" }}>{completed}/{available.length}</span>
      </div>
    </button>
  );
}

interface SkillPathViewProps {
  path: SkillPath;
  problems: Problem[];
  completedIds: number[];
  onSelectProblem: (problem: Problem) => void;
  onBack: () => void;
}

export function SkillPathView({ path, problems, completedIds, onSelectProblem, onBack }: SkillPathViewProps) {
  const pathProblems = path.problemIds
    .map((id) => problems.find((p) => p.id === id))
    .filter(Boolean) as Problem[];

  const completed = pathProblems.filter((p) => completedIds.includes(p.id)).length;
  const pct = pathProblems.length > 0 ? Math.round((completed / pathProblems.length) * 100) : 0;

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: 4 }}>
          {Icons.back}
        </button>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: path.color + "20", display: "flex", alignItems: "center", justifyContent: "center", color: path.color, fontWeight: 800, fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{path.icon}</span>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "#f1f5f9" }}>{path.name}</h2>
          <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{path.description}</div>
        </div>
      </div>

      {/* Path progress */}
      <div style={{ background: "#0c1222", border: `1px solid ${path.color}30`, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ color: path.color, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Path Progress</span>
          <span style={{ color: path.color, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", fontWeight: 700 }}>{pct}%</span>
        </div>
        <div style={{ height: 6, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${path.color}80, ${path.color})`, borderRadius: 4, transition: "width 0.8s ease" }} />
        </div>
        <div style={{ color: "#64748b", fontSize: "0.7rem", marginTop: 6 }}>{completed} of {pathProblems.length} problems completed</div>
      </div>

      {/* RPG Node Path */}
      <div style={{ position: "relative" }}>
        {/* Vertical connector */}
        {pathProblems.length > 1 && (
          <div style={{ position: "absolute", left: 19, top: 28, bottom: 28, width: 2, background: "#1e293b", zIndex: 0 }} />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pathProblems.map((problem, idx) => {
            const isCompleted = completedIds.includes(problem.id);
            const isUnlocked = idx === 0 || completedIds.includes(pathProblems[idx - 1]?.id ?? -1);
            const isNext = !isCompleted && isUnlocked;

            const nodeTextColor = isCompleted ? "#fff" : isNext ? "#0f172a" : "#64748b";

            return (
              <button
                key={problem.id}
                onClick={() => isUnlocked ? onSelectProblem(problem) : undefined}
                disabled={!isUnlocked}
                style={{ display: "flex", alignItems: "center", gap: 14, background: isCompleted ? "#22c55e0a" : isNext ? path.color + "10" : "transparent", border: `1.5px solid ${isCompleted ? "#22c55e30" : isNext ? path.color + "40" : "#1e293b"}`, borderRadius: 12, padding: "12px 14px", cursor: isUnlocked ? "pointer" : "default", textAlign: "left", transition: "all 0.2s", position: "relative", zIndex: 1 }}
              >
                {/* Node circle */}
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: isCompleted ? "#22c55e" : isNext ? path.color : "#1e293b", border: `2px solid ${isCompleted ? "#22c55e" : isNext ? path.color : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: isNext ? `0 0 16px ${path.color}60` : "none", transition: "all 0.3s" }}>
                  {isCompleted ? (
                    <span style={{ color: "#fff", fontSize: "1rem" }}>✓</span>
                  ) : isUnlocked ? (
                    <span style={{ color: nodeTextColor, fontSize: "0.75rem", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{idx + 1}</span>
                  ) : (
                    <span style={{ color: "#64748b", display: "flex" }}>{Icons.lock}</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: isCompleted ? "#22c55e" : isNext ? "#f1f5f9" : "#475569", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {problem.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>#{problem.id}</span>
                    <DiffBadge d={problem.difficulty} />
                    {isCompleted && <span style={{ fontSize: "0.65rem", color: "#22c55e", fontWeight: 600 }}>Completed</span>}
                    {isNext && <span style={{ fontSize: "0.65rem", color: path.color, fontWeight: 600, animation: "pulse 2s infinite" }}>Ready</span>}
                    {!isUnlocked && <span style={{ fontSize: "0.65rem", color: "#475569" }}>Complete previous first</span>}
                  </div>
                </div>

                {isUnlocked && !isCompleted && (
                  <div style={{ color: path.color, display: "flex", flexShrink: 0 }}>{Icons.arrow}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {pathProblems.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#475569", fontSize: "0.85rem" }}>
          No problems available for this path yet.
        </div>
      )}
    </div>
  );
}
