"use client";

import { getGooglePatentUrl } from "@/lib/utils";
import NextLink from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PatentWorkflowGraph from "./PatentWorkflowGraph";
import { supabase } from "@/lib/supabase";

// ─── THEME ───────────────────────────────────────────────────────────────────

type Theme = "dark" | "light";

function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    const saved = localStorage.getItem("pp-theme") as Theme | null;
    if (saved) setTheme(saved);
  }, []);
  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("pp-theme", next);
      return next;
    });
  }, []);
  return { theme, toggle };
}

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────

function tokens(theme: Theme) {
  return theme === "dark"
    ? {
        bg: "#050d1a",
        bgCard: "rgba(13,27,46,0.65)",
        bgCardSolid: "#0d1b2e",
        bgInput: "rgba(5,13,26,0.7)",
        border: "rgba(6,182,212,0.12)",
        borderInput: "rgba(6,182,212,0.18)",
        borderFocus: "rgba(6,182,212,0.55)",
        text: "#e2e8f0",
        textSub: "#94a3b8",
        textMuted: "#475569",
        accent: "#06b6d4",
        accentBg: "rgba(6,182,212,0.1)",
        accentBorder: "rgba(6,182,212,0.22)",
        gridLine: "rgba(6,182,212,0.3)",
        navBg: "rgba(5,13,26,0.88)",
        shadow: "0 25px 60px rgba(0,0,0,0.45)",
        headerBg: "rgba(5,13,26,0.5)",
        codeBg: "rgba(5,13,26,0.8)",
        codeColor: "#06b6d4",
      }
    : {
        bg: "#f0f4f8",
        bgCard: "rgba(255,255,255,0.92)",
        bgCardSolid: "#ffffff",
        bgInput: "rgba(255,255,255,0.9)",
        border: "rgba(14,165,233,0.18)",
        borderInput: "rgba(14,165,233,0.25)",
        borderFocus: "rgba(6,182,212,0.6)",
        text: "#0f172a",
        textSub: "#334155",
        textMuted: "#64748b",
        accent: "#0284c7",
        accentBg: "rgba(14,165,233,0.08)",
        accentBorder: "rgba(14,165,233,0.2)",
        gridLine: "rgba(14,165,233,0.12)",
        navBg: "rgba(240,244,248,0.92)",
        shadow: "0 10px 40px rgba(0,0,0,0.08)",
        headerBg: "rgba(240,244,248,0.6)",
        codeBg: "#e2e8f0",
        codeColor: "#0284c7",
      };
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const QUICK_NAV_ITEMS = [
  { id: "compound-information", label: "Compound Information" },
  { id: "related-patents", label: "Related Patents" },
  { id: "interactive-graph", label: "Interactive Graph" },
  { id: "patentability-report", label: "Patentability Report" },
] as const;

// ─── UTILITY COMPONENTS (outside Home to prevent remount on re-render) ────────

function riskTone(raw?: string) {
  const v = (raw || "").toLowerCase();
  if (v.includes("low")) return { bg: "rgba(16,185,129,0.12)", text: "#059669", border: "rgba(16,185,129,0.28)", dot: "#10b981" };
  if (v.includes("high")) return { bg: "rgba(239,68,68,0.12)", text: "#dc2626", border: "rgba(239,68,68,0.28)", dot: "#ef4444" };
  if (v.includes("medium") || v.includes("moderate") || v.includes("expert") || v.includes("review"))
    return { bg: "rgba(245,158,11,0.12)", text: "#d97706", border: "rgba(245,158,11,0.28)", dot: "#f59e0b" };
  return { bg: "rgba(100,116,139,0.1)", text: "#64748b", border: "rgba(100,116,139,0.22)", dot: "#64748b" };
}

function RiskBadge({ value }: { value: string }) {
  const t = riskTone(value);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: t.bg, color: t.text, border: `1px solid ${t.border}` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.dot }} />
      {value}
    </span>
  );
}

function ScoreRing({ value, label, color, tk }: { value: number; label: string; color: string; tk: ReturnType<typeof tokens> }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value || 0));
  const offset = circ - (clamped / 100) * circ;
  return (
    <div className="flex flex-1 items-center gap-4 rounded-xl p-4" style={{ background: tk.accentBg, border: `1px solid ${tk.border}` }}>
      <div className="relative h-16 w-16 shrink-0">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" stroke={`${color}22`} />
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset} stroke={color}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: tk.text }}>{value}%</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: tk.textMuted }}>{label}</p>
    </div>
  );
}

// ─── SUN / MOON SVG (safe, no emoji) ─────────────────────────────────────────

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// ─── PDF DOWNLOAD ─────────────────────────────────────────────────────────────

