import { useState, useEffect, useRef, type ChangeEvent } from "react";
import SAMPLE_PROBLEMS from "./leetcode_problems.json";
import type { Problem, UserProgress, PageType, ClassicPhase } from "./src/types";
import type { SkillPath } from "./src/types";
import { loadProgress, saveProgress, markClassicComplete, markQuestComplete, markSkillPathComplete } from "./src/progress";
import { Modal, Icons, btnPrimary, btnSmall } from "./src/components/ui";
import { ProblemView, MCQPhase, CodePuzzle } from "./src/components/ClassicMode";
import { QuestMode } from "./src/components/QuestMode";
import { SkillPathView } from "./src/components/SkillPaths";
import { Home } from "./src/components/Home";

// --- PROMPT TEMPLATE ---
const PROMPT_TEMPLATE = `I need you to convert the following LeetCode problems into a specific JSON data format for my practice app. For each problem number I provide, generate a JSON object following this EXACT structure. Return ONLY a valid JSON array, no other text.

**Format for each problem:**
\`\`\`json
{
  "id": <problem_number>,
  "title": "<problem_title>",
  "difficulty": "Easy" | "Medium" | "Hard",
  "description": "<full problem description with markdown formatting>",
  "examples": [
    {
      "input": "<input as string>",
      "output": "<output as string>",
      "explanation": "<explanation or empty string>"
    }
  ],
  "constraints": ["<constraint1>", "<constraint2>"],
  "mcq": [
    {
      "question": "What algorithm/data structure should the best solution use?",
      "options": ["<wrong1>", "<correct>", "<wrong2>", "<wrong3>"],
      "correct": <index_of_correct_option_0_based>,
      "explanation": "<why this is the best approach, 2-3 sentences>"
    },
    {
      "question": "What is the time complexity of the best solution?",
      "options": ["<option1>", "<option2>", "<option3>", "<option4>"],
      "correct": <index_of_correct_option_0_based>,
      "explanation": "<why, 2-3 sentences>"
    },
    {
      "question": "What is the space complexity of the best solution?",
      "options": ["<option1>", "<option2>", "<option3>", "<option4>"],
      "correct": <index_of_correct_option_0_based>,
      "explanation": "<why, 2-3 sentences>"
    }
  ],
  "codePuzzle": {
    "description": "Arrange the correct code blocks to form the solution. Beware — some lines are distractors!",
    "blocks": [
      { "id": "a", "code": "<line1>" },
      { "id": "b", "code": "<line2>" }
    ],
    "distractors": [
      { "id": "x1", "code": "<plausible_but_wrong_line1>" },
      { "id": "x2", "code": "<plausible_but_wrong_line2>" },
      { "id": "x3", "code": "<plausible_but_wrong_line3>" }
    ],
    "correctOrder": ["a", ["b", "c"], "d"]
  }
}
\`\`\`

**Rules:**
- For MCQ options, randomize the position of the correct answer (don't always put it at index 1).
- For the code puzzle, use the optimal Python solution. Each block should be one logical line with proper indentation preserved. Use letter IDs (a, b, c...) for correct blocks.
- **correctOrder format**: A flat string ID means that line must be at exactly that position. An array of IDs like \`["b", "c"]\` means those lines are interchangeable at that slot. Example: \`["a", ["b", "c"], "d", "e"]\`.
- Include exactly 3 distractor lines (id: "x1", "x2", "x3"). Distractors must be plausible-looking Python code — similar but wrong. Correct indentation.
- Make MCQ wrong answers plausible — real algorithms/complexities.
- Description should use backticks for code terms.

**Here are the LeetCode problem numbers I want:**
`;

// --- RESPONSIVE HOOK ---
function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 480);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return { isMobile: width < 640, isDesktop: width >= 1024 };
}

