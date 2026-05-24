import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Problem, CodeBlock } from "../types";
import { renderInlineMarkdown, DiffBadge, Timer, Modal, Icons, btnPrimary, btnSmall, microBtn } from "./ui";

// --- PHASE: PROBLEM DISPLAY ---
export function ProblemView({ problem, onReady }: { problem: Problem; onReady: () => void }) {
  const [timer, setTimer] = useState(180);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  useEffect(() => { if (timer === 0) onReady(); }, [timer, onReady]);

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.8rem", color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>#{problem.id}</span>
        <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#f1f5f9", fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{problem.title}</h2>
        <DiffBadge d={problem.difficulty} />
      </div>

      <div style={{ marginBottom: 16 }}><Timer seconds={timer} total={180} /></div>

      <div style={{ background: "#0c1222", border: "1px solid #1e293b", borderRadius: 12, padding: 16, marginBottom: 16, fontSize: "0.88rem", lineHeight: 1.7, color: "#cbd5e1", maxHeight: "40vh", overflowY: "auto" }}>
        {problem.description.split("\n").map((line, i) => (
          <p key={i} style={{ margin: "6px 0" }}>{renderInlineMarkdown(line)}</p>
        ))}
      </div>

      {problem.examples.map((ex, i) => (
        <div key={i} style={{ background: "#0c1222", border: "1px solid #1e293b", borderRadius: 12, padding: 14, marginBottom: 10, fontSize: "0.82rem", fontFamily: "'JetBrains Mono', monospace" }}>
          <div style={{ color: "#94a3b8", marginBottom: 4, fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Example {i + 1}</div>
          <div style={{ color: "#f59e0b" }}><span style={{ color: "#64748b" }}>Input: </span>{ex.input}</div>
          <div style={{ color: "#fbbf24" }}><span style={{ color: "#64748b" }}>Output: </span>{ex.output}</div>
          {ex.explanation && <div style={{ color: "#94a3b8", marginTop: 4, fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem" }}>{ex.explanation}</div>}
        </div>
      ))}

      <div style={{ marginTop: 12, marginBottom: 20 }}>
        <div style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Constraints</div>
        {problem.constraints.map((c, i) => (
          <div key={i} style={{ color: "#94a3b8", fontSize: "0.8rem", padding: "3px 0", fontFamily: "'JetBrains Mono', monospace" }}>• {renderInlineMarkdown(c)}</div>
        ))}
      </div>

      <button onClick={onReady} style={btnPrimary}>I'm ready — Start Quiz {Icons.arrow}</button>
    </div>
  );
}

// --- PHASE: MCQ QUIZ ---
export function MCQPhase({ problem, onComplete }: { problem: Problem; onComplete: (time: number) => void }) {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timer, setTimer] = useState(60);
  const [totalTime, setTotalTime] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const q = problem.mcq[qIdx];
  const isCorrect = selected === q.correct;

  useEffect(() => {
    setTimer(60); setSelected(null); setShowResult(false); setTimedOut(false);
    timerRef.current = setInterval(() => {
      setTimer((t) => { if (t <= 1) { clearInterval(timerRef.current!); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [qIdx]);

  useEffect(() => {
    if (timer === 0 && selected === null && !showResult) { setTimedOut(true); setShowResult(true); setTotalTime((t) => t + 60); }
  }, [timer, selected, showResult]);

  const handleSelect = (idx: number) => {
    if (showResult || timer === 0) return;
    clearInterval(timerRef.current!);
    setSelected(idx); setShowResult(true); setTotalTime((t) => t + (60 - timer));
  };

  const handleNext = () => { if (qIdx < 2) setQIdx(qIdx + 1); else onComplete(totalTime); };

  const qLabels = ["Algorithm / Data Structure", "Time Complexity", "Space Complexity"];

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Question {qIdx + 1} of 3</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < qIdx ? "#22c55e" : i === qIdx ? "#f59e0b" : "#334155", transition: "all 0.3s" }} />
            ))}
          </div>
        </div>
        <Timer seconds={timer} total={60} />
      </div>

      <div style={{ background: "#0c1222", border: "1px solid #1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ color: "#f59e0b", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{qLabels[qIdx]}</div>
        <p style={{ color: "#f1f5f9", fontSize: "0.95rem", margin: 0, fontWeight: 600, lineHeight: 1.5, fontFamily: "'Outfit', sans-serif" }}>{renderInlineMarkdown(q.question)}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {q.options.map((opt, i) => {
          let bg = "#0f172a", border = "#1e293b", color = "#cbd5e1";
          if (showResult || timer === 0) {
            if (i === q.correct) { bg = "#22c55e18"; border = "#22c55e60"; color = "#22c55e"; }
            else if (i === selected && !isCorrect) { bg = "#ef444418"; border = "#ef444460"; color = "#ef4444"; }
          } else if (selected === i) { bg = "#f59e0b18"; border = "#f59e0b60"; }
          return (
            <button key={i} onClick={() => handleSelect(i)} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 10, padding: "12px 14px", color, fontSize: "0.88rem", fontFamily: "'JetBrains Mono', monospace", cursor: showResult || timer === 0 ? "default" : "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s" }}>
              <span style={{ width: 24, height: 24, borderRadius: 6, background: showResult && i === q.correct ? "#22c55e" : showResult && i === selected && !isCorrect ? "#ef4444" : "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: showResult && (i === q.correct || (i === selected && !isCorrect)) ? "#fff" : "#64748b", flexShrink: 0 }}>
                {showResult && i === q.correct ? Icons.check : showResult && i === selected && !isCorrect ? Icons.x : String.fromCharCode(65 + i)}
              </span>
              <span>{renderInlineMarkdown(opt)}</span>
            </button>
          );
        })}
      </div>

      {showResult && timedOut && (
        <Modal show={true} onClose={handleNext}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f59e0b20", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10, color: "#f59e0b" }}>{Icons.timer}</div>
            <h3 style={{ color: "#f59e0b", margin: "0 0 4px", fontFamily: "'Outfit', sans-serif" }}>Time's up!</h3>
          </div>
          <div style={{ background: "#22c55e12", border: "1px solid #22c55e30", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
            <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 600, marginBottom: 2 }}>CORRECT ANSWER</div>
            <div style={{ color: "#22c55e", fontSize: "0.9rem", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{q.options[q.correct]}</div>
          </div>
          <p style={{ color: "#cbd5e1", fontSize: "0.85rem", lineHeight: 1.6, margin: "0 0 16px", textAlign: "center" }}>{renderInlineMarkdown(q.explanation)}</p>
          <button onClick={handleNext} style={{ ...btnPrimary, width: "100%" }}>{qIdx < 2 ? "Next Question" : "Start Code Puzzle"} {Icons.arrow}</button>
        </Modal>
      )}

      {showResult && !timedOut && !isCorrect && (
        <Modal show={true} onClose={handleNext}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#ef444420", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <h3 style={{ color: "#ef4444", margin: "0 0 4px", fontFamily: "'Outfit', sans-serif" }}>Not quite!</h3>
          </div>
          <p style={{ color: "#cbd5e1", fontSize: "0.85rem", lineHeight: 1.6, margin: "0 0 16px", textAlign: "center" }}>{renderInlineMarkdown(q.explanation)}</p>
          <button onClick={handleNext} style={{ ...btnPrimary, width: "100%" }}>{qIdx < 2 ? "Next Question" : "Start Code Puzzle"} {Icons.arrow}</button>
        </Modal>
      )}

      {showResult && isCorrect && (
        <div style={{ background: "#22c55e18", border: "1px solid #22c55e40", borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ color: "#22c55e", fontWeight: 700, fontSize: "0.9rem", marginBottom: 6, textAlign: "center" }}>✓ Correct!</div>
          <p style={{ color: "#94a3b8", fontSize: "0.82rem", lineHeight: 1.6, margin: "0 0 10px", fontFamily: "'DM Sans', sans-serif" }}>{renderInlineMarkdown(q.explanation)}</p>
          <button onClick={handleNext} style={{ ...btnPrimary, width: "100%" }}>{qIdx < 2 ? "Next Question" : "Start Code Puzzle"} {Icons.arrow}</button>
        </div>
      )}
    </div>
  );
}

// --- PHASE: CODE PUZZLE ---
export function CodePuzzle({ problem, quizTime, onComplete }: { problem: Problem; quizTime: number; onComplete: () => void }) {
  const puzzle = problem.codePuzzle;
  const allBlocks = [...puzzle.blocks, ...(puzzle.distractors || [])];
  const distractorIds = new Set((puzzle.distractors || []).map((d) => d.id));
  const correctCount = puzzle.correctOrder.reduce((sum: number, entry) => sum + (Array.isArray(entry) ? entry.length : 1), 0);

  const [placed, setPlaced] = useState<CodeBlock[]>([]);
  const [available, setAvailable] = useState<CodeBlock[]>(() => {
    const arr = [...allBlocks];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const [result, setResult] = useState<boolean | null>(null);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  const addBlock = (block: CodeBlock) => { setPlaced([...placed, block]); setAvailable(available.filter((b) => b.id !== block.id)); };
  const removeBlock = (block: CodeBlock) => { setAvailable([...available, block]); setPlaced(placed.filter((b) => b.id !== block.id)); };
  const moveUp = (idx: number) => { if (idx === 0) return; const arr = [...placed]; [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; setPlaced(arr); };
  const moveDown = (idx: number) => { if (idx === placed.length - 1) return; const arr = [...placed]; [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]; setPlaced(arr); };

  const isCorrectPlacement = useCallback((placedIds: string[]) => {
    const order = puzzle.correctOrder;
    const slots: { ids: Set<string>; count: number }[] = [];
    for (const entry of order) {
      if (Array.isArray(entry)) slots.push({ ids: new Set(entry), count: entry.length });
      else slots.push({ ids: new Set([entry]), count: 1 });
    }
    const totalExpected = slots.reduce((sum, s) => sum + s.count, 0);
    if (placedIds.length !== totalExpected) return false;
    let pi = 0;
    for (const slot of slots) {
      const chunk = placedIds.slice(pi, pi + slot.count);
      const chunkSet = new Set(chunk);
      if (chunkSet.size !== slot.count) return false;
      for (const id of chunk) { if (!slot.ids.has(id)) return false; }
      pi += slot.count;
    }
    return true;
  }, [puzzle.correctOrder]);

  const validPositionsMap = useMemo(() => {
    const map: Record<string, Set<number>> = {};
    let pos = 0;
    for (const entry of puzzle.correctOrder) {
      if (Array.isArray(entry)) {
        const positions = entry.map((_, i) => pos + i);
        for (const id of entry) map[id] = new Set(positions);
        pos += entry.length;
      } else { map[entry] = new Set([pos]); pos += 1; }
    }
    return map;
  }, [puzzle.correctOrder]);

  const checkSolution = () => {
    clearInterval(timerRef.current!);
    setResult(isCorrectPlacement(placed.map((b) => b.id)));
  };

  const getBlockError = (block: CodeBlock, idx: number): string | null => {
    if (result !== false) return null;
    if (distractorIds.has(block.id)) return "distractor";
    const validPos = validPositionsMap[block.id];
    if (!validPos || !validPos.has(idx)) return "wrong-pos";
    return null;
  };

  const placedDistractorCount = placed.filter((b) => distractorIds.has(b.id)).length;

  const reset = () => {
    const arr = [...allBlocks];
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    setAvailable(arr); setPlaced([]); setResult(null); setTimer(0);
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  };

  if (result === true) {
    return (
      <div style={{ animation: "fadeUp 0.3s ease-out", textAlign: "center", padding: "30px 0" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#22c55e20", border: "2px solid #22c55e40", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: "#22c55e" }}>{Icons.check}</div>
        <h2 style={{ color: "#22c55e", fontFamily: "'Outfit', sans-serif", margin: "0 0 8px" }}>Puzzle Solved!</h2>
        <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 20px" }}>Quiz: {Math.floor(quizTime / 60)}m {quizTime % 60}s · Puzzle: {Math.floor(timer / 60)}m {timer % 60}s</p>
        <div style={{ background: "#0c1222", border: "1px solid #22c55e40", borderRadius: 12, padding: 16, textAlign: "left", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", lineHeight: 1.8, color: "#fbbf24", marginBottom: 20 }}>
          {puzzle.correctOrder.flatMap((entry) => Array.isArray(entry) ? entry : [entry]).map((id) => {
            const block = puzzle.blocks.find((b) => b.id === id);
            return <div key={id}>{block?.code}</div>;
          })}
        </div>
        <button onClick={onComplete} style={btnPrimary}>Back to Problems {Icons.arrow}</button>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ color: "#f1f5f9", margin: 0, fontSize: "1rem", fontFamily: "'Outfit', sans-serif" }}>Code Puzzle</h3>
        <span style={{ color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem" }}>{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}</span>
      </div>
      <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: "0 0 6px" }}>{puzzle.description}</p>
      <p style={{ color: "#f59e0b", fontSize: "0.75rem", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: "0.85rem" }}>⚠</span>
        {distractorIds.size} distractor{distractorIds.size !== 1 ? "s" : ""} hidden among {allBlocks.length} blocks — don't include them!
      </p>

      <div style={{ marginBottom: 16 }}>
        <div style={{ color: "#f59e0b", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
          <span>Your Solution</span>
          <span style={{ color: placed.length === correctCount && placedDistractorCount === 0 ? "#22c55e" : "#64748b" }}>{placed.length} / {correctCount} lines needed</span>
        </div>
        <div style={{ background: "#0c1222", border: "1px solid #1e293b", borderRadius: 12, minHeight: 80, padding: placed.length ? 8 : 16 }}>
          {placed.length === 0 && <p style={{ color: "#334155", fontSize: "0.8rem", textAlign: "center", margin: 0 }}>Tap blocks below to add them here</p>}
          {placed.map((block, idx) => {
            const err = getBlockError(block, idx);
            const isDistractor = err === "distractor";
            const hasError = !!err;
            return (
              <div key={block.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", background: isDistractor ? "#f59e0b18" : hasError ? "#ef444418" : "#1e293b", border: `1px solid ${isDistractor ? "#f59e0b60" : hasError ? "#ef444460" : "#334155"}`, borderRadius: 8, marginBottom: 4, fontSize: "0.78rem", fontFamily: "'JetBrains Mono', monospace", color: isDistractor ? "#fbbf24" : hasError ? "#fca5a5" : "#fbbf24" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button onClick={() => moveUp(idx)} style={microBtn} disabled={idx === 0}>{Icons.up}</button>
                  <button onClick={() => moveDown(idx)} style={microBtn} disabled={idx === placed.length - 1}>{Icons.down}</button>
                </div>
                <pre style={{ margin: 0, flex: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{block.code}</pre>
                {isDistractor && result === false && <span style={{ fontSize: "0.65rem", color: "#f59e0b", fontWeight: 700, whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>TRAP</span>}
                <button onClick={() => removeBlock(block)} style={{ ...microBtn, color: "#ef4444" }}>{Icons.x}</button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Available Blocks ({available.length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {available.map((block) => (
            <button key={block.id} onClick={() => addBlock(block)} style={{ background: "#0f172a", border: "1.5px solid #334155", borderRadius: 8, padding: "10px 12px", color: "#cbd5e1", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}>
              <span style={{ color: "#334155" }}>{Icons.grip}</span>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{block.code}</pre>
            </button>
          ))}
        </div>
      </div>

      {result === false && (
        <div style={{ background: "#ef444418", border: "1px solid #ef444440", borderRadius: 12, padding: 14, marginBottom: 14, textAlign: "center" }}>
          <p style={{ color: "#fca5a5", fontSize: "0.85rem", margin: "0 0 4px" }}>
            {placedDistractorCount > 0 ? `You included ${placedDistractorCount} distractor${placedDistractorCount > 1 ? "s" : ""} (marked as TRAP). Remove them!` : "Not in the right order yet. Incorrect lines are highlighted."}
          </p>
          <p style={{ color: "#64748b", fontSize: "0.75rem", margin: "0 0 8px" }}>The solution needs exactly {correctCount} lines.</p>
          <button onClick={() => setResult(null)} style={{ ...btnSmall, color: "#f1f5f9", background: "#1e293b" }}>Try Again</button>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={reset} style={{ ...btnSmall, flex: 1, background: "#1e293b", color: "#94a3b8" }}>Reset</button>
        <button onClick={checkSolution} disabled={placed.length !== correctCount} style={{ ...btnPrimary, flex: 2, opacity: placed.length !== correctCount ? 0.4 : 1, cursor: placed.length !== correctCount ? "not-allowed" : "pointer" }}>
          Check Solution ({placed.length}/{correctCount})
        </button>
      </div>
    </div>
  );
}