async function downloadPatentReport(compound: any, patents: any[], report: any) {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageW = 595;
  const pageH = 842;
  const margin = 50;
  const colW = pageW - margin * 2;

  let page = doc.addPage([pageW, pageH]);
  let y = pageH - margin;

  function checkPage(needed = 60) {
    if (y < needed + margin) {
      page = doc.addPage([pageW, pageH]);
      y = pageH - margin;
    }
  }

  function drawText(text: string, opts: { x?: number; size?: number; bold?: boolean; color?: [number, number, number] } = {}) {
    const { x = margin, size = 10, bold = false, color = [0.12, 0.16, 0.24] } = opts;
    const f = bold ? boldFont : font;
    const maxW = colW - (x - margin);
    const words = String(text || "").split(" ");
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      const tw = f.widthOfTextAtSize(test, size);
      if (tw > maxW && line) {
        page.drawText(line, { x, y, size, font: f, color: rgb(...color as [number, number, number]) });
        y -= size + 4;
        line = w;
        checkPage();
      } else {
        line = test;
      }
    }
    if (line) {
      page.drawText(line, { x, y, size, font: f, color: rgb(...color as [number, number, number]) });
      y -= size + 4;
    }
  }

  function drawLine() {
    page.drawLine({ start: { x: margin, y: y + 4 }, end: { x: pageW - margin, y: y + 4 }, thickness: 0.5, color: rgb(0.8, 0.87, 0.93) });
    y -= 6;
  }

  function drawSectionTitle(title: string) {
    checkPage(40);
    y -= 8;
    page.drawRectangle({ x: margin - 4, y: y - 4, width: colW + 8, height: 22, color: rgb(0.02, 0.42, 0.55), opacity: 0.12 });
    drawText(title, { size: 13, bold: true, color: [0.02, 0.42, 0.55] });
    drawLine();
  }

  page.drawRectangle({ x: 0, y: pageH - 70, width: pageW, height: 70, color: rgb(0.02, 0.07, 0.1) });
  page.drawText("PatentPilot", { x: margin, y: pageH - 38, size: 22, font: boldFont, color: rgb(0.02, 0.71, 0.83) });
  page.drawText("Patentability Analysis Report", { x: margin, y: pageH - 56, size: 11, font, color: rgb(0.58, 0.65, 0.73) });
  page.drawText(new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), { x: pageW - 130, y: pageH - 42, size: 10, font, color: rgb(0.58, 0.65, 0.73) });
  y = pageH - 80;

  drawSectionTitle("Compound Information");
  drawText(`Name: ${compound.name}`, { bold: true, size: 11 });
  drawText(`PubChem CID: ${compound.cid}`);
  drawText(`Molecular Formula: ${compound.molecularFormula}`);
  drawText(`Canonical SMILES: ${compound.canonicalSmiles}`, { size: 9 });
  if (compound.synonyms?.length) drawText(`Synonyms: ${compound.synonyms.slice(0, 5).join(", ")}`);

  if (patents.length > 0) {
    drawSectionTitle(`Patent Landscape (${patents.length} Patents Analysed)`);
    patents.forEach((p, i) => {
      checkPage(60);
      y -= 4;
      drawText(`${i + 1}. ${p.title}`, { bold: true, size: 10 });
      drawText(`   Patent No: ${p.patentNumber}  |  Assignee: ${p.assignee || "Unknown"}  |  Date: ${p.publicationDate || "--"}`, { size: 9, color: [0.4, 0.45, 0.55] });
      drawText(`   Relevance: ${p.relevanceScore}%  |  Confidence: ${p.confidence}%`, { size: 9 });
      if (p.aiExplanation) drawText(`   ${p.aiExplanation.split("\n")[0]?.substring(0, 200)}...`, { size: 9, color: [0.4, 0.45, 0.55] });
      y -= 4;
    });
  }

  drawSectionTitle("Patentability Report");
  drawText(`Overall Risk: ${report.overallRisk}   |   Score: ${report.overallScore}/100`, { bold: true, size: 11 });
  drawText(`Recommendation: ${report.recommendation}`, { size: 10, color: [0.02, 0.42, 0.55] });
  y -= 4;
  if (report.executiveSummary) { drawText("Executive Summary:", { bold: true, size: 10 }); drawText(report.executiveSummary || ""); y -= 4; }
  if (report.noveltyConcerns) { drawText("Novelty Concerns:", { bold: true, size: 10 }); drawText(report.noveltyConcerns || ""); y -= 4; }
  if (report.scoringMethodology) { drawText("Scoring Methodology:", { bold: true, size: 10 }); drawText(report.scoringMethodology || ""); y -= 4; }
  if (report.justification) { drawText("Legal Justification:", { bold: true, size: 10 }); drawText(report.justification || ""); }

  const pages = doc.getPages();
  pages.forEach((pg, idx) => {
    pg.drawText(`PatentPilot AI Report  |  Page ${idx + 1} of ${pages.length}  |  For research use only`, {
      x: margin, y: 20, size: 8, font, color: rgb(0.55, 0.6, 0.65),
    });
    pg.drawLine({ start: { x: margin, y: 32 }, end: { x: pageW - margin, y: 32 }, thickness: 0.4, color: rgb(0.75, 0.82, 0.87) });
  });

  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PatentPilot_${compound.name?.replace(/\s+/g, "_") || "Report"}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── INTERFACES ───────────────────────────────────────────────────────────────