// --- IMPORT MODAL ---
function ImportModal({ show, onClose, onImport }: { show: boolean; onClose: () => void; onImport: (problems: Problem[]) => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const processJSON = (text: string) => {
    try {
      let cleaned = text.trim();
      if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const data = JSON.parse(cleaned);
      const arr: Problem[] = Array.isArray(data) ? data : [data];
      for (const p of arr) {
        if (!p.id || !p.title || !p.mcq || !p.codePuzzle) throw new Error(`Problem "${p.title || p.id}" is missing required fields.`);
      }
      onImport(arr); setError(""); setFileName(""); setLoading(false);
    } catch (e) { setError((e as Error).message); setLoading(false); }
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name); setError(""); setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => processJSON(evt.target?.result as string);
    reader.onerror = () => { setError("Failed to read file."); setLoading(false); };
    reader.readAsText(file);
  };

  return (
    <Modal show={show} onClose={onClose}>
      <h3 style={{ color: "#f1f5f9", margin: "0 0 10px", fontFamily: "'Outfit', sans-serif", fontSize: "1rem" }}>Import Problems</h3>
      <p style={{ color: "#94a3b8", fontSize: "0.78rem", margin: "0 0 16px" }}>Upload a JSON file generated from the prompt.</p>
      <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFile} style={{ display: "none" }} />
      <button onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: "20px 16px", background: "#0c1222", border: "2px dashed #334155", borderRadius: 12, color: "#94a3b8", fontSize: "0.85rem", fontFamily: "'DM Sans', sans-serif", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
        {loading ? <span style={{ color: "#f59e0b" }}>Processing...</span> : fileName ? <span style={{ color: "#22c55e" }}>✓ {fileName}</span> : "Tap to choose .json file"}
      </button>
      {error && <p style={{ color: "#ef4444", fontSize: "0.78rem", margin: "10px 0 0", lineHeight: 1.4 }}>{error}</p>}
    </Modal>
  );
}

