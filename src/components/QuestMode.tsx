import { useState, useMemo, useEffect, useRef } from "react";
import type { Problem, CodeBlock } from "../types";
import { DiffBadge, Icons, btnPrimary, btnSmall } from "./ui";

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_PLAYER_HP = 150;
const HP_PER_LINE = 20;
const WRONG_PENALTY = 15;

// ─── Line Annotation ─────────────────────────────────────────────────────────
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
    return { type: "def", label: "Define", detail: `${name}(${params})`, color: "#a78bfa" };
  }
  if (t.startsWith("return ")) {
    const val = t.replace(/^return\s*/, "");
    return { type: "return", label: "Return", detail: val || "result", color: "#34d399" };
  }
  if (t.startsWith("for ")) {
    const body = t.replace(/^for\s+/, "").replace(/:$/, "");
    return { type: "loop", label: "Loop", detail: body, color: "#f59e0b" };
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
    return { type: "comment", label: "Note", detail: t.replace(/^#+\s*/, ""), color: "#64748b" };
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
  return { type: "call", label: "Call", detail: t, color: "#94a3b8" };
}

// ─── Data Trace ───────────────────────────────────────────────────────────────
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

  delete vars["self"];
  const ann = annotateCodeLine(lastLine);

  return {
    variables: Object.entries(vars)
      .filter(([k]) => k !== "self")
      .map(([name, value]) => ({ name, value, isNew: newKeys.has(name) }))
      .concat(ann.type === "return" ? [{ name: "returns", value: ann.detail, isNew: true }] : []),
  };
}

// ─── Quest Step Builder ───────────────────────────────────────────────────────
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

// ─── HP Bar ──────────────────────────────────────────────────────────────────
function HPBar({ current, max, flash }: { current: number; max: number; flash?: boolean }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 50 ? "#22c55e" : pct > 25 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ flex: 1, height: 7, background: "#0f172a", borderRadius: 999, overflow: "hidden", border: "1px solid #1e293b", animation: flash ? "hpFlash 0.5s ease" : "none" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.45s ease, background 0.3s" }} />
    </div>
  );
}

// ─── XP Flash ────────────────────────────────────────────────────────────────
function XPFlash({ xp, visible }: { xp: number; visible: boolean }) {
  return (
    <div style={{ position: "fixed", top: 72, right: 16, zIndex: 999, opacity: visible ? 1 : 0, transform: visible ? "translateY(0) scale(1)" : "translateY(-16px) scale(0.85)", transition: "all 0.35s cubic-bezier(.34,1.56,.64,1)", pointerEvents: "none" }}>
      <div style={{ background: "#f59e0b", color: "#0f172a", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "0.9rem", padding: "6px 14px", borderRadius: 999, boxShadow: "0 4px 16px #f59e0b50", display: "flex", alignItems: "center", gap: 4 }}>
        {Icons.zap} +{xp} XP
      </div>
    </div>
  );
}

// ─── Main Quest Mode (Battle) ─────────────────────────────────────────────────
interface QuestModeProps {
  problem: Problem;
  onComplete: (xpEarned: number) => void;
  onBack: () => void;
  currentXP: number;
  currentStreak: number;
}