interface Compound {
  cid: number;
  name: string;
  molecularFormula: string;
  canonicalSmiles: string;
  synonyms: string[];
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Home() {
  const { theme, toggle } = useTheme();
  const tk = tokens(theme);

  const [smiles, setSmiles] = useState("");
  const [target, setTarget] = useState("");
  const [disease, setDisease] = useState("");
  const [description, setDescription] = useState("");
  const [compound, setCompound] = useState<Compound | null>(null);
  const [patents, setPatents] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [graph, setGraph] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [previousAnalysis, setPreviousAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const hasResults = Boolean(compound);
  const manualScrollRef = useRef(false);
  const manualScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadingSteps = [
    "Retrieving compound information from PubChem",
    "Searching SureChEMBL for top 10 candidate patents",
    "AI ranking and selecting best 5 relevant patents",
    "Generating comprehensive patentability report",
  ];

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const iv = setInterval(() => setLoadingStep((p) => (p < loadingSteps.length - 1 ? p + 1 : p)), 7000);
    return () => clearInterval(iv);
  }, [loading]);

  useEffect(() => {
    if (!hasResults) { setActiveSection(""); return; }
    const ids = QUICK_NAV_ITEMS.map((i) => i.id);
    const obs = new IntersectionObserver(
      (entries) => {
        if (manualScrollRef.current) return;
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis.length) setActiveSection(vis[0].target.id);
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0.1 }
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [hasResults, patents.length, report]);

  function handleNavigate(id: string) {
    setActiveSection(id);
    manualScrollRef.current = true;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (manualScrollTimeoutRef.current) clearTimeout(manualScrollTimeoutRef.current);
    manualScrollTimeoutRef.current = setTimeout(() => { manualScrollRef.current = false; }, 800);
  }

  async function analyze() {
    if (!smiles.trim()) { setError("Please enter a SMILES string."); return; }
    if (!description.trim()) { setError("Please enter a description for the molecule."); return; }
    setLoading(true); setError(""); setCompound(null); setPreviousAnalysis(null); setLoadingStep(0);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smiles, target, disease, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setCompound(data.compound);
      setPatents(data.patents || []);
      setReport(data.report);
      setGraph(data.graph || { nodes: [], edges: [] });
      const prev = await fetch(`/api/history/check?smiles=${encodeURIComponent(smiles)}&target=${encodeURIComponent(target)}&disease=${encodeURIComponent(disease)}`);
      const prevData = await prev.json();
      setPreviousAnalysis(prevData.exists ? prevData : null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    if (!compound || !report) return;
    setPdfLoading(true);
    try { await downloadPatentReport(compound, patents, report); }
    catch (e) { console.error("PDF error:", e); }
    finally { setPdfLoading(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: tk.bgInput,
    border: `1px solid ${tk.borderInput}`,
    color: tk.text,
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: tk.bg, transition: "background 0.3s" }}>
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `linear-gradient(${tk.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${tk.gridLine} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }} />
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: "rgba(6,182,212,0.04)" }} />
      </div>

      {/* ── NAVBAR ── */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3" style={{
        background: tk.navBg, backdropFilter: "blur(20px)", borderBottom: `1px solid ${tk.border}`, transition: "background 0.3s",
      }}>
        <NextLink href="/" className="flex items-center gap-2.5">
          <span className="text-lg font-black tracking-tight" style={{
            fontFamily: "var(--font-outfit)",
            background: "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>PatentPilot</span>
        </NextLink>
        <div className="flex items-center gap-2">
          <NextLink href="/drug-screening" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ color: tk.accent, background: tk.accentBg, border: `1px solid ${tk.accentBorder}` }}>
            Drug Screening
          </NextLink>
          <NextLink href="/history" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ color: tk.textSub, background: "rgba(128,128,128,0.06)", border: `1px solid ${tk.border}` }}>
            History
          </NextLink>
          <button onClick={toggle}
            className="flex items-center justify-center rounded-lg h-8 w-8 transition-all"
            style={{ background: tk.accentBg, border: `1px solid ${tk.accentBorder}`, color: tk.accent }}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          {userEmail ? (
            <span className="rounded-lg px-3 py-1.5 text-xs font-semibold truncate max-w-[160px]"
              style={{ color: tk.accent, background: tk.accentBg, border: `1px solid ${tk.accentBorder}` }}
              title={userEmail}>
              {userEmail}
            </span>
          ) : (
            <NextLink href="/auth" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{ color: tk.textSub, background: "rgba(128,128,128,0.06)", border: `1px solid ${tk.border}` }}>
              Sign In
            </NextLink>
          )}
        </div>
      </div>

      <main className="relative min-h-screen pt-20 flex justify-center p-6 sm:p-8">
        <div className="flex w-full max-w-[1320px] items-start justify-center gap-8">
          <div className="w-full max-w-5xl">

            {/* Hero */}
            <div className="mb-8 pt-4">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
                <span style={{ color: tk.text }}>Patent</span>
                <span style={{ color: tk.accent }}>Pilot</span>
              </h1>
              <p className="mt-2 text-sm" style={{ color: tk.textMuted }}>
                AI-assisted patentability assessment for pharmaceutical compounds
              </p>
            </div>

            {/* ── INPUT FORM ── */}
            <div className="rounded-2xl overflow-hidden" style={{ background: tk.bgCard, border: `1px solid ${tk.border}`, backdropFilter: "blur(12px)", boxShadow: tk.shadow }}>
              <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ background: tk.headerBg, borderColor: tk.border }}>
                <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-outfit)", color: tk.text }}>New Analysis</h2>
              </div>
              <div className="p-6 sm:p-8 space-y-5">

                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: tk.textSub }}>
                    SMILES String <span style={{ color: tk.accent }}>*</span>
                  </label>
                  <input
                    id="smiles-input"
                    type="text"
                    value={smiles}
                    onChange={(e) => setSmiles(e.target.value)}
                    placeholder="e.g. CC(=O)Nc1ccc(O)cc1"
                    style={{ ...inputStyle, fontFamily: "monospace", color: tk.accent }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = tk.borderFocus; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.07)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = tk.borderInput; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: tk.textSub }}>
                      Biological Target <span style={{ color: tk.textMuted }}>(optional)</span>
                    </label>
                    <input
                      id="target-input"
                      type="text"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      placeholder="e.g. COX-1, EGFR, ACE2"
                      style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = tk.borderFocus; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.07)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = tk.borderInput; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: tk.textSub }}>
                      Disease / Indication <span style={{ color: tk.textMuted }}>(optional)</span>
                    </label>
                    <input
                      id="disease-input"
                      type="text"
                      value={disease}
                      onChange={(e) => setDisease(e.target.value)}
                      placeholder="e.g. Alzheimer's Disease"
                      style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = tk.borderFocus; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.07)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = tk.borderInput; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: tk.textSub }}>
                    Molecule Description & Context <span style={{ color: tk.accent }}>*</span>
                  </label>
                  <textarea
                    id="description-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe the molecule's mechanism of action, structural modifications, therapeutic use, or any other context that will help the AI find the most relevant patents..."
                    style={{ ...inputStyle, resize: "none" } as React.CSSProperties}
                    onFocus={(e) => { e.currentTarget.style.borderColor = tk.borderFocus; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.07)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = tk.borderInput; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button onClick={analyze} disabled={loading}
                    className="flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-bold transition-all"
                    style={{
                      background: loading ? "rgba(6,182,212,0.2)" : "linear-gradient(135deg, #06b6d4, #0ea5e9)",
                      color: loading ? tk.textMuted : "#050d1a",
                      boxShadow: loading ? "none" : "0 4px 20px rgba(6,182,212,0.25)",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}>
                    {loading ? (
                      <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Analyzing...</>
                    ) : "Analyze Molecule"}
                  </button>
                  <NextLink href="/drug-screening" className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
                    style={{ color: tk.accent, background: tk.accentBg, border: `1px solid ${tk.accentBorder}` }}>
                    Drug Screening
                  </NextLink>
                </div>

                {loading && (
                  <div className="mt-2 rounded-2xl p-5" style={{ background: tk.accentBg, border: `1px solid ${tk.accentBorder}` }}>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 h-6 w-6 animate-spin rounded-full border-2 shrink-0" style={{ borderColor: tk.accent, borderTopColor: "transparent" }} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm" style={{ color: tk.text }}>Patent analysis in progress...</h3>
                        <p className="mt-1 text-xs" style={{ color: tk.textMuted }}>Usually takes <strong style={{ color: tk.textSub }}>15–45 seconds.</strong></p>
                        <div className="mt-4 space-y-2">
                          {loadingSteps.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs transition-all" style={{
                              color: i <= loadingStep ? tk.textSub : tk.textMuted,
                              opacity: i <= loadingStep ? 1 : 0.4,
                            }}>
                              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: i < loadingStep ? "#10b981" : i === loadingStep ? tk.accent : tk.textMuted }} />
                              <span>{s}</span>
                              {i < loadingStep && <span className="ml-auto font-bold" style={{ color: "#10b981" }}>Done</span>}
                              {i === loadingStep && <span className="ml-auto h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl px-5 py-4 text-sm font-medium"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                {error}
              </div>
            )}

            {/* ── COMPOUND INFORMATION ── */}
            {compound && (
              <div id="compound-information" className="mt-8">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: `${tk.accent}99` }}>Molecular Profile</p>
                <div className="rounded-2xl overflow-hidden" style={{ background: tk.bgCard, border: `1px solid ${tk.border}`, backdropFilter: "blur(12px)" }}>
                  <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ background: tk.headerBg, borderColor: tk.border }}>
                    <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-outfit)", color: tk.text }}>Compound Information</h2>
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[{ l: "Name", v: compound.name }, { l: "PubChem CID", v: String(compound.cid) }, { l: "Molecular Formula", v: compound.molecularFormula }].map((item) => (
                        <div key={item.l} className="rounded-xl p-4" style={{ background: tk.accentBg, border: `1px solid ${tk.border}` }}>
                          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: tk.textMuted }}>{item.l}</p>
                          <p className="font-bold text-sm" style={{ color: tk.text }}>{item.v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: tk.textMuted }}>Canonical SMILES</p>
                      <div className="rounded-xl p-4 font-mono text-sm break-all" style={{ background: tk.codeBg, border: `1px solid ${tk.border}`, color: tk.codeColor }}>{compound.canonicalSmiles}</div>
                    </div>
                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: tk.textMuted }}>2D Structure</p>
                      <div className="flex justify-center">
                        <div className="rounded-xl p-4 inline-block" style={{ background: "#ffffff", border: `2px solid ${tk.accentBorder}` }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(compound.canonicalSmiles)}/PNG?image_size=300x300`}
                            alt={`2D structure of ${compound.name}`} width={180} height={180} className="rounded" />
                          <p className="text-center text-xs mt-2 font-medium text-slate-600">{compound.name}</p>
                        </div>
                      </div>
                    </div>
                    {compound.synonyms?.length > 0 && (
                      <div className="mt-5">
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: tk.textMuted }}>Synonyms</p>
                        <div className="flex flex-wrap gap-2">
                          {compound.synonyms.slice(0, 10).map((s: string, i: number) => (
                            <span key={i} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: tk.accentBg, color: tk.textSub, border: `1px solid ${tk.border}` }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── PATENTS ── */}
            {patents.length > 0 && (
              <div id="related-patents" className="mt-8">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: `${tk.accent}99` }}>Patent Landscape</p>
                <div className="rounded-2xl overflow-hidden" style={{ background: tk.bgCard, border: `1px solid ${tk.border}`, backdropFilter: "blur(12px)" }}>
                  <div className="flex items-center justify-between gap-2 px-6 py-4 border-b" style={{ background: tk.headerBg, borderColor: tk.border }}>
                    <div className="flex items-center gap-3">
                      <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-outfit)", color: tk.text }}>AI-Ranked Relevant Patents</h2>
                      <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: tk.accentBg, color: tk.accent, border: `1px solid ${tk.accentBorder}` }}>
                        {patents.length} selected
                      </span>
                    </div>