// --- PROMPT PAGE ---
function PromptPage({ onBack }: { onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(PROMPT_TEMPLATE).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div style={{ animation: "fadeUp 0.3s ease-out" }}>
      <button onClick={onBack} style={{ ...btnSmall, color: "#94a3b8", background: "none", padding: 0, marginBottom: 16 }}>← Back</button>
      <h2 style={{ color: "#f1f5f9", margin: "0 0 8px", fontFamily: "'Outfit', sans-serif", fontSize: "1.15rem" }}>Generate Problem Data</h2>
      <p style={{ color: "#94a3b8", fontSize: "0.82rem", lineHeight: 1.6, margin: "0 0 16px" }}>Copy the prompt below, paste into Claude, add problem numbers at the end, then import the JSON.</p>
      <div style={{ position: "relative" }}>
        <pre style={{ background: "#0c1222", border: "1px solid #1e293b", borderRadius: 12, padding: 14, fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.6, maxHeight: "50vh", overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "'JetBrains Mono', monospace" }}>
          {PROMPT_TEMPLATE}
        </pre>
        <button onClick={handleCopy} style={{ ...btnPrimary, width: "100%", marginTop: 8, background: copied ? "#22c55e" : "#f59e0b", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {copied ? <>{Icons.check} Copied!</> : <>{Icons.copy} Copy Prompt</>}
        </button>
      </div>
    </div>
  );
}

// --- MAIN APP ---
export default function App() {
  const { isMobile, isDesktop } = useBreakpoint();
  const [problems, setProblems] = useState<Problem[]>(SAMPLE_PROBLEMS as Problem[]);
  const [page, setPage] = useState<PageType>("home");
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [classicPhase, setClassicPhase] = useState<ClassicPhase>("read");
  const [quizTime, setQuizTime] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState<UserProgress>(loadProgress());
  const [selectedPath, setSelectedPath] = useState<SkillPath | null>(null);
  const [questSourcePath, setQuestSourcePath] = useState<SkillPath | null>(null);

  // Load problems from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("leetdrill-problems");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setProblems(parsed);
      }
    } catch { /* silent */ }
    setLoaded(true);
  }, []);

  // Persist problems
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("leetdrill-problems", JSON.stringify(problems)); } catch { /* silent */ }
  }, [problems, loaded]);

  // Persist progress whenever it changes
  useEffect(() => {
    if (!loaded) return;
    saveProgress(progress);
  }, [progress, loaded]);

  const handleImport = (arr: Problem[]) => {
    setProblems((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      const merged = [...prev, ...arr.filter((p) => !ids.has(p.id))];
      merged.sort((a, b) => a.id - b.id);
      return merged;
    });
    setShowImport(false);
  };

  const handleReset = () => {
    setProblems(SAMPLE_PROBLEMS as Problem[]);
    try { localStorage.removeItem("leetdrill-problems"); } catch { /* silent */ }
  };

  const startClassic = (problem: Problem) => {
    setSelectedProblem(problem);
    setClassicPhase("read");
    setPage("classic");
  };

  const startQuest = (problem: Problem, sourcePath?: SkillPath) => {
    setSelectedProblem(problem);
    setQuestSourcePath(sourcePath ?? null);
    setPage("quest");
  };

  const openSkillPath = (path: SkillPath) => {
    setSelectedPath(path);
    setPage("skillpath");
  };

  const handleClassicComplete = () => {
    if (selectedProblem) {
      const updated = markClassicComplete(progress, selectedProblem.id);
      if (selectedPath) {
        setProgress(markSkillPathComplete(updated, selectedPath.id, selectedProblem.id));
      } else {
        setProgress(updated);
      }
    }
    setPage("home");
    setSelectedProblem(null);
  };

  const handleQuestComplete = (xpEarned: number) => {
    if (selectedProblem) {
      let updated = markQuestComplete(progress, selectedProblem.id, xpEarned);
      if (questSourcePath) {
        updated = markSkillPathComplete(updated, questSourcePath.id, selectedProblem.id);
      }
      setProgress(updated);
    }
    if (questSourcePath) {
      setPage("skillpath");
    } else {
      setPage("home");
    }
    setSelectedProblem(null);
  };

  const goHome = () => { setPage("home"); setSelectedProblem(null); setSelectedPath(null); };

  const pathCompletedIds = selectedPath
    ? [...new Set([...progress.classicCompleted, ...progress.questCompleted])]
    : [];

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; padding: 0; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
        button, [role="button"] { -webkit-user-select: none; user-select: none; touch-action: manipulation; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        textarea:focus, input:focus { outline: none; border-color: #f59e0b !important; }
        button:active { transform: scale(0.97); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>

      <div style={{ maxWidth: isDesktop ? 720 : isMobile ? 480 : 600, margin: "0 auto", padding: isMobile ? "16px 16px 40px" : "24px 32px 60px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid #1e293b" }}>
          <div onClick={goHome} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/logo.png" alt="LeetCram" style={{ width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, objectFit: "contain" }} />
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: isMobile ? "1.05rem" : "1.3rem", color: "#f1f5f9" }}>
              Leet<span style={{ color: "#4ade80" }}>Cram</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setPage("prompt")} style={{ ...btnSmall, fontSize: "0.7rem", padding: "6px 10px" }}>Prompt</button>
            <button onClick={() => setShowImport(true)} style={{ ...btnSmall, fontSize: "0.7rem", padding: "6px 10px", background: "#f59e0b20", color: "#f59e0b", border: "1px solid #f59e0b40" }}>+ Import</button>
          </div>
        </div>

        {/* Pages */}
        {page === "prompt" && <PromptPage onBack={goHome} />}

        {page === "home" && (
          <Home
            problems={problems}
            progress={progress}
            onStartClassic={startClassic}
            onStartQuest={(p) => startQuest(p)}
            onOpenSkillPath={openSkillPath}
            onImport={() => setShowImport(true)}
            onReset={handleReset}
          />
        )}

        {page === "skillpath" && selectedPath && (
          <SkillPathView
            path={selectedPath}
            problems={problems}
            completedIds={pathCompletedIds}
            onSelectProblem={(p) => startQuest(p, selectedPath)}
            onBack={goHome}
          />
        )}

        {page === "classic" && selectedProblem && (
          <>
            {classicPhase !== "read" && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: "#64748b", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem" }}>#{selectedProblem.id}</span>
                  <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem", fontFamily: "'Outfit', sans-serif" }}>{selectedProblem.title}</span>
                  <div style={{ marginLeft: "auto" }}>
                    <span style={{ background: "#f59e0b20", color: "#f59e0b", fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, border: "1px solid #f59e0b40" }}>Classic</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {(["Quiz", "Puzzle"] as const).map((label, i) => {
                    const active = (classicPhase === "quiz" && i === 0) || (classicPhase === "puzzle" && i === 1);
                    const done = classicPhase === "puzzle" && i === 0;
                    return <div key={label} style={{ flex: 1, height: 3, borderRadius: 3, background: active ? "#f59e0b" : done ? "#22c55e" : "#1e293b", transition: "all 0.3s" }} />;
                  })}
                </div>
              </div>
            )}
            {classicPhase === "read" && <ProblemView problem={selectedProblem} onReady={() => setClassicPhase("quiz")} />}
            {classicPhase === "quiz" && <MCQPhase problem={selectedProblem} onComplete={(t) => { setQuizTime(t); setClassicPhase("puzzle"); }} />}
            {classicPhase === "puzzle" && <CodePuzzle problem={selectedProblem} quizTime={quizTime} onComplete={handleClassicComplete} />}
          </>
        )}

        {page === "quest" && selectedProblem && (
          <QuestMode
            problem={selectedProblem}
            onComplete={handleQuestComplete}
            onBack={() => questSourcePath ? setPage("skillpath") : goHome()}
            currentXP={progress.questXP}
            currentStreak={progress.questStreak}
          />
        )}
      </div>

      <ImportModal show={showImport} onClose={() => setShowImport(false)} onImport={handleImport} />
    </div>
  );
}
