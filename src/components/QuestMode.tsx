import { useState, useMemo } from "react";
import type { Problem, CodeBlock } from "../types";
import { DiffBadge, Icons, btnPrimary } from "./ui";

// --- LINE ANNOTATION ---
type LineType = "def" | "assign" | "loop" | "condition" | "return" | "call" | "comment";

interface LineAnnotation {
  type: LineType;
  label: string;
  detail: string;
  color: string;
}

function annotateCodeLine(code: string): LineAnnotation {
  const t = code.trim();

  if (t.startsWith("def ")) {
    const name = t.match(/def (\w+)/)?.[1] ?? "function";
    const params = t.match(/\(([^)]*)\)/)?.[1] ?? "";
    return { type: "def", label: "Define function", detail: `${name}(${params})`, color: "#a78bfa" };
  }
  if (t.startsWith("return ")) {
    const val = t.replace(/^return\s*/, "");
    return { type: "return", label: "Return", detail: val || "result", color: "#34d399" };
  }
  if (t.startsWith("for ")) {
    const body = t.replace(/^for\s+/, "").replace(/:$/, "");
    return { type: "loop", label: "For each", detail: body, color: "#f59e0b" };
  }
  if (t.startsWith("while ")) {
    const cond = t.replace(/^while\s+/, "").replace(/:$/, "");
    return { type: "loop", label: "While", detail: cond, color: "#f59e0b" };
  }
  if (t.startsWith("if ") || t.startsWith("elif ")) {
    const cond = t.replace(/^(if|elif)\s+/, "").replace(/:$/, "");
    return { type: "condition", label: "If", detail: cond, color: "#fb7185" };
  }
  if (t === "else:") {
    return { type: "condition", label: "Else", detail: "otherwise", color: "#fb7185" };
  }
  if (t.startsWith("#")) {
    return { type: "comment", label: "Comment", detail: t.replace(/^#+\s*/, ""), color: "#64748b" };
  }
  if (t.match(/^\w[\w\[\].]*\s*=/)) {
    const parts = t.split("=");
    const varName = parts[0].trim();
    const val = parts.slice(1).join("=").trim();
    return { type: "assign", label: "Assign", detail: `${varName} = ${val}`, color: "#06b6d4" };
  }
  if (t.includes(".append(") || t.includes(".add(") || t.includes(".push(")) {
    return { type: "call", label: "Add", detail: t.trim(), color: "#22c55e" };
  }
  if (t.includes(".pop(") || t.includes(".remove(")) {
    return { type: "call", label: "Remove", detail: t.trim(), color: "#fb7185" };
  }
  return { type: "call", label: "Execute", detail: t, color: "#94a3b8" };
}

// --- DATA TRACE VISUALIZER ---
interface TraceState {
  variables: { name: string; value: string; isNew: boolean }[];
}

function buildTraceUpTo(lines: string[], upToIdx: number): TraceState {
  if (upToIdx < 0) return { variables: [] };
  const vars: Record<string, string> = {};
  const newKeys = new Set<string>();
  const lastLine = lines[upToIdx] ?? "";

  for (let i = 0; i <= upToIdx; i++) {
    const t = lines[i].trim();
    const assignMatch = t.match(/^(\w+)\s*=\s*(.+)$/);
    if (assignMatch && !t.startsWith("def") && !t.startsWith("return") && !t.startsWith("if ") && !t.startsWith("for ") && !t.startsWith("while ")) {
      const prev = vars[assignMatch[1]];
      vars[assignMatch[1]] = assignMatch[2];
      if (i === upToIdx && prev !== assignMatch[2]) newKeys.add(assignMatch[1]);
    }
    const updateMatch = t.match(/^(\w+)\[(.+)\]\s*=\s*(.+)$/);
    if (updateMatch) {
      const keyName = `${updateMatch[1]}[...]`;
      vars[keyName] = updateMatch[3];
      if (i === upToIdx) newKeys.add(keyName);
    }
  }

  // Ignore `self` variable
  delete vars["self"];

  const ann = annotateCodeLine(lastLine);

  return {
    variables: Object.entries(vars)
      .filter(([k]) => k !== "self")
      .map(([name, value]) => ({ name, value, isNew: newKeys.has(name) }))
      .concat(ann.type === "return" ? [{ name: "→ returns", value: ann.detail, isNew: true }] : []),
  };
}

// --- QUEST STEP BUILDER ---
interface QuestStep {
  correctLine: string;
  choices: string[];
  correctIdx: number;
  annotation: LineAnnotation;
}

function buildQuestSteps(problem: Problem): QuestStep[] {
  const { blocks, distractors = [], correctOrder } = problem.codePuzzle;

  const correctLines: CodeBlock[] = correctOrder
    .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
    .map((id) => blocks.find((b) => b.id === id))
    .filter(Boolean) as CodeBlock[];

  const distractorCodes = distractors.map((d) => d.code);

  return correctLines.map((correctBlock, lineIdx) => {
    const wrongPool = [
      ...distractorCodes,
      ...correctLines.filter((_, i) => i !== lineIdx).map((b) => b.code),
    ].filter((c) => c !== correctBlock.code);

    const shuffledWrong = wrongPool.sort(() => Math.random() - 0.5).slice(0, 3);
    const choices = [correctBlock.code, ...shuffledWrong].sort(() => Math.random() - 0.5);
    const correctIdx = choices.indexOf(correctBlock.code);

    return {
      correctLine: correctBlock.code,
      choices,
      correctIdx,
      annotation: annotateCodeLine(correctBlock.code),
    };
  });
}

// --- XP FLASH ---
function XPFlash({ xp, visible }: { xp: number; visible: boolean }) {
  return (
    <div style={{ position: "fixed", top: 80, right: 20, zIndex: 999, opacity: visible ? 1 : 0, transform: visible ? "translateY(0) scale(1)" : "translateY(-20px) scale(0.8)", transition: "all 0.4s cubic-bezier(.34,1.56,.64,1)", pointerEvents: "none" }}>
      <div style={{ background: "#f59e0b", color: "#0f172a", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1rem", padding: "8px 16px", borderRadius: 999, boxShadow: "0 4px 20px #f59e0b60", display: "flex", alignItems: "center", gap: 4 }}>
        {Icons.zap} +{xp} XP
      </div>
    </div>
  );
}

// --- MAIN QUEST MODE ---
interface QuestModeProps {
  problem: Problem;
  onComplete: (xpEarned: number) => void;
  onBack: () => void;
  currentXP: number;
  currentStreak: number;
}

export function QuestMode({ problem, onComplete, onBack, currentXP, currentStreak }: QuestModeProps) {
  const steps = useMemo(() => buildQuestSteps(problem), [problem]);
  const correctLines = useMemo(() =>
    problem.codePuzzle.correctOrder
      .flatMap((e) => (Array.isArray(e) ? e : [e]))
      .map((id) => problem.codePuzzle.blocks.find((b) => b.id === id)?.code ?? "")
      .filter(Boolean),
    [problem]
  );

  const [stepIdx, setStepIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [streak, setStreak] = useState(currentStreak);
  const [showXPFlash, setShowXPFlash] = useState(false);
  const [flashXP, setFlashXP] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [done, setDone] = useState(false);

  const step = steps[stepIdx];
  const example = problem.examples[0];
  const isLastStep = stepIdx === steps.length - 1;
  const isCorrect = selected === step?.correctIdx;

  const flashXPGain = (amount: number) => {
    setFlashXP(amount);
    setShowXPFlash(true);
    setTimeout(() => setShowXPFlash(false), 1200);
  };

  const handleSelect = (idx: number) => {
    if (showFeedback) return;
    setSelected(idx);
    setShowFeedback(true);

    const correct = idx === step.correctIdx;
    if (correct) {
      const baseXP = hintUsed ? 10 : 30;
      const streakBonus = Math.min(streak * 5, 25);
      const gained = baseXP + streakBonus;
      setXpEarned((prev) => prev + gained);
      setStreak((s) => s + 1);
      flashXPGain(gained);
    } else {
      setStreak(0);
    }
    setHintUsed(false);
  };

  const handleNext = () => {
    if (isLastStep) {
      const completionBonus = 100;
      const total = xpEarned + completionBonus;
      flashXPGain(completionBonus);
      setTimeout(() => setDone(true), 600);
      setXpEarned(total);
    } else {
      setStepIdx((i) => i + 1);
      setSelected(null);
      setShowFeedback(false);
      setHintUsed(false);
    }
  };

  const handleHint = () => {
    setHintUsed(true);
  };

  if (done) {
    return (
      <div style={{ animation: "fadeUp 0.4s ease-out", textAlign: "center", padding: "20px 0" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f59e0b20", border: "2px solid #f59e0b40", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12, color: "#f59e0b" }}>{Icons.zap}</div>
        <h2 style={{ color: "#f59e0b", fontFamily: "'Outfit', sans-serif", margin: "0 0 4px" }}>Quest Complete!</h2>
        <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 20px" }}>#{problem.id} · {problem.title}</p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
          <div style={{ background: "#f59e0b18", border: "1px solid #f59e0b40", borderRadius: 12, padding: "12px 20px", textAlign: "center" }}>
            <div style={{ color: "#f59e0b", fontSize: "1.4rem", fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>+{xpEarned}</div>
            <div style={{ color: "#94a3b8", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase" }}>XP Earned</div>
          </div>
          <div style={{ background: "#22c55e18", border: "1px solid #22c55e40", borderRadius: 12, padding: "12px 20px", textAlign: "center" }}>
            <div style={{ color: "#22c55e", fontSize: "1.4rem", fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>{streak}</div>
            <div style={{ color: "#94a3b8", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase" }}>Streak</div>
          </div>
        </div>

        <div style={{ background: "#0c1222", border: "1px solid #22c55e40", borderRadius: 12, padding: 16, textAlign: "left", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", lineHeight: 1.8, color: "#fbbf24", marginBottom: 20 }}>
          <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Complete Solution</div>
          {correctLines.map((line, i) => (
            <div key={i} style={{ padding: "2px 0" }}>{line}</div>
          ))}
        </div>

        <button onClick={() => onComplete(xpEarned)} style={{ ...btnPrimary, width: "100%" }}>
          Back to Problems {Icons.arrow}
        </button>
      </div>
    );
  }

  if (!step) return null;

  const ann = step.annotation;
  const traceState = buildTraceUpTo(correctLines, stepIdx - 1 + (showFeedback && isCorrect ? 1 : 0));

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <XPFlash xp={flashXP} visible={showXPFlash} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: 4 }}>
          {Icons.back}
        </button>
        <span style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>#{problem.id}</span>
        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: "#f1f5f9", fontSize: "0.95rem", flex: 1 }}>{problem.title}</span>
        <DiffBadge d={problem.difficulty} />
      </div>

      {/* XP + Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "#f59e0b", display: "flex" }}>{Icons.zap}</span>
          <span style={{ color: "#f59e0b", fontSize: "0.8rem", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{currentXP + xpEarned} XP</span>
          {streak > 1 && <span style={{ background: "#f97316", color: "#fff", fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: 999, fontFamily: "'DM Sans', sans-serif" }}>{streak}x streak</span>}
        </div>
        <span style={{ color: "#64748b", fontSize: "0.72rem", fontFamily: "'JetBrains Mono', monospace" }}>{stepIdx + 1} / {steps.length} lines</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: "#1e293b", borderRadius: 4, marginBottom: 16, overflow: "hidden" }}>
        <div style={{ width: `${((stepIdx + (showFeedback ? 1 : 0)) / steps.length) * 100}%`, height: "100%", background: "#f59e0b", borderRadius: 4, transition: "width 0.4s ease" }} />
      </div>

      {/* Example trace panel */}
      <div style={{ background: "#0c1222", border: "1px solid #1e293b", borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ color: "#64748b", fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Input</div>
            <div style={{ color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem" }}>{example?.input ?? "—"}</div>
          </div>
          <div style={{ flex: 1, minWidth: 80 }}>
            <div style={{ color: "#64748b", fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Expected output</div>
            <div style={{ color: "#22c55e", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem" }}>{example?.output ?? "—"}</div>
          </div>
        </div>

        {/* Variable state */}
        {traceState.variables.length > 0 && (
          <div>
            <div style={{ color: "#64748b", fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Data state</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {traceState.variables.map((v, i) => (
                <div key={i} style={{ background: v.isNew ? "#06b6d420" : "#1e293b", border: `1px solid ${v.isNew ? "#06b6d460" : "#334155"}`, borderRadius: 6, padding: "4px 8px", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", animation: v.isNew ? "fadeUp 0.3s ease-out" : "none" }}>
                  <span style={{ color: "#94a3b8" }}>{v.name}</span>
                  <span style={{ color: "#64748b" }}> = </span>
                  <span style={{ color: v.isNew ? "#06b6d4" : "#fbbf24" }}>{v.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Code so far */}
      {stepIdx > 0 && (
        <div style={{ background: "#0c1222", border: "1px solid #1e293b", borderRadius: 12, padding: "10px 14px", marginBottom: 14, maxHeight: 140, overflowY: "auto" }}>
          {correctLines.slice(0, stepIdx).map((line, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "#64748b", lineHeight: 1.7 }}>{line}</div>
          ))}
          {!(isLastStep && showFeedback) && (
            <>
              <div style={{ height: 2, background: "#f59e0b40", borderRadius: 1, margin: "6px 0" }} />
              <div style={{ color: "#f59e0b", fontSize: "0.7rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>↓ What comes next?</div>
            </>
          )}
        </div>
      )}

      {/* Line annotation badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ background: ann.color + "20", color: ann.color, fontSize: "0.65rem", fontWeight: 700, padding: "3px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em", border: `1px solid ${ann.color}40` }}>
          {ann.label}
        </span>
        <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>Pick the correct next line:</span>
        {!hintUsed && !showFeedback && (
          <button onClick={handleHint} style={{ marginLeft: "auto", background: "none", border: "1px solid #334155", borderRadius: 6, color: "#64748b", fontSize: "0.65rem", padding: "3px 8px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Hint −10 XP
          </button>
        )}
      </div>

      {/* Hint reveal */}
      {hintUsed && !showFeedback && (
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: "#94a3b8" }}>
          Hint: <span style={{ color: ann.color }}>{ann.detail}</span>
        </div>
      )}

      {/* Choice buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {step.choices.map((choice, i) => {
          const isSelected = selected === i;
          const isRight = i === step.correctIdx;
          let bg = "#0f172a", border = "#334155", color = "#cbd5e1", label = "";

          if (showFeedback) {
            if (isRight) { bg = "#22c55e18"; border = "#22c55e60"; color = "#22c55e"; label = "✓ Correct"; }
            else if (isSelected) { bg = "#ef444418"; border = "#ef444460"; color = "#ef4444"; label = "✗ Wrong"; }
            else { color = "#334155"; }
          } else if (isSelected) {
            bg = "#f59e0b18"; border = "#f59e0b60";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={showFeedback}
              style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 10, padding: "12px 14px", color, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", textAlign: "left", cursor: showFeedback ? "default" : "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8, minHeight: 48 }}
            >
              <span style={{ width: 22, height: 22, borderRadius: 6, background: showFeedback && isRight ? "#22c55e" : showFeedback && isSelected ? "#ef4444" : "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: showFeedback && (isRight || isSelected) ? "#fff" : "#64748b", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
                {label ? (isRight ? "✓" : "✗") : String.fromCharCode(65 + i)}
              </span>
              <pre style={{ margin: 0, flex: 1, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "'JetBrains Mono', monospace" }}>{choice}</pre>
            </button>
          );
        })}
      </div>

      {/* Feedback panel */}
      {showFeedback && (
        <div style={{ animation: "fadeUp 0.3s ease-out" }}>
          {isCorrect ? (
            <div style={{ background: "#22c55e18", border: "1px solid #22c55e40", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
              <div style={{ color: "#22c55e", fontWeight: 700, fontSize: "0.85rem", marginBottom: 2 }}>Correct! {!hintUsed && streak > 1 ? `${streak}x streak` : ""}</div>
              <div style={{ color: "#94a3b8", fontSize: "0.78rem" }}>{ann.label}: <span style={{ color: ann.color, fontFamily: "'JetBrains Mono', monospace" }}>{ann.detail}</span></div>
            </div>
          ) : (
            <div style={{ background: "#ef444418", border: "1px solid #ef444440", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
              <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "0.85rem", marginBottom: 2 }}>Not quite — streak reset</div>
              <div style={{ color: "#94a3b8", fontSize: "0.78rem" }}>Correct: <span style={{ color: "#22c55e", fontFamily: "'JetBrains Mono', monospace" }}>{step.correctLine}</span></div>
            </div>
          )}
          <button onClick={handleNext} style={{ ...btnPrimary, width: "100%" }}>
            {isLastStep ? "Complete Quest" : "Next Line"} {Icons.arrow}
          </button>
        </div>
      )}
    </div>
  );
}

// --- QUEST PROBLEM PICKER (within skill path or all problems) ---
export function QuestProblemCard({
  problem,
  completed,
  onStart,
}: {
  problem: Problem;
  completed: boolean;
  onStart: () => void;
}) {
  return (
    <button
      onClick={onStart}
      style={{
        background: completed ? "#22c55e0a" : "#0c1222",
        border: `1.5px solid ${completed ? "#22c55e40" : "#1e293b"}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "all 0.15s",
        color: "#f1f5f9",
      }}
    >
      <span style={{ width: 28, height: 28, borderRadius: "50%", background: completed ? "#22c55e" : "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {completed ? <span style={{ color: "#fff", fontSize: "0.8rem" }}>✓</span> : <span style={{ color: "#f59e0b", display: "flex" }}>{Icons.zap}</span>}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", color: "#64748b", minWidth: 32 }}>#{problem.id}</span>
      <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: completed ? "#22c55e" : "#f1f5f9" }}>{problem.title}</span>
      <DiffBadge d={problem.difficulty} />
    </button>
  );
}