export function QuestMode({ problem, onComplete, onBack, currentXP: _currentXP, currentStreak }: QuestModeProps) {
  const steps = useMemo(() => buildQuestSteps(problem), [problem]);
  const correctLines = useMemo(() =>
    problem.codePuzzle.correctOrder
      .flatMap((e) => (Array.isArray(e) ? e : [e]))
      .map((id) => problem.codePuzzle.blocks.find((b) => b.id === id)?.code ?? "")
      .filter(Boolean),
    [problem]
  );
  const maxEnemyHP = steps.length * HP_PER_LINE;

  const [stepIdx, setStepIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [streak, setStreak] = useState(currentStreak);
  const [hintUsed, setHintUsed] = useState(false);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);

  // Battle HP
  const [playerHP, setPlayerHP] = useState(MAX_PLAYER_HP);
  const [enemyHP, setEnemyHP] = useState(maxEnemyHP);

  // Animations
  const [enemyShaking, setEnemyShaking] = useState(false);
  const [playerFlash, setPlayerFlash] = useState(false);
  const [enemyFlash, setEnemyFlash] = useState(false);
  const [dmgText, setDmgText] = useState("");
  const [dmgColor, setDmgColor] = useState("#ef4444");
  const [dmgVisible, setDmgVisible] = useState(false);
  const [dmgKey, setDmgKey] = useState(0);

  // XP flash
  const [flashXP, setFlashXP] = useState(0);
  const [showXPFlash, setShowXPFlash] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer — pauses while feedback shows or game is done
  useEffect(() => {
    if (done || showFeedback) {
      clearInterval(timerRef.current!);
      return;
    }
    timerRef.current = setInterval(() => {
      setPlayerHP((hp) => {
        if (hp <= 1) {
          clearInterval(timerRef.current!);
          setDone(true);
          return 0;
        }
        return hp - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [showFeedback, done]);

  const triggerDamage = (text: string, color: string) => {
    setDmgText(text);
    setDmgColor(color);
    setDmgKey((k) => k + 1);
    setDmgVisible(true);
    setTimeout(() => setDmgVisible(false), 900);
  };

  const showXP = (amount: number) => {
    setFlashXP(amount);
    setShowXPFlash(true);
    setTimeout(() => setShowXPFlash(false), 1200);
  };

  const step = steps[stepIdx];
  const isLastStep = stepIdx === steps.length - 1;
  const isCorrect = selected === step?.correctIdx;
  const example = problem.examples[0];
  const traceState = buildTraceUpTo(correctLines, stepIdx - 1 + (showFeedback && isCorrect ? 1 : 0));

  const handleSelect = (idx: number) => {
    if (showFeedback) return;
    setSelected(idx);
    setShowFeedback(true);

    const correct = idx === step.correctIdx;
    if (correct) {
      setEnemyHP((hp) => Math.max(0, hp - HP_PER_LINE));
      setEnemyShaking(true);
      setEnemyFlash(true);
      setTimeout(() => setEnemyShaking(false), 550);
      setTimeout(() => setEnemyFlash(false), 300);
      triggerDamage(`-${HP_PER_LINE}`, "#ef4444");

      const baseXP = hintUsed ? 10 : 30;
      const streakBonus = Math.min(streak * 5, 25);
      const gained = baseXP + streakBonus;
      setXpEarned((prev) => prev + gained);
      setStreak((s) => s + 1);
      showXP(gained);
    } else {
      setPlayerHP((hp) => Math.max(0, hp - WRONG_PENALTY));
      setPlayerFlash(true);
      setTimeout(() => setPlayerFlash(false), 500);
      triggerDamage(`-${WRONG_PENALTY}s`, "#f59e0b");
      setStreak(0);
    }
    setHintUsed(false);
  };

  const handleNext = () => {
    // If player HP hit 0 from wrong answers, trigger game-over
    if (playerHP <= 0 && !isLastStep) {
      setDone(true);
      return;
    }
    if (isLastStep) {
      const completionBonus = 100;
      const total = xpEarned + completionBonus;
      setXpEarned(total);
      setWon(true);
      showXP(completionBonus);
      setTimeout(() => setDone(true), 700);
    } else {
      setStepIdx((i) => i + 1);
      setSelected(null);
      setShowFeedback(false);
      setHintUsed(false);
    }
  };

  const resetQuest = () => {
    setDone(false);
    setWon(false);
    setStepIdx(0);
    setSelected(null);
    setShowFeedback(false);
    setXpEarned(0);
    setStreak(currentStreak);
    setPlayerHP(MAX_PLAYER_HP);
    setEnemyHP(maxEnemyHP);
    setHintUsed(false);
  };

  // ─── Done / Victory / Game Over Screen ───────────────────────────────────
  if (done) {
    return (
      <div style={{ animation: "fadeUp 0.4s ease-out", textAlign: "center", padding: "24px 0" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: won ? "#f59e0b18" : "#ef444418",
          border: `2px solid ${won ? "#f59e0b40" : "#ef444440"}`,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginBottom: 14, color: won ? "#f59e0b" : "#ef4444",
        }}>
          {won ? Icons.zap : Icons.timer}
        </div>
        <h2 style={{ color: won ? "#f59e0b" : "#ef4444", fontFamily: "'Outfit', sans-serif", margin: "0 0 4px", fontSize: "1.3rem" }}>
          {won ? "Quest Complete!" : "Time's Up!"}
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.82rem", margin: "0 0 20px" }}>
          #{problem.id} · {problem.title}
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}>
          <div style={{ background: "#f59e0b12", border: "1px solid #f59e0b30", borderRadius: 12, padding: "12px 18px", minWidth: 80 }}>
            <div style={{ color: "#f59e0b", fontSize: "1.3rem", fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>+{xpEarned}</div>
            <div style={{ color: "#64748b", fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase" }}>XP Earned</div>
          </div>
          <div style={{ background: "#22c55e12", border: "1px solid #22c55e30", borderRadius: 12, padding: "12px 18px", minWidth: 80 }}>
            <div style={{ color: "#22c55e", fontSize: "1.3rem", fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>{won ? steps.length : stepIdx}/{steps.length}</div>
            <div style={{ color: "#64748b", fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase" }}>Lines Hit</div>
          </div>
          <div style={{ background: "#06b6d412", border: "1px solid #06b6d430", borderRadius: 12, padding: "12px 18px", minWidth: 80 }}>
            <div style={{ color: "#06b6d4", fontSize: "1.3rem", fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>{playerHP}s</div>
            <div style={{ color: "#64748b", fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase" }}>HP Left</div>
          </div>
        </div>

        {won && (
          <div style={{ background: "#0c1222", border: "1px solid #22c55e30", borderRadius: 12, padding: "12px 16px", textAlign: "left", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.76rem", lineHeight: 1.8, color: "#fbbf24", marginBottom: 20 }}>
            <div style={{ color: "#475569", fontSize: "0.62rem", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Complete Solution</div>
            {correctLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}

        {!won && (
          <div style={{ background: "#0c1222", border: "1px solid #334155", borderRadius: 12, padding: "10px 14px", marginBottom: 16, textAlign: "left" }}>
            <div style={{ color: "#64748b", fontSize: "0.78rem" }}>
              Answered {stepIdx} of {steps.length} lines before time ran out.
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {won ? (
            <button onClick={() => onComplete(xpEarned)} style={{ ...btnPrimary, width: "100%" }}>
              Collect Rewards {Icons.arrow}
            </button>
          ) : (
            <>
              <button onClick={resetQuest} style={{ ...btnPrimary, width: "100%" }}>
                Rematch {Icons.arrow}
              </button>
              <button onClick={onBack} style={{ ...btnSmall, width: "100%", textAlign: "center" }}>
                Retreat
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!step) return null;

  const ann = step.annotation;
  const playerHPPct = playerHP / MAX_PLAYER_HP;
  const playerHPColor = playerHPPct > 0.5 ? "#22c55e" : playerHPPct > 0.22 ? "#f59e0b" : "#ef4444";

  // ─── Battle UI ────────────────────────────────────────────────────────────
  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <XPFlash xp={flashXP} visible={showXPFlash} />

      {/* Player hit full-screen flash */}
      {playerFlash && (
        <div style={{ position: "fixed", inset: 0, background: "#ef444418", pointerEvents: "none", zIndex: 997, animation: "quickFade 0.5s ease-out forwards" }} />
      )}

      {/* Back + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center" }}>
          {Icons.back}
        </button>
        <span style={{ fontSize: "0.7rem", color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>#{problem.id}</span>
        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: "#f1f5f9", fontSize: "0.88rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{problem.title}</span>
        <DiffBadge d={problem.difficulty} />
      </div>

      {/* ── ENEMY card ──────────────────────────────────────────────────────── */}
      <div style={{
        background: enemyFlash ? "#ef444410" : "#0c1222",
        border: `1.5px solid ${enemyFlash ? "#ef444440" : "#1e293b"}`,
        borderRadius: 12, padding: "10px 14px", marginBottom: 8,
        position: "relative", overflow: "hidden",
        animation: enemyShaking ? "shake 0.5s ease" : "none",
        transition: "background 0.15s, border-color 0.15s",
      }}>
        {/* Enemy name row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 }}>
            {problem.title}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {streak > 1 && (
              <span style={{ background: "#f97316", color: "#fff", fontSize: "0.58rem", fontWeight: 700, padding: "2px 6px", borderRadius: 999, fontFamily: "'DM Sans', sans-serif" }}>
                {streak}x streak
              </span>
            )}
            <span style={{ color: "#475569", fontSize: "0.6rem", fontFamily: "'JetBrains Mono', monospace" }}>
              {stepIdx + 1}/{steps.length}
            </span>
          </div>
        </div>

        {/* Enemy HP bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "#ef4444", fontSize: "0.58rem", fontWeight: 800, fontFamily: "'DM Sans', sans-serif", minWidth: 14 }}>HP</span>
          <HPBar current={enemyHP} max={maxEnemyHP} flash={enemyFlash} />
          <span style={{ color: "#ef4444", fontSize: "0.58rem", fontFamily: "'JetBrains Mono', monospace", minWidth: 34, textAlign: "right" }}>
            {enemyHP}/{maxEnemyHP}
          </span>
        </div>

        {/* Damage float — positioned inside enemy card */}
        {dmgVisible && (
          <div
            key={dmgKey}
            style={{
              position: "absolute", top: 4, right: 14,
              color: dmgColor, fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "1rem",
              animation: "floatUp 0.85s ease-out forwards", pointerEvents: "none", zIndex: 10,
            }}
          >
            {dmgText}
          </div>
        )}
      </div>

      {/* ── Data trace / battlefield ─────────────────────────────────────────── */}
      <div style={{ background: "#0c1222", border: "1px solid #1e293b", borderRadius: 10, padding: "8px 12px", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: traceState.variables.length > 0 ? 6 : 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#475569", fontSize: "0.56rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Input</div>
            <div style={{ color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{example?.input ?? "—"}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#475569", fontSize: "0.56rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Expected</div>
            <div style={{ color: "#22c55e", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem" }}>{example?.output ?? "—"}</div>
          </div>
        </div>
        {traceState.variables.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {traceState.variables.map((v, i) => (
              <div key={i} style={{
                background: v.isNew ? "#06b6d418" : "#1e293b",
                border: `1px solid ${v.isNew ? "#06b6d450" : "#334155"}`,
                borderRadius: 5, padding: "2px 6px",
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem",
                animation: v.isNew ? "fadeUp 0.3s ease-out" : "none",
              }}>
                <span style={{ color: "#64748b" }}>{v.name}=</span>
                <span style={{ color: v.isNew ? "#06b6d4" : "#f59e0b" }}>{v.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Code so far (compact battle log) */}
      {stepIdx > 0 && (
        <div style={{ background: "#0c1222", border: "1px solid #1e293b", borderRadius: 10, padding: "5px 12px", marginBottom: 8, maxHeight: 68, overflowY: "auto" }}>
          {correctLines.slice(Math.max(0, stepIdx - 4), stepIdx).map((line, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.6 }}>{line}</div>
          ))}
          {!(isLastStep && showFeedback) && (
            <div style={{ borderTop: "1px solid #f59e0b20", marginTop: 3, paddingTop: 2, color: "#f59e0b50", fontSize: "0.58rem" }}>↓ next?</div>
          )}
        </div>
      )}

      {/* ── PLAYER HP (timer) ────────────────────────────────────────────────── */}
      <div style={{
        background: playerFlash ? "#ef444412" : "#0c1222",
        border: `1px solid ${playerFlash ? "#ef444430" : "#1e293b"}`,
        borderRadius: 10, padding: "7px 12px", marginBottom: 10,
        transition: "background 0.2s, border-color 0.2s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "#64748b", fontSize: "0.58rem", fontWeight: 800, fontFamily: "'DM Sans', sans-serif", minWidth: 18, lineHeight: 1 }}>YOU</span>
          <div style={{ flex: 1, height: 7, background: "#0f172a", borderRadius: 999, overflow: "hidden", border: "1px solid #1e293b" }}>
            <div style={{ width: `${(playerHP / MAX_PLAYER_HP) * 100}%`, height: "100%", background: playerHPColor, borderRadius: 999, transition: "width 0.4s ease, background 0.3s" }} />
          </div>
          <span style={{ color: playerHPColor, fontSize: "0.62rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, minWidth: 28, textAlign: "right" }}>
            {playerHP}s
          </span>
        </div>
      </div>

      {/* ── Move selector label ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <span style={{
          background: ann.color + "20", color: ann.color,
          fontSize: "0.58rem", fontWeight: 700, padding: "2px 7px", borderRadius: 999,
          textTransform: "uppercase", letterSpacing: "0.06em", border: `1px solid ${ann.color}40`,
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          {ann.label}
        </span>
        <span style={{ color: "#94a3b8", fontSize: "0.72rem", fontWeight: 600, flex: 1 }}>Choose your move</span>
        {!hintUsed && !showFeedback && (
          <button
            onClick={() => setHintUsed(true)}
            style={{ background: "none", border: "1px solid #334155", borderRadius: 6, color: "#475569", fontSize: "0.58rem", padding: "2px 7px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}
          >
            Hint
          </button>
        )}
      </div>

      {/* Hint reveal */}
      {hintUsed && !showFeedback && (
        <div style={{ background: "#1e293b", borderRadius: 8, padding: "5px 10px", marginBottom: 7, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.66rem", color: "#94a3b8" }}>
          Hint: <span style={{ color: ann.color }}>{ann.detail}</span>
        </div>
      )}

      {/* ── 2x2 Move Grid ────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        {step.choices.map((choice, i) => {
          const isSelected = selected === i;
          const isRight = i === step.correctIdx;
          let bg = "#0c1222", border = "#334155", textCol = "#cbd5e1";

          if (showFeedback) {
            if (isRight) { bg = "#22c55e12"; border = "#22c55e50"; textCol = "#22c55e"; }
            else if (isSelected && !isRight) { bg = "#ef444412"; border = "#ef444450"; textCol = "#ef4444"; }
            else { textCol = "#1e293b"; border = "#1e293b"; }
          }

          const tag = showFeedback && isRight ? "HIT" : showFeedback && isSelected && !isRight ? "MISS" : String.fromCharCode(65 + i);
          const tagColor = showFeedback && isRight ? "#22c55e" : showFeedback && isSelected && !isRight ? "#ef4444" : "#475569";

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={showFeedback}
              style={{
                background: bg, border: `1.5px solid ${border}`, borderRadius: 10,
                padding: "9px 10px", color: textCol,
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem",
                textAlign: "left", cursor: showFeedback ? "default" : "pointer",
                transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 4,
                minHeight: 60, wordBreak: "break-word",
              }}
            >
              <span style={{ color: tagColor, fontSize: "0.56rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 800, letterSpacing: "0.08em" }}>
                {tag}
              </span>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit", lineHeight: 1.4, fontSize: "0.68rem" }}>
                {choice}
              </pre>
            </button>
          );
        })}
      </div>

      {/* ── Feedback + Next ───────────────────────────────────────────────────── */}
      {showFeedback && (
        <div style={{ animation: "fadeUp 0.25s ease-out" }}>
          <div style={{
            background: isCorrect ? "#22c55e10" : "#ef444410",
            border: `1px solid ${isCorrect ? "#22c55e30" : "#ef444430"}`,
            borderRadius: 10, padding: "8px 12px", marginBottom: 10,
          }}>
            <div style={{ color: isCorrect ? "#22c55e" : "#ef4444", fontWeight: 700, fontSize: "0.78rem", marginBottom: 2 }}>
              {isCorrect
                ? `Hit! Dealt ${HP_PER_LINE} damage${streak > 1 ? ` · ${streak}x streak` : ""}`
                : `Missed! Lost ${WRONG_PENALTY}s`}
            </div>
            <div style={{ color: "#64748b", fontSize: "0.7rem" }}>
              {ann.label}: <span style={{ color: ann.color, fontFamily: "'JetBrains Mono', monospace" }}>{ann.detail}</span>
            </div>
          </div>
          <button onClick={handleNext} style={{ ...btnPrimary, width: "100%" }}>
            {isLastStep ? "Finish Battle" : "Next Move"} {Icons.arrow}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Quest Problem Card ───────────────────────────────────────────────────────
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
        borderRadius: 12, padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 12,
        cursor: "pointer", textAlign: "left", width: "100%",
        transition: "all 0.15s", color: "#f1f5f9",
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
