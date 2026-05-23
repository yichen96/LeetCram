import type { ReactNode, CSSProperties } from "react";

// --- INLINE MARKDOWN RENDERER ---
export function renderInlineMarkdown(text: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let key = 0;
  for (const match of text.matchAll(regex)) {
    if (match.index! > lastIndex) tokens.push(text.slice(lastIndex, match.index));
    if (match[2] !== undefined) {
      tokens.push(<strong key={key++} style={{ fontWeight: 700 }}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      tokens.push(
        <code key={key++} style={{ background: "#1e293b", color: "#f59e0b", padding: "1px 6px", borderRadius: 4, fontSize: "0.82rem", fontFamily: "'JetBrains Mono', monospace" }}>
          {match[3]}
        </code>
      );
    }
    lastIndex = match.index! + match[0].length;
  }
  if (lastIndex < text.length) tokens.push(text.slice(lastIndex));
  return tokens;
}

// --- DIFFICULTY BADGE ---
export function DiffBadge({ d }: { d: "Easy" | "Medium" | "Hard" }) {
  const c = d === "Easy" ? "#22c55e" : d === "Medium" ? "#f59e0b" : "#ef4444";
  return (
    <span style={{ background: c + "18", color: c, padding: "2px 10px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", border: `1px solid ${c}40` }}>
      {d}
    </span>
  );
}

// --- TIMER ---
export function Timer({ seconds, total }: { seconds: number; total: number }) {
  const pct = seconds / total;
  const clr = pct > 0.5 ? "#22c55e" : pct > 0.2 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ color: clr, display: "flex", alignItems: "center" }}>{Icons.timer}</span>
      <div style={{ flex: 1, height: 4, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct * 100}%`, height: "100%", background: clr, borderRadius: 4, transition: "width 1s linear, background 0.5s" }} />
      </div>
      <span style={{ color: clr, fontSize: "0.85rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, minWidth: 40, textAlign: "right" }}>
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
      </span>
    </div>
  );
}

// --- MODAL ---
export function Modal({ show, children, onClose }: { show: boolean; children: ReactNode; onClose: () => void }) {
  if (!show) return null;
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 16, padding: 24, maxWidth: 480, width: "100%", animation: "modalIn 0.2s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// --- ICONS ---
export const Icons = {
  timer: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  check: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  copy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  grip: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="6" r="1.5" fill="currentColor"/><circle cx="15" cy="6" r="1.5" fill="currentColor"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><circle cx="9" cy="18" r="1.5" fill="currentColor"/><circle cx="15" cy="18" r="1.5" fill="currentColor"/></svg>,
  up: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  down: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  zap: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  lock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  map: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  trophy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  back: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
};

// --- SHARED STYLES ---
export const btnPrimary: CSSProperties = {
  background: "#f59e0b",
  color: "#0f172a",
  border: "none",
  borderRadius: 10,
  padding: "12px 20px",
  fontSize: "0.85rem",
  fontWeight: 700,
  fontFamily: "'Outfit', sans-serif",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  transition: "all 0.15s",
};

export const btnSmall: CSSProperties = {
  background: "#1e293b",
  color: "#cbd5e1",
  border: "1px solid #334155",
  borderRadius: 8,
  padding: "8px 14px",
  fontSize: "0.78rem",
  fontWeight: 600,
  fontFamily: "'DM Sans', sans-serif",
  cursor: "pointer",
  transition: "all 0.15s",
};

export const microBtn: CSSProperties = {
  background: "none",
  border: "none",
  color: "#64748b",
  cursor: "pointer",
  padding: 6,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 32,
  minHeight: 32,
};