                    <button
                      onClick={() => handleNavigate("interactive-graph")}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md hover:scale-105"
                      style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)", color: "#ffffff" }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      View Relationships
                    </button>
                  </div>
                  <div className="space-y-4 p-6 sm:p-8">
                    {patents.map((patent, index) => {
                      // Parse AI explanation sections
                      const lines = (patent.aiExplanation || "").split("\n").filter((l: string) => l.trim());
                      const getValue = (prefix: string) => {
                        const l = lines.find((x: string) => x.startsWith(prefix));
                        return l ? l.replace(prefix, "").trim() : null;
                      };
                      const riskLevel = getValue("Risk Level:");
                      const patentType = getValue("Patent Type:");
                      const chemOverlap = getValue("Chemical Overlap:");
                      const therOverlap = getValue("Therapeutic Overlap:");
                      const composition = getValue("Composition of Matter:");
                      const process = getValue("Process / Manufacturing:");
                      const formulation = getValue("Formulation:");
                      const drugDelivery = getValue("Drug Delivery:");
                      const indication = getValue("New Therapeutic Indication:");
                      const summaryLines = lines.filter((l: string) => !l.includes(":"));

                      const jurisdiction = patent.patentNumber.startsWith("US-") ? "US"
                        : patent.patentNumber.startsWith("EP-") ? "EP"
                        : patent.patentNumber.startsWith("WO-") ? "WO"
                        : patent.patentNumber.startsWith("CN-") ? "CN"
                        : patent.patentNumber.startsWith("JP-") ? "JP"
                        : patent.patentNumber.startsWith("GB-") ? "GB"
                        : patent.patentNumber.startsWith("DE-") ? "DE"
                        : "INTL";

                      return (
                        <div key={index} className="rounded-xl p-6 transition-all"
                          style={{ background: tk.accentBg, border: `1px solid ${tk.border}` }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = tk.accentBorder; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = tk.border; }}>

                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                                style={{ background: tk.accentBg, color: tk.accent, border: `1px solid ${tk.accentBorder}` }}>
                                {index + 1}
                              </span>
                              <h3 className="text-base font-bold leading-snug" style={{ color: tk.text }}>{patent.title}</h3>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              {riskLevel && <RiskBadge value={riskLevel} />}
                              {patentType && (
                                <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                                  style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.25)" }}>
                                  {patentType}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl p-3 text-xs mb-4"
                            style={{ background: theme === "dark" ? "rgba(5,13,26,0.4)" : "rgba(241,245,249,0.8)", border: `1px solid ${tk.border}` }}>
                            <div><p style={{ color: tk.textMuted }}>Patent No</p><p className="font-semibold mt-0.5" style={{ color: tk.text }}>{patent.patentNumber}</p></div>
                            <div><p style={{ color: tk.textMuted }}>Jurisdiction</p><p className="font-semibold mt-0.5" style={{ color: tk.text }}>{jurisdiction}</p></div>
                            <div><p style={{ color: tk.textMuted }}>Assignee</p><p className="font-semibold mt-0.5 truncate" style={{ color: tk.text }}>{patent.assignee && patent.assignee !== "null" ? patent.assignee : "Unknown"}</p></div>
                            <div><p style={{ color: tk.textMuted }}>Published</p><p className="font-semibold mt-0.5" style={{ color: tk.text }}>{patent.publicationDate ? patent.publicationDate.slice(0, 4) : "--"}</p></div>
                          </div>

                          {patent.abstract && (
                            <div className="mb-4">
                              <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: tk.textMuted }}>Abstract</h4>
                              <div className="rounded-xl p-4 text-sm leading-7 text-justify"
                                style={{ background: theme === "dark" ? "rgba(5,13,26,0.3)" : "rgba(248,250,252,0.9)", border: `1px solid ${tk.border}`, color: tk.textSub }}>
                                {patent.abstract || "Abstract not available."}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            <ScoreRing value={patent.relevanceScore} label="Relevance" color="#06b6d4" tk={tk} />
                            <ScoreRing value={patent.confidence} label="AI Confidence" color="#10b981" tk={tk} />
                          </div>

                          {/* AI Analysis — 5 Category Breakdown */}
                          {patent.aiExplanation && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: tk.textMuted }}>AI Patent Analysis</h4>
                              <div className="rounded-xl p-4 text-sm leading-7 space-y-3"
                                style={{ background: theme === "dark" ? "rgba(5,13,26,0.3)" : "rgba(248,250,252,0.9)", border: `1px solid ${tk.border}`, color: tk.textSub }}>

                                {summaryLines.length > 0 && (
                                  <p className="leading-6">{summaryLines.join(" ")}</p>
                                )}

                                {/* 5 Category breakdown */}
                                <div className="grid grid-cols-1 gap-2 pt-1">
                                  {composition && (
                                    <div className="text-xs">
                                      <span className="font-bold" style={{ color: tk.text }}>Composition of Matter: </span>
                                      <span>{composition}</span>
                                    </div>
                                  )}
                                  {process && (
                                    <div className="text-xs">
                                      <span className="font-bold" style={{ color: tk.text }}>Process / Manufacturing: </span>
                                      <span>{process}</span>
                                    </div>
                                  )}
                                  {formulation && (
                                    <div className="text-xs">
                                      <span className="font-bold" style={{ color: tk.text }}>Formulation: </span>
                                      <span>{formulation}</span>
                                    </div>
                                  )}
                                  {drugDelivery && (
                                    <div className="text-xs">
                                      <span className="font-bold" style={{ color: tk.text }}>Drug Delivery: </span>
                                      <span>{drugDelivery}</span>
                                    </div>
                                  )}
                                  {indication && (
                                    <div className="text-xs">
                                      <span className="font-bold" style={{ color: tk.text }}>New Indication: </span>
                                      <span>{indication}</span>
                                    </div>
                                  )}
                                </div>

                                {(chemOverlap || therOverlap) && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t" style={{ borderColor: tk.border }}>
                                    {chemOverlap && (
                                      <div className="text-xs">
                                        <span className="font-bold" style={{ color: tk.accent }}>Chemical Overlap: </span>
                                        <span>{chemOverlap}</span>
                                      </div>
                                    )}
                                    {therOverlap && (
                                      <div className="text-xs">
                                        <span className="font-bold" style={{ color: "#10b981" }}>Therapeutic Overlap: </span>
                                        <span>{therOverlap}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {riskLevel && (
                                  <div className="flex items-center gap-2 text-xs pt-1 border-t" style={{ borderColor: tk.border }}>
                                    <span className="font-bold" style={{ color: tk.text }}>Risk Level:</span>
                                    <RiskBadge value={riskLevel} />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mt-5 flex flex-wrap items-center gap-3">
                            <a href={getGooglePatentUrl(patent.patentNumber)} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
                              style={{ background: tk.accentBg, color: tk.accent, border: `1px solid ${tk.accentBorder}` }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = `${tk.accent}22`; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = tk.accentBg; }}>
                              View on Google Patents
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── INTERACTIVE GRAPH ── */}
            {graph && graph.nodes?.length > 0 && (
              <div id="interactive-graph" className="mt-8">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: `${tk.accent}99` }}>Relationship Landscape</p>
                <div className="rounded-2xl overflow-hidden" style={{ background: tk.bgCard, border: `1px solid ${tk.border}`, backdropFilter: "blur(12px)" }}>
                  <div className="flex items-center justify-between gap-2 px-6 py-4 border-b" style={{ background: tk.headerBg, borderColor: tk.border }}>
                    <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-outfit)", color: tk.text }}>Innovation Patent Relationship Map</h2>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: tk.accentBg, color: tk.accent, border: `1px solid ${tk.accentBorder}` }}>
                      Interactive
                    </span>
                  </div>
                  <div className="p-4 sm:p-6">
                    <PatentWorkflowGraph graph={graph} dark={theme === "dark"} />
                  </div>
                </div>
              </div>
            )}
            {report && (
              <div id="patentability-report" className="mt-8 mb-12">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: `${tk.accent}99` }}>Risk Assessment</p>

                <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${tk.accentBorder}`, boxShadow: theme === "dark" ? "0 0 40px rgba(6,182,212,0.06)" : "0 4px 20px rgba(14,165,233,0.08)" }}>
                  <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-8"
                    style={{ background: theme === "dark" ? "linear-gradient(135deg, rgba(6,182,212,0.14), rgba(14,165,233,0.07))" : "linear-gradient(135deg, rgba(6,182,212,0.08), rgba(14,165,233,0.04))", borderBottom: `1px solid ${tk.accentBorder}` }}>
                    <div>
                      <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-outfit)", color: tk.text }}>Patentability Report</h2>
                      <p className="text-xs mt-0.5" style={{ color: tk.textMuted }}>AI-generated analysis based on retrieved patent landscape</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <RiskBadge value={report.overallRisk} />
                      <span className="rounded-full px-3 py-1 text-sm font-bold"
                        style={{ background: "rgba(245,158,11,0.12)", color: "#d97706", border: "1px solid rgba(245,158,11,0.28)" }}>
                        Score: {report.overallScore}/100
                      </span>
                      <button onClick={handleDownloadPDF} disabled={pdfLoading}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all"
                        style={{
                          background: pdfLoading ? "rgba(16,185,129,0.1)" : "linear-gradient(135deg, #10b981, #059669)",
                          color: pdfLoading ? "#64748b" : "#ffffff",
                          border: "1px solid rgba(16,185,129,0.3)",
                          cursor: pdfLoading ? "not-allowed" : "pointer",
                          boxShadow: pdfLoading ? "none" : "0 2px 12px rgba(16,185,129,0.25)",
                        }}>
                        {pdfLoading ? (
                          <><span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />Generating...</>
                        ) : "Download PDF"}
                      </button>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 space-y-4" style={{ background: tk.bgCard }}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl p-4 text-center" style={{ background: tk.accentBg, border: `1px solid ${tk.border}` }}>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: tk.textMuted }}>Overall Risk</p>
                        <RiskBadge value={report.overallRisk} />
                      </div>
                      <div className="rounded-xl p-4 text-center" style={{ background: tk.accentBg, border: `1px solid ${tk.border}` }}>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: tk.textMuted }}>Patentability Score</p>
                        <p className="text-2xl font-black" style={{ color: tk.accent }}>{report.overallScore}<span className="text-sm font-normal" style={{ color: tk.textMuted }}>/100</span></p>
                      </div>
                      <div className="rounded-xl p-4 text-center" style={{ background: tk.accentBg, border: `1px solid ${tk.border}` }}>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: tk.textMuted }}>Recommendation</p>
                        <p className="text-sm font-bold" style={{ color: tk.text }}>{report.recommendation}</p>
                      </div>
                    </div>

                    {report.executiveSummary && (
                      <div className="rounded-xl p-5" style={{ background: tk.accentBg, border: `1px solid ${tk.accentBorder}` }}>
                        <p className="font-bold text-sm mb-3" style={{ color: tk.text }}>Executive Summary</p>
                        <p className="text-sm leading-7" style={{ color: tk.textSub }}>{report.executiveSummary}</p>
                      </div>
                    )}

                    {report.noveltyConcerns && (
                      <div className="rounded-xl p-5" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <p className="font-bold text-sm mb-3" style={{ color: "#d97706" }}>Potential Novelty Concerns</p>
                        <p className="text-sm leading-7" style={{ color: tk.textSub }}>{report.noveltyConcerns}</p>
                      </div>
                    )}

                    {report.keySimilarPatents?.length > 0 && (
                      <div className="rounded-xl p-5" style={{ background: tk.accentBg, border: `1px solid ${tk.border}` }}>
                        <p className="font-bold text-sm mb-3" style={{ color: tk.text }}>Key Similar Patents</p>
                        <ul className="space-y-2">
                          {report.keySimilarPatents.map((p: any, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-sm">
                              <span className="font-mono font-bold" style={{ color: tk.accent }}>{p.patentNumber}</span>
                              <span style={{ color: tk.textSub }}>{p.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {report.manualReviewPatents?.length > 0 && (
                      <div className="rounded-xl p-5" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <p className="font-bold text-sm mb-3" style={{ color: "#dc2626" }}>Patents Requiring Manual Review</p>
                        <ul className="space-y-2">
                          {report.manualReviewPatents.map((p: any, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-sm">
                              <span className="font-mono font-bold" style={{ color: "#ef4444" }}>{p.patentNumber}</span>
                              <span style={{ color: tk.textSub }}>{p.reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {report.scoringMethodology && (
                      <div className="rounded-xl p-5" style={{ background: tk.accentBg, border: `1px solid ${tk.border}` }}>
                        <p className="font-bold text-sm mb-3" style={{ color: tk.text }}>Scoring Methodology</p>
                        <p className="text-sm leading-7" style={{ color: tk.textSub }}>{report.scoringMethodology}</p>
                      </div>
                    )}

                    {report.justification && (
                      <div className="rounded-xl p-5" style={{ background: tk.accentBg, border: `1px solid ${tk.border}` }}>
                        <p className="font-bold text-sm mb-3" style={{ color: tk.text }}>Legal Justification</p>
                        <p className="text-sm leading-7" style={{ color: tk.textSub }}>{report.justification}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ── SIDEBAR ── */}
          {hasResults && (
            <div className="hidden 2xl:flex sticky top-24 shrink-0 flex-col gap-4">
              <nav className="flex w-[220px] flex-col rounded-2xl p-4" style={{ background: tk.bgCard, border: `1px solid ${tk.border}`, backdropFilter: "blur(16px)" }}>
                <p className="px-2 pb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: `${tk.accent}66` }}>Jump to section</p>
                <div className="flex flex-col gap-1">
                  {QUICK_NAV_ITEMS.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <button key={item.id} onClick={() => handleNavigate(item.id)}
                        className="relative flex w-full items-center gap-2 rounded-xl py-2.5 pl-4 pr-3 text-left text-xs font-medium transition-all"
                        style={{ background: isActive ? tk.accentBg : "transparent", color: isActive ? tk.accent : tk.textMuted }}>
                        <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full" style={{ background: isActive ? tk.accent : "transparent" }} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </nav>

              {previousAnalysis && (
                <div className="w-[220px] rounded-2xl p-4" style={{ background: tk.bgCard, border: `1px solid ${tk.accentBorder}`, backdropFilter: "blur(16px)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: `${tk.accent}66` }}>Previous Analysis</p>
                  <div className="space-y-2 text-xs">
                    <div><p style={{ color: tk.textMuted }}>Last Analyzed</p><p className="font-semibold" style={{ color: tk.text }}>{new Date(previousAnalysis.lastAnalyzed).toLocaleDateString()}</p></div>
                    <div><p style={{ color: tk.textMuted }}>Times Analyzed</p><p className="font-semibold" style={{ color: tk.text }}>{previousAnalysis.count + 1}</p></div>
                    <button onClick={() => { window.location.href = `/history?search=${encodeURIComponent(compound?.name ?? "")}`; }}
                      className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold"
                      style={{ background: tk.accentBg, color: tk.accent, border: `1px solid ${tk.accentBorder}` }}>
                      View History
                    </button>
                  </div>
                </div>
              )}

              <div className="w-[220px] rounded-2xl p-4 text-xs leading-6"
                style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)", color: "#92400e" }}>
                <strong style={{ color: "#d97706" }}>Note:</strong> Some patents may open in their original language. Google Patents provides English translations where available.
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
